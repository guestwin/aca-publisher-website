import handler from '../../../pages/api/auth/login';
import { createMocks } from 'node-mocks-http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import connectDB from '../../../lib/db';
import { authLogger, logger } from '../../../middleware/logger';
import { successResponse } from '../../../lib/errorHandler';

// Mock dependencies
jest.mock('../../../lib/db');
jest.mock('../../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../middleware/logger');
jest.mock('../../../lib/errorHandler');

// Mock rate limiting
jest.mock('../../../middleware/rateLimiter', () => ({
  createRateLimiter: () => (req, res, next) => next()
}));

describe('/api/auth/login', () => {
  let req, res;

  beforeEach(() => {
    const mocks = createMocks();
    req = mocks.req;
    res = mocks.res;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock successful database connection
    connectDB.mockResolvedValue();
    
    // Mock logger methods
    authLogger.info = jest.fn();
    authLogger.warn = jest.fn();
    authLogger.error = jest.fn();
    logger.error = jest.fn();
    
    // Mock successResponse
    successResponse.mockImplementation((res, data, message, statusCode = 200) => {
      res.status(statusCode).json({ success: true, message, data });
    });
    
    // Mock client IP
    req.ip = '127.0.0.1';
    req.headers = { 'user-agent': 'test-agent' };
  });

  describe('Method Validation', () => {
    it('should only accept POST requests', async () => {
      req.method = 'GET';
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        message: 'Method not allowed'
      });
    });

    it('should accept POST requests', async () => {
      req.method = 'POST';
      req.body = { email: 'test@example.com', password: 'password123' };
      
      // Mock user found and password match
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'user',
        isVerified: true
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      req.method = 'POST';
    });

    it('should require email field', async () => {
      req.body = { password: 'password123' };
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        message: 'Email and password are required'
      });
    });

    it('should require password field', async () => {
      req.body = { email: 'test@example.com' };
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        message: 'Email and password are required'
      });
    });

    it('should require both email and password', async () => {
      req.body = {};
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        message: 'Email and password are required'
      });
    });

    it('should validate email format', async () => {
      req.body = { email: 'invalid-email', password: 'password123' };
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        message: 'Invalid email format'
      });
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];
      
      for (const email of validEmails) {
        req.body = { email, password: 'password123' };
        
        // Mock user not found to avoid full authentication flow
        User.findOne.mockResolvedValue(null);
        
        await handler(req, res);
        
        // Should not fail on email validation
        expect(res._getStatusCode()).not.toBe(400);
        
        // Reset response for next iteration
        const mocks = createMocks();
        res = mocks.res;
      }
    });
  });

  describe('Authentication Logic', () => {
    beforeEach(() => {
      req.method = 'POST';
      req.body = { email: 'test@example.com', password: 'password123' };
    });

    it('should return error when user not found', async () => {
      User.findOne.mockResolvedValue(null);
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        message: 'Invalid credentials'
      });
      
      expect(authLogger.warn).toHaveBeenCalledWith(
        'Login attempt with non-existent email',
        expect.objectContaining({
          email: 'test@example.com',
          clientIP: '127.0.0.1'
        })
      );
    });

    it('should return error when password is incorrect', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        message: 'Invalid credentials'
      });
      
      expect(authLogger.warn).toHaveBeenCalledWith(
        'Login attempt with incorrect password',
        expect.objectContaining({
          userId: 'user123',
          email: 'test@example.com',
          clientIP: '127.0.0.1'
        })
      );
    });

    it('should return error when user is not verified', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        isVerified: false
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        message: 'Please verify your email before logging in'
      });
    });

    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'user',
        isVerified: true
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(200);
      expect(successResponse).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'user123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user'
          }),
          token: 'mock-jwt-token'
        }),
        'Login successful'
      );
      
      expect(authLogger.info).toHaveBeenCalledWith(
        'User logged in successfully',
        expect.objectContaining({
          userId: 'user123',
          email: 'test@example.com',
          clientIP: '127.0.0.1'
        })
      );
    });
  });

  describe('JWT Token Generation', () => {
    beforeEach(() => {
      req.method = 'POST';
      req.body = { email: 'test@example.com', password: 'password123' };
      
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'user',
        isVerified: true
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
    });

    it('should generate JWT token with correct payload', async () => {
      jwt.sign.mockReturnValue('mock-jwt-token');
      
      await handler(req, res);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 'user123',
          email: 'test@example.com',
          role: 'user'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
    });

    it('should handle JWT generation error', async () => {
      jwt.sign.mockImplementation(() => {
        throw new Error('JWT generation failed');
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(500);
      expect(logger.error).toHaveBeenCalledWith(
        'Login error',
        expect.objectContaining({
          error: expect.any(Error),
          clientIP: '127.0.0.1'
        })
      );
    });
  });

  describe('Database Errors', () => {
    beforeEach(() => {
      req.method = 'POST';
      req.body = { email: 'test@example.com', password: 'password123' };
    });

    it('should handle database connection error', async () => {
      connectDB.mockRejectedValue(new Error('Database connection failed'));
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(500);
      expect(logger.error).toHaveBeenCalledWith(
        'Login error',
        expect.objectContaining({
          error: expect.any(Error),
          clientIP: '127.0.0.1'
        })
      );
    });

    it('should handle user query error', async () => {
      User.findOne.mockRejectedValue(new Error('Database query failed'));
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(500);
      expect(logger.error).toHaveBeenCalledWith(
        'Login error',
        expect.objectContaining({
          error: expect.any(Error),
          clientIP: '127.0.0.1'
        })
      );
    });

    it('should handle bcrypt comparison error', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword'
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockRejectedValue(new Error('Bcrypt comparison failed'));
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(500);
      expect(logger.error).toHaveBeenCalledWith(
        'Login error',
        expect.objectContaining({
          error: expect.any(Error),
          clientIP: '127.0.0.1'
        })
      );
    });
  });

  describe('Security', () => {
    beforeEach(() => {
      req.method = 'POST';
    });

    it('should not expose sensitive information in error messages', async () => {
      req.body = { email: 'test@example.com', password: 'wrongpassword' };
      
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword'
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      
      await handler(req, res);
      
      const response = JSON.parse(res._getData());
      expect(response.message).toBe('Invalid credentials');
      expect(response.message).not.toContain('password');
      expect(response.message).not.toContain('user');
    });

    it('should log client IP for security monitoring', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      User.findOne.mockResolvedValue(null);
      
      await handler(req, res);
      
      expect(authLogger.warn).toHaveBeenCalledWith(
        'Login attempt with non-existent email',
        expect.objectContaining({
          clientIP: '127.0.0.1'
        })
      );
    });

    it('should not return user password in response', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'user',
        isVerified: true
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');
      
      await handler(req, res);
      
      expect(successResponse).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          user: expect.not.objectContaining({
            password: expect.anything()
          })
        }),
        'Login successful'
      );
    });
  });
});