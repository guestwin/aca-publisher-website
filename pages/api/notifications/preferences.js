import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { verifyToken, requireAuth } from '../../../middleware/authMiddleware';

export default async function handler(req, res) {
  try {
    await connectDB();
    
    // Verify authentication
    await new Promise((resolve, reject) => {
      verifyToken(req, res, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      requireAuth(req, res, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    if (req.method === 'GET') {
      // Get current notification preferences
      const user = await User.findById(req.user._id).select('notificationPreferences email phone');
      
      if (!user) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }

      res.status(200).json({
        preferences: user.notificationPreferences,
        email: user.email,
        phone: user.phone
      });
    } else if (req.method === 'PUT') {
      // Update notification preferences
      const { email, whatsapp } = req.body;

      // Validate input
      if (typeof email !== 'boolean' || typeof whatsapp !== 'boolean') {
        return res.status(400).json({ message: 'Preferensi email dan whatsapp harus berupa boolean' });
      }

      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }

      // If user wants WhatsApp notifications but doesn't have phone number
      if (whatsapp && !user.phone) {
        return res.status(400).json({ 
          message: 'Nomor WhatsApp harus diisi terlebih dahulu untuk mengaktifkan notifikasi WhatsApp' 
        });
      }

      // Update preferences
      user.notificationPreferences = {
        email,
        whatsapp: user.phone ? whatsapp : false // Force false if no phone
      };

      await user.save();

      res.status(200).json({
        message: 'Preferensi notifikasi berhasil diupdate',
        preferences: user.notificationPreferences
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notification preferences error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}