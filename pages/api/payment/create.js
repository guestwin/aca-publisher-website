/**
 * API endpoint untuk membuat transaksi pembayaran
 * POST /api/payment/create
 */

import { getSession } from 'next-auth/react';
import connectDB from '../../../lib/mongodb';
import midtransPayment from '../../../lib/midtransPayment';
import Product from '../../../models/Product';
import User from '../../../models/User';
import { logger } from '../../../middleware/logger';

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

    // Check authentication
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { items, customerDetails } = req.body;

    // Validate request data
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items are required' 
      });
    }

    if (!customerDetails || !customerDetails.email || !customerDetails.firstName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer details are required' 
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

    // Validate and calculate total amount
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product not found: ${item.productId}` 
        });
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.title}` 
        });
      }

      const itemPrice = product.isDiscounted && product.discountPrice 
        ? product.discountPrice 
        : product.price;
      
      const itemTotal = itemPrice * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: itemPrice,
        title: product.title
      });
    }

    // Create payment transaction
    const orderData = {
      userId: user._id,
      items: validatedItems,
      customerDetails: {
        firstName: customerDetails.firstName,
        lastName: customerDetails.lastName || '',
        email: customerDetails.email,
        phone: customerDetails.phone || '',
        address: customerDetails.address || '',
        city: customerDetails.city || 'Jakarta',
        postalCode: customerDetails.postalCode || '12345'
      },
      totalAmount
    };

    const paymentResult = await midtransPayment.createTransaction(orderData);

    logger.info('Payment transaction created via API', {
      userId: user._id,
      orderId: paymentResult.orderId,
      totalAmount,
      itemCount: validatedItems.length
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: paymentResult.orderId,
        token: paymentResult.token,
        redirectUrl: paymentResult.redirectUrl,
        totalAmount,
        expiryTime: paymentResult.expiryTime
      }
    });

  } catch (error) {
    logger.error('Error in payment creation API', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}