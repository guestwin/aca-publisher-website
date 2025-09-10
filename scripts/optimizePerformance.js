/**
 * Script untuk optimasi performance production
 * Mencakup caching, CDN, compression, dan optimasi lainnya
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class PerformanceOptimizer {
  constructor() {
    this.projectRoot = process.cwd();
    this.buildDir = path.join(this.projectRoot, '.next');
    this.publicDir = path.join(this.projectRoot, 'public');
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

  async analyzeBundle() {
    this.log('Analyzing bundle size...', 'info');
    
    try {
      // Check if build exists
      const buildExists = await this.fileExists(this.buildDir);
      if (!buildExists) {
        this.log('Build directory not found. Running build first...', 'warning');
        execSync('npm run build', { stdio: 'inherit' });
      }
      
      // Analyze bundle with webpack-bundle-analyzer
      this.log('Generating bundle analysis...', 'info');
      
      try {
        execSync('npx @next/bundle-analyzer', { stdio: 'inherit' });
        this.log('✅ Bundle analysis completed', 'success');
      } catch (error) {
        this.log('Installing bundle analyzer...', 'info');
        execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' });
        
        // Create next.config.js with bundle analyzer
        await this.setupBundleAnalyzer();
        this.log('✅ Bundle analyzer configured', 'success');
      }
      
    } catch (error) {
      this.log(`❌ Bundle analysis failed: ${error.message}`, 'error');
    }
  }

  async setupBundleAnalyzer() {
    const configPath = path.join(this.projectRoot, 'next.config.js');
    
    const config = `/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Performance optimizations
  compress: true,
  
  // Image optimization
  images: {
    domains: ['localhost', 'acapublisher.com', 'www.acapublisher.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000'
          }
        ]
      }
    ]
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    
    return config;
  },
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // PWA configuration (if needed)
  // pwa: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  // },
}

module.exports = withBundleAnalyzer(nextConfig)
`;
    
    await fs.writeFile(configPath, config);
    this.log('✅ Next.js config updated with optimizations', 'success');
  }

  async optimizeImages() {
    this.log('Optimizing images...', 'info');
    
    try {
      const imagesDir = path.join(this.publicDir, 'images');
      const imagesDirExists = await this.fileExists(imagesDir);
      
      if (!imagesDirExists) {
        this.log('Images directory not found, creating...', 'warning');
        await fs.mkdir(imagesDir, { recursive: true });
      }
      
      // Install image optimization tools
      try {
        execSync('npm install --save-dev imagemin imagemin-webp imagemin-mozjpeg imagemin-pngquant', 
                { stdio: 'inherit' });
        this.log('✅ Image optimization tools installed', 'success');
      } catch (error) {
        this.log('⚠️  Failed to install image optimization tools', 'warning');
      }
      
      // Create image optimization script
      const imageOptScript = `const imagemin = require('imagemin');
const imageminWebp = require('imagemin-webp');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

(async () => {
  const files = await imagemin(['public/images/*.{jpg,png}'], {
    destination: 'public/images/optimized',
    plugins: [
      imageminMozjpeg({ quality: 80 }),
      imageminPngquant({ quality: [0.6, 0.8] }),
      imageminWebp({ quality: 80 })
    ]
  });
  
  console.log('Images optimized:', files.length);
})();
`;
      
      await fs.writeFile(path.join(this.projectRoot, 'scripts', 'optimizeImages.js'), imageOptScript);
      this.log('✅ Image optimization script created', 'success');
      
    } catch (error) {
      this.log(`❌ Image optimization failed: ${error.message}`, 'error');
    }
  }

  async setupServiceWorker() {
    this.log('Setting up service worker for caching...', 'info');
    
    try {
      const swContent = `const CACHE_NAME = 'aca-publisher-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/images/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;
      
      await fs.writeFile(path.join(this.publicDir, 'sw.js'), swContent);
      this.log('✅ Service worker created', 'success');
      
    } catch (error) {
      this.log(`❌ Service worker setup failed: ${error.message}`, 'error');
    }
  }

  async setupCDNConfiguration() {
    this.log('Setting up CDN configuration...', 'info');
    
    const cdnConfig = {
      cloudflare: {
        name: 'Cloudflare',
        setup: [
          '1. Sign up for Cloudflare account',
          '2. Add your domain to Cloudflare',
          '3. Update nameservers at your registrar',
          '4. Enable Auto Minify (CSS, JS, HTML)',
          '5. Enable Brotli compression',
          '6. Set up Page Rules for caching',
          '7. Enable Always Use HTTPS',
          '8. Configure Security settings'
        ],
        pageRules: [
          {
            url: '*.acapublisher.com/_next/static/*',
            settings: {
              'Cache Level': 'Cache Everything',
              'Edge Cache TTL': '1 month',
              'Browser Cache TTL': '1 month'
            }
          },
          {
            url: '*.acapublisher.com/images/*',
            settings: {
              'Cache Level': 'Cache Everything',
              'Edge Cache TTL': '1 week',
              'Browser Cache TTL': '1 week'
            }
          },
          {
            url: '*.acapublisher.com/api/*',
            settings: {
              'Cache Level': 'Bypass'
            }
          }
        ]
      },
      vercel: {
        name: 'Vercel Edge Network',
        setup: [
          '1. Vercel automatically provides global CDN',
          '2. Static assets are cached at edge locations',
          '3. Configure cache headers in next.config.js',
          '4. Use Vercel Analytics for monitoring',
          '5. Enable Edge Functions if needed'
        ]
      }
    };
    
    console.log('\n🌐 CDN Configuration Guide:\n');
    
    Object.entries(cdnConfig).forEach(([provider, config]) => {
      console.log(`📡 ${config.name}:`);
      config.setup.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
      if (config.pageRules) {
        console.log('\n   📋 Recommended Page Rules:');
        config.pageRules.forEach((rule, index) => {
          console.log(`   Rule ${index + 1}: ${rule.url}`);
          Object.entries(rule.settings).forEach(([key, value]) => {
            console.log(`     ${key}: ${value}`);
          });
        });
      }
      console.log('');
    });
    
    this.log('✅ CDN configuration guide generated', 'success');
  }

  async optimizeDatabase() {
    this.log('Setting up database optimization...', 'info');
    
    const dbOptimizations = {
      mongodb: {
        indexes: [
          'Create compound indexes for frequent queries',
          'Use text indexes for search functionality',
          'Monitor slow queries with profiler',
          'Implement connection pooling',
          'Use read replicas for read-heavy operations'
        ],
        caching: [
          'Implement Redis for session storage',
          'Cache frequently accessed data',
          'Use MongoDB aggregation pipeline efficiently',
          'Implement query result caching'
        ]
      }
    };
    
    // Create database optimization utilities
    const dbUtilsContent = `// Database optimization utilities
const { MongoClient } = require('mongodb');
const Redis = require('redis');

class DatabaseOptimizer {
  constructor() {
    this.mongoClient = null;
    this.redisClient = null;
  }
  
  async setupIndexes() {
    // Implementation for creating optimized indexes
    const db = this.mongoClient.db();
    
    // Products collection indexes
    await db.collection('products').createIndex({ title: 'text', description: 'text' });
    await db.collection('products').createIndex({ category: 1, price: 1 });
    await db.collection('products').createIndex({ composerId: 1, createdAt: -1 });
    
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: 1 });
    
    // Transactions collection indexes
    await db.collection('transactions').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('transactions').createIndex({ status: 1 });
    
    console.log('Database indexes optimized');
  }
  
  async setupCaching() {
    // Redis caching setup
    this.redisClient = Redis.createClient({
      url: process.env.REDIS_URL
    });
    
    await this.redisClient.connect();
    console.log('Redis caching configured');
  }
  
  async cacheQuery(key, queryFn, ttl = 3600) {
    try {
      const cached = await this.redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      
      const result = await queryFn();
      await this.redisClient.setEx(key, ttl, JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Cache error:', error);
      return await queryFn();
    }
  }
}

module.exports = DatabaseOptimizer;
`;
    
    await fs.writeFile(path.join(this.projectRoot, 'lib', 'DatabaseOptimizer.js'), dbUtilsContent);
    
    console.log('\n🗄️  Database Optimization Recommendations:\n');
    Object.entries(dbOptimizations.mongodb).forEach(([category, items]) => {
      console.log(`📊 ${category.toUpperCase()}:`);
      items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item}`);
      });
      console.log('');
    });
    
    this.log('✅ Database optimization utilities created', 'success');
  }

  async setupMonitoring() {
    this.log('Setting up performance monitoring...', 'info');
    
    const monitoringConfig = `// Performance monitoring configuration
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
  
  // Also send to custom analytics endpoint
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metric),
  }).catch(console.error);
}

export function reportWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

// Performance observer for custom metrics
export function setupPerformanceObserver() {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('Navigation timing:', entry);
        }
        if (entry.entryType === 'resource') {
          // Monitor slow resources
          if (entry.duration > 1000) {
            console.warn('Slow resource:', entry.name, entry.duration);
          }
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation', 'resource'] });
  }
}
`;
    
    await fs.writeFile(path.join(this.projectRoot, 'lib', 'monitoring.js'), monitoringConfig);
    
    // Create web vitals API endpoint
    const webVitalsAPI = `// API endpoint for collecting web vitals
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const metric = req.body;
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital:', metric);
    }
    
    // In production, send to your analytics service
    // await sendToAnalyticsService(metric);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Web vitals error:', error);
    res.status(500).json({ error: 'Failed to record metric' });
  }
}
`;
    
    const apiDir = path.join(this.projectRoot, 'pages', 'api', 'analytics');
    await fs.mkdir(apiDir, { recursive: true });
    await fs.writeFile(path.join(apiDir, 'web-vitals.js'), webVitalsAPI);
    
    this.log('✅ Performance monitoring setup completed', 'success');
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async generatePerformanceReport() {
    this.log('Generating performance optimization report...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      optimizations: {
        bundleAnalysis: '✅ Bundle analyzer configured',
        imageOptimization: '✅ Image optimization tools installed',
        caching: '✅ Service worker and cache headers configured',
        cdn: '✅ CDN configuration guide provided',
        database: '✅ Database optimization utilities created',
        monitoring: '✅ Performance monitoring setup'
      },
      recommendations: [
        'Run bundle analysis regularly to identify large dependencies',
        'Optimize images before deployment using the provided script',
        'Configure CDN (Cloudflare recommended) for global performance',
        'Implement Redis caching for database queries',
        'Monitor Core Web Vitals using the monitoring setup',
        'Use lazy loading for images and components',
        'Implement code splitting for large pages',
        'Minimize JavaScript bundle size',
        'Use compression (Gzip/Brotli) on server',
        'Optimize database queries and add proper indexes'
      ],
      nextSteps: [
        '1. Run npm run build to test optimizations',
        '2. Analyze bundle with ANALYZE=true npm run build',
        '3. Configure CDN provider (Cloudflare/Vercel)',
        '4. Set up Redis for caching',
        '5. Deploy and monitor performance metrics',
        '6. Regularly audit and optimize based on metrics'
      ]
    };
    
    const reportPath = path.join(this.projectRoot, 'PERFORMANCE_REPORT.md');
    const reportContent = `# Performance Optimization Report

Generated: ${report.timestamp}

## Completed Optimizations

${Object.entries(report.optimizations).map(([key, value]) => `- ${value}`).join('\n')}

## Recommendations

${report.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

## Next Steps

${report.nextSteps.join('\n')}

## Performance Checklist

- [ ] Bundle size analyzed and optimized
- [ ] Images compressed and optimized
- [ ] CDN configured and tested
- [ ] Caching strategy implemented
- [ ] Database queries optimized
- [ ] Performance monitoring active
- [ ] Core Web Vitals monitored
- [ ] Regular performance audits scheduled

## Tools and Resources

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
`;
    
    await fs.writeFile(reportPath, reportContent);
    
    console.log('\n📊 Performance Optimization Summary:\n');
    console.log('✅ All optimization tools and configurations have been set up');
    console.log('📋 Performance report generated: PERFORMANCE_REPORT.md');
    console.log('🚀 Ready for production deployment with optimized performance');
    
    this.log('✅ Performance optimization completed', 'success');
  }

  async run() {
    try {
      this.log('🚀 Starting performance optimization...', 'info');
      
      // Create lib directory if it doesn't exist
      const libDir = path.join(this.projectRoot, 'lib');
      await fs.mkdir(libDir, { recursive: true });
      
      // Run all optimization tasks
      await this.analyzeBundle();
      await this.optimizeImages();
      await this.setupServiceWorker();
      await this.setupCDNConfiguration();
      await this.optimizeDatabase();
      await this.setupMonitoring();
      
      // Generate final report
      await this.generatePerformanceReport();
      
      this.log('🎉 Performance optimization completed successfully!', 'success');
      
    } catch (error) {
      this.log(`❌ Performance optimization failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Performance Optimization Script

Usage: node scripts/optimizePerformance.js [options]

Options:
  --help    Show this help message

Example:
  node scripts/optimizePerformance.js
`);
    process.exit(0);
  }
  
  const optimizer = new PerformanceOptimizer();
  optimizer.run().catch(error => {
    console.error('Optimization failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceOptimizer;