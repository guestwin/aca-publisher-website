// Validation Middleware
// Middleware untuk validasi input yang konsisten

import { ValidationError } from '../lib/errorHandler';

// Schema validation using Joi-like approach but simpler
export const createValidationSchema = (schema) => {
  return (req, res, next) => {
    const errors = {};
    const { body, query, params } = req;
    
    // Validate body
    if (schema.body) {
      const bodyErrors = validateObject(body, schema.body);
      if (Object.keys(bodyErrors).length > 0) {
        errors.body = bodyErrors;
      }
    }
    
    // Validate query parameters
    if (schema.query) {
      const queryErrors = validateObject(query, schema.query);
      if (Object.keys(queryErrors).length > 0) {
        errors.query = queryErrors;
      }
    }
    
    // Validate URL parameters
    if (schema.params) {
      const paramErrors = validateObject(params, schema.params);
      if (Object.keys(paramErrors).length > 0) {
        errors.params = paramErrors;
      }
    }
    
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
    
    next();
  };
};

// Validate object against schema
const validateObject = (obj, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(key => {
    const rule = schema[key];
    const value = obj[key];
    
    try {
      validateField(value, rule, key);
    } catch (error) {
      errors[key] = error.message;
    }
  });
  
  return errors;
};

// Validate individual field
const validateField = (value, rule, fieldName) => {
  // Check if field is required
  if (rule.required && (value === undefined || value === null || value === '')) {
    throw new Error(`${fieldName} is required`);
  }
  
  // Skip validation if field is not required and empty
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return;
  }
  
  // Type validation
  if (rule.type) {
    validateType(value, rule.type, fieldName);
  }
  
  // String validations
  if (rule.type === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      throw new Error(`${fieldName} must be at least ${rule.minLength} characters long`);
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      throw new Error(`${fieldName} must be no more than ${rule.maxLength} characters long`);
    }
    
    if (rule.pattern && !rule.pattern.test(value)) {
      throw new Error(`${fieldName} format is invalid`);
    }
    
    if (rule.enum && !rule.enum.includes(value)) {
      throw new Error(`${fieldName} must be one of: ${rule.enum.join(', ')}`);
    }
  }
  
  // Number validations
  if (rule.type === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      throw new Error(`${fieldName} must be at least ${rule.min}`);
    }
    
    if (rule.max !== undefined && value > rule.max) {
      throw new Error(`${fieldName} must be no more than ${rule.max}`);
    }
  }
  
  // Array validations
  if (rule.type === 'array') {
    if (rule.minItems && value.length < rule.minItems) {
      throw new Error(`${fieldName} must have at least ${rule.minItems} items`);
    }
    
    if (rule.maxItems && value.length > rule.maxItems) {
      throw new Error(`${fieldName} must have no more than ${rule.maxItems} items`);
    }
    
    if (rule.items) {
      value.forEach((item, index) => {
        try {
          validateField(item, rule.items, `${fieldName}[${index}]`);
        } catch (error) {
          throw new Error(`${fieldName}[${index}]: ${error.message}`);
        }
      });
    }
  }
  
  // Custom validation function
  if (rule.custom) {
    const customResult = rule.custom(value);
    if (customResult !== true) {
      throw new Error(customResult || `${fieldName} is invalid`);
    }
  }
};

// Type validation
const validateType = (value, expectedType, fieldName) => {
  switch (expectedType) {
    case 'string':
      if (typeof value !== 'string') {
        throw new Error(`${fieldName} must be a string`);
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`${fieldName} must be a number`);
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new Error(`${fieldName} must be a boolean`);
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array`);
      }
      break;
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`${fieldName} must be an object`);
      }
      break;
    case 'email':
      if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error(`${fieldName} must be a valid email address`);
      }
      break;
    case 'url':
      if (typeof value !== 'string' || !/^https?:\/\/.+/.test(value)) {
        throw new Error(`${fieldName} must be a valid URL`);
      }
      break;
    case 'mongoId':
      if (typeof value !== 'string' || !/^[0-9a-fA-F]{24}$/.test(value)) {
        throw new Error(`${fieldName} must be a valid MongoDB ObjectId`);
      }
      break;
    default:
      throw new Error(`Unknown validation type: ${expectedType}`);
  }
};

// Common validation schemas
export const commonSchemas = {
  // User registration
  userRegistration: {
    body: {
      name: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 50
      },
      email: {
        type: 'email',
        required: true
      },
      password: {
        type: 'string',
        required: true,
        minLength: 8,
        custom: (value) => {
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumbers = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
          
          if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            return 'Password must contain uppercase, lowercase, number, and special character';
          }
          return true;
        }
      },
      phone: {
        type: 'string',
        required: false,
        pattern: /^[+]?[0-9\s-()]+$/
      }
    }
  },
  
  // User login
  userLogin: {
    body: {
      email: {
        type: 'email',
        required: true
      },
      password: {
        type: 'string',
        required: true
      }
    }
  },
  
  // Product creation
  productCreation: {
    body: {
      title: {
        type: 'string',
        required: true,
        minLength: 3,
        maxLength: 100
      },
      description: {
        type: 'string',
        required: true,
        minLength: 10,
        maxLength: 1000
      },
      price: {
        type: 'number',
        required: true,
        min: 0
      },
      category: {
        type: 'string',
        required: true,
        enum: ['classical', 'jazz', 'pop', 'rock', 'electronic', 'world', 'other']
      },
      composer: {
        type: 'mongoId',
        required: true
      },
      stock: {
        type: 'number',
        required: false,
        min: 0
      }
    }
  },
  
  // Product update
  productUpdate: {
    params: {
      id: {
        type: 'mongoId',
        required: true
      }
    },
    body: {
      title: {
        type: 'string',
        required: false,
        minLength: 3,
        maxLength: 100
      },
      description: {
        type: 'string',
        required: false,
        minLength: 10,
        maxLength: 1000
      },
      price: {
        type: 'number',
        required: false,
        min: 0
      },
      category: {
        type: 'string',
        required: false,
        enum: ['classical', 'jazz', 'pop', 'rock', 'electronic', 'world', 'other']
      },
      stock: {
        type: 'number',
        required: false,
        min: 0
      }
    }
  },
  
  // Pagination query
  pagination: {
    query: {
      page: {
        type: 'number',
        required: false,
        min: 1
      },
      limit: {
        type: 'number',
        required: false,
        min: 1,
        max: 100
      },
      sort: {
        type: 'string',
        required: false,
        enum: ['createdAt', '-createdAt', 'title', '-title', 'price', '-price']
      }
    }
  },
  
  // MongoDB ID parameter
  mongoIdParam: {
    params: {
      id: {
        type: 'mongoId',
        required: true
      }
    }
  }
};

// Validation middleware factory
export const validate = (schemaName) => {
  const schema = commonSchemas[schemaName];
  if (!schema) {
    throw new Error(`Validation schema '${schemaName}' not found`);
  }
  return createValidationSchema(schema);
};

// Custom validation middleware
export const validateCustom = (schema) => {
  return createValidationSchema(schema);
};

export default {
  createValidationSchema,
  commonSchemas,
  validate,
  validateCustom
};