import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { addJob } from './queueSystem.js';
import { sendEmail } from './emailService.js';

/**
 * SEO Monitoring and Alerts Service
 * Monitors website SEO performance and sends alerts
 */
class SEOMonitoringService {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    this.monitoringDir = path.join(process.cwd(), 'data', 'seo-monitoring');
    this.alertsEmail = process.env.SEO_ALERTS_EMAIL || process.env.ADMIN_EMAIL;
    this.thresholds = {
      pageLoadTime: 3000, // 3 seconds
      seoScore: 80,
      accessibilityScore: 90,
      performanceScore: 85,
      uptimePercentage: 99.5
    };
  }

  /**
   * Run comprehensive SEO monitoring
   */
  async runSEOMonitoring() {
    console.log('🔍 Starting SEO monitoring...');
    
    try {
      const results = {
        timestamp: new Date().toISOString(),
        website: this.baseUrl,
        checks: {}
      };
      
      // Run all monitoring checks
      results.checks.uptime = await this.checkUptime();
      results.checks.performance = await this.checkPerformance();
      results.checks.seo = await this.checkSEOBasics();
      results.checks.sitemap = await this.checkSitemap();
      results.checks.robots = await this.checkRobotsTxt();
      results.checks.ssl = await this.checkSSL();
      results.checks.meta = await this.checkMetaTags();
      results.checks.images = await this.checkImages();
      results.checks.links = await this.checkLinks();
      
      // Calculate overall score
      results.overallScore = this.calculateOverallScore(results.checks);
      
      // Save results
      await this.saveMonitoringResults(results);
      
      // Check for alerts
      await this.checkAlerts(results);
      
      console.log(`✅ SEO monitoring completed. Overall score: ${results.overallScore}/100`);
      return results;
      
    } catch (error) {
      console.error(`❌ SEO monitoring failed: ${error.message}`);
      await this.sendAlert('SEO Monitoring Failed', `SEO monitoring encountered an error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check website uptime
   */
  async checkUptime() {
    try {
      const startTime = Date.now();
      const response = await axios.get(this.baseUrl, {
        timeout: 10000,
        validateStatus: (status) => status < 500
      });
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'up',
        responseTime,
        statusCode: response.status,
        score: response.status === 200 ? 100 : response.status < 400 ? 80 : 50
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Check website performance
   */
  async checkPerformance() {
    try {
      const startTime = Date.now();
      const response = await axios.get(this.baseUrl, { timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      // Basic performance metrics
      const contentLength = response.headers['content-length'] || 0;
      const hasGzip = response.headers['content-encoding'] === 'gzip';
      const hasCaching = response.headers['cache-control'] || response.headers['expires'];
      
      let score = 100;
      if (loadTime > this.thresholds.pageLoadTime) score -= 20;
      if (!hasGzip) score -= 15;
      if (!hasCaching) score -= 10;
      if (contentLength > 1000000) score -= 10; // 1MB
      
      return {
        loadTime,
        contentLength: parseInt(contentLength),
        hasGzip,
        hasCaching: !!hasCaching,
        score: Math.max(0, score)
      };
    } catch (error) {
      return {
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Check basic SEO elements
   */
  async checkSEOBasics() {
    try {
      const response = await axios.get(this.baseUrl);
      const html = response.data;
      
      const checks = {
        hasTitle: /<title[^>]*>([^<]+)<\/title>/i.test(html),
        hasMetaDescription: /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i.test(html),
        hasMetaKeywords: /<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i.test(html),
        hasH1: /<h1[^>]*>([^<]+)<\/h1>/i.test(html),
        hasCanonical: /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.test(html),
        hasViewport: /<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i.test(html),
        hasOgTags: /<meta[^>]*property=["']og:/i.test(html),
        hasTwitterCard: /<meta[^>]*name=["']twitter:card["']/i.test(html),
        hasStructuredData: /application\/ld\+json/i.test(html)
      };
      
      const passedChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;
      const score = Math.round((passedChecks / totalChecks) * 100);
      
      return {
        ...checks,
        passedChecks,
        totalChecks,
        score
      };
    } catch (error) {
      return {
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Check sitemap accessibility
   */
  async checkSitemap() {
    try {
      const sitemapUrl = `${this.baseUrl}/sitemap.xml`;
      const response = await axios.get(sitemapUrl);
      
      const isXML = response.headers['content-type']?.includes('xml');
      const hasUrls = response.data.includes('<url>');
      const hasLastmod = response.data.includes('<lastmod>');
      
      let score = 100;
      if (!isXML) score -= 30;
      if (!hasUrls) score -= 40;
      if (!hasLastmod) score -= 20;
      
      return {
        accessible: response.status === 200,
        isXML,
        hasUrls,
        hasLastmod,
        size: response.data.length,
        score: Math.max(0, score)
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Check robots.txt
   */
  async checkRobotsTxt() {
    try {
      const robotsUrl = `${this.baseUrl}/robots.txt`;
      const response = await axios.get(robotsUrl);
      
      const content = response.data;
      const hasUserAgent = content.includes('User-agent:');
      const hasSitemap = content.includes('Sitemap:');
      const hasDisallow = content.includes('Disallow:');
      
      let score = 100;
      if (!hasUserAgent) score -= 40;
      if (!hasSitemap) score -= 30;
      if (!hasDisallow) score -= 20;
      
      return {
        accessible: response.status === 200,
        hasUserAgent,
        hasSitemap,
        hasDisallow,
        size: content.length,
        score: Math.max(0, score)
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Check SSL certificate
   */
  async checkSSL() {
    try {
      if (!this.baseUrl.startsWith('https://')) {
        return {
          hasSSL: false,
          score: 0,
          message: 'Website is not using HTTPS'
        };
      }
      
      const response = await axios.get(this.baseUrl);
      
      return {
        hasSSL: true,
        score: 100,
        message: 'SSL certificate is valid'
      };
    } catch (error) {
      return {
        hasSSL: false,
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Check meta tags on key pages
   */
  async checkMetaTags() {
    const pagesToCheck = ['/', '/products', '/composers', '/about'];
    const results = {};
    let totalScore = 0;
    
    for (const page of pagesToCheck) {
      try {
        const url = `${this.baseUrl}${page}`;
        const response = await axios.get(url);
        const html = response.data;
        
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        
        const title = titleMatch ? titleMatch[1].trim() : '';
        const description = descMatch ? descMatch[1].trim() : '';
        
        let pageScore = 100;
        if (!title || title.length < 10 || title.length > 60) pageScore -= 40;
        if (!description || description.length < 120 || description.length > 160) pageScore -= 40;
        if (title.toLowerCase().includes('untitled')) pageScore -= 20;
        
        results[page] = {
          title,
          titleLength: title.length,
          description,
          descriptionLength: description.length,
          score: Math.max(0, pageScore)
        };
        
        totalScore += results[page].score;
      } catch (error) {
        results[page] = {
          error: error.message,
          score: 0
        };
      }
    }
    
    return {
      pages: results,
      averageScore: Math.round(totalScore / pagesToCheck.length),
      score: Math.round(totalScore / pagesToCheck.length)
    };
  }

  /**
   * Check images for SEO optimization
   */
  async checkImages() {
    try {
      const response = await axios.get(this.baseUrl);
      const html = response.data;
      
      const imgTags = html.match(/<img[^>]*>/gi) || [];
      let totalImages = imgTags.length;
      let imagesWithAlt = 0;
      let imagesWithTitle = 0;
      let imagesWithLazyLoad = 0;
      
      imgTags.forEach(img => {
        if (img.includes('alt=')) imagesWithAlt++;
        if (img.includes('title=')) imagesWithTitle++;
        if (img.includes('loading="lazy"')) imagesWithLazyLoad++;
      });
      
      const altPercentage = totalImages > 0 ? (imagesWithAlt / totalImages) * 100 : 100;
      const lazyLoadPercentage = totalImages > 0 ? (imagesWithLazyLoad / totalImages) * 100 : 100;
      
      let score = Math.round((altPercentage * 0.7) + (lazyLoadPercentage * 0.3));
      
      return {
        totalImages,
        imagesWithAlt,
        imagesWithTitle,
        imagesWithLazyLoad,
        altPercentage: Math.round(altPercentage),
        lazyLoadPercentage: Math.round(lazyLoadPercentage),
        score
      };
    } catch (error) {
      return {
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Check internal and external links
   */
  async checkLinks() {
    try {
      const response = await axios.get(this.baseUrl);
      const html = response.data;
      
      const linkTags = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
      let internalLinks = 0;
      let externalLinks = 0;
      let brokenLinks = 0;
      
      for (const link of linkTags.slice(0, 20)) { // Check first 20 links
        const hrefMatch = link.match(/href=["']([^"']+)["']/);
        if (hrefMatch) {
          const href = hrefMatch[1];
          if (href.startsWith('http')) {
            if (href.includes(this.baseUrl)) {
              internalLinks++;
            } else {
              externalLinks++;
            }
          } else if (href.startsWith('/')) {
            internalLinks++;
          }
        }
      }
      
      const totalLinks = internalLinks + externalLinks;
      const internalRatio = totalLinks > 0 ? (internalLinks / totalLinks) * 100 : 0;
      
      let score = 100;
      if (internalRatio < 60) score -= 20; // Should have more internal links
      if (totalLinks < 5) score -= 30; // Should have reasonable number of links
      
      return {
        totalLinks,
        internalLinks,
        externalLinks,
        brokenLinks,
        internalRatio: Math.round(internalRatio),
        score: Math.max(0, score)
      };
    } catch (error) {
      return {
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Calculate overall SEO score
   */
  calculateOverallScore(checks) {
    const weights = {
      uptime: 0.2,
      performance: 0.15,
      seo: 0.2,
      sitemap: 0.1,
      robots: 0.1,
      ssl: 0.1,
      meta: 0.1,
      images: 0.05,
      links: 0.05
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(checks).forEach(([key, result]) => {
      if (weights[key] && result.score !== undefined) {
        totalScore += result.score * weights[key];
        totalWeight += weights[key];
      }
    });
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Check for alerts and send notifications
   */
  async checkAlerts(results) {
    const alerts = [];
    
    // Check uptime
    if (results.checks.uptime.status === 'down') {
      alerts.push({
        type: 'critical',
        message: 'Website is down!',
        details: results.checks.uptime.error
      });
    }
    
    // Check performance
    if (results.checks.performance.loadTime > this.thresholds.pageLoadTime) {
      alerts.push({
        type: 'warning',
        message: `Slow page load time: ${results.checks.performance.loadTime}ms`,
        details: `Threshold: ${this.thresholds.pageLoadTime}ms`
      });
    }
    
    // Check overall SEO score
    if (results.overallScore < this.thresholds.seoScore) {
      alerts.push({
        type: 'warning',
        message: `Low SEO score: ${results.overallScore}/100`,
        details: `Threshold: ${this.thresholds.seoScore}/100`
      });
    }
    
    // Check sitemap
    if (!results.checks.sitemap.accessible) {
      alerts.push({
        type: 'error',
        message: 'Sitemap is not accessible',
        details: results.checks.sitemap.error
      });
    }
    
    // Check robots.txt
    if (!results.checks.robots.accessible) {
      alerts.push({
        type: 'error',
        message: 'Robots.txt is not accessible',
        details: results.checks.robots.error
      });
    }
    
    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlerts(alerts, results);
    }
    
    return alerts;
  }

  /**
   * Send alert notifications
   */
  async sendAlerts(alerts, results) {
    if (!this.alertsEmail) {
      console.log('⚠️  No alerts email configured');
      return;
    }
    
    const criticalAlerts = alerts.filter(a => a.type === 'critical');
    const errorAlerts = alerts.filter(a => a.type === 'error');
    const warningAlerts = alerts.filter(a => a.type === 'warning');
    
    let subject = 'SEO Monitoring Alert';
    if (criticalAlerts.length > 0) {
      subject = '🚨 CRITICAL: SEO Monitoring Alert';
    } else if (errorAlerts.length > 0) {
      subject = '❌ ERROR: SEO Monitoring Alert';
    } else {
      subject = '⚠️  WARNING: SEO Monitoring Alert';
    }
    
    const emailContent = {
      subject,
      alerts,
      overallScore: results.overallScore,
      website: this.baseUrl,
      timestamp: results.timestamp,
      summary: {
        critical: criticalAlerts.length,
        errors: errorAlerts.length,
        warnings: warningAlerts.length
      }
    };
    
    try {
      await sendEmail('seo-alert', this.alertsEmail, emailContent);
      console.log(`📧 SEO alerts sent to ${this.alertsEmail}`);
    } catch (error) {
      console.error(`❌ Failed to send SEO alerts: ${error.message}`);
    }
  }

  /**
   * Send individual alert
   */
  async sendAlert(subject, message) {
    if (!this.alertsEmail) return;
    
    try {
      await sendEmail('simple-alert', this.alertsEmail, {
        subject,
        message,
        website: this.baseUrl,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Failed to send alert: ${error.message}`);
    }
  }

  /**
   * Save monitoring results
   */
  async saveMonitoringResults(results) {
    try {
      await fs.mkdir(this.monitoringDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `seo-monitoring-${timestamp}.json`;
      const filePath = path.join(this.monitoringDir, filename);
      
      await fs.writeFile(filePath, JSON.stringify(results, null, 2));
      
      // Also save as latest.json for easy access
      const latestPath = path.join(this.monitoringDir, 'latest.json');
      await fs.writeFile(latestPath, JSON.stringify(results, null, 2));
      
      console.log(`💾 SEO monitoring results saved: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to save monitoring results: ${error.message}`);
    }
  }

  /**
   * Get monitoring history
   */
  async getMonitoringHistory(days = 30) {
    try {
      const files = await fs.readdir(this.monitoringDir);
      const monitoringFiles = files
        .filter(file => file.startsWith('seo-monitoring-') && file.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, days);
      
      const history = [];
      
      for (const file of monitoringFiles) {
        try {
          const filePath = path.join(this.monitoringDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const result = JSON.parse(data);
          
          history.push({
            timestamp: result.timestamp,
            overallScore: result.overallScore,
            uptime: result.checks.uptime?.status,
            performance: result.checks.performance?.loadTime,
            seoScore: result.checks.seo?.score
          });
        } catch (error) {
          // Skip invalid files
        }
      }
      
      return history;
    } catch (error) {
      console.error(`❌ Failed to get monitoring history: ${error.message}`);
      return [];
    }
  }

  /**
   * Schedule SEO monitoring
   */
  async scheduleMonitoring() {
    // Schedule hourly monitoring
    await addJob('seo', {
      type: 'seo-monitoring',
      data: {}
    }, { priority: 2 });
    
    console.log('📅 SEO monitoring scheduled');
  }
}

// Create service instance
const seoMonitoringService = new SEOMonitoringService();

// Export functions
export const runSEOMonitoring = () => seoMonitoringService.runSEOMonitoring();
export const getMonitoringHistory = (days) => seoMonitoringService.getMonitoringHistory(days);
export const scheduleMonitoring = () => seoMonitoringService.scheduleMonitoring();

export default seoMonitoringService;

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'run':
      await runSEOMonitoring();
      break;
    case 'history':
      const days = parseInt(process.argv[3]) || 30;
      const history = await getMonitoringHistory(days);
      console.table(history);
      break;
    case 'schedule':
      await scheduleMonitoring();
      break;
    default:
      console.log('Available commands: run, history, schedule');
      break;
  }
}