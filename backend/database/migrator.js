const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class DatabaseMigrator {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY // Use service key for admin operations
    );
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  // Create migrations table if it doesn't exist
  async createMigrationsTable() {
    const { error } = await this.supabase.rpc('create_migrations_table', {});
    
    if (error && !error.message.includes('already exists')) {
      throw new Error(`Failed to create migrations table: ${error.message}`);
    }

    console.log('✅ Migrations table ready');
  }

  // Get list of migration files
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ensure chronological order
    } catch (error) {
      console.error('Error reading migrations directory:', error);
      return [];
    }
  }

  // Get executed migrations from database
  async getExecutedMigrations() {
    const { data, error } = await this.supabase
      .from('migrations')
      .select('filename')
      .order('executed_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get executed migrations: ${error.message}`);
    }

    return data.map(row => row.filename);
  }

  // Execute a single migration
  async executeMigration(filename) {
    try {
      console.log(`🔄 Executing migration: ${filename}`);
      
      // Read migration file
      const filePath = path.join(this.migrationsDir, filename);
      const migrationSQL = await fs.readFile(filePath, 'utf8');

      // Execute migration
      const { error } = await this.supabase.rpc('execute_migration', {
        migration_sql: migrationSQL,
        migration_name: filename
      });

      if (error) {
        throw new Error(`Migration ${filename} failed: ${error.message}`);
      }

      // Record migration execution
      const { error: recordError } = await this.supabase
        .from('migrations')
        .insert({
          filename,
          executed_at: new Date().toISOString()
        });

      if (recordError) {
        throw new Error(`Failed to record migration: ${recordError.message}`);
      }

      console.log(`✅ Migration completed: ${filename}`);
      return true;
    } catch (error) {
      console.error(`❌ Migration failed: ${filename}`, error.message);
      throw error;
    }
  }

  // Run all pending migrations
  async migrate() {
    try {
      console.log('🚀 Starting database migration...');

      await this.createMigrationsTable();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log('🎉 All migrations completed successfully!');
    } catch (error) {
      console.error('💥 Migration process failed:', error.message);
      process.exit(1);
    }
  }

  // Rollback last migration (use with caution)
  async rollback() {
    try {
      console.log('⚠️  Starting rollback process...');

      const { data: lastMigration, error } = await this.supabase
        .from('migrations')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !lastMigration) {
        console.log('No migrations to rollback');
        return;
      }

      const rollbackFile = lastMigration.filename.replace('.sql', '_rollback.sql');
      const rollbackPath = path.join(this.migrationsDir, rollbackFile);

      try {
        const rollbackSQL = await fs.readFile(rollbackPath, 'utf8');
        
        const { error: rollbackError } = await this.supabase.rpc('execute_migration', {
          migration_sql: rollbackSQL,
          migration_name: rollbackFile
        });

        if (rollbackError) {
          throw new Error(`Rollback failed: ${rollbackError.message}`);
        }

        // Remove migration record
        await this.supabase
          .from('migrations')
          .delete()
          .eq('id', lastMigration.id);

        console.log(`✅ Rolled back migration: ${lastMigration.filename}`);
      } catch (fileError) {
        console.log(`⚠️  No rollback file found for: ${lastMigration.filename}`);
        console.log('Manual intervention may be required');
      }
    } catch (error) {
      console.error('💥 Rollback failed:', error.message);
      process.exit(1);
    }
  }

  // Check migration status
  async status() {
    try {
      await this.createMigrationsTable();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      console.log('\n📊 Migration Status:');
      console.log('==================');

      migrationFiles.forEach(file => {
        const status = executedMigrations.includes(file) ? '✅' : '⏳';
        console.log(`${status} ${file}`);
      });

      const pending = migrationFiles.length - executedMigrations.length;
      console.log(`\n📈 Summary: ${executedMigrations.length} executed, ${pending} pending`);
    } catch (error) {
      console.error('💥 Failed to check migration status:', error.message);
    }
  }

  // Create a new migration file
  async create(migrationName) {
    try {
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const filename = `${timestamp}_${migrationName.toLowerCase().replace(/\s+/g, '_')}.sql`;
      const filePath = path.join(this.migrationsDir, filename);

      const template = `-- Migration: ${filename}
-- Description: ${migrationName}
-- Date: ${new Date().toISOString().split('T')[0]}

BEGIN;

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example_table (
--     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
--     name VARCHAR(100) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

COMMIT;
`;

      await fs.writeFile(filePath, template);
      console.log(`✅ Created migration file: ${filename}`);
      console.log(`📝 Edit the file at: ${filePath}`);
    } catch (error) {
      console.error('💥 Failed to create migration:', error.message);
    }
  }
}

// CLI interface
const command = process.argv[2];
const migrator = new DatabaseMigrator();

switch (command) {
  case 'migrate':
    migrator.migrate();
    break;
  case 'rollback':
    migrator.rollback();
    break;
  case 'status':
    migrator.status();
    break;
  case 'create':
    const migrationName = process.argv[3];
    if (!migrationName) {
      console.error('Please provide a migration name: npm run migrate:create "Add user preferences"');
      process.exit(1);
    }
    migrator.create(migrationName);
    break;
  default:
    console.log(`
🗄️  Nivaran Database Migrator

Usage:
  npm run migrate              Run all pending migrations
  npm run migrate:status       Show migration status
  npm run migrate:rollback     Rollback last migration
  npm run migrate:create <name> Create new migration file

Examples:
  npm run migrate:create "Add user preferences table"
  npm run migrate:create "Update issue status enum"
    `);
}

module.exports = DatabaseMigrator;