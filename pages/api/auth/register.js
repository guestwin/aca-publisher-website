import connectDB from '../../../lib/db';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method tidak diizinkan'
    });
  }

  try {
    await connectDB();

    const { name, email, phone, password, role = 'user', notificationPreferences } = req.body;

    // Validasi input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password harus diisi'
      });
    }

    // Validasi format phone jika ada
    if (phone && !/^[\+]?[1-9][\d]{0,15}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Format nomor telepon tidak valid'
      });
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Buat verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Buat user baru
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      verificationToken,
      notificationPreferences: notificationPreferences || {
        email: true,
        whatsapp: phone ? true : false
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

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error saat registrasi'
    });
  }
};

export default handler;