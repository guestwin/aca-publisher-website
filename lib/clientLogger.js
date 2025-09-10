// Client-side logging utility
class ClientLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logQueue = [];
    this.maxQueueSize = 100;
    this.flushInterval = 30000; // 30 seconds
    
    // Start periodic flush in browser environment
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.flushInterval);
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  // Log levels
  debug(message, data = {}) {
    this.log('debug', message, data);
  }

  info(message, data = {}) {
    this.log('info', message, data);
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  error(message, error = null, data = {}) {
    const errorData = {
      ...data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };
    this.log('error', message, errorData);
  }

  // Core logging method
  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      sessionId: this.getSessionId()
    };

    // Console output in development
    if (this.isDevelopment) {
      const consoleMethod = console[level] || console.log;
      consoleMethod(`[${level.toUpperCase()}] ${message}`, data);
    }

    // Add to queue for server logging
    this.addToQueue(logEntry);
  }

  // User interaction logging
  userAction(action, element = null, data = {}) {
    this.info('User Action', {
      action,
      element: element ? {
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        textContent: element.textContent?.substring(0, 100)
      } : null,
      ...data
    });
  }

  // Performance logging
  performance(metric, value, data = {}) {
    this.info('Performance Metric', {
      metric,
      value,
      timestamp: performance.now(),
      ...data
    });
  }

  // API call logging
  apiCall(method, url, status, duration, data = {}) {
    const level = status >= 400 ? 'error' : 'info';
    this.log(level, 'API Call', {
      method,
      url,
      status,
      duration,
      ...data
    });
  }

  // Navigation logging
  navigation(from, to, data = {}) {
    this.info('Navigation', {
      from,
      to,
      timestamp: Date.now(),
      ...data
    });
  }

  // Error boundary logging
  reactError(error, errorInfo, componentStack) {
    this.error('React Error', error, {
      errorInfo,
      componentStack,
      timestamp: Date.now()
    });
  }

  // Queue management
  addToQueue(logEntry) {
    this.logQueue.push(logEntry);
    
    // Prevent queue from growing too large
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue = this.logQueue.slice(-this.maxQueueSize);
    }

    // Flush immediately for errors
    if (logEntry.level === 'error') {
      this.flush();
    }
  }

  // Send logs to server
  async flush() {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    // Temporarily disabled to test redirect issue
    console.log('Client logs (not sent to server):', logsToSend);
    
    /*
    try {
      await fetch('/api/logs/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs: logsToSend })
      });
    } catch (error) {
      // If sending fails, add logs back to queue
      this.logQueue.unshift(...logsToSend);
      console.warn('Failed to send logs to server:', error);
    }
    */
  }

  // Session management
  getSessionId() {
    if (typeof window === 'undefined') return null;
    
    let sessionId = sessionStorage.getItem('logSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('logSessionId', sessionId);
    }
    return sessionId;
  }

  // Manual flush method
  forceFlush() {
    return this.flush();
  }
}

// Create singleton instance
const clientLogger = new ClientLogger();

// React Hook for logging
export const useLogger = () => {
  return {
    log: clientLogger.log.bind(clientLogger),
    debug: clientLogger.debug.bind(clientLogger),
    info: clientLogger.info.bind(clientLogger),
    warn: clientLogger.warn.bind(clientLogger),
    error: clientLogger.error.bind(clientLogger),
    userAction: clientLogger.userAction.bind(clientLogger),
    performance: clientLogger.performance.bind(clientLogger),
    apiCall: clientLogger.apiCall.bind(clientLogger),
    navigation: clientLogger.navigation.bind(clientLogger)
  };
};

// HOC for automatic component logging
export const withLogging = (WrappedComponent, componentName) => {
  return function LoggedComponent(props) {
    React.useEffect(() => {
      clientLogger.info('Component Mounted', { component: componentName });
      
      return () => {
        clientLogger.info('Component Unmounted', { component: componentName });
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  };
};

export default clientLogger;