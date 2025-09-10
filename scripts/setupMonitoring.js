/**
 * Script untuk setup monitoring dan analytics production
 * Mencakup uptime monitoring, error tracking, performance monitoring, dan analytics
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class MonitoringSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.domain = 'www.acapublisher.com';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async setupErrorTracking() {
    this.log('Setting up error tracking with Sentry...', 'info');
    
    try {
      // Install Sentry
      this.log('Installing Sentry SDK...', 'info');
      execSync('npm install @sentry/nextjs @sentry/tracing', { stdio: 'inherit' });
      
      // Create Sentry configuration
      const sentryConfig = `// This file configures the initialization of Sentry on the browser side
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Performance Monitoring
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      tracePropagationTargets: ['localhost', /^https:\/\/yourserver\//],
    }),
  ],
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with an error will be recorded
  
  beforeSend(event) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry Event:', event);
    }
    return event;
  },
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NODE_ENV,
});
`;
      
      await fs.writeFile(path.join(this.projectRoot, 'sentry.client.config.js'), sentryConfig);
      
      // Server-side Sentry config
      const sentryServerConfig = `// This file configures the initialization of Sentry on the server side
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Performance Monitoring
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  
  beforeSend(event) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    return event;
  },
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NODE_ENV,
});
`;
      
      await fs.writeFile(path.join(this.projectRoot, 'sentry.server.config.js'), sentryServerConfig);
      
      // Next.js Sentry config
      const sentryNextConfig = `// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const { withSentryConfig } = require('@sentry/nextjs');

const moduleExports = {
  // Your existing module.exports
  reactStrictMode: true,
  swcMinify: true,
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses source map uploading logs during build
};

module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions);
`;
      
      // Update next.config.js to include Sentry
      const nextConfigPath = path.join(this.projectRoot, 'next.config.js');
      const nextConfigExists = await this.fileExists(nextConfigPath);
      
      if (!nextConfigExists) {
        await fs.writeFile(nextConfigPath, sentryNextConfig);
      }
      
      this.log('✅ Sentry error tracking configured', 'success');
      
    } catch (error) {
      this.log(`❌ Error tracking setup failed: ${error.message}`, 'error');
    }
  }

  async setupUptimeMonitoring() {
    this.log('Setting up uptime monitoring...', 'info');
    
    const uptimeConfig = {
      uptimeRobot: {
        name: 'UptimeRobot',
        features: [
          'Free plan: 50 monitors, 5-minute intervals',
          'HTTP(s), ping, port, keyword monitoring',
          'Email, SMS, webhook notifications',
          'Public status pages',
          'Mobile app available'
        ],
        setup: [
          '1. Sign up at https://uptimerobot.com',
          '2. Add HTTP(S) monitor for https://www.acapublisher.com',
          '3. Add keyword monitor for "ACA Publisher" text',
          '4. Set up notification contacts (email, SMS)',
          '5. Configure alert settings (when to notify)',
          '6. Create public status page (optional)',
          '7. Set up webhook for Slack/Discord notifications'
        ]
      },
      pingdom: {
        name: 'Pingdom',
        features: [
          'Real user monitoring (RUM)',
          'Synthetic monitoring',
          'Page speed monitoring',
          'Transaction monitoring',
          'Root cause analysis'
        ],
        setup: [
          '1. Sign up at https://pingdom.com',
          '2. Add uptime check for main domain',
          '3. Set up page speed monitoring',
          '4. Configure transaction monitoring for checkout',
          '5. Set up alert integrations',
          '6. Create custom dashboards'
        ]
      },
      statusPage: {
        name: 'Status Page',
        setup: [
          '1. Create status.acapublisher.com subdomain',
          '2. Set up status page service (StatusPage.io, Atlassian)',
          '3. Connect monitoring services',
          '4. Configure incident management',
          '5. Set up subscriber notifications',
          '6. Create maintenance schedules'
        ]
      }
    };
    
    // Create uptime monitoring script
    const uptimeScript = `// Simple uptime monitoring script
const https = require('https');
const nodemailer = require('nodemailer');

class UptimeMonitor {
  constructor() {
    this.urls = [
      'https://www.acapublisher.com',
      'https://www.acapublisher.com/api/health',
      'https://www.acapublisher.com/products',
      'https://www.acapublisher.com/checkout'
    ];
    this.interval = 5 * 60 * 1000; // 5 minutes
    this.alertThreshold = 3; // Alert after 3 consecutive failures
    this.failures = new Map();
  }
  
  async checkUrl(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = https.get(url, (res) => {
        const responseTime = Date.now() - startTime;
        const isHealthy = res.statusCode >= 200 && res.statusCode < 400;
        
        resolve({
          url,
          status: res.statusCode,
          responseTime,
          isHealthy,
          timestamp: new Date().toISOString()
        });
      });
      
      req.on('error', (error) => {
        resolve({
          url,
          status: 0,
          responseTime: Date.now() - startTime,
          isHealthy: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });
      
      req.setTimeout(30000, () => {
        req.destroy();
        resolve({
          url,
          status: 0,
          responseTime: 30000,
          isHealthy: false,
          error: 'Timeout',
          timestamp: new Date().toISOString()
        });
      });
    });
  }
  
  async sendAlert(url, failures) {
    // Send email alert (configure with your email service)
    console.log(\`🚨 ALERT: \${url} has failed \${failures} times\`);
    
    // You can integrate with:
    // - Nodemailer for email
    // - Slack webhook
    // - Discord webhook
    // - SMS service
  }
  
  async monitor() {
    console.log('🔍 Starting uptime monitoring...');
    
    setInterval(async () => {
      for (const url of this.urls) {
        try {
          const result = await this.checkUrl(url);
          
          if (result.isHealthy) {
            // Reset failure count on success
            this.failures.delete(url);
            console.log(\`✅ \${url} - \${result.status} (\${result.responseTime}ms)\`);
          } else {
            // Increment failure count
            const currentFailures = this.failures.get(url) || 0;
            const newFailures = currentFailures + 1;
            this.failures.set(url, newFailures);
            
            console.log(\`❌ \${url} - \${result.status || 'ERROR'} (\${result.responseTime}ms) - Failure #\${newFailures}\`);
            
            // Send alert if threshold reached
            if (newFailures >= this.alertThreshold) {
              await this.sendAlert(url, newFailures);
            }
          }
        } catch (error) {
          console.error(\`Error monitoring \${url}:\`, error);
        }
      }
    }, this.interval);
  }
}

// Start monitoring if run directly
if (require.main === module) {
  const monitor = new UptimeMonitor();
  monitor.monitor();
}

module.exports = UptimeMonitor;
`;
    
    await fs.writeFile(path.join(this.projectRoot, 'scripts', 'uptimeMonitor.js'), uptimeScript);
    
    console.log('\n📊 Uptime Monitoring Setup Guide:\n');
    Object.entries(uptimeConfig).forEach(([service, config]) => {
      console.log(`🔍 ${config.name}:`);
      if (config.features) {
        console.log('   Features:');
        config.features.forEach(feature => console.log(`   • ${feature}`));
      }
      console.log('   Setup Steps:');
      config.setup.forEach(step => console.log(`   ${step}`));
      console.log('');
    });
    
    this.log('✅ Uptime monitoring configuration created', 'success');
  }

  async setupAnalytics() {
    this.log('Setting up analytics and tracking...', 'info');
    
    try {
      // Google Analytics 4 setup
      const ga4Config = `// Google Analytics 4 configuration
import { gtag } from 'ga-gtag';

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// E-commerce tracking
export const purchase = (transactionData) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    gtag('event', 'purchase', {
      transaction_id: transactionData.transaction_id,
      value: transactionData.value,
      currency: transactionData.currency,
      items: transactionData.items
    });
  }
};

export const addToCart = (item) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    gtag('event', 'add_to_cart', {
      currency: 'IDR',
      value: item.price,
      items: [{
        item_id: item.id,
        item_name: item.title,
        category: item.category,
        quantity: 1,
        price: item.price
      }]
    });
  }
};

export const beginCheckout = (items, value) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    gtag('event', 'begin_checkout', {
      currency: 'IDR',
      value: value,
      items: items
    });
  }
};
`;
      
      await fs.writeFile(path.join(this.projectRoot, 'lib', 'gtag.js'), ga4Config);
      
      // Custom analytics hook
      const analyticsHook = `// Custom analytics hook
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as gtag from '../lib/gtag';

export const useAnalytics = () => {
  const router = useRouter();
  
  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url);
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);
  
  const trackEvent = (eventData) => {
    gtag.event(eventData);
  };
  
  const trackPurchase = (transactionData) => {
    gtag.purchase(transactionData);
  };
  
  const trackAddToCart = (item) => {
    gtag.addToCart(item);
  };
  
  const trackBeginCheckout = (items, value) => {
    gtag.beginCheckout(items, value);
  };
  
  return {
    trackEvent,
    trackPurchase,
    trackAddToCart,
    trackBeginCheckout
  };
};
`;
      
      const hooksDir = path.join(this.projectRoot, 'hooks');
      await fs.mkdir(hooksDir, { recursive: true });
      await fs.writeFile(path.join(hooksDir, 'useAnalytics.js'), analyticsHook);
      
      // Analytics API endpoint
      const analyticsAPI = `// Analytics API endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { event, data } = req.body;
    
    // Log analytics event
    console.log('Analytics Event:', { event, data, timestamp: new Date().toISOString() });
    
    // Here you can:
    // 1. Store in database for custom analytics
    // 2. Send to third-party analytics services
    // 3. Trigger webhooks or notifications
    
    // Example: Store in MongoDB
    // const db = await connectToDatabase();
    // await db.collection('analytics').insertOne({
    //   event,
    //   data,
    //   timestamp: new Date(),
    //   userAgent: req.headers['user-agent'],
    //   ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    // });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to record analytics event' });
  }
}
`;
      
      const analyticsApiDir = path.join(this.projectRoot, 'pages', 'api', 'analytics');
      await fs.mkdir(analyticsApiDir, { recursive: true });
      await fs.writeFile(path.join(analyticsApiDir, 'track.js'), analyticsAPI);
      
      this.log('✅ Analytics configuration created', 'success');
      
    } catch (error) {
      this.log(`❌ Analytics setup failed: ${error.message}`, 'error');
    }
  }

  async setupHealthCheck() {
    this.log('Setting up health check endpoint...', 'info');
    
    const healthCheckAPI = `// Health check API endpoint
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  const startTime = Date.now();
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {}
  };
  
  try {
    // Database connectivity check
    try {
      const { db } = await connectToDatabase();
      await db.admin().ping();
      checks.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      checks.checks.database = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
      checks.status = 'degraded';
    }
    
    // External services check (Midtrans)
    try {
      const midtransCheck = await fetch('https://api.sandbox.midtrans.com/v2/ping', {
        method: 'GET',
        timeout: 5000
      });
      
      checks.checks.midtrans = {
        status: midtransCheck.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      checks.checks.midtrans = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
      checks.status = 'degraded';
    }
    
    // File system check
    try {
      const fs = require('fs').promises;
      await fs.access('./public');
      checks.checks.filesystem = {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      checks.checks.filesystem = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
      checks.status = 'degraded';
    }
    
    checks.totalResponseTime = Date.now() - startTime;
    
    // Return appropriate status code
    const statusCode = checks.status === 'healthy' ? 200 : 
                      checks.status === 'degraded' ? 207 : 503;
    
    res.status(statusCode).json(checks);
    
  } catch (error) {
    res.status(503).json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message,
      totalResponseTime: Date.now() - startTime
    });
  }
}
`;
    
    const apiDir = path.join(this.projectRoot, 'pages', 'api');
    await fs.mkdir(apiDir, { recursive: true });
    await fs.writeFile(path.join(apiDir, 'health.js'), healthCheckAPI);
    
    this.log('✅ Health check endpoint created', 'success');
  }

  async setupLogAggregation() {
    this.log('Setting up log aggregation...', 'info');
    
    const loggerConfig = `// Centralized logging configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'aca-publisher',
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

// Custom log methods
export const logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context
  });
};

export const logInfo = (message, context = {}) => {
  logger.info({
    message,
    ...context
  });
};

export const logWarning = (message, context = {}) => {
  logger.warn({
    message,
    ...context
  });
};

export const logTransaction = (transactionData) => {
  logger.info({
    message: 'Transaction processed',
    type: 'transaction',
    ...transactionData
  });
};

export const logUserAction = (action, userId, context = {}) => {
  logger.info({
    message: 'User action',
    type: 'user_action',
    action,
    userId,
    ...context
  });
};

export default logger;
`;
    
    await fs.writeFile(path.join(this.projectRoot, 'lib', 'logger.js'), loggerConfig);
    
    // Create logs directory
    const logsDir = path.join(this.projectRoot, 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    // Add .gitignore entry for logs
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    try {
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
      if (!gitignoreContent.includes('logs/')) {
        await fs.appendFile(gitignorePath, '\n# Logs\nlogs/\n*.log\n');
      }
    } catch (error) {
      // Create .gitignore if it doesn't exist
      await fs.writeFile(gitignorePath, '# Logs\nlogs/\n*.log\n');
    }
    
    this.log('✅ Log aggregation configured', 'success');
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async generateMonitoringDashboard() {
    this.log('Generating monitoring dashboard configuration...', 'info');
    
    const dashboardConfig = {
      services: {
        errorTracking: {
          name: 'Sentry',
          url: 'https://sentry.io',
          description: 'Real-time error tracking and performance monitoring'
        },
        uptime: {
          name: 'UptimeRobot',
          url: 'https://uptimerobot.com',
          description: 'Website uptime and availability monitoring'
        },
        analytics: {
          name: 'Google Analytics 4',
          url: 'https://analytics.google.com',
          description: 'User behavior and conversion tracking'
        },
        performance: {
          name: 'Vercel Analytics',
          url: 'https://vercel.com/analytics',
          description: 'Core Web Vitals and performance metrics'
        }
      },
      alerts: {
        critical: [
          'Website down for more than 2 minutes',
          'Database connection failures',
          'Payment processing errors',
          'SSL certificate expiration (7 days)'
        ],
        warning: [
          'Response time > 3 seconds',
          'Error rate > 1%',
          'Memory usage > 80%',
          'Disk space < 20%'
        ]
      },
      metrics: {
        availability: {
          target: '99.9%',
          measurement: 'Monthly uptime percentage'
        },
        performance: {
          target: '< 2s',
          measurement: 'Average page load time'
        },
        errorRate: {
          target: '< 0.1%',
          measurement: 'Percentage of requests resulting in errors'
        },
        conversion: {
          target: '> 2%',
          measurement: 'Visitor to purchase conversion rate'
        }
      }
    };
    
    const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ACA Publisher - Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .service-link { color: #007bff; text-decoration: none; }
        .service-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 ACA Publisher Monitoring Dashboard</h1>
            <p>Real-time monitoring and analytics for production environment</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📊 Monitoring Services</h3>
                ${Object.entries(dashboardConfig.services).map(([key, service]) => `
                <div class="metric">
                    <strong>${service.name}:</strong>
                    <a href="${service.url}" class="service-link" target="_blank">Open Dashboard</a>
                </div>
                <p><small>${service.description}</small></p>
                `).join('')}
            </div>
            
            <div class="card">
                <h3>🚨 Alert Configuration</h3>
                <h4>Critical Alerts:</h4>
                <ul>
                    ${dashboardConfig.alerts.critical.map(alert => `<li>${alert}</li>`).join('')}
                </ul>
                <h4>Warning Alerts:</h4>
                <ul>
                    ${dashboardConfig.alerts.warning.map(alert => `<li>${alert}</li>`).join('')}
                </ul>
            </div>
            
            <div class="card">
                <h3>📈 Key Metrics & Targets</h3>
                ${Object.entries(dashboardConfig.metrics).map(([key, metric]) => `
                <div class="metric">
                    <strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
                    <span class="status-good">${metric.target}</span>
                </div>
                <p><small>${metric.measurement}</small></p>
                `).join('')}
            </div>
            
            <div class="card">
                <h3>🔗 Quick Links</h3>
                <div class="metric">
                    <a href="https://www.acapublisher.com" target="_blank">🌐 Live Website</a>
                </div>
                <div class="metric">
                    <a href="https://www.acapublisher.com/api/health" target="_blank">❤️ Health Check</a>
                </div>
                <div class="metric">
                    <a href="https://vercel.com/dashboard" target="_blank">🚀 Vercel Dashboard</a>
                </div>
                <div class="metric">
                    <a href="https://cloud.mongodb.com" target="_blank">🗄️ MongoDB Atlas</a>
                </div>
            </div>
        </div>
        
        <div class="card" style="margin-top: 20px;">
            <h3>📋 Monitoring Checklist</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px;">
                <label><input type="checkbox"> Uptime monitoring active</label>
                <label><input type="checkbox"> Error tracking configured</label>
                <label><input type="checkbox"> Performance monitoring enabled</label>
                <label><input type="checkbox"> Analytics tracking working</label>
                <label><input type="checkbox"> Alert notifications set up</label>
                <label><input type="checkbox"> SSL certificate monitoring</label>
                <label><input type="checkbox"> Database monitoring active</label>
                <label><input type="checkbox"> Backup verification scheduled</label>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 5 minutes
        setTimeout(() => {
            window.location.reload();
        }, 5 * 60 * 1000);
        
        // Check health endpoint
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                console.log('Health check:', data);
            })
            .catch(error => {
                console.error('Health check failed:', error);
            });
    </script>
</body>
</html>`;
    
    await fs.writeFile(path.join(this.publicDir, 'monitoring-dashboard.html'), dashboardHTML);
    
    this.log('✅ Monitoring dashboard created at /monitoring-dashboard.html', 'success');
  }

  async run() {
    try {
      this.log('🔍 Starting monitoring and analytics setup...', 'info');
      
      // Create necessary directories
      const libDir = path.join(this.projectRoot, 'lib');
      await fs.mkdir(libDir, { recursive: true });
      
      const scriptsDir = path.join(this.projectRoot, 'scripts');
      await fs.mkdir(scriptsDir, { recursive: true });
      
      // Setup all monitoring components
      await this.setupErrorTracking();
      await this.setupUptimeMonitoring();
      await this.setupAnalytics();
      await this.setupHealthCheck();
      await this.setupLogAggregation();
      await this.generateMonitoringDashboard();
      
      console.log('\n🎉 Monitoring Setup Complete!\n');
      console.log('📋 Next Steps:');
      console.log('1. Set up Sentry account and add SENTRY_DSN to environment variables');
      console.log('2. Configure UptimeRobot or Pingdom for uptime monitoring');
      console.log('3. Set up Google Analytics 4 and add GA_TRACKING_ID');
      console.log('4. Configure alert notifications (email, Slack, SMS)');
      console.log('5. Test all monitoring endpoints and dashboards');
      console.log('6. Set up regular monitoring reviews and reports');
      console.log('\n🔗 Access monitoring dashboard: /monitoring-dashboard.html');
      
      this.log('✅ Monitoring and analytics setup completed successfully!', 'success');
      
    } catch (error) {
      this.log(`❌ Monitoring setup failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Monitoring and Analytics Setup Script

Usage: node scripts/setupMonitoring.js [options]

Options:
  --help    Show this help message

Example:
  node scripts/setupMonitoring.js
`);
    process.exit(0);
  }
  
  const setup = new MonitoringSetup();
  setup.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = MonitoringSetup;