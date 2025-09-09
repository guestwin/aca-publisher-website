import dbConnect from '../../../lib/db';
import PurchaseHistory from '../../../models/PurchaseHistory';
import Product from '../../../models/Product';
import Transaction from '../../../models/Transaction';
import pdfWatermarkService from '../../../lib/pdfWatermark';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { transactionId, buyerName, choirName } = req.body;

    if (!transactionId || !buyerName || !choirName) {
      return res.status(400).json({ 
        message: 'Transaction ID, buyer name, and choir name are required' 
      });
    }

    // Find transaction with product details
    const transaction = await Transaction.findById(transactionId)
      .populate('items.productId', 'title composer arrangement pdfPath');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({ message: 'Transaction is not completed yet' });
    }

    const processedPurchases = [];

    // Process each item in the transaction
    for (const item of transaction.items) {
      const product = item.productId;
      
      // Check if PDF file exists
      const originalPdfPath = path.join(process.cwd(), 'public', product.pdfPath || `scores/${product.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      
      if (!fs.existsSync(originalPdfPath)) {
        console.warn(`PDF not found for product ${product.title}: ${originalPdfPath}`);
        continue;
      }

      // Check if purchase history already exists
      let purchaseHistory = await PurchaseHistory.findOne({
        transactionId: transactionId,
        productId: product._id
      });

      if (!purchaseHistory) {
        // Create new purchase history
        purchaseHistory = new PurchaseHistory({
          transactionId: transactionId,
          productId: product._id,
          buyerName: buyerName,
          buyerEmail: transaction.email,
          choirName: choirName,
          quantity: item.quantity,
          purchaseDate: transaction.createdAt,
          pdfPath: product.pdfPath
        });
        
        await purchaseHistory.save();
      }

      // Process PDF with watermark
      try {
        const watermarkResult = await pdfWatermarkService.processPurchasePDF(originalPdfPath, {
          purchaseId: purchaseHistory.purchaseId,
          purchaseUUID: purchaseHistory.purchaseUUID,
          buyerName: buyerName,
          choirName: choirName,
          purchaseDate: purchaseHistory.purchaseDate,
          quantity: item.quantity
        });

        // Update purchase history with watermarked PDF path
        purchaseHistory.watermarkedPdfPath = watermarkResult.relativePath;
        await purchaseHistory.save();

        processedPurchases.push({
          productId: product._id,
          productTitle: product.title,
          purchaseId: purchaseHistory.purchaseId,
          purchaseUUID: purchaseHistory.purchaseUUID,
          watermarkedPdfPath: watermarkResult.relativePath,
          verificationUrl: watermarkResult.verificationUrl
        });

      } catch (pdfError) {
        console.error(`Error processing PDF for ${product.title}:`, pdfError);
        // Continue with other products even if one fails
      }
    }

    if (processedPurchases.length === 0) {
      return res.status(400).json({ 
        message: 'No PDFs could be processed. Please check if PDF files exist.' 
      });
    }

    res.status(200).json({
      message: 'PDFs processed successfully',
      processedPurchases: processedPurchases,
      totalProcessed: processedPurchases.length
    });

  } catch (error) {
    console.error('Error processing PDFs:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}