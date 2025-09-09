import connectDB from '../../../lib/db';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method tidak diizinkan'
    });
  }

  try {
    await connectDB();

    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential harus diisi'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Cek apakah user sudah ada berdasarkan email atau googleId
    let user = await User.findOne({
      $or: [{ email }, { googleId }]
    });

    if (user) {
      // Update googleId jika user sudah ada tapi belum punya googleId
      if (!user.googleId) {
        user.googleId = googleId;
        user.emailVerified = true;
        await user.save();
      }
    } else {
      // Buat user baru
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        emailVerified: true,
        isVerified: true,
        notificationPreferences: {
          email: true,
          whatsapp: false
        }
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Buat JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login dengan Google berhasil',
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
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saat login dengan Google'
    });
  }
};

export default handler;