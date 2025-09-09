import jwt from 'jsonwebtoken';
import User from '../models/User';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Ambil token dari header
      token = req.headers.authorization.split(' ')[1];

      // Verifikasi token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ambil data user dari token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Token tidak valid atau user tidak ditemukan'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Tidak diizinkan mengakses route ini'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Tidak diizinkan mengakses route ini'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} tidak diizinkan mengakses route ini`
      });
    }
    next();
  };
};

export const validateLoginAttempts = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user && user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Akun terkunci karena terlalu banyak percobaan login. Silakan coba lagi nanti.'
      });
    }

    req.loginUser = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error saat memvalidasi percobaan login'
    });
  }
};