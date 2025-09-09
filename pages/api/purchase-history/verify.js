import dbConnect from '../../../lib/db';
import PurchaseHistory from '../../../models/PurchaseHistory';
import Product from '../../../models/Product';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { purchaseId, purchaseUUID } = req.query;

    if (!purchaseId || !purchaseUUID) {
      return res.status(400).json({ message: 'Purchase ID and UUID are required' });
    }

    // Find purchase history with populated product data
    const purchaseHistory = await PurchaseHistory.findOne({
      purchaseId: purchaseId,
      purchaseUUID: purchaseUUID
    }).populate('productId', 'title composer arrangement category price');

    if (!purchaseHistory) {
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    // Return purchase data
    const responseData = {
      purchaseId: purchaseHistory.purchaseId,
      purchaseUUID: purchaseHistory.purchaseUUID,
      transactionId: purchaseHistory.transactionId,
      buyerName: purchaseHistory.buyerName,
      buyerEmail: purchaseHistory.buyerEmail,
      choirName: purchaseHistory.choirName,
      quantity: purchaseHistory.quantity,
      purchaseDate: purchaseHistory.purchaseDate,
      isDelivered: purchaseHistory.isDelivered,
      deliveredAt: purchaseHistory.deliveredAt,
      product: {
        _id: purchaseHistory.productId._id,
        title: purchaseHistory.productId.title,
        composer: purchaseHistory.productId.composer,
        arrangement: purchaseHistory.productId.arrangement,
        category: purchaseHistory.productId.category,
        price: purchaseHistory.productId.price
      }
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error verifying purchase:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}