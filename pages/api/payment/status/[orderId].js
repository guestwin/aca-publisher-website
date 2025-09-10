/**
 * API endpoint untuk mengecek status pembayaran
 * GET /api/payment/status/[orderId]
 */

import { getSession } from 'next-auth/react';
import connectDB from '../../../../lib/mongodb';
import midtransPayment from '../../../../lib/midtransPayment';
import Transaction from '../../../../models/Transaction';
import User from '../../../../models/User';
import { logger } from '../../../../middleware/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Connect to database
    await connectDB();

    // Check authentication
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Find transaction in database
    const transaction = await Transaction.findOne({ 
      orderId,
      userId: user._id 
    }).populate('items.productId', 'title composer price');

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    // Get latest status from Midtrans
    let midtransStatus = null;
    try {
      midtransStatus = await midtransPayment.checkTransactionStatus(orderId);
    } catch (error) {
      logger.warn('Failed to get Midtrans status', {
        orderId,
        error: error.message
      });
    }

    // Prepare response data
    const responseData = {
      orderId: transaction.orderId,
      status: transaction.status,
      totalAmount: transaction.totalAmount,
      paymentMethod: transaction.paymentMethod,
      createdAt: transaction.createdAt,
      expiryTime: transaction.expiryTime,
      customerDetails: transaction.customerDetails,
      items: transaction.items.map(item => ({
        productId: item.productId._id,
        title: item.productId.title,
        quantity: item.quantity,
        price: item.price
      })),
      paymentDetails: transaction.paymentDetails,
      downloadLinks: transaction.downloadLinks || [],
      downloadExpiryDate: transaction.downloadExpiryDate
    };

    // Include Midtrans status if available
    if (midtransStatus) {
      responseData.midtransStatus = {
        transactionStatus: midtransStatus.transactionStatus,
        fraudStatus: midtransStatus.fraudStatus,
        paymentType: midtransStatus.paymentType
      };
    }

    logger.info('Payment status checked', {
      orderId,
      userId: user._id,
      status: transaction.status
    });

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    logger.error('Error checking payment status', {
      error: error.message,
      stack: error.stack,
      orderId: req.query.orderId
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}