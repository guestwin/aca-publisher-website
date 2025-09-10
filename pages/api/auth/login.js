import connectDB from '../../../lib/db';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';
import { validateLoginAttempts } from '../../../middleware/auth';
import { authRateLimit } from '../../../middleware/rateLimiter';
import { validateEmail } from '../../../utils/validation';
import { errorHandler, ValidationError, AuthenticationError, successResponse } from '../../../lib/errorHandler';
import { logger, authLogger } from '../../../middleware/logger';

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    throw new ValidationError('Method not allowed');
  }

  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  logger.info('Login attempt', { ip: clientIP });
  
  await connectDB();

  const { email, password } = req.body;

  // Validasi dan sanitasi input
  if (!email || !password) {
    authLogger.login(null, email, false, clientIP);
    throw new ValidationError('Email and password are required', {
      email: !email ? 'Email is required' : undefined,
      password: !password ? 'Password is required' : undefined
    });
  }
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    authLogger.login(null, email, false, clientIP);
    throw new ValidationError(emailValidation.message);
  }
  
  const sanitizedEmail = emailValidation.sanitized;

  // Cek apakah ini adalah permintaan pembuatan admin pertama
  logger.info('Checking for existing admin');
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists && sanitizedEmail === 'admin@acapubweb.com' && password === 'adminACA2024!') {
    logger.info('Creating first admin account');
      // Buat akun admin pertama
      const admin = await User.create({
        name: 'Admin ACA',
        email: 'admin@acapubweb.com',
        password: 'adminACA2024!',
        role: 'admin',
        isVerified: true
      });

      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      authLogger.login(admin._id, admin.email, true, clientIP);
      logger.info('First admin account created successfully');
      
      return successResponse(res, {
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }, 'Admin account created successfully', 201);
    }

  logger.info('Looking up user', { email: sanitizedEmail });
  // Cari user dan include password untuk verifikasi
  const user = await User.findOne({ email: sanitizedEmail }).select('+password');

  if (!user) {
    authLogger.login(null, sanitizedEmail, false, clientIP);
    throw new AuthenticationError('Invalid email or password');
  }

  // Cek apakah akun terkunci
  if (user.isLocked()) {
    authLogger.login(user._id, sanitizedEmail, false, clientIP, 'Account locked');
    throw new AuthenticationError('Account locked due to too many failed login attempts. Please try again later.', { lockUntil: user.lockUntil });

  logger.info('Verifying password');
  // Verifikasi password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    // Tambah percobaan login gagal
    await user.incrementLoginAttempts();
    authLogger.login(user._id, sanitizedEmail, false, clientIP, 'Invalid password');
    throw new AuthenticationError('Invalid email or password');
  }

  logger.info('Login successful, resetting login attempts');
  // Reset login attempts jika berhasil
  await User.findByIdAndUpdate(user._id, {
    loginAttempts: 0,
    lockUntil: null,
    lastLogin: Date.now()
  });

  // Buat token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  authLogger.login(user._id, user.email, true, clientIP);
  logger.info('Login successful', { userId: user._id, email: user.email });
  
  return successResponse(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      notificationPreferences: user.notificationPreferences
    }
  }, 'Login successful');
};

// Apply rate limiting and error handling middleware
const rateLimitedHandler = async (req, res) => {
  return new Promise((resolve, reject) => {
    authRateLimit(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(errorHandler(handler)(req, res));
    });
  });
};

} // Close the if(user.isLocked()) block that was missing a closing brace

export default rateLimitedHandler;