import connectDB from '../../../lib/db';
import Product from '../../../models/Product';
import { protect, authorize } from '../../../middleware/auth';

const handler = async (req, res) => {
  await connectDB();

  switch (req.method) {
    case 'GET':
      try {
        const { category, composer, search, sort = '-createdAt', page = 1, limit = 10 } = req.query;

        // Buat query filter
        const query = {};
        if (category) query.category = category;
        if (composer) query.composer = composer;
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }

        // Hitung total dokumen
        const total = await Product.countDocuments(query);

        // Ambil produk dengan pagination
        const products = await Product.find(query)
          .populate('composer', 'name')
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(parseInt(limit));

        res.status(200).json({
          success: true,
          data: products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
          success: false,
          message: 'Error saat mengambil data produk'
        });
      }
      break;

    case 'POST':
      try {
        // Validasi token dan role
        await protect(req, res, async () => {
          await authorize('admin', 'composer')(req, res, async () => {
            const { title, description, price, category, score, preview } = req.body;

            // Validasi input
            if (!title || !description || !price || !category || !score || !preview) {
              return res.status(400).json({
                success: false,
                message: 'Semua field harus diisi'
              });
            }

            // Buat produk baru
            const product = await Product.create({
              ...req.body,
              composer: req.user.id
            });

            res.status(201).json({
              success: true,
              data: product
            });
          });
        });
      } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
          success: false,
          message: 'Error saat membuat produk'
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