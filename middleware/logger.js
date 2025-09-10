// Logger Middleware
// Sistem logging yang konsisten untuk monitoring dan debugging

import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be set via environment variable)
const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

// Color codes for console output
const colors = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
  RESET: '\x1b[0m'   // Reset
};

// Logger class
class Logger {
  constructor() {
    this.logFiles = {
      error: path.join(logsDir, 'error.log'),
      combined: path.join(logsDir, 'combined.log'),
      access: path.join(logsDir, 'access.log')
    };
  }

  // Format log message
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };
    
    return JSON.stringify(logEntry);
  }

  // Write to file
  writeToFile(filename, message) {
    try {
      fs.appendFileSync(filename, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Console output with colors
  consoleOutput(level, message, meta = {}) {
    if (process.env.NODE_ENV === 'test') return; // Skip console output in tests
    
    const color = colors[level] || colors.RESET;
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    
    console.log(`${color}[${timestamp}] ${level}: ${message}${metaStr}${colors.RESET}`);
  }

  // Generic log method
  log(level, message, meta = {}) {
    const levelValue = LOG_LEVELS[level];
    if (levelValue > currentLogLevel) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output
    this.consoleOutput(level, message, meta);
    
    // File output
    this.writeToFile(this.logFiles.combined, formattedMessage);
    
    // Error logs also go to error file
    if (level === 'ERROR') {
      this.writeToFile(this.logFiles.error, formattedMessage);
    }
  }

  // Convenience methods
  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  // Access log for API requests
  access(req, res, responseTime) {
    const logEntry = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };

    const formattedMessage = JSON.stringify(logEntry);
    this.writeToFile(this.logFiles.access, formattedMessage);
    
    // Console output for access logs in development
    if (process.env.NODE_ENV === 'development') {
      const statusColor = res.statusCode >= 400 ? colors.ERROR : 
                         res.statusCode >= 300 ? colors.WARN : colors.INFO;
      console.log(
        `${statusColor}${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms${colors.RESET}`
      );
    }
  }
}

// Create logger instance
const logger = new Logger();

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    logger.access(req, res, responseTime);
    originalEnd.apply(this, args);
  };

  next();
};

// Error logging middleware
export const errorLogger = (error, req, res, next) => {
  logger.error('API Error', {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });

  next(error);
};

// Database operation logger
export const dbLogger = {
  query: (operation, collection, query, duration) => {
    logger.debug('Database Query', {
      operation,
      collection,
      query: JSON.stringify(query),
      duration: `${duration}ms`
    });
  },
  
  error: (operation, collection, error) => {
    logger.error('Database Error', {
      operation,
      collection,
      error: error.message,
      stack: error.stack
    });
  },
  
  connection: (status, details = {}) => {
    if (status === 'connected') {
      logger.info('Database connected', details);
    } else if (status === 'disconnected') {
      logger.warn('Database disconnected', details);
    } else if (status === 'error') {
      logger.error('Database connection error', details);
    }
  }
};

// Authentication logger
export const authLogger = {
  login: (userId, email, success, ip) => {
    if (success) {
      logger.info('User login successful', { userId, email, ip });
    } else {
      logger.warn('User login failed', { email, ip });
    }
  },
  
  register: (userId, email, ip) => {
    logger.info('User registered', { userId, email, ip });
  },
  
  logout: (userId, email, ip) => {
    logger.info('User logout', { userId, email, ip });
  },
  
  tokenRefresh: (userId, ip) => {
    logger.info('Token refreshed', { userId, ip });
  },
  
  passwordReset: (email, ip) => {
    logger.info('Password reset requested', { email, ip });
  }
};

// Security logger
export const securityLogger = {
  rateLimitExceeded: (ip, endpoint, limit) => {
    logger.warn('Rate limit exceeded', { ip, endpoint, limit });
  },
  
  suspiciousActivity: (type, details) => {
    logger.warn('Suspicious activity detected', { type, ...details });
  },
  
  unauthorizedAccess: (ip, endpoint, reason) => {
    logger.warn('Unauthorized access attempt', { ip, endpoint, reason });
  },
  
  corsViolation: (origin, ip) => {
    logger.warn('CORS policy violation', { origin, ip });
  }
};

// Performance logger
export const performanceLogger = {
  slowQuery: (query, duration, threshold = 1000) => {
    if (duration > threshold) {
      logger.warn('Slow database query detected', {
        query: JSON.stringify(query),
        duration: `${duration}ms`,
        threshold: `${threshold}ms`
      });
    }
  },
  
  slowRequest: (method, url, duration, threshold = 5000) => {
    if (duration > threshold) {
      logger.warn('Slow API request detected', {
        method,
        url,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`
      });
    }
  },
  
  memoryUsage: () => {
    const usage = process.memoryUsage();
    logger.debug('Memory usage', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`
    });
  }
};

// Log rotation (simple implementation)
export const rotateLog = (filename) => {
  try {
    const stats = fs.statSync(filename);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (stats.size > maxSize) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFilename = filename.replace('.log', `-${timestamp}.log`);
      fs.renameSync(filename, rotatedFilename);
      logger.info('Log file rotated', { original: filename, rotated: rotatedFilename });
    }
  } catch (error) {
    logger.error('Log rotation failed', { filename, error: error.message });
  }
};

// Rotate logs daily
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    Object.values(logger.logFiles).forEach(rotateLog);
  }, 24 * 60 * 60 * 1000); // 24 hours
}

export { logger };
export default logger;