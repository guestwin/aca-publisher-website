import connectDB from '../../../lib/db';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authRateLimit } from '../../../middleware/rateLimiter';
import { validateUserInput } from '../../../utils/validation';
import { errorHandler, ValidationError, ConflictError, successResponse } from '../../../lib/errorHandler';
import { logger, authLogger } from '../../../middleware/logger';

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    throw new ValidationError('Method not allowed');
  }

  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  logger.info('Registration attempt', { ip: clientIP });
  
  await connectDB();

  const { name, email, phone, password, role = 'user', notificationPreferences } = req.body;

  // Validasi dan sanitasi input
  const validationResult = validateUserInput({ name, email, phone, password });
  
  if (!validationResult.isValid) {
    authLogger.register(null, email, false, clientIP, 'Invalid input data');
    throw new ValidationError('Input tidak valid', validationResult.errors);
  }
    
    // Gunakan data yang sudah disanitasi
    const sanitizedData = validationResult.sanitized;

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ email: sanitizedData.email });
    if (existingUser) {
      authLogger.register(null, sanitizedData.email, false, clientIP, 'Email already exists');
      throw new ConflictError('Email sudah terdaftar');
    }

    // Buat verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Buat user baru
    const user = await User.create({
      name: sanitizedData.name,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      password: sanitizedData.password,
      role,
      verificationToken,
      notificationPreferences: notificationPreferences || {
        email: true,
        whatsapp: sanitizedData.phone ? true : false
      }
    });

  // Buat JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // TODO: Kirim email verifikasi
  // await sendVerificationEmail(user.email, verificationToken);

  authLogger.register(user._id, user.email, true, clientIP);
  logger.info('User registered successfully', { userId: user._id, email: user.email });

  return successResponse(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  }, 'Registration successful', 201);
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

export default rateLimitedHandler;