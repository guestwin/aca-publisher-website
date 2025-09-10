import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { createWriteStream, createReadStream } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';

/**
 * Automated Database Backup Service
 * Handles MongoDB backups, compression, and restoration
 */
class BackupService {
  constructor() {
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    this.dbName = process.env.DB_NAME || 'acapub';
    this.backupDir = path.join(process.cwd(), 'backups');
    this.maxBackups = 30; // Keep 30 days of backups
    this.compressionLevel = 6;
  }

  /**
   * Create database backup
   */
  async createBackup(options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = options.name || `backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupName);
    
    console.log(`🔄 Starting database backup: ${backupName}`);
    
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Create backup using mongodump
      await this.runMongoDump(backupPath);
      
      // Compress backup
      const compressedPath = await this.compressBackup(backupPath);
      
      // Remove uncompressed backup
      await fs.rm(backupPath, { recursive: true, force: true });
      
      // Get backup info
      const backupInfo = await this.getBackupInfo(compressedPath);
      
      // Save backup metadata
      await this.saveBackupMetadata(backupName, backupInfo);
      
      console.log(`✅ Backup completed: ${backupName}.tar.gz`);
      console.log(`   Size: ${backupInfo.sizeMB} MB`);
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      return {
        name: backupName,
        path: compressedPath,
        ...backupInfo
      };
      
    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run mongodump command
   */
  async runMongoDump(outputPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '--uri', this.mongoUri,
        '--db', this.dbName,
        '--out', outputPath,
        '--gzip'
      ];
      
      const mongodump = spawn('mongodump', args);
      
      let stderr = '';
      
      mongodump.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      mongodump.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`mongodump failed with code ${code}: ${stderr}`));
        }
      });
      
      mongodump.on('error', (error) => {
        reject(new Error(`mongodump error: ${error.message}`));
      });
    });
  }

  /**
   * Compress backup directory
   */
  async compressBackup(backupPath) {
    const compressedPath = `${backupPath}.tar.gz`;
    
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', [
        '-czf',
        compressedPath,
        '-C',
        path.dirname(backupPath),
        path.basename(backupPath)
      ]);
      
      tar.on('close', (code) => {
        if (code === 0) {
          resolve(compressedPath);
        } else {
          reject(new Error(`tar compression failed with code ${code}`));
        }
      });
      
      tar.on('error', (error) => {
        reject(new Error(`tar error: ${error.message}`));
      });
    });
  }

  /**
   * Get backup file information
   */
  async getBackupInfo(backupPath) {
    try {
      const stats = await fs.stat(backupPath);
      
      return {
        size: stats.size,
        sizeMB: Math.round(stats.size / (1024 * 1024) * 100) / 100,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get backup info: ${error.message}`);
    }
  }

  /**
   * Save backup metadata
   */
  async saveBackupMetadata(backupName, backupInfo) {
    const metadataPath = path.join(this.backupDir, 'metadata.json');
    
    try {
      let metadata = {};
      
      // Load existing metadata
      try {
        const existingData = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(existingData);
      } catch (error) {
        // File doesn't exist or is invalid, start fresh
      }
      
      // Add new backup info
      metadata[backupName] = {
        ...backupInfo,
        dbName: this.dbName,
        mongoUri: this.mongoUri.replace(/\/\/.*@/, '//***:***@') // Hide credentials
      };
      
      // Save updated metadata
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
    } catch (error) {
      console.error(`⚠️  Failed to save backup metadata: ${error.message}`);
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.tar.gz'));
      
      const backups = [];
      
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        const name = file.replace('.tar.gz', '');
        
        backups.push({
          name,
          file,
          path: filePath,
          size: stats.size,
          sizeMB: Math.round(stats.size / (1024 * 1024) * 100) / 100,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString()
        });
      }
      
      // Sort by creation date (newest first)
      return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
      
    } catch (error) {
      console.error(`❌ Failed to list backups: ${error.message}`);
      return [];
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupName, options = {}) {
    const backupPath = path.join(this.backupDir, `${backupName}.tar.gz`);
    
    console.log(`🔄 Starting database restore from: ${backupName}`);
    
    try {
      // Check if backup exists
      await fs.access(backupPath);
      
      // Extract backup
      const extractPath = path.join(this.backupDir, 'temp-restore');
      await this.extractBackup(backupPath, extractPath);
      
      // Run mongorestore
      await this.runMongoRestore(extractPath, options);
      
      // Cleanup extracted files
      await fs.rm(extractPath, { recursive: true, force: true });
      
      console.log(`✅ Database restored from: ${backupName}`);
      
    } catch (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract backup archive
   */
  async extractBackup(backupPath, extractPath) {
    await fs.mkdir(extractPath, { recursive: true });
    
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', [
        '-xzf',
        backupPath,
        '-C',
        extractPath
      ]);
      
      tar.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tar extraction failed with code ${code}`));
        }
      });
      
      tar.on('error', (error) => {
        reject(new Error(`tar error: ${error.message}`));
      });
    });
  }

  /**
   * Run mongorestore command
   */
  async runMongoRestore(backupPath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        '--uri', this.mongoUri,
        '--gzip'
      ];
      
      if (options.drop) {
        args.push('--drop');
      }
      
      if (options.db) {
        args.push('--db', options.db);
      }
      
      // Find the actual backup directory
      const dbBackupPath = path.join(backupPath, `backup-*/${this.dbName}`);
      args.push(dbBackupPath);
      
      const mongorestore = spawn('mongorestore', args);
      
      let stderr = '';
      
      mongorestore.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      mongorestore.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`mongorestore failed with code ${code}: ${stderr}`));
        }
      });
      
      mongorestore.on('error', (error) => {
        reject(new Error(`mongorestore error: ${error.message}`));
      });
    });
  }

  /**
   * Cleanup old backups
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.listBackups();
      
      if (backups.length <= this.maxBackups) {
        return;
      }
      
      const backupsToDelete = backups.slice(this.maxBackups);
      
      for (const backup of backupsToDelete) {
        await fs.unlink(backup.path);
        console.log(`🗑️  Deleted old backup: ${backup.name}`);
      }
      
      console.log(`✅ Cleaned up ${backupsToDelete.length} old backups`);
      
    } catch (error) {
      console.error(`⚠️  Failed to cleanup old backups: ${error.message}`);
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    try {
      const backups = await this.listBackups();
      
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;
      
      return {
        totalBackups: backups.length,
        totalSize,
        totalSizeMB,
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
        newestBackup: backups.length > 0 ? backups[0].created : null,
        averageSizeMB: backups.length > 0 ? Math.round(totalSizeMB / backups.length * 100) / 100 : 0
      };
    } catch (error) {
      console.error(`❌ Failed to get backup stats: ${error.message}`);
      return null;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupName) {
    const backupPath = path.join(this.backupDir, `${backupName}.tar.gz`);
    
    try {
      // Check if file exists and is readable
      await fs.access(backupPath, fs.constants.R_OK);
      
      // Test archive integrity
      return new Promise((resolve, reject) => {
        const tar = spawn('tar', ['-tzf', backupPath]);
        
        tar.on('close', (code) => {
          if (code === 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
        
        tar.on('error', () => {
          resolve(false);
        });
      });
      
    } catch (error) {
      return false;
    }
  }
}

// Create service instance
const backupService = new BackupService();

// Export functions
export const createBackup = (options) => backupService.createBackup(options);
export const listBackups = () => backupService.listBackups();
export const restoreBackup = (backupName, options) => backupService.restoreBackup(backupName, options);
export const getBackupStats = () => backupService.getBackupStats();
export const verifyBackup = (backupName) => backupService.verifyBackup(backupName);
export const cleanupOldBackups = () => backupService.cleanupOldBackups();

export default backupService;

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'create':
      await createBackup({ name: arg });
      break;
    case 'list':
      const backups = await listBackups();
      console.table(backups);
      break;
    case 'restore':
      if (!arg) {
        console.error('Please specify backup name');
        process.exit(1);
      }
      await restoreBackup(arg, { drop: true });
      break;
    case 'stats':
      const stats = await getBackupStats();
      console.log(JSON.stringify(stats, null, 2));
      break;
    case 'verify':
      if (!arg) {
        console.error('Please specify backup name');
        process.exit(1);
      }
      const isValid = await verifyBackup(arg);
      console.log(`Backup ${arg} is ${isValid ? 'valid' : 'invalid'}`);
      break;
    case 'cleanup':
      await cleanupOldBackups();
      break;
    default:
      console.log('Available commands: create, list, restore, stats, verify, cleanup');
      break;
  }
}