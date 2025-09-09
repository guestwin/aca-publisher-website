import { connectDB } from '../../../lib/db';
import Transaction from '../../../models/Transaction';
import { protect } from '../../../middleware/auth';

async function handler(req, res) {
  await connectDB();

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        const transaction = await Transaction.findById(id)
          .populate('user', 'name email')
          .populate('items.product', 'title price discountPrice');

        if (!transaction) {
          return res.status(404).json({
            success: false,
            message: 'Transaksi tidak ditemukan'
          });
        }

        // Pastikan user hanya bisa melihat transaksinya sendiri
        if (transaction.user._id.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Tidak memiliki akses'
          });
        }

        res.status(200).json({
          success: true,
          data: transaction
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat mengambil data transaksi',
          error: error.message
        });
      }
      break;

    case 'PUT':
      try {
        const transaction = await Transaction.findById(id);

        if (!transaction) {
          return res.status(404).json({
            success: false,
            message: 'Transaksi tidak ditemukan'
          });
        }

        // Pastikan user hanya bisa mengupdate transaksinya sendiri
        if (transaction.user.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Tidak memiliki akses'
          });
        }

        const { paymentProof, status } = req.body;

        // Update yang diizinkan berdasarkan status transaksi saat ini
        if (transaction.status === 'pending') {
          if (paymentProof) {
            transaction.paymentProof = paymentProof;
            transaction.status = 'paid';
            transaction.paymentConfirmedAt = new Date();
          }
        } else if (transaction.status === 'paid' && req.user.role === 'admin') {
          if (status === 'completed') {
            transaction.status = status;
            transaction.completedAt = new Date();
          } else if (status === 'cancelled') {
            transaction.status = status;
          }
        }

        await transaction.save();
        await transaction.populate('user', 'name email');
        await transaction.populate('items.product', 'title price discountPrice');

        res.status(200).json({
          success: true,
          data: transaction
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat mengupdate transaksi',
          error: error.message
        });
      }
      break;

    case 'DELETE':
      try {
        const transaction = await Transaction.findById(id);

        if (!transaction) {
          return res.status(404).json({
            success: false,
            message: 'Transaksi tidak ditemukan'
          });
        }

        // Hanya admin yang bisa menghapus transaksi
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Tidak memiliki akses'
          });
        }

        await transaction.remove();

        res.status(200).json({
          success: true,
          message: 'Transaksi berhasil dihapus'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat menghapus transaksi',
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