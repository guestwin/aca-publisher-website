import connectDB from '../../../lib/db';
import Product from '../../../models/Product';
import { protect, authorize } from '../../../middleware/auth';

const handler = async (req, res) => {
  await connectDB();

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        const product = await Product.findById(id).populate('composer', 'name');

        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Produk tidak ditemukan'
          });
        }

        res.status(200).json({
          success: true,
          data: product
        });
      } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
          success: false,
          message: 'Error saat mengambil data produk'
        });
      }
      break;

    case 'PUT':
      try {
        await protect(req, res, async () => {
          await authorize('admin', 'composer')(req, res, async () => {
            let product = await Product.findById(id);

            if (!product) {
              return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan'
              });
            }

            // Cek kepemilikan produk untuk composer
            if (req.user.role === 'composer' && product.composer.toString() !== req.user.id) {
              return res.status(403).json({
                success: false,
                message: 'Tidak diizinkan mengubah produk ini'
              });
            }

            product = await Product.findByIdAndUpdate(
              id,
              { ...req.body },
              { new: true, runValidators: true }
            );

            res.status(200).json({
              success: true,
              data: product
            });
          });
        });
      } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
          success: false,
          message: 'Error saat mengupdate produk'
        });
      }
      break;

    case 'DELETE':
      try {
        await protect(req, res, async () => {
          await authorize('admin', 'composer')(req, res, async () => {
            const product = await Product.findById(id);

            if (!product) {
              return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan'
              });
            }

            // Cek kepemilikan produk untuk composer
            if (req.user.role === 'composer' && product.composer.toString() !== req.user.id) {
              return res.status(403).json({
                success: false,
                message: 'Tidak diizinkan menghapus produk ini'
              });
            }

            await product.remove();

            res.status(200).json({
              success: true,
              message: 'Produk berhasil dihapus'
            });
          });
        });
      } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
          success: false,
          message: 'Error saat menghapus produk'
        });
      }
      break;

    default:
      res.status(405).json({
        success: false,
        message: 'Method tidak diizinkan'
      });
  }
};

export default handler;