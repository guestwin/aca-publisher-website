import { connectDB } from '../../../lib/db';
import Review from '../../../models/Review';
import Transaction from '../../../models/Transaction';
import { protect } from '../../../middleware/auth';

async function handler(req, res) {
  await connectDB();

  switch (req.method) {
    case 'GET':
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const productId = req.query.product;
        const rating = parseInt(req.query.rating);
        const verifiedOnly = req.query.verifiedOnly === 'true';

        let query = { status: 'active' };

        if (productId) {
          query.product = productId;
        }

        if (rating) {
          query.rating = rating;
        }

        if (verifiedOnly) {
          query.isVerifiedPurchase = true;
        }

        const skip = (page - 1) * limit;

        const reviews = await Review.find(query)
          .populate('user', 'name avatar')
          .populate('product', 'title')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        const total = await Review.countDocuments(query);

        res.status(200).json({
          success: true,
          data: reviews,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat mengambil data ulasan',
          error: error.message
        });
      }
      break;

    case 'POST':
      try {
        const { productId, transactionId, rating, comment, images } = req.body;

        // Verifikasi transaksi
        const transaction = await Transaction.findById(transactionId);
        if (!transaction || transaction.user.toString() !== req.user._id.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Transaksi tidak valid'
          });
        }

        // Verifikasi produk ada dalam transaksi
        const productInTransaction = transaction.items.some(
          item => item.product.toString() === productId
        );
        if (!productInTransaction) {
          return res.status(400).json({
            success: false,
            message: 'Produk tidak ada dalam transaksi'
          });
        }

        // Cek apakah sudah pernah review
        const existingReview = await Review.findOne({
          user: req.user._id,
          product: productId,
          transaction: transactionId
        });

        if (existingReview) {
          return res.status(400).json({
            success: false,
            message: 'Anda sudah memberikan ulasan untuk produk ini'
          });
        }

        const review = await Review.create({
          user: req.user._id,
          product: productId,
          transaction: transactionId,
          rating,
          comment,
          images: images || [],
          isVerifiedPurchase: true
        });

        await review.populate('user', 'name avatar');
        await review.populate('product', 'title');

        res.status(201).json({
          success: true,
          data: review
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat membuat ulasan',
          error: error.message
        });
      }
      break;

    default:
      res.status(405).json({
        success: false,
        message: `Method ${req.method} tidak diizinkan`
      });
  }
}

export default protect(handler);