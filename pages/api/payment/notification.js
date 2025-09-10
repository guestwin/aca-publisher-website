/**
 * API endpoint untuk menangani notifikasi dari Midtrans
 * POST /api/payment/notification
 */

import connectDB from '../../../lib/mongodb';
import midtransPayment from '../../../lib/midtransPayment';
import { logger } from '../../../middleware/logger';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Connect to database
    await connectDB();

    const notification = req.body;
    
    logger.info('Payment notification received', {
      orderId: notification.order_id,
      transactionStatus: notification.transaction_status,
      paymentType: notification.payment_type
    });

    // Verify notification signature
    const isValidSignature = verifySignature(notification);
    if (!isValidSignature) {
      logger.error('Invalid notification signature', {
        orderId: notification.order_id
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }

    // Process notification
    const result = await midtransPayment.handleNotification(notification);

    logger.info('Payment notification processed successfully', {
      orderId: result.orderId,
      status: result.status
    });

    res.status(200).json({
      success: true,
      message: 'Notification processed successfully'
    });

  } catch (error) {
    logger.error('Error processing payment notification', {
      error: error.message,
      stack: error.stack,
      notification: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Verify Midtrans notification signature
 * @param {Object} notification - Midtrans notification data
 * @returns {Boolean} - Is signature valid
 */
function verifySignature(notification) {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key
    } = notification;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new Error('Midtrans server key not configured');
    }

    // Create signature hash
    const signatureString = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const calculatedSignature = crypto
      .createHash('sha512')
      .update(signatureString)
      .digest('hex');

    return calculatedSignature === signature_key;

  } catch (error) {
    logger.error('Error verifying signature', {
      error: error.message
    });
    return false;
  }
}

// Disable body parser for raw body access
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}