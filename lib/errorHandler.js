// Error Handler Utility
// Sistem error handling yang konsisten untuk seluruh aplikasi

// Custom Error Classes
export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.retryAfter = retryAfter;
  }
}

// Error Response Formatter
export const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      statusCode: error.statusCode || 500
    }
  };

  // Add additional error details for specific error types
  if (error instanceof ValidationError) {
    response.error.errors = error.errors;
  }

  if (error instanceof RateLimitError && error.retryAfter) {
    response.error.retryAfter = error.retryAfter;
  }

  // Include stack trace in development
  if (includeStack && process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  return response;
};

// Global Error Handler Middleware for API Routes
export const errorHandler = (handler) => {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`API Error [${req.method} ${req.url}]:`, {
        message: error.message,
        stack: error.stack,
        body: req.body,
        query: req.query,
        headers: req.headers
      });

      // Handle known operational errors
      if (error.isOperational) {
        const errorResponse = formatErrorResponse(error, process.env.NODE_ENV === 'development');
        return res.status(error.statusCode).json(errorResponse);
      }

      // Handle MongoDB/Mongoose errors
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        Object.keys(error.errors).forEach(key => {
          validationErrors[key] = error.errors[key].message;
        });
        
        const validationError = new ValidationError('Validation failed', validationErrors);
        const errorResponse = formatErrorResponse(validationError);
        return res.status(400).json(errorResponse);
      }

      if (error.name === 'CastError') {
        const castError = new ValidationError('Invalid ID format');
        const errorResponse = formatErrorResponse(castError);
        return res.status(400).json(errorResponse);
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        const duplicateError = new ConflictError(`${field} already exists`);
        const errorResponse = formatErrorResponse(duplicateError);
        return res.status(409).json(errorResponse);
      }

      // Handle JWT errors
      if (error.name === 'JsonWebTokenError') {
        const jwtError = new AuthenticationError('Invalid token');
        const errorResponse = formatErrorResponse(jwtError);
        return res.status(401).json(errorResponse);
      }

      if (error.name === 'TokenExpiredError') {
        const expiredError = new AuthenticationError('Token expired');
        const errorResponse = formatErrorResponse(expiredError);
        return res.status(401).json(errorResponse);
      }

      // Handle unknown errors
      const unknownError = new AppError('Internal server error', 500, 'INTERNAL_ERROR');
      const errorResponse = formatErrorResponse(unknownError, process.env.NODE_ENV === 'development');
      return res.status(500).json(errorResponse);
    }
  };
};

// Async wrapper for better error handling
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation helper
export const validateRequired = (fields, data) => {
  const errors = {};
  
  fields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors[field] = `${field} is required`;
    }
  });

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Required fields are missing', errors);
  }
};

// Email validation helper
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

// Password validation helper
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = {};

  if (password.length < minLength) {
    errors.length = `Password must be at least ${minLength} characters long`;
  }

  if (!hasUpperCase) {
    errors.uppercase = 'Password must contain at least one uppercase letter';
  }

  if (!hasLowerCase) {
    errors.lowercase = 'Password must contain at least one lowercase letter';
  }

  if (!hasNumbers) {
    errors.numbers = 'Password must contain at least one number';
  }

  if (!hasSpecialChar) {
    errors.special = 'Password must contain at least one special character';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Password does not meet requirements', errors);
  }
};

// Database connection error handler
export const handleDBError = (error) => {
  console.error('Database connection error:', error);
  throw new AppError('Database connection failed', 500, 'DB_CONNECTION_ERROR');
};

// File upload error handler
export const handleUploadError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    throw new ValidationError('File size too large');
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    throw new ValidationError('Too many files');
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    throw new ValidationError('Unexpected file field');
  }
  
  throw new AppError('File upload failed', 500, 'UPLOAD_ERROR');
};

// Success response formatter
export const successResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode
  };
};

// Pagination helper
export const paginationResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

export default errorHandler;