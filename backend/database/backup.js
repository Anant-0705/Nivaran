const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

class DatabaseBackup {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    this.backupDir = path.join(__dirname, 'backups');
    this.maxBackups = 30; // Keep last 30 backups
    
    this.ensureBackupDirectory();
  }

  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  // Create database schema backup
  async createSchemaBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const filename = `schema_backup_${timestamp}.sql`;
      const filePath = path.join(this.backupDir, filename);

      console.log('🔄 Creating schema backup...');

      // Get database schema using Supabase SQL
      const { data: tables, error: tablesError } = await this.supabase.rpc('get_schema_info');
      
      if (tablesError) {
        throw new Error(`Failed to get schema info: ${tablesError.message}`);
      }

      let schemaSQL = `-- Schema backup created at ${new Date().toISOString()}\n\n`;
      
      // Add table creation scripts
      for (const table of tables || []) {
        const { data: tableSchema, error } = await this.supabase
          .rpc('get_table_schema', { table_name: table.table_name });
        
        if (!error && tableSchema) {
          schemaSQL += `${tableSchema}\n\n`;
        }
      }

      await fs.writeFile(filePath, schemaSQL);
      console.log(`✅ Schema backup created: ${filename}`);
      
      return filename;
    } catch (error) {
      console.error('❌ Schema backup failed:', error.message);
      throw error;
    }
  }

  // Create data backup (JSON format for Supabase)
  async createDataBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const filename = `data_backup_${timestamp}.json`;
      const filePath = path.join(this.backupDir, filename);

      console.log('🔄 Creating data backup...');

      const backup = {
        timestamp: new Date().toISOString(),
        tables: {}
      };

      // List of tables to backup
      const tablesToBackup = [
        'users', 'issues', 'comments', 'votes', 'rewards', 
        'sessions', 'api_keys', 'audit_logs', 'notifications'
      ];

      for (const tableName of tablesToBackup) {
        try {
          const { data, error } = await this.supabase
            .from(tableName)
            .select('*');

          if (error) {
            console.warn(`⚠️  Warning: Could not backup table ${tableName}: ${error.message}`);
            continue;
          }

          backup.tables[tableName] = {
            count: data?.length || 0,
            data: data || []
          };

          console.log(`✅ Backed up ${tableName}: ${data?.length || 0} records`);
        } catch (tableError) {
          console.warn(`⚠️  Warning: Error backing up ${tableName}:`, tableError.message);
        }
      }

      await fs.writeFile(filePath, JSON.stringify(backup, null, 2));
      console.log(`✅ Data backup created: ${filename}`);
      
      return filename;
    } catch (error) {
      console.error('❌ Data backup failed:', error.message);
      throw error;
    }
  }

  // Create full backup (schema + data)
  async createFullBackup() {
    try {
      console.log('🚀 Starting full database backup...');
      
      const [schemaFile, dataFile] = await Promise.all([
        this.createSchemaBackup(),
        this.createDataBackup()
      ]);

      // Clean old backups
      await this.cleanOldBackups();

      console.log('🎉 Full backup completed successfully!');
      return { schemaFile, dataFile };
    } catch (error) {
      console.error('💥 Full backup failed:', error.message);
      throw error;
    }
  }

  // Restore from backup
  async restoreFromBackup(backupFile, type = 'data') {
    try {
      console.log(`🔄 Restoring ${type} from backup: ${backupFile}`);
      
      const filePath = path.join(this.backupDir, backupFile);
      const backupData = await fs.readFile(filePath, 'utf8');

      if (type === 'data') {
        const backup = JSON.parse(backupData);
        
        console.log('⚠️  WARNING: This will replace existing data!');
        console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        for (const [tableName, tableData] of Object.entries(backup.tables)) {
          if (tableData.data && tableData.data.length > 0) {
            // Clear existing data
            const { error: deleteError } = await this.supabase
              .from(tableName)
              .delete()
              .neq('id', 'impossible_value'); // Delete all

            if (deleteError) {
              console.warn(`⚠️  Warning: Could not clear ${tableName}: ${deleteError.message}`);
            }

            // Insert backup data
            const { error: insertError } = await this.supabase
              .from(tableName)
              .insert(tableData.data);

            if (insertError) {
              console.error(`❌ Failed to restore ${tableName}: ${insertError.message}`);
            } else {
              console.log(`✅ Restored ${tableName}: ${tableData.count} records`);
            }
          }
        }
      } else if (type === 'schema') {
        console.log('⚠️  Schema restoration requires manual execution');
        console.log('Please execute the SQL file manually in your database');
      }

      console.log('✅ Restoration completed');
    } catch (error) {
      console.error('❌ Restoration failed:', error.message);
      throw error;
    }
  }

  // Clean old backup files
  async cleanOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.includes('backup_'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stats: null
        }));

      // Get file stats
      for (const file of backupFiles) {
        try {
          file.stats = await fs.stat(file.path);
        } catch (error) {
          console.warn(`Warning: Could not get stats for ${file.name}`);
        }
      }

      // Sort by creation time (newest first)
      backupFiles
        .filter(file => file.stats)
        .sort((a, b) => b.stats.mtime - a.stats.mtime)
        .slice(this.maxBackups) // Keep only excess files
        .forEach(async (file) => {
          try {
            await fs.unlink(file.path);
            console.log(`🗑️  Cleaned old backup: ${file.name}`);
          } catch (error) {
            console.warn(`Warning: Could not delete ${file.name}:`, error.message);
          }
        });
    } catch (error) {
      console.warn('Warning: Could not clean old backups:', error.message);
    }
  }

  // List available backups
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.includes('backup_'));
      
      if (backupFiles.length === 0) {
        console.log('No backup files found');
        return;
      }

      console.log('\n📁 Available Backups:');
      console.log('====================');

      for (const file of backupFiles.sort().reverse()) {
        try {
          const stats = await fs.stat(path.join(this.backupDir, file));
          const size = (stats.size / 1024 / 1024).toFixed(2);
          const date = stats.mtime.toISOString().split('T')[0];
          const time = stats.mtime.toTimeString().split(' ')[0];
          
          console.log(`📄 ${file} (${size} MB) - ${date} ${time}`);
        } catch (error) {
          console.log(`📄 ${file} (size unknown)`);
        }
      }
    } catch (error) {
      console.error('Failed to list backups:', error.message);
    }
  }

  // Schedule automatic backups
  scheduleBackups() {
    // Daily backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🕐 Running scheduled daily backup...');
      try {
        await this.createFullBackup();
        console.log('✅ Scheduled backup completed');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error.message);
      }
    }, {
      timezone: "UTC"
    });

    console.log('⏰ Automatic daily backups scheduled for 2:00 AM UTC');
  }
}

// CLI interface
const command = process.argv[2];
const backup = new DatabaseBackup();

switch (command) {
  case 'schema':
    backup.createSchemaBackup();
    break;
  case 'data':
    backup.createDataBackup();
    break;
  case 'full':
    backup.createFullBackup();
    break;
  case 'restore':
    const backupFile = process.argv[3];
    const type = process.argv[4] || 'data';
    if (!backupFile) {
      console.error('Please provide backup filename: npm run backup:restore <filename> [data|schema]');
      process.exit(1);
    }
    backup.restoreFromBackup(backupFile, type);
    break;
  case 'list':
    backup.listBackups();
    break;
  case 'schedule':
    backup.scheduleBackups();
    console.log('Backup scheduler is running... Press Ctrl+C to stop');
    break;
  case 'clean':
    backup.cleanOldBackups();
    break;
  default:
    console.log(`
🗄️  Nivaran Database Backup System

Usage:
  npm run backup:schema       Create schema backup
  npm run backup:data         Create data backup  
  npm run backup:full         Create full backup (schema + data)
  npm run backup:restore <file> [type]  Restore from backup
  npm run backup:list         List available backups
  npm run backup:schedule     Start automatic daily backups
  npm run backup:clean        Clean old backup files

Examples:
  npm run backup:full
  npm run backup:restore data_backup_20241215T143022.json data
  npm run backup:restore schema_backup_20241215T143022.sql schema
    `);
}

module.exports = DatabaseBackup;