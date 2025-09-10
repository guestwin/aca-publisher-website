import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * File Cleanup Service
 * Handles automated cleanup of temporary files, old logs, and unused assets
 */
class FileCleanupService {
  constructor() {
    this.tempDirs = [
      path.join(process.cwd(), 'temp'),
      path.join(process.cwd(), 'tmp'),
      path.join(process.cwd(), '.next/cache'),
      path.join(process.cwd(), 'public/temp')
    ];
    
    this.logDirs = [
      path.join(process.cwd(), 'logs'),
      path.join(process.cwd(), '.next/logs')
    ];
    
    this.uploadDirs = [
      path.join(process.cwd(), 'public/uploads'),
      path.join(process.cwd(), 'public/watermarked-pdfs')
    ];
  }

  /**
   * Clean up temporary files older than specified days
   */
  async cleanupTempFiles(maxAgeDays = 1) {
    console.log('🧹 Starting temporary files cleanup...');
    let totalCleaned = 0;
    
    for (const tempDir of this.tempDirs) {
      try {
        const cleaned = await this.cleanDirectory(tempDir, maxAgeDays);
        totalCleaned += cleaned;
        console.log(`  📁 Cleaned ${cleaned} files from ${tempDir}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`❌ Error cleaning ${tempDir}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Temporary files cleanup completed. ${totalCleaned} files removed.`);
    return totalCleaned;
  }

  /**
   * Clean up old log files
   */
  async cleanupOldLogs(maxAgeDays = 30) {
    console.log('📋 Starting log files cleanup...');
    let totalCleaned = 0;
    
    for (const logDir of this.logDirs) {
      try {
        const cleaned = await this.cleanDirectory(logDir, maxAgeDays, ['.log', '.txt']);
        totalCleaned += cleaned;
        console.log(`  📁 Cleaned ${cleaned} log files from ${logDir}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`❌ Error cleaning logs in ${logDir}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Log files cleanup completed. ${totalCleaned} files removed.`);
    return totalCleaned;
  }

  /**
   * Clean up orphaned upload files (files not referenced in database)
   */
  async cleanupOrphanedUploads() {
    console.log('🗂️  Starting orphaned uploads cleanup...');
    
    try {
      // This would require database connection to check references
      // For now, we'll implement a basic cleanup of very old files
      let totalCleaned = 0;
      
      for (const uploadDir of this.uploadDirs) {
        try {
          // Clean files older than 90 days that might be orphaned
          const cleaned = await this.cleanDirectory(uploadDir, 90);
          totalCleaned += cleaned;
          console.log(`  📁 Cleaned ${cleaned} old upload files from ${uploadDir}`);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.error(`❌ Error cleaning uploads in ${uploadDir}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Orphaned uploads cleanup completed. ${totalCleaned} files removed.`);
      return totalCleaned;
    } catch (error) {
      console.error('❌ Error during orphaned uploads cleanup:', error);
      throw error;
    }
  }

  /**
   * Clean directory of files older than specified days
   */
  async cleanDirectory(dirPath, maxAgeDays, allowedExtensions = null) {
    let cleanedCount = 0;
    
    try {
      const files = await fs.readdir(dirPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        
        try {
          const stats = await fs.stat(filePath);
          
          // Skip directories
          if (stats.isDirectory()) {
            continue;
          }
          
          // Check file extension if specified
          if (allowedExtensions && !allowedExtensions.includes(path.extname(file))) {
            continue;
          }
          
          // Check if file is older than cutoff date
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            cleanedCount++;
            console.log(`    🗑️  Removed: ${file}`);
          }
        } catch (fileError) {
          console.error(`❌ Error processing file ${file}:`, fileError.message);
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Directory doesn't exist, that's fine
        return 0;
      }
      throw error;
    }
    
    return cleanedCount;
  }

  /**
   * Get directory size and file count
   */
  async getDirectoryInfo(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      let totalSize = 0;
      let fileCount = 0;
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
            fileCount++;
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }
      
      return {
        fileCount,
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
      };
    } catch (error) {
      return { fileCount: 0, totalSize: 0, totalSizeMB: 0 };
    }
  }

  /**
   * Generate cleanup report
   */
  async generateCleanupReport() {
    console.log('📊 Generating file cleanup report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      directories: {}
    };
    
    // Check temp directories
    for (const dir of this.tempDirs) {
      report.directories[dir] = await this.getDirectoryInfo(dir);
    }
    
    // Check log directories
    for (const dir of this.logDirs) {
      report.directories[dir] = await this.getDirectoryInfo(dir);
    }
    
    // Check upload directories
    for (const dir of this.uploadDirs) {
      report.directories[dir] = await this.getDirectoryInfo(dir);
    }
    
    return report;
  }

  /**
   * Run comprehensive cleanup
   */
  async runFullCleanup() {
    console.log('🚀 Starting comprehensive file cleanup...');
    
    const results = {
      tempFiles: 0,
      logFiles: 0,
      orphanedUploads: 0,
      errors: []
    };
    
    try {
      results.tempFiles = await this.cleanupTempFiles();
    } catch (error) {
      results.errors.push(`Temp cleanup error: ${error.message}`);
    }
    
    try {
      results.logFiles = await this.cleanupOldLogs();
    } catch (error) {
      results.errors.push(`Log cleanup error: ${error.message}`);
    }
    
    try {
      results.orphanedUploads = await this.cleanupOrphanedUploads();
    } catch (error) {
      results.errors.push(`Upload cleanup error: ${error.message}`);
    }
    
    const totalCleaned = results.tempFiles + results.logFiles + results.orphanedUploads;
    console.log(`✅ Comprehensive cleanup completed. ${totalCleaned} total files removed.`);
    
    if (results.errors.length > 0) {
      console.log('⚠️  Cleanup completed with errors:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    return results;
  }
}

// Create service instance
const fileCleanupService = new FileCleanupService();

// Export functions for use in scheduler
export const cleanupTempFiles = (maxAgeDays) => fileCleanupService.cleanupTempFiles(maxAgeDays);
export const cleanupOldLogs = (maxAgeDays) => fileCleanupService.cleanupOldLogs(maxAgeDays);
export const cleanupOrphanedUploads = () => fileCleanupService.cleanupOrphanedUploads();
export const generateCleanupReport = () => fileCleanupService.generateCleanupReport();
export const runFullCleanup = () => fileCleanupService.runFullCleanup();

export default fileCleanupService;

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'temp':
      await cleanupTempFiles();
      break;
    case 'logs':
      await cleanupOldLogs();
      break;
    case 'uploads':
      await cleanupOrphanedUploads();
      break;
    case 'report':
      const report = await generateCleanupReport();
      console.log(JSON.stringify(report, null, 2));
      break;
    case 'full':
    default:
      await runFullCleanup();
      break;
  }
}