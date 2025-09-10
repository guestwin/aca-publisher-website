import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';

/**
 * Simple Queue System for Background Processing
 * Handles email sending, PDF processing, and other background tasks
 */
class QueueSystem extends EventEmitter {
  constructor() {
    super();
    this.queues = new Map();
    this.workers = new Map();
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    this.queueFile = path.join(process.cwd(), 'data', 'queue.json');
    
    // Initialize default queues
    this.initializeQueues();
    
    // Load persisted queue data
    this.loadQueueData();
  }

  /**
   * Initialize default queues
   */
  initializeQueues() {
    const defaultQueues = [
      'email',
      'pdf-processing',
      'notifications',
      'reports',
      'cleanup',
      'backup',
      'seo'
    ];
    
    defaultQueues.forEach(queueName => {
      this.queues.set(queueName, {
        name: queueName,
        jobs: [],
        processing: false,
        stats: {
          total: 0,
          completed: 0,
          failed: 0,
          retries: 0
        }
      });
    });
  }

  /**
   * Add job to queue
   */
  async addJob(queueName, jobData, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' does not exist`);
    }

    const job = {
      id: this.generateJobId(),
      type: jobData.type,
      data: jobData.data,
      priority: options.priority || 0,
      retries: 0,
      maxRetries: options.maxRetries || this.maxRetries,
      delay: options.delay || 0,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // Insert job based on priority (higher priority first)
    const insertIndex = queue.jobs.findIndex(existingJob => existingJob.priority < job.priority);
    if (insertIndex === -1) {
      queue.jobs.push(job);
    } else {
      queue.jobs.splice(insertIndex, 0, job);
    }

    queue.stats.total++;
    
    console.log(`📋 Job ${job.id} added to queue '${queueName}'`);
    this.emit('jobAdded', { queueName, job });
    
    // Save queue state
    await this.saveQueueData();
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return job.id;
  }

  /**
   * Register worker for a queue
   */
  registerWorker(queueName, workerFunction) {
    if (typeof workerFunction !== 'function') {
      throw new Error('Worker must be a function');
    }
    
    this.workers.set(queueName, workerFunction);
    console.log(`👷 Worker registered for queue '${queueName}'`);
  }

  /**
   * Start processing queues
   */
  async startProcessing() {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    console.log('🚀 Queue processing started');
    
    while (this.isProcessing) {
      let hasJobs = false;
      
      // Process each queue
      for (const [queueName, queue] of this.queues) {
        if (queue.jobs.length > 0 && !queue.processing) {
          hasJobs = true;
          await this.processQueue(queueName);
        }
      }
      
      // If no jobs, wait a bit before checking again
      if (!hasJobs) {
        await this.sleep(1000);
      }
    }
  }

  /**
   * Stop processing queues
   */
  stopProcessing() {
    this.isProcessing = false;
    console.log('⏹️  Queue processing stopped');
  }

  /**
   * Process a specific queue
   */
  async processQueue(queueName) {
    const queue = this.queues.get(queueName);
    const worker = this.workers.get(queueName);
    
    if (!queue || !worker || queue.processing) {
      return;
    }
    
    queue.processing = true;
    
    while (queue.jobs.length > 0) {
      const job = queue.jobs.shift();
      
      // Check if job should be delayed
      if (job.delay > 0) {
        const now = new Date();
        const jobTime = new Date(job.createdAt);
        if (now.getTime() - jobTime.getTime() < job.delay) {
          // Put job back and wait
          queue.jobs.unshift(job);
          break;
        }
      }
      
      try {
        console.log(`⚙️  Processing job ${job.id} in queue '${queueName}'`);
        job.status = 'processing';
        job.startedAt = new Date().toISOString();
        
        // Execute worker
        await worker(job.data);
        
        // Job completed successfully
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        queue.stats.completed++;
        
        console.log(`✅ Job ${job.id} completed successfully`);
        this.emit('jobCompleted', { queueName, job });
        
      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error.message);
        
        job.retries++;
        job.lastError = error.message;
        
        if (job.retries < job.maxRetries) {
          // Retry job
          job.status = 'retrying';
          job.delay = this.retryDelay * job.retries; // Exponential backoff
          queue.jobs.push(job); // Add back to end of queue
          queue.stats.retries++;
          
          console.log(`🔄 Job ${job.id} will be retried (attempt ${job.retries}/${job.maxRetries})`);
          this.emit('jobRetry', { queueName, job });
        } else {
          // Job failed permanently
          job.status = 'failed';
          job.failedAt = new Date().toISOString();
          queue.stats.failed++;
          
          console.log(`💀 Job ${job.id} failed permanently after ${job.retries} retries`);
          this.emit('jobFailed', { queueName, job });
        }
      }
      
      // Save queue state after each job
      await this.saveQueueData();
    }
    
    queue.processing = false;
  }

  /**
   * Get queue statistics
   */
  getQueueStats(queueName = null) {
    if (queueName) {
      const queue = this.queues.get(queueName);
      return queue ? {
        name: queueName,
        pending: queue.jobs.length,
        processing: queue.processing,
        ...queue.stats
      } : null;
    }
    
    const stats = {};
    for (const [name, queue] of this.queues) {
      stats[name] = {
        pending: queue.jobs.length,
        processing: queue.processing,
        ...queue.stats
      };
    }
    
    return stats;
  }

  /**
   * Clear queue
   */
  async clearQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' does not exist`);
    }
    
    const clearedJobs = queue.jobs.length;
    queue.jobs = [];
    
    await this.saveQueueData();
    console.log(`🗑️  Cleared ${clearedJobs} jobs from queue '${queueName}'`);
    
    return clearedJobs;
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Save queue data to file
   */
  async saveQueueData() {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        queues: {}
      };
      
      for (const [name, queue] of this.queues) {
        data.queues[name] = {
          jobs: queue.jobs,
          stats: queue.stats
        };
      }
      
      // Ensure data directory exists
      const dataDir = path.dirname(this.queueFile);
      await fs.mkdir(dataDir, { recursive: true });
      
      await fs.writeFile(this.queueFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error saving queue data:', error.message);
    }
  }

  /**
   * Load queue data from file
   */
  async loadQueueData() {
    try {
      const data = await fs.readFile(this.queueFile, 'utf8');
      const queueData = JSON.parse(data);
      
      for (const [name, savedQueue] of Object.entries(queueData.queues)) {
        const queue = this.queues.get(name);
        if (queue) {
          queue.jobs = savedQueue.jobs || [];
          queue.stats = { ...queue.stats, ...savedQueue.stats };
        }
      }
      
      console.log('📂 Queue data loaded from file');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error loading queue data:', error.message);
      }
    }
  }
}

// Create global queue instance
const queueSystem = new QueueSystem();

// Register default workers
queueSystem.registerWorker('email', async (data) => {
  const { emailService } = await import('./emailService.js');
  await emailService.sendEmail(data.template, data.to, data.data);
});

queueSystem.registerWorker('pdf-processing', async (data) => {
  const { default: PDFWatermarkService } = await import('./pdfWatermark.js');
  const pdfService = new PDFWatermarkService();
  await pdfService.addWatermark(data.inputPath, data.outputPath, data.watermarkData);
});

queueSystem.registerWorker('notifications', async (data) => {
  const { triggerOrderConfirmation, triggerPaymentReceived } = await import('./notificationTrigger.js');
  
  switch (data.type) {
    case 'order-confirmation':
      await triggerOrderConfirmation(data.userId, data.orderId);
      break;
    case 'payment-received':
      await triggerPaymentReceived(data.userId, data.transactionId);
      break;
  }
});

queueSystem.registerWorker('cleanup', async (data) => {
  const { runFullCleanup } = await import('./fileCleanup.js');
  await runFullCleanup();
});

queueSystem.registerWorker('seo', async (data) => {
  const { generateSEOFiles } = await import('./sitemap.js');
  await generateSEOFiles();
});

// Export functions
export const addJob = (queueName, jobData, options) => queueSystem.addJob(queueName, jobData, options);
export const registerWorker = (queueName, workerFunction) => queueSystem.registerWorker(queueName, workerFunction);
export const getQueueStats = (queueName) => queueSystem.getQueueStats(queueName);
export const clearQueue = (queueName) => queueSystem.clearQueue(queueName);
export const startProcessing = () => queueSystem.startProcessing();
export const stopProcessing = () => queueSystem.stopProcessing();

export default queueSystem;

// Auto-start processing in production
if (process.env.NODE_ENV === 'production') {
  queueSystem.startProcessing();
}