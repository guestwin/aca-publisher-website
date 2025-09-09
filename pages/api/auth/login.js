import connectDB from '../../../lib/db';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';
import { validateLoginAttempts } from '../../../middleware/auth';

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    console.log('Method tidak diizinkan:', req.method);
    return res.status(405).json({
      success: false,
      message: 'Method tidak diizinkan'
    });
  }

  try {
    console.log('Mencoba koneksi ke database...');
    await connectDB();
    console.log('Koneksi database berhasil');

    const { email, password } = req.body;
    console.log('Menerima permintaan login untuk email:', email);

    if (!email || !password) {
      console.log('Email atau password kosong');
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi'
      });
    }

    // Cek apakah ini adalah permintaan pembuatan admin pertama
    console.log('Memeriksa keberadaan admin...');
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists && email === 'admin@acapubweb.com' && password === 'adminACA2024!') {
      console.log('Admin belum ada, membuat akun admin pertama...');
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

      console.log('Akun admin berhasil dibuat');
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        },
        message: 'Akun admin berhasil dibuat'
      });
    }

    console.log('Mencari user dengan email:', email);
    // Cari user dan include password untuk verifikasi
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('User tidak ditemukan');
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Cek apakah akun terkunci
    if (user.isLocked()) {
      console.log('Akun terkunci:', email);
      return res.status(423).json({
        success: false,
        message: 'Akun terkunci karena terlalu banyak percobaan login. Silakan coba lagi nanti.'
      });
    }

    console.log('Memverifikasi password...');
    // Verifikasi password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log('Password tidak cocok untuk user:', email);
      // Tambah percobaan login gagal
      await user.incrementLoginAttempts();

      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    console.log('Login berhasil, mereset login attempts...');
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

    console.log('Mengirim respons sukses untuk user:', email);
    res.status(200).json({
      success: true,
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
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saat login'
    });
  }
};

export default handler;