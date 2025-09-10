// Performance monitoring utilities

/**
 * Web Vitals monitoring
 */
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;

  const vitals = {
    FCP: null, // First Contentful Paint
    LCP: null, // Largest Contentful Paint
    FID: null, // First Input Delay
    CLS: null, // Cumulative Layout Shift
    TTFB: null // Time to First Byte
  };

  // Measure FCP
  const measureFCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        vitals.FCP = fcpEntry.startTime;
        console.log('FCP:', fcpEntry.startTime);
      }
    });
    observer.observe({ entryTypes: ['paint'] });
  };

  // Measure LCP
  const measureLCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      vitals.LCP = lastEntry.startTime;
      console.log('LCP:', lastEntry.startTime);
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  };

  // Measure FID
  const measureFID = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        vitals.FID = entry.processingStart - entry.startTime;
        console.log('FID:', vitals.FID);
      });
    });
    observer.observe({ entryTypes: ['first-input'] });
  };

  // Measure CLS
  const measureCLS = () => {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      vitals.CLS = clsValue;
      console.log('CLS:', clsValue);
    });
    observer.observe({ entryTypes: ['layout-shift'] });
  };

  // Measure TTFB
  const measureTTFB = () => {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    if (navigationEntry) {
      vitals.TTFB = navigationEntry.responseStart - navigationEntry.requestStart;
      console.log('TTFB:', vitals.TTFB);
    }
  };

  // Initialize measurements
  measureFCP();
  measureLCP();
  measureFID();
  measureCLS();
  measureTTFB();

  return vitals;
};

/**
 * Bundle size analyzer
 */
export const analyzeBundleSize = () => {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource');
  const jsResources = resources.filter(resource => 
    resource.name.includes('.js') || resource.name.includes('/_next/static/')
  );

  const analysis = {
    totalSize: 0,
    gzippedSize: 0,
    resources: [],
    recommendations: []
  };

  jsResources.forEach(resource => {
    const size = resource.transferSize || 0;
    analysis.totalSize += size;
    
    analysis.resources.push({
      name: resource.name.split('/').pop(),
      size: size,
      sizeFormatted: formatBytes(size),
      loadTime: resource.duration
    });
  });

  // Generate recommendations
  if (analysis.totalSize > 500 * 1024) { // 500KB
    analysis.recommendations.push('Consider code splitting to reduce initial bundle size');
  }
  
  const largeResources = analysis.resources.filter(r => r.size > 100 * 1024);
  if (largeResources.length > 0) {
    analysis.recommendations.push('Large resources detected - consider lazy loading');
  }

  return analysis;
};

/**
 * Memory usage monitor
 */
export const monitorMemoryUsage = () => {
  if (typeof window === 'undefined' || !performance.memory) return null;

  const memory = performance.memory;
  return {
    used: formatBytes(memory.usedJSHeapSize),
    total: formatBytes(memory.totalJSHeapSize),
    limit: formatBytes(memory.jsHeapSizeLimit),
    percentage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)
  };
};

/**
 * Network performance monitor
 */
export const monitorNetworkPerformance = () => {
  if (typeof navigator === 'undefined' || !navigator.connection) return null;

  const connection = navigator.connection;
  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData
  };
};

/**
 * Image loading performance
 */
export const measureImageLoadTime = (imageUrl) => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      resolve({
        url: imageUrl,
        loadTime: loadTime,
        size: img.naturalWidth * img.naturalHeight
      });
    };
    
    img.onerror = () => {
      resolve({
        url: imageUrl,
        loadTime: -1,
        error: 'Failed to load'
      });
    };
    
    img.src = imageUrl;
  });
};

/**
 * Performance observer for custom metrics
 */
export class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
  }

  startMeasure(name) {
    performance.mark(`${name}-start`);
  }

  endMeasure(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    this.metrics.set(name, measure.duration);
    
    return measure.duration;
  }

  getMeasure(name) {
    return this.metrics.get(name);
  }

  getAllMeasures() {
    return Object.fromEntries(this.metrics);
  }

  observeResourceTiming(callback) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      callback(entries);
    });
    
    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * Utility functions
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Performance report generator
 */
export const generatePerformanceReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    webVitals: measureWebVitals(),
    bundleAnalysis: analyzeBundleSize(),
    memoryUsage: monitorMemoryUsage(),
    networkInfo: monitorNetworkPerformance(),
    recommendations: []
  };

  // Generate recommendations based on metrics
  if (report.webVitals.LCP > 2500) {
    report.recommendations.push('LCP is slow - optimize images and critical resources');
  }
  
  if (report.webVitals.FID > 100) {
    report.recommendations.push('FID is high - reduce JavaScript execution time');
  }
  
  if (report.webVitals.CLS > 0.1) {
    report.recommendations.push('CLS is high - ensure proper image dimensions and avoid layout shifts');
  }

  return report;
};

export default {
  measureWebVitals,
  analyzeBundleSize,
  monitorMemoryUsage,
  monitorNetworkPerformance,
  measureImageLoadTime,
  PerformanceTracker,
  generatePerformanceReport
};