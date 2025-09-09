import { connectDB } from '../../../lib/db';
import Review from '../../../models/Review';
import { protect } from '../../../middleware/auth';

async function handler(req, res) {
  await connectDB();

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        const review = await Review.findById(id)
          .populate('user', 'name avatar')
          .populate('product', 'title')
          .populate('replies.user', 'name avatar');

        if (!review || review.status === 'deleted') {
          return res.status(404).json({
            success: false,
            message: 'Ulasan tidak ditemukan'
          });
        }

        res.status(200).json({
          success: true,
          data: review
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat mengambil data ulasan',
          error: error.message
        });
      }
      break;

    case 'PUT':
      try {
        const review = await Review.findById(id);

        if (!review || review.status === 'deleted') {
          return res.status(404).json({
            success: false,
            message: 'Ulasan tidak ditemukan'
          });
        }

        // Pastikan hanya pemilik ulasan yang bisa edit
        if (review.user.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Tidak memiliki akses'
          });
        }

        const { rating, comment, images } = req.body;

        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        if (images) review.images = images;
        review.isEdited = true;

        await review.save();
        await review.populate('user', 'name avatar');
        await review.populate('product', 'title');
        await review.populate('replies.user', 'name avatar');

        res.status(200).json({
          success: true,
          data: review
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat mengupdate ulasan',
          error: error.message
        });
      }
      break;

    case 'DELETE':
      try {
        const review = await Review.findById(id);

        if (!review || review.status === 'deleted') {
          return res.status(404).json({
            success: false,
            message: 'Ulasan tidak ditemukan'
          });
        }

        // Hanya pemilik ulasan atau admin yang bisa menghapus
        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Tidak memiliki akses'
          });
        }

        review.status = 'deleted';
        await review.save();

        res.status(200).json({
          success: true,
          message: 'Ulasan berhasil dihapus'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat menghapus ulasan',
          error: error.message
        });
      }
      break;

    case 'POST':
      try {
        const review = await Review.findById(id);

        if (!review || review.status === 'deleted') {
          return res.status(404).json({
            success: false,
            message: 'Ulasan tidak ditemukan'
          });
        }

        const { action, comment } = req.body;

        switch (action) {
          case 'like':
            const userLiked = review.likes.includes(req.user._id);
            if (userLiked) {
              review.likes = review.likes.filter(
                userId => userId.toString() !== req.user._id.toString()
              );
            } else {
              review.likes.push(req.user._id);
            }
            break;

          case 'reply':
            if (!comment) {
              return res.status(400).json({
                success: false,
                message: 'Komentar harus diisi'
              });
            }
            review.replies.push({
              user: req.user._id,
              comment
            });
            break;

          default:
            return res.status(400).json({
              success: false,
              message: 'Action tidak valid'
            });
        }

        await review.save();
        await review.populate('user', 'name avatar');
        await review.populate('product', 'title');
        await review.populate('replies.user', 'name avatar');

        res.status(200).json({
          success: true,
          data: review
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat memproses aksi',
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