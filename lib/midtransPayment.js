/**
 * Midtrans Payment Gateway Integration
 * Untuk menangani pembayaran digital partitur musik
 */

import midtransClient from 'midtrans-client';
import { v4 as uuidv4 } from 'uuid';
import Transaction from '../models/Transaction';
import Product from '../models/Product';
import User from '../models/User';
import { sendEmail } from './emailService';
import { logger } from '../middleware/logger';

class MidtransPayment {
  constructor() {
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    this.serverKey = process.env.MIDTRANS_SERVER_KEY;
    this.clientKey = process.env.MIDTRANS_CLIENT_KEY;
    
    if (!this.serverKey || !this.clientKey) {
      throw new Error('Midtrans credentials not configured');
    }
    
    // Initialize Midtrans Snap
    this.snap = new midtransClient.Snap({
      isProduction: this.isProduction,
      serverKey: this.serverKey,
      clientKey: this.clientKey
    });
    
    // Initialize Core API
    this.coreApi = new midtransClient.CoreApi({
      isProduction: this.isProduction,
      serverKey: this.serverKey,
      clientKey: this.clientKey
    });
  }
  
  /**
   * Create payment transaction
   * @param {Object} orderData - Order information
   * @returns {Object} Payment token and redirect URL
   */
  async createTransaction(orderData) {
    try {
      const {
        userId,
        items, // Array of {productId, quantity, price}
        customerDetails,
        totalAmount
      } = orderData;
      
      // Generate unique order ID
      const orderId = `ACA-${Date.now()}-${uuidv4().substring(0, 8)}`;
      
      // Prepare item details for Midtrans
      const itemDetails = await Promise.all(
        items.map(async (item) => {
          const product = await Product.findById(item.productId);
          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }
          
          return {
            id: product._id.toString(),
            price: item.price,
            quantity: item.quantity,
            name: product.title,
            category: product.category,
            merchant_name: 'ACA Publisher'
          };
        })
      );
      
      // Create transaction parameter
      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: totalAmount
        },
        item_details: itemDetails,
        customer_details: {
          first_name: customerDetails.firstName,
          last_name: customerDetails.lastName,
          email: customerDetails.email,
          phone: customerDetails.phone,
          billing_address: {
            first_name: customerDetails.firstName,
            last_name: customerDetails.lastName,
            email: customerDetails.email,
            phone: customerDetails.phone,
            address: customerDetails.address || '',
            city: customerDetails.city || 'Jakarta',
            postal_code: customerDetails.postalCode || '12345',
            country_code: 'IDN'
          }
        },
        credit_card: {
          secure: true
        },
        enabled_payments: [
          'credit_card',
          'bca_va',
          'bni_va',
          'bri_va',
          'echannel',
          'permata_va',
          'other_va',
          'gopay',
          'shopeepay',
          'qris'
        ],
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
          error: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/error`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/pending`
        },
        expiry: {
          start_time: new Date().toISOString(),
          unit: 'minutes',
          duration: 60 // 1 hour
        }
      };
      
      // Create transaction token
      const transaction = await this.snap.createTransaction(parameter);
      
      // Save transaction to database
      const dbTransaction = new Transaction({
        orderId,
        userId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount,
        status: 'pending',
        paymentMethod: 'midtrans',
        customerDetails,
        midtransToken: transaction.token,
        midtransRedirectUrl: transaction.redirect_url,
        expiryTime: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      });
      
      await dbTransaction.save();
      
      logger.info('Payment transaction created', {
        orderId,
        userId,
        totalAmount,
        itemCount: items.length
      });
      
      return {
        success: true,
        orderId,
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        expiryTime: dbTransaction.expiryTime
      };
      
    } catch (error) {
      logger.error('Error creating payment transaction', {
        error: error.message,
        stack: error.stack
      });
      
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }
  
  /**
   * Handle payment notification from Midtrans
   * @param {Object} notification - Midtrans notification
   */
  async handleNotification(notification) {
    try {
      const {
        order_id,
        transaction_status,
        fraud_status,
        payment_type,
        gross_amount
      } = notification;
      
      // Verify notification authenticity
      const statusResponse = await this.coreApi.transaction.notification(notification);
      
      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;
      
      logger.info('Payment notification received', {
        orderId,
        transactionStatus,
        fraudStatus,
        paymentType: payment_type
      });
      
      // Find transaction in database
      const transaction = await Transaction.findOne({ orderId });
      if (!transaction) {
        throw new Error(`Transaction not found: ${orderId}`);
      }
      
      // Update transaction status based on Midtrans response
      let newStatus = 'pending';
      let shouldProcessOrder = false;
      
      if (transactionStatus === 'capture') {
        if (fraudStatus === 'challenge') {
          newStatus = 'challenge';
        } else if (fraudStatus === 'accept') {
          newStatus = 'success';
          shouldProcessOrder = true;
        }
      } else if (transactionStatus === 'settlement') {
        newStatus = 'success';
        shouldProcessOrder = true;
      } else if (transactionStatus === 'cancel' || 
                 transactionStatus === 'deny' || 
                 transactionStatus === 'expire') {
        newStatus = 'failed';
      } else if (transactionStatus === 'pending') {
        newStatus = 'pending';
      }
      
      // Update transaction
      transaction.status = newStatus;
      transaction.paymentDetails = {
        transactionStatus,
        fraudStatus,
        paymentType: payment_type,
        grossAmount: gross_amount,
        updatedAt: new Date()
      };
      
      await transaction.save();
      
      // Process successful payment
      if (shouldProcessOrder) {
        await this.processSuccessfulPayment(transaction);
      }
      
      return {
        success: true,
        orderId,
        status: newStatus
      };
      
    } catch (error) {
      logger.error('Error handling payment notification', {
        error: error.message,
        notification
      });
      
      throw error;
    }
  }
  
  /**
   * Process successful payment
   * @param {Object} transaction - Transaction object
   */
  async processSuccessfulPayment(transaction) {
    try {
      // Update product sold count
      for (const item of transaction.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { sold: item.quantity } }
        );
      }
      
      // Get user details
      const user = await User.findById(transaction.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Send confirmation email
      await this.sendPaymentConfirmationEmail(transaction, user);
      
      // Generate download links (implement based on your file storage)
      const downloadLinks = await this.generateDownloadLinks(transaction.items);
      
      // Update transaction with download links
      transaction.downloadLinks = downloadLinks;
      transaction.downloadExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await transaction.save();
      
      logger.info('Payment processed successfully', {
        orderId: transaction.orderId,
        userId: transaction.userId,
        totalAmount: transaction.totalAmount
      });
      
    } catch (error) {
      logger.error('Error processing successful payment', {
        orderId: transaction.orderId,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Send payment confirmation email
   * @param {Object} transaction - Transaction object
   * @param {Object} user - User object
   */
  async sendPaymentConfirmationEmail(transaction, user) {
    try {
      const products = await Product.find({
        _id: { $in: transaction.items.map(item => item.productId) }
      }).populate('composer', 'name');
      
      const emailData = {
        to: user.email,
        subject: `Pembayaran Berhasil - Order #${transaction.orderId}`,
        template: 'payment-success',
        data: {
          userName: user.name,
          orderId: transaction.orderId,
          totalAmount: transaction.totalAmount,
          products: products.map(product => {
            const item = transaction.items.find(item => 
              item.productId.toString() === product._id.toString()
            );
            return {
              title: product.title,
              composer: product.composer.name,
              price: item.price,
              quantity: item.quantity
            };
          }),
          downloadUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/download/${transaction.orderId}`,
          supportEmail: 'support@acapublisher.com'
        }
      };
      
      await sendEmail(emailData);
      
    } catch (error) {
      logger.error('Error sending payment confirmation email', {
        orderId: transaction.orderId,
        error: error.message
      });
    }
  }
  
  /**
   * Generate download links for purchased items
   * @param {Array} items - Transaction items
   * @returns {Array} Download links
   */
  async generateDownloadLinks(items) {
    const downloadLinks = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product && product.pdfFile) {
        downloadLinks.push({
          productId: product._id,
          title: product.title,
          downloadUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/download/${product._id}`,
          fileName: product.pdfFile
        });
      }
    }
    
    return downloadLinks;
  }
  
  /**
   * Check transaction status
   * @param {String} orderId - Order ID
   * @returns {Object} Transaction status
   */
  async checkTransactionStatus(orderId) {
    try {
      const statusResponse = await this.coreApi.transaction.status(orderId);
      
      return {
        success: true,
        orderId: statusResponse.order_id,
        transactionStatus: statusResponse.transaction_status,
        fraudStatus: statusResponse.fraud_status,
        paymentType: statusResponse.payment_type,
        grossAmount: statusResponse.gross_amount
      };
      
    } catch (error) {
      logger.error('Error checking transaction status', {
        orderId,
        error: error.message
      });
      
      throw error;
    }
  }
}

// Export singleton instance
const midtransPayment = new MidtransPayment();
export default midtransPayment;

// Export class for testing
export { MidtransPayment };