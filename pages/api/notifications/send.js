import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { sendNotification } from '../../../lib/emailService';
import { sendNotificationWhatsApp } from '../../../lib/whatsappService';
import { verifyToken, requireAuth } from '../../../middleware/authMiddleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    const { userId, type, data } = req.body;

    // Validate input
    if (!userId || !type || !data) {
      return res.status(400).json({ message: 'userId, type, dan data harus diisi' });
    }

    // Validate notification type
    const validTypes = ['order_confirmation', 'payment_received', 'order_shipped'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Tipe notifikasi tidak valid' });
    }

    // Get user
    const user = await User.findById(userId).select('email phone notificationPreferences name');
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const notifications = {
      email: { sent: false, error: null },
      whatsapp: { sent: false, error: null }
    };

    // Send email notification if enabled
    if (user.notificationPreferences.email) {
      try {
        await sendNotification(user.email, type, data);
        notifications.email.sent = true;
      } catch (error) {
        console.error('Email notification error:', error);
        notifications.email.error = error.message;
      }
    }

    // Send WhatsApp notification if enabled and phone number exists
    if (user.notificationPreferences.whatsapp && user.phone) {
      try {
        await sendNotificationWhatsApp(user.phone, type, data);
        notifications.whatsapp.sent = true;
      } catch (error) {
        console.error('WhatsApp notification error:', error);
        notifications.whatsapp.error = error.message;
      }
    }

    res.status(200).json({
      message: 'Notifikasi berhasil diproses',
      notifications,
      user: {
        email: user.email,
        phone: user.phone,
        preferences: user.notificationPreferences
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}