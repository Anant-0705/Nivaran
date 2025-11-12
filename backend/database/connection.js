const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config();

class DatabaseConnection {
  constructor() {
    // Supabase client for standard operations
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // PostgreSQL connection pool for direct database access
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || this.buildConnectionString(),
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // Connection pool configuration
      max: 20, // Maximum number of clients
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
      connectionTimeoutMillis: 2000, // How long to try connecting before timing out
      // Additional pool settings for performance
      min: 2, // Minimum number of connections to maintain
      acquireTimeoutMillis: 60000, // Maximum time to wait for a connection
      createTimeoutMillis: 3000, // Maximum time to wait for connection creation
      destroyTimeoutMillis: 5000, // Maximum time to wait for connection destruction
      reapIntervalMillis: 1000, // How often to check for idle connections
    });

    // Connection pool event handlers
    this.setupPoolEvents();
  }

  buildConnectionString() {
    const {
      SUPABASE_DB_HOST = 'localhost',
      SUPABASE_DB_PORT = 5432,
      SUPABASE_DB_NAME = 'postgres',
      SUPABASE_DB_USER = 'postgres',
      SUPABASE_DB_PASSWORD = '',
    } = process.env;

    return `postgresql://${SUPABASE_DB_USER}:${SUPABASE_DB_PASSWORD}@${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT}/${SUPABASE_DB_NAME}`;
  }

  setupPoolEvents() {
    // Pool event handlers for monitoring
    this.pool.on('connect', (client) => {
      console.log('🔗 New database connection established');
    });

    this.pool.on('acquire', (client) => {
      console.log('📋 Database connection acquired from pool');
    });

    this.pool.on('error', (err, client) => {
      console.error('💥 Unexpected error on idle database client:', err);
    });

    this.pool.on('remove', (client) => {
      console.log('🗑️  Database connection removed from pool');
    });
  }

  // Get Supabase client (for auth-aware operations)
  getSupabaseClient() {
    return this.supabase;
  }

  // Get PostgreSQL pool client (for direct database operations)
  async getPoolClient() {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      console.error('Failed to get pool client:', error);
      throw error;
    }
  }

  // Execute query with pool connection
  async query(text, params = []) {
    const client = await this.getPoolClient();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) { // Log slow queries
        console.warn(`⚠️  Slow query detected (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Execute transaction
  async transaction(queries) {
    const client = await this.getPoolClient();
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const { text, params } of queries) {
        const result = await client.query(text, params);
        results.push(result);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction failed, rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check for database connection
  async healthCheck() {
    try {
      const start = Date.now();
      
      // Test Supabase connection
      const { data: supabaseHealth, error: supabaseError } = await this.supabase
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (supabaseError && !supabaseError.message.includes('relation "users" does not exist')) {
        throw new Error(`Supabase connection failed: ${supabaseError.message}`);
      }

      // Test Pool connection
      const poolResult = await this.query('SELECT NOW() as current_time');
      
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        supabase: supabaseError ? 'error' : 'connected',
        pool: poolResult ? 'connected' : 'error',
        responseTime: `${duration}ms`,
        poolInfo: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get connection pool statistics
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      options: {
        max: this.pool.options.max,
        min: this.pool.options.min || 0,
        idleTimeoutMillis: this.pool.options.idleTimeoutMillis,
        connectionTimeoutMillis: this.pool.options.connectionTimeoutMillis
      }
    };
  }

  // Close all connections
  async close() {
    try {
      await this.pool.end();
      console.log('✅ Database connections closed successfully');
    } catch (error) {
      console.error('❌ Error closing database connections:', error);
      throw error;
    }
  }

  // Create authenticated Supabase client for user operations
  createAuthClient(accessToken) {
    return createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );
  }

  // Utility methods for common operations
  async findById(table, id, columns = '*') {
    const { data, error } = await this.supabase
      .from(table)
      .select(columns)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    return data;
  }

  async create(table, data) {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  }

  async update(table, id, data) {
    const { data: result, error } = await this.supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  }

  async delete(table, id) {
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  // Pagination helper
  async paginate(table, page = 1, pageSize = 10, filters = {}, orderBy = 'created_at') {
    const offset = (page - 1) * pageSize;
    
    let query = this.supabase
      .from(table)
      .select('*', { count: 'exact' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });

    const { data, error, count } = await query
      .order(orderBy, { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        hasNext: page * pageSize < (count || 0),
        hasPrev: page > 1
      }
    };
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;