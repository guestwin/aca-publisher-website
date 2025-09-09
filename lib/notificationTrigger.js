import { sendNotification } from './emailService';
import { sendNotificationWhatsApp } from './whatsappService';
import User from '../models/User';
import connectDB from './db';

// Trigger notifikasi untuk konfirmasi pesanan
export const triggerOrderConfirmation = async (userId, orderData) => {
  try {
    await connectDB();
    
    const user = await User.findById(userId).select('email phone notificationPreferences name');
    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const notifications = {
      email: { sent: false, error: null },
      whatsapp: { sent: false, error: null }
    };

    // Prepare notification data
    const notificationData = {
      customerName: user.name,
      orderId: orderData.orderId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      orderDate: orderData.orderDate || new Date().toLocaleDateString('id-ID')
    };

    // Send email notification
    if (user.notificationPreferences.email) {
      try {
        await sendNotification(user.email, 'order_confirmation', notificationData);
        notifications.email.sent = true;
      } catch (error) {
        console.error('Email notification error:', error);
        notifications.email.error = error.message;
      }
    }

    // Send WhatsApp notification
    if (user.notificationPreferences.whatsapp && user.phone) {
      try {
        await sendNotificationWhatsApp(user.phone, 'order_confirmation', notificationData);
        notifications.whatsapp.sent = true;
      } catch (error) {
        console.error('WhatsApp notification error:', error);
        notifications.whatsapp.error = error.message;
      }
    }

    return notifications;
  } catch (error) {
    console.error('Order confirmation notification error:', error);
    throw error;
  }
};

// Trigger notifikasi untuk pembayaran diterima
export const triggerPaymentReceived = async (userId, paymentData) => {
  try {
    await connectDB();
    
    const user = await User.findById(userId).select('email phone notificationPreferences name');
    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const notifications = {
      email: { sent: false, error: null },
      whatsapp: { sent: false, error: null }
    };

    // Prepare notification data
    const notificationData = {
      customerName: user.name,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: paymentData.paymentDate || new Date().toLocaleDateString('id-ID')
    };

    // Send email notification
    if (user.notificationPreferences.email) {
      try {
        await sendNotification(user.email, 'payment_received', notificationData);
        notifications.email.sent = true;
      } catch (error) {
        console.error('Email notification error:', error);
        notifications.email.error = error.message;
      }
    }

    // Send WhatsApp notification
    if (user.notificationPreferences.whatsapp && user.phone) {
      try {
        await sendNotificationWhatsApp(user.phone, 'payment_received', notificationData);
        notifications.whatsapp.sent = true;
      } catch (error) {
        console.error('WhatsApp notification error:', error);
        notifications.whatsapp.error = error.message;
      }
    }

    return notifications;
  } catch (error) {
    console.error('Payment received notification error:', error);
    throw error;
  }
};

// Trigger notifikasi untuk pesanan dikirim
export const triggerOrderShipped = async (userId, shippingData) => {
  try {
    await connectDB();
    
    const user = await User.findById(userId).select('email phone notificationPreferences name');
    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const notifications = {
      email: { sent: false, error: null },
      whatsapp: { sent: false, error: null }
    };

    // Prepare notification data
    const notificationData = {
      customerName: user.name,
      orderId: shippingData.orderId,
      trackingNumber: shippingData.trackingNumber,
      courier: shippingData.courier,
      estimatedDelivery: shippingData.estimatedDelivery,
      shippingDate: shippingData.shippingDate || new Date().toLocaleDateString('id-ID')
    };

    // Send email notification
    if (user.notificationPreferences.email) {
      try {
        await sendNotification(user.email, 'order_shipped', notificationData);
        notifications.email.sent = true;
      } catch (error) {
        console.error('Email notification error:', error);
        notifications.email.error = error.message;
      }
    }

    // Send WhatsApp notification
    if (user.notificationPreferences.whatsapp && user.phone) {
      try {
        await sendNotificationWhatsApp(user.phone, 'order_shipped', notificationData);
        notifications.whatsapp.sent = true;
      } catch (error) {
        console.error('WhatsApp notification error:', error);
        notifications.whatsapp.error = error.message;
      }
    }

    return notifications;
  } catch (error) {
    console.error('Order shipped notification error:', error);
    throw error;
  }
};

// Utility function untuk mengirim notifikasi custom
export const sendCustomNotification = async (userId, type, data) => {
  try {
    await connectDB();
    
    const user = await User.findById(userId).select('email phone notificationPreferences name');
    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const notifications = {
      email: { sent: false, error: null },
      whatsapp: { sent: false, error: null }
    };

    // Send email notification
    if (user.notificationPreferences.email) {
      try {
        await sendNotification(user.email, type, data);
        notifications.email.sent = true;
      } catch (error) {
        console.error('Email notification error:', error);
        notifications.email.error = error.message;
      }
    }

    // Send WhatsApp notification
    if (user.notificationPreferences.whatsapp && user.phone) {
      try {
        await sendNotificationWhatsApp(user.phone, type, data);
        notifications.whatsapp.sent = true;
      } catch (error) {
        console.error('WhatsApp notification error:', error);
        notifications.whatsapp.error = error.message;
      }
    }

    return notifications;
  } catch (error) {
    console.error('Custom notification error:', error);
    throw error;
  }
};