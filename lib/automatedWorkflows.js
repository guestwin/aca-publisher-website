/**
 * Automated Workflows Initialization
 * Menginisialisasi semua sistem automated workflow untuk ACA Publisher
 */

const TaskScheduler = require('./scheduler');
const QueueSystem = require('./queueSystem');
const BackupService = require('./backupService');
const FileCleanupService = require('./fileCleanup');
const EmailCampaignService = require('./emailCampaignService');
const ReportGenerator = require('./reportGenerator');
const SEOMonitoringService = require('./seoMonitoring');

class AutomatedWorkflows {
  constructor() {
    this.scheduler = null;
    this.queueSystem = null;
    this.backupService = null;
    this.fileCleanup = null;
    this.emailCampaign = null;
    this.reportGenerator = null;
    this.seoMonitoring = null;
    this.isInitialized = false;
  }

  /**
   * Initialize all automated workflow systems
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('⚠️  Automated workflows already initialized');
      return;
    }

    console.log('🚀 Initializing Automated Workflows System...');

    try {
      // Initialize Task Scheduler
      console.log('📅 Setting up Task Scheduler...');
      this.scheduler = new TaskScheduler();
      await this.scheduler.start();

      // Initialize Queue System
      console.log('🔄 Setting up Queue System...');
      this.queueSystem = new QueueSystem();
      await this.queueSystem.startProcessing();

      // Initialize Backup Service
      console.log('💾 Setting up Backup Service...');
      this.backupService = new BackupService();

      // Initialize File Cleanup Service
      console.log('🧹 Setting up File Cleanup Service...');
      this.fileCleanup = new FileCleanupService();

      // Initialize Email Campaign Service
      console.log('📧 Setting up Email Campaign Service...');
      this.emailCampaign = new EmailCampaignService();

      // Initialize Report Generator
      console.log('📊 Setting up Report Generator...');
      this.reportGenerator = new ReportGenerator();

      // Initialize SEO Monitoring Service
      console.log('🔍 Setting up SEO Monitoring Service...');
      this.seoMonitoring = new SEOMonitoringService();

      this.isInitialized = true;
      console.log('✅ All automated workflows initialized successfully!');
      
      // Log system status
      await this.logSystemStatus();

    } catch (error) {
      console.error('❌ Failed to initialize automated workflows:', error);
      throw error;
    }
  }

  /**
   * Get system status for all workflows
   */
  async getSystemStatus() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' };
    }

    const status = {
      timestamp: new Date().toISOString(),
      scheduler: {
        running: this.scheduler?.isRunning || false,
        tasks: this.scheduler?.getStatus() || {}
      },
      queue: {
        stats: await this.queueSystem?.getQueueStats() || {},
        processing: this.queueSystem?.isProcessing || false
      },
      services: {
        backup: this.backupService ? 'available' : 'unavailable',
        fileCleanup: this.fileCleanup ? 'available' : 'unavailable',
        emailCampaign: this.emailCampaign ? 'available' : 'unavailable',
        reportGenerator: this.reportGenerator ? 'available' : 'unavailable',
        seoMonitoring: this.seoMonitoring ? 'available' : 'unavailable'
      }
    };

    return status;
  }

  /**
   * Log current system status
   */
  async logSystemStatus() {
    const status = await this.getSystemStatus();
    console.log('📋 System Status:', JSON.stringify(status, null, 2));
  }

  /**
   * Gracefully shutdown all workflows
   */
  async shutdown() {
    console.log('🛑 Shutting down automated workflows...');

    try {
      // Stop scheduler
      if (this.scheduler) {
        await this.scheduler.stop();
        console.log('✅ Task Scheduler stopped');
      }

      // Stop queue processing
      if (this.queueSystem) {
        await this.queueSystem.stopProcessing();
        console.log('✅ Queue System stopped');
      }

      this.isInitialized = false;
      console.log('✅ All automated workflows shut down successfully');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Restart all workflows
   */
  async restart() {
    console.log('🔄 Restarting automated workflows...');
    await this.shutdown();
    await this.initialize();
  }

  /**
   * Add job to queue system
   */
  async addJob(type, data, options = {}) {
    if (!this.queueSystem) {
      throw new Error('Queue system not initialized');
    }
    return await this.queueSystem.addJob(type, data, options);
  }

  /**
   * Manual backup trigger
   */
  async createBackup() {
    if (!this.backupService) {
      throw new Error('Backup service not initialized');
    }
    return await this.backupService.createBackup();
  }

  /**
   * Manual file cleanup trigger
   */
  async runFileCleanup() {
    if (!this.fileCleanup) {
      throw new Error('File cleanup service not initialized');
    }
    return await this.fileCleanup.runFullCleanup();
  }

  /**
   * Manual report generation
   */
  async generateReport(type, period, format) {
    if (!this.reportGenerator) {
      throw new Error('Report generator not initialized');
    }
    
    switch (type) {
      case 'sales':
        return await this.reportGenerator.generateSalesReport(period, format);
      case 'users':
        return await this.reportGenerator.generateUserActivityReport(period, format);
      case 'dashboard':
        return await this.reportGenerator.generateDashboardReport(period, format);
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  /**
   * Manual SEO monitoring
   */
  async runSEOMonitoring() {
    if (!this.seoMonitoring) {
      throw new Error('SEO monitoring service not initialized');
    }
    return await this.seoMonitoring.runSEOMonitoring();
  }

  /**
   * Send email campaign
   */
  async sendEmailCampaign(campaignData) {
    if (!this.emailCampaign) {
      throw new Error('Email campaign service not initialized');
    }
    return await this.emailCampaign.createCampaign(campaignData);
  }
}

// Singleton instance
let workflowInstance = null;

/**
 * Get or create workflow instance
 */
function getWorkflowInstance() {
  if (!workflowInstance) {
    workflowInstance = new AutomatedWorkflows();
  }
  return workflowInstance;
}

/**
 * Initialize workflows (can be called multiple times safely)
 */
async function initializeWorkflows() {
  const workflows = getWorkflowInstance();
  await workflows.initialize();
  return workflows;
}

/**
 * Auto-initialize in production
 */
if (process.env.NODE_ENV === 'production') {
  initializeWorkflows().catch(error => {
    console.error('Failed to auto-initialize workflows:', error);
  });
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down workflows...');
  if (workflowInstance) {
    await workflowInstance.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down workflows...');
  if (workflowInstance) {
    await workflowInstance.shutdown();
  }
  process.exit(0);
});

module.exports = {
  AutomatedWorkflows,
  getWorkflowInstance,
  initializeWorkflows
};

// Export individual functions for convenience
module.exports.addJob = async (type, data, options) => {
  const workflows = getWorkflowInstance();
  return await workflows.addJob(type, data, options);
};

module.exports.createBackup = async () => {
  const workflows = getWorkflowInstance();
  return await workflows.createBackup();
};

module.exports.runFileCleanup = async () => {
  const workflows = getWorkflowInstance();
  return await workflows.runFileCleanup();
};

module.exports.generateReport = async (type, period, format) => {
  const workflows = getWorkflowInstance();
  return await workflows.generateReport(type, period, format);
};

module.exports.runSEOMonitoring = async () => {
  const workflows = getWorkflowInstance();
  return await workflows.runSEOMonitoring();
};

module.exports.sendEmailCampaign = async (campaignData) => {
  const workflows = getWorkflowInstance();
  return await workflows.sendEmailCampaign(campaignData);
};

module.exports.getSystemStatus = async () => {
  const workflows = getWorkflowInstance();
  return await workflows.getSystemStatus();
};