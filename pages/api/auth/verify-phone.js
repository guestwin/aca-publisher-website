import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { verifyWhatsAppNumber } from '../../../lib/whatsappService';
import crypto from 'crypto';

const handler = async (req, res) => {
  await connectDB();

  if (req.method === 'POST') {
    // Kirim kode verifikasi
    try {
      const { userId, phone } = req.body;

      if (!userId || !phone) {
        return res.status(400).json({
          success: false,
          message: 'User ID dan nomor telepon harus diisi'
        });
      }

      // Validasi format nomor telepon
      if (!/^[\+]?[1-9][\d]{0,15}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Format nomor telepon tidak valid'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // Generate kode verifikasi
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const phoneVerificationToken = crypto
        .createHash('sha256')
        .update(verificationCode)
        .digest('hex');

      // Update user dengan nomor telepon dan token verifikasi
      user.phone = phone;
      user.phoneVerificationToken = phoneVerificationToken;
      user.phoneVerified = false;
      await user.save();

      // Kirim kode verifikasi via WhatsApp
      const whatsappResult = await verifyWhatsAppNumber(phone);
      
      if (!whatsappResult.success) {
        // Fallback: simpan kode untuk verifikasi manual
        console.log(`Kode verifikasi untuk ${phone}: ${verificationCode}`);
      }

      res.status(200).json({
        success: true,
        message: 'Kode verifikasi telah dikirim ke nomor WhatsApp Anda',
        // Untuk development, bisa menampilkan kode
        ...(process.env.NODE_ENV === 'development' && { verificationCode })
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      res.status(500).json({
        success: false,
        message: 'Error saat mengirim kode verifikasi'
      });
    }
  } else if (req.method === 'PUT') {
    // Verifikasi kode
    try {
      const { userId, verificationCode } = req.body;

      if (!userId || !verificationCode) {
        return res.status(400).json({
          success: false,
          message: 'User ID dan kode verifikasi harus diisi'
        });
      }

      const phoneVerificationToken = crypto
        .createHash('sha256')
        .update(verificationCode)
        .digest('hex');

      const user = await User.findOne({
        _id: userId,
        phoneVerificationToken
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Kode verifikasi tidak valid'
        });
      }

      // Update status verifikasi
      user.phoneVerified = true;
      user.phoneVerificationToken = undefined;
      
      // Aktifkan notifikasi WhatsApp jika belum aktif
      if (!user.notificationPreferences.whatsapp) {
        user.notificationPreferences.whatsapp = true;
      }
      
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Nomor WhatsApp berhasil diverifikasi',
        user: {
          id: user._id,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          notificationPreferences: user.notificationPreferences
        }
      });
    } catch (error) {
      console.error('Error verifying phone:', error);
      res.status(500).json({
        success: false,
        message: 'Error saat verifikasi nomor telepon'
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Method tidak diizinkan'
    });
  }
};

export default handler;