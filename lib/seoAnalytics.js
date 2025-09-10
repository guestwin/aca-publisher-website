// SEO Analytics and Monitoring Utilities

// Google Analytics 4 integration
export const initGA4 = (measurementId) => {
  if (typeof window === 'undefined') return;
  
  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  
  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', measurementId, {
    page_title: document.title,
    page_location: window.location.href
  });
};

// Track page views
export const trackPageView = (url, title) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
    page_title: title,
    page_location: url
  });
};

// Track custom events
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', eventName, parameters);
};

// Track music downloads
export const trackMusicDownload = (compositionId, title, composer, price) => {
  trackEvent('download_music', {
    item_id: compositionId,
    item_name: title,
    item_category: 'Sheet Music',
    item_brand: composer,
    value: price,
    currency: 'IDR'
  });
};

// Track search queries
export const trackSearch = (searchTerm, resultCount) => {
  trackEvent('search', {
    search_term: searchTerm,
    result_count: resultCount
  });
};

// Track user engagement
export const trackEngagement = (action, category, label, value) => {
  trackEvent('engagement', {
    event_category: category,
    event_label: label,
    value: value,
    custom_parameter: action
  });
};

// SEO Performance Monitoring
export class SEOMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      timeToFirstByte: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0
    };
  }

  // Initialize performance monitoring
  init() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.monitorWebVitals();
    
    // Monitor page load performance
    this.monitorPageLoad();
    
    // Monitor SEO-specific metrics
    this.monitorSEOMetrics();
  }

  monitorWebVitals() {
    // First Contentful Paint (FCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
          this.reportMetric('FCP', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.largestContentfulPaint = lastEntry.startTime;
      this.reportMetric('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.metrics.cumulativeLayoutShift = clsValue;
      this.reportMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
        this.reportMetric('FID', this.metrics.firstInputDelay);
      }
    }).observe({ entryTypes: ['first-input'] });
  }

  monitorPageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.timeToFirstByte = navigation.responseStart - navigation.fetchStart;
      
      this.reportMetric('Page Load Time', this.metrics.pageLoadTime);
      this.reportMetric('TTFB', this.metrics.timeToFirstByte);
    });
  }

  monitorSEOMetrics() {
    // Check for missing meta tags
    this.checkMetaTags();
    
    // Check for missing structured data
    this.checkStructuredData();
    
    // Check for image optimization
    this.checkImageOptimization();
    
    // Check for accessibility
    this.checkAccessibility();
  }

  checkMetaTags() {
    const requiredTags = [
      'title',
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:image"]',
      'meta[name="twitter:card"]'
    ];

    const missingTags = [];
    requiredTags.forEach(selector => {
      if (!document.querySelector(selector)) {
        missingTags.push(selector);
      }
    });

    if (missingTags.length > 0) {
      console.warn('Missing SEO meta tags:', missingTags);
      this.reportIssue('missing_meta_tags', missingTags);
    }
  }

  checkStructuredData() {
    const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    if (structuredDataScripts.length === 0) {
      console.warn('No structured data found');
      this.reportIssue('missing_structured_data', 'No JSON-LD found');
    } else {
      // Validate JSON-LD
      structuredDataScripts.forEach((script, index) => {
        try {
          JSON.parse(script.textContent);
        } catch (error) {
          console.error(`Invalid JSON-LD at index ${index}:`, error);
          this.reportIssue('invalid_structured_data', `Script ${index}: ${error.message}`);
        }
      });
    }
  }

  checkImageOptimization() {
    const images = document.querySelectorAll('img');
    const issues = [];

    images.forEach((img, index) => {
      // Check for alt text
      if (!img.alt || img.alt.trim() === '') {
        issues.push(`Image ${index}: Missing alt text`);
      }
      
      // Check for loading attribute
      if (!img.loading) {
        issues.push(`Image ${index}: Missing loading attribute`);
      }
      
      // Check for srcset for responsive images
      if (!img.srcset && img.width > 300) {
        issues.push(`Image ${index}: Large image without srcset`);
      }
    });

    if (issues.length > 0) {
      console.warn('Image optimization issues:', issues);
      this.reportIssue('image_optimization', issues);
    }
  }

  checkAccessibility() {
    const issues = [];

    // Check for heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      issues.push('No headings found');
    }

    // Check for skip links
    const skipLink = document.querySelector('a[href="#main"], a[href="#content"]');
    if (!skipLink) {
      issues.push('No skip link found');
    }

    // Check for form labels
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      if (!input.labels || input.labels.length === 0) {
        if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
          issues.push(`Form input ${index}: Missing label`);
        }
      }
    });

    if (issues.length > 0) {
      console.warn('Accessibility issues:', issues);
      this.reportIssue('accessibility', issues);
    }
  }

  reportMetric(name, value) {
    // Send to analytics
    trackEvent('web_vitals', {
      metric_name: name,
      metric_value: Math.round(value),
      page_path: window.location.pathname
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`SEO Metric - ${name}:`, Math.round(value));
    }
  }

  reportIssue(type, details) {
    // Send to analytics
    trackEvent('seo_issue', {
      issue_type: type,
      issue_details: Array.isArray(details) ? details.join(', ') : details,
      page_path: window.location.pathname
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`SEO Issue - ${type}:`, details);
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      metrics: this.getMetrics(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.largestContentfulPaint > 2500) {
      recommendations.push('Optimize LCP: Consider image optimization, server response time, or resource loading');
    }

    if (this.metrics.firstInputDelay > 100) {
      recommendations.push('Optimize FID: Reduce JavaScript execution time or use code splitting');
    }

    if (this.metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('Optimize CLS: Add size attributes to images and reserve space for dynamic content');
    }

    if (this.metrics.timeToFirstByte > 600) {
      recommendations.push('Optimize TTFB: Improve server response time or use CDN');
    }

    return recommendations;
  }
}

// Initialize SEO monitoring
export const initSEOMonitoring = () => {
  if (typeof window === 'undefined') return null;
  
  const monitor = new SEOMonitor();
  monitor.init();
  
  return monitor;
};

// Export default monitor instance
export default SEOMonitor;