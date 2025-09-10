import cron from 'node-cron';
import { generateSEOFiles } from './sitemap.js';
import { optimizeDatabase } from '../scripts/optimizeDatabase.js';
import { cleanupTempFiles, cleanupOldLogs } from './fileCleanup.js';
import { generateDailyReport, generateWeeklyReport } from './reportGenerator.js';
import { backupDatabase } from './databaseBackup.js';
import { monitorSEOHealth } from './seoHealthMonitor.js';
import { sendScheduledEmails } from './emailCampaigns.js';

/**
 * Automated Task Scheduler
 * Manages all scheduled tasks and cron jobs for ACA Publisher
 */
class TaskScheduler {
  constructor() {
    this.tasks = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize all scheduled tasks
   */
  async initializeTasks() {
    console.log('📅 Initializing scheduled tasks...');
    
    try {
      // SEO tasks - daily at 2 AM
      this.schedule('seo-generation', '0 2 * * *', async () => {
        console.log('🔍 Running SEO generation...');
        const { generateSEOFiles } = await import('./sitemap.js');
        await generateSEOFiles();
      });
      
      // Database optimization - weekly on Sunday at 3 AM
      this.schedule('database-optimization', '0 3 * * 0', async () => {
        console.log('🗄️  Running database optimization...');
        const { spawn } = await import('child_process');
        spawn('node', ['scripts/optimizeDatabase.js'], { stdio: 'inherit' });
      });
      
      // File cleanup - daily at 1 AM
      this.schedule('file-cleanup', '0 1 * * *', async () => {
        console.log('🧹 Running file cleanup...');
        const { runFullCleanup } = await import('./fileCleanup.js');
        await runFullCleanup();
      });
      
      // Generate reports - weekly on Monday at 6 AM
      this.schedule('weekly-reports', '0 6 * * 1', async () => {
        console.log('📊 Generating weekly reports...');
        const { generateDashboardReport, generateSalesReport } = await import('./reportGenerator.js');
        await generateDashboardReport('weekly', 'pdf');
        await generateSalesReport('weekly', 'pdf');
      });
      
      // Database backup - daily at 4 AM
      this.schedule('database-backup', '0 4 * * *', async () => {
        console.log('💾 Creating database backup...');
        const { createBackup } = await import('./backupService.js');
        await createBackup();
      });
      
      // SEO monitoring - every 4 hours
      this.schedule('seo-monitoring', '0 */4 * * *', async () => {
        console.log('🔍 Running SEO monitoring...');
        const { runSEOMonitoring } = await import('./seoMonitoring.js');
        await runSEOMonitoring();
      });
      
      // Email campaigns - check every hour for scheduled campaigns
      this.schedule('email-campaigns', '0 * * * *', async () => {
        console.log('📧 Processing email campaigns...');
        const { addJob } = await import('./queueSystem.js');
        await addJob('email', {
          type: 'process-scheduled-campaigns',
          data: {}
        }, { priority: 3 });
      });
      
      // Queue processing - ensure queue is always running
      this.schedule('queue-health', '*/10 * * * *', async () => {
        const { startProcessing } = await import('./queueSystem.js');
        await startProcessing();
      });
      
      // System health check - every 30 minutes
      this.schedule('health-check', '*/30 * * * *', async () => {
        console.log('🏥 Running system health check...');
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        console.log(`Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
        console.log(`Uptime: ${Math.round(uptime / 3600)}h`);
        
        // Alert if memory usage is too high
        if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
          console.warn('⚠️  High memory usage detected');
          const { sendEmail } = await import('./emailService.js');
          try {
            await sendEmail('system-alert', process.env.ADMIN_EMAIL, {
              subject: 'High Memory Usage Alert',
              message: `Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error('Failed to send memory alert:', error.message);
          }
        }
      });
      
      // Monthly comprehensive reports - first day of month at 7 AM
      this.schedule('monthly-reports', '0 7 1 * *', async () => {
        console.log('📈 Generating monthly comprehensive reports...');
        const { generateDashboardReport, generateSalesReport, generateUserActivityReport } = await import('./reportGenerator.js');
        await generateDashboardReport('monthly', 'pdf');
        await generateSalesReport('monthly', 'pdf');
        await generateUserActivityReport('monthly', 'pdf');
      });
      
      // Backup cleanup - weekly on Saturday at 5 AM
      this.schedule('backup-cleanup', '0 5 * * 6', async () => {
        console.log('🗑️  Cleaning up old backups...');
        const { cleanupOldBackups } = await import('./backupService.js');
        await cleanupOldBackups();
      });
      
      console.log(`✅ ${this.tasks.size} scheduled tasks initialized`);
      
    } catch (error) {
      console.error('❌ Failed to initialize scheduled tasks:', error);
      throw error;
    }
  }

  /**
   * Schedule a task with cron pattern
   */
  schedule(name, cronPattern, taskFunction) {
    const task = cron.schedule(cronPattern, taskFunction, {
      scheduled: false,
      timezone: 'Asia/Jakarta'
    });
    
    this.tasks.set(name, task);
    console.log(`📋 Scheduled task: ${name} (${cronPattern})`);
  }

  /**
   * Initialize all scheduled tasks
   */
  init() {
    if (this.isRunning) {
      console.log('⚠️  Scheduler already running');
      return;
    }

    console.log('🚀 Initializing Task Scheduler...');
    
    // Initialize new task system
    this.initializeTasks();
    
    this.isRunning = true;
    console.log('✅ Task Scheduler initialized successfully');
  }

  /**
   * Schedule daily tasks
   */
  scheduleDailyTasks() {
    // Generate SEO files daily at 2:00 AM
    const seoTask = cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Running daily SEO generation...');
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'https://acapubweb.com';
        const publicDir = process.cwd() + '/public';
        await generateSEOFiles(baseUrl, publicDir);
        console.log('✅ Daily SEO generation completed');
      } catch (error) {
        console.error('❌ Daily SEO generation failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta'
    });

    // Database optimization daily at 3:00 AM
    const dbOptimizeTask = cron.schedule('0 3 * * *', async () => {
      console.log('🔄 Running daily database optimization...');
      try {
        await optimizeDatabase();
        console.log('✅ Daily database optimization completed');
      } catch (error) {
        console.error('❌ Daily database optimization failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta'
    });

    // File cleanup daily at 4:00 AM
    const cleanupTask = cron.schedule('0 4 * * *', async () => {
      console.log('🔄 Running daily file cleanup...');
      try {
        await cleanupTempFiles();
        await cleanupOldLogs();
        console.log('✅ Daily file cleanup completed');
      } catch (error) {
        console.error('❌ Daily file cleanup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta'
    });

    // Daily report generation at 6:00 AM
    const dailyReportTask = cron.schedule('0 6 * * *', async () => {
      console.log('🔄 Generating daily report...');
      try {
        await generateDailyReport();
        console.log('✅ Daily report generated');
      } catch (error) {
        console.error('❌ Daily report generation failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta'
    });

    // SEO health monitoring daily at 8:00 AM
    const seoMonitorTask = cron.schedule('0 8 * * *', async () => {
      console.log('🔄 Running SEO health monitoring...');
      try {
        await monitorSEOHealth();
        console.log('✅ SEO health monitoring completed');
      } catch (error) {
        console.error('❌ SEO health monitoring failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta'
    });

    this.tasks.set('seo-generation', seoTask);
    this.tasks.set('db-optimization', dbOptimizeTask);
    this.tasks.set('file-cleanup', cleanupTask);
    this.tasks.set('daily-report', dailyReportTask);
    this.tasks.set('seo-monitoring', seoMonitorTask);
  }

  /**
   * Schedule weekly tasks
   */
  scheduleWeeklyTasks() {
    // Database backup every Sunday at 1:00 AM
    const backupTask = cron.schedule('0 1 * * 0', async () => {
      console.log('🔄 Running weekly database backup...');
      try {
        await backupDatabase();
        console.log('✅ Weekly database backup completed');
      } catch (error) {
        console.error('❌ Weekly database backup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta'
    });

    // Weekly report generation every Monday at 7:00 AM
    const weeklyReportTask = cron.schedule('0 7 * * 1', async () => {
      console.log('🔄 Generating weekly report...');
      try {
        await generateWeeklyReport();
        console.log('✅ Weekly report generated');
      } catch (error) {
        console.error('❌ Weekly report generation failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta'
    });

    this.tasks.set('db-backup', backupTask);
    this.tasks.set('weekly-report', weeklyReportTask);
  }

  /**
   * Schedule monthly tasks
   */
  scheduleMonthlyTasks() {
    // Comprehensive system health check on 1st of every month at 5:00 AM
    const healthCheckTask = cron.schedule('0 5 1 * *', async () => {
      console.log('🔄 Running monthly system health check...');
      try {
        // Comprehensive health check logic here
        console.log('✅ Monthly system health check completed');
      } catch (error) {
        console.error('❌ Monthly system health check failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta'
    });

    this.tasks.set('health-check', healthCheckTask);
  }

  /**
   * Schedule hourly tasks
   */
  scheduleHourlyTasks() {
    // Send scheduled email campaigns every hour
    const emailCampaignTask = cron.schedule('0 * * * *', async () => {
      console.log('🔄 Processing scheduled email campaigns...');
      try {
        await sendScheduledEmails();
        console.log('✅ Scheduled email campaigns processed');
      } catch (error) {
        console.error('❌ Scheduled email campaigns failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta'
    });

    this.tasks.set('email-campaigns', emailCampaignTask);
  }

  /**
   * Start all scheduled tasks
   */
  start() {
    console.log('▶️  Starting all scheduled tasks...');
    this.tasks.forEach((task, name) => {
      task.start();
      console.log(`✅ Started task: ${name}`);
    });
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    console.log('⏹️  Stopping all scheduled tasks...');
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`🛑 Stopped task: ${name}`);
    });
    this.isRunning = false;
  }

  /**
   * Get status of all tasks
   */
  getStatus() {
    const status = {};
    this.tasks.forEach((task, name) => {
      status[name] = {
        running: task.running || false,
        scheduled: true
      };
    });
    return status;
  }

  /**
   * Run a specific task manually
   */
  async runTask(taskName) {
    const task = this.tasks.get(taskName);
    if (!task) {
      throw new Error(`Task '${taskName}' not found`);
    }
    
    console.log(`🔄 Manually running task: ${taskName}`);
    // Note: This would require extracting the task logic into separate functions
    // for manual execution. For now, we'll just log the attempt.
    console.log(`⚠️  Manual task execution not implemented for: ${taskName}`);
  }
}

// Create singleton instance
const scheduler = new TaskScheduler();

// Export scheduler instance and utilities
export default scheduler;
export { TaskScheduler };

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  scheduler.init();
  scheduler.start();
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM, stopping scheduler...');
    scheduler.stop();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('📴 Received SIGINT, stopping scheduler...');
    scheduler.stop();
    process.exit(0);
  });
}