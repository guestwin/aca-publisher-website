import { connectDB } from './mongodb.js';
import { sendEmail } from './emailService.js';
import { addJob } from './queueSystem.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Automated Email Campaign Service
 * Handles newsletter, promotional emails, and automated sequences
 */
class EmailCampaignService {
  constructor() {
    this.campaignDir = path.join(process.cwd(), 'data', 'campaigns');
    this.templatesDir = path.join(process.cwd(), 'email-templates');
    this.maxBatchSize = 50; // Send emails in batches
    this.batchDelay = 5000; // 5 seconds between batches
  }

  /**
   * Create email campaign
   */
  async createCampaign(campaignData) {
    const campaign = {
      id: this.generateCampaignId(),
      name: campaignData.name,
      subject: campaignData.subject,
      template: campaignData.template,
      templateData: campaignData.templateData || {},
      audience: campaignData.audience, // 'all', 'subscribers', 'customers', 'composers'
      filters: campaignData.filters || {},
      scheduledAt: campaignData.scheduledAt || new Date().toISOString(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      stats: {
        total: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0
      }
    };

    // Save campaign
    await this.saveCampaign(campaign);
    
    console.log(`📧 Campaign created: ${campaign.name} (${campaign.id})`);
    return campaign;
  }

  /**
   * Schedule campaign for sending
   */
  async scheduleCampaign(campaignId, scheduledAt = null) {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    campaign.scheduledAt = scheduledAt || new Date().toISOString();
    campaign.status = 'scheduled';
    
    await this.saveCampaign(campaign);
    
    // Add to queue for processing
    await addJob('email', {
      type: 'campaign',
      data: { campaignId }
    }, {
      delay: scheduledAt ? new Date(scheduledAt).getTime() - Date.now() : 0,
      priority: 5
    });
    
    console.log(`📅 Campaign scheduled: ${campaign.name}`);
    return campaign;
  }

  /**
   * Send campaign immediately
   */
  async sendCampaign(campaignId) {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    console.log(`🚀 Starting campaign: ${campaign.name}`);
    
    try {
      // Get recipients
      const recipients = await this.getRecipients(campaign.audience, campaign.filters);
      campaign.stats.total = recipients.length;
      
      if (recipients.length === 0) {
        throw new Error('No recipients found for campaign');
      }
      
      console.log(`👥 Found ${recipients.length} recipients`);
      
      // Update campaign status
      campaign.status = 'sending';
      campaign.startedAt = new Date().toISOString();
      await this.saveCampaign(campaign);
      
      // Send emails in batches
      await this.sendInBatches(campaign, recipients);
      
      // Update final status
      campaign.status = 'completed';
      campaign.completedAt = new Date().toISOString();
      await this.saveCampaign(campaign);
      
      console.log(`✅ Campaign completed: ${campaign.name}`);
      console.log(`   Sent: ${campaign.stats.sent}/${campaign.stats.total}`);
      
      return campaign;
      
    } catch (error) {
      campaign.status = 'failed';
      campaign.error = error.message;
      campaign.failedAt = new Date().toISOString();
      await this.saveCampaign(campaign);
      
      console.error(`❌ Campaign failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send emails in batches to avoid overwhelming the email service
   */
  async sendInBatches(campaign, recipients) {
    const batches = this.chunkArray(recipients, this.maxBatchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Sending batch ${i + 1}/${batches.length} (${batch.length} emails)`);
      
      // Send batch
      const batchPromises = batch.map(recipient => 
        this.sendCampaignEmail(campaign, recipient)
      );
      
      const results = await Promise.allSettled(batchPromises);
      
      // Update stats
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          campaign.stats.sent++;
        }
      });
      
      // Save progress
      await this.saveCampaign(campaign);
      
      // Wait between batches (except for the last one)
      if (i < batches.length - 1) {
        await this.sleep(this.batchDelay);
      }
    }
  }

  /**
   * Send individual campaign email
   */
  async sendCampaignEmail(campaign, recipient) {
    try {
      // Prepare template data with recipient info
      const templateData = {
        ...campaign.templateData,
        recipient: {
          name: recipient.name || recipient.email,
          email: recipient.email,
          firstName: recipient.firstName || recipient.name?.split(' ')[0] || 'Friend'
        },
        campaign: {
          id: campaign.id,
          name: campaign.name
        },
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?email=${encodeURIComponent(recipient.email)}&campaign=${campaign.id}`
      };
      
      // Send email
      await sendEmail(campaign.template, recipient.email, templateData);
      
      // Log successful send
      await this.logEmailSent(campaign.id, recipient.email, 'sent');
      
    } catch (error) {
      console.error(`❌ Failed to send email to ${recipient.email}:`, error.message);
      await this.logEmailSent(campaign.id, recipient.email, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Get recipients based on audience and filters
   */
  async getRecipients(audience, filters = {}) {
    await connectDB();
    const { User, Composer } = await import('../models/User.js');
    
    let recipients = [];
    
    switch (audience) {
      case 'all':
        // Get all users and composers
        const users = await User.find({ emailSubscribed: { $ne: false } }, 'name email firstName');
        const composers = await Composer.find({ emailSubscribed: { $ne: false } }, 'name email firstName');
        recipients = [...users, ...composers];
        break;
        
      case 'subscribers':
        // Get users who explicitly subscribed to newsletter
        recipients = await User.find({ 
          emailSubscribed: true,
          newsletterSubscribed: true 
        }, 'name email firstName');
        break;
        
      case 'customers':
        // Get users who made purchases
        const { Transaction } = await import('../models/Transaction.js');
        const customerIds = await Transaction.distinct('userId', { status: 'completed' });
        recipients = await User.find({ 
          _id: { $in: customerIds },
          emailSubscribed: { $ne: false }
        }, 'name email firstName');
        break;
        
      case 'composers':
        // Get all composers
        recipients = await Composer.find({ 
          emailSubscribed: { $ne: false }
        }, 'name email firstName');
        break;
        
      case 'inactive':
        // Get users who haven't logged in recently
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (filters.inactiveDays || 30));
        recipients = await User.find({
          lastLoginAt: { $lt: cutoffDate },
          emailSubscribed: { $ne: false }
        }, 'name email firstName');
        break;
        
      default:
        throw new Error(`Unknown audience type: ${audience}`);
    }
    
    // Apply additional filters
    if (filters.location) {
      recipients = recipients.filter(r => r.location === filters.location);
    }
    
    if (filters.registeredAfter) {
      const afterDate = new Date(filters.registeredAfter);
      recipients = recipients.filter(r => new Date(r.createdAt) > afterDate);
    }
    
    // Remove duplicates and invalid emails
    const uniqueRecipients = recipients
      .filter(r => r.email && this.isValidEmail(r.email))
      .reduce((acc, current) => {
        const exists = acc.find(item => item.email === current.email);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
    
    return uniqueRecipients;
  }

  /**
   * Create automated email sequence
   */
  async createEmailSequence(sequenceData) {
    const sequence = {
      id: this.generateSequenceId(),
      name: sequenceData.name,
      trigger: sequenceData.trigger, // 'signup', 'purchase', 'abandoned_cart'
      emails: sequenceData.emails.map((email, index) => ({
        id: `${this.generateCampaignId()}_${index}`,
        subject: email.subject,
        template: email.template,
        templateData: email.templateData || {},
        delayDays: email.delayDays || 0,
        delayHours: email.delayHours || 0
      })),
      active: true,
      createdAt: new Date().toISOString(),
      stats: {
        triggered: 0,
        completed: 0
      }
    };
    
    await this.saveSequence(sequence);
    console.log(`🔄 Email sequence created: ${sequence.name}`);
    
    return sequence;
  }

  /**
   * Trigger email sequence for user
   */
  async triggerSequence(sequenceId, userId, triggerData = {}) {
    const sequence = await this.getSequence(sequenceId);
    if (!sequence || !sequence.active) {
      return;
    }
    
    console.log(`🎯 Triggering sequence: ${sequence.name} for user ${userId}`);
    
    // Schedule each email in the sequence
    for (const email of sequence.emails) {
      const delayMs = (email.delayDays * 24 * 60 * 60 * 1000) + (email.delayHours * 60 * 60 * 1000);
      
      await addJob('email', {
        type: 'sequence-email',
        data: {
          sequenceId,
          emailId: email.id,
          userId,
          triggerData
        }
      }, {
        delay: delayMs,
        priority: 3
      });
    }
    
    // Update stats
    sequence.stats.triggered++;
    await this.saveSequence(sequence);
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId) {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      return null;
    }
    
    // Calculate rates
    const deliveryRate = campaign.stats.total > 0 ? 
      (campaign.stats.delivered / campaign.stats.total * 100).toFixed(2) : 0;
    const openRate = campaign.stats.delivered > 0 ? 
      (campaign.stats.opened / campaign.stats.delivered * 100).toFixed(2) : 0;
    const clickRate = campaign.stats.opened > 0 ? 
      (campaign.stats.clicked / campaign.stats.opened * 100).toFixed(2) : 0;
    
    return {
      ...campaign,
      analytics: {
        deliveryRate: `${deliveryRate}%`,
        openRate: `${openRate}%`,
        clickRate: `${clickRate}%`,
        unsubscribeRate: campaign.stats.sent > 0 ? 
          `${(campaign.stats.unsubscribed / campaign.stats.sent * 100).toFixed(2)}%` : '0%'
      }
    };
  }

  /**
   * Utility functions
   */
  generateCampaignId() {
    return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateSequenceId() {
    return `sequence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * File operations
   */
  async saveCampaign(campaign) {
    await fs.mkdir(this.campaignDir, { recursive: true });
    const filePath = path.join(this.campaignDir, `${campaign.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(campaign, null, 2));
  }
  
  async getCampaign(campaignId) {
    try {
      const filePath = path.join(this.campaignDir, `${campaignId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
  
  async saveSequence(sequence) {
    await fs.mkdir(this.campaignDir, { recursive: true });
    const filePath = path.join(this.campaignDir, `${sequence.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(sequence, null, 2));
  }
  
  async getSequence(sequenceId) {
    try {
      const filePath = path.join(this.campaignDir, `${sequenceId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
  
  async logEmailSent(campaignId, email, status, error = null) {
    const logDir = path.join(this.campaignDir, 'logs');
    await fs.mkdir(logDir, { recursive: true });
    
    const logFile = path.join(logDir, `${campaignId}.log`);
    const logEntry = `${new Date().toISOString()} - ${email} - ${status}${error ? ` - ${error}` : ''}\n`;
    
    await fs.appendFile(logFile, logEntry);
  }
}

// Create service instance
const emailCampaignService = new EmailCampaignService();

// Export functions
export const createCampaign = (campaignData) => emailCampaignService.createCampaign(campaignData);
export const scheduleCampaign = (campaignId, scheduledAt) => emailCampaignService.scheduleCampaign(campaignId, scheduledAt);
export const sendCampaign = (campaignId) => emailCampaignService.sendCampaign(campaignId);
export const createEmailSequence = (sequenceData) => emailCampaignService.createEmailSequence(sequenceData);
export const triggerSequence = (sequenceId, userId, triggerData) => emailCampaignService.triggerSequence(sequenceId, userId, triggerData);
export const getCampaignAnalytics = (campaignId) => emailCampaignService.getCampaignAnalytics(campaignId);

export default emailCampaignService;