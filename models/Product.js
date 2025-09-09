import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Judul produk harus diisi'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Deskripsi produk harus diisi'],
  },
  price: {
    type: Number,
    required: [true, 'Harga produk harus diisi'],
    min: [0, 'Harga tidak boleh negatif'],
  },
  category: {
    type: String,
    required: [true, 'Kategori harus diisi'],
    enum: ['national', 'traditional', 'religious'],
  },
  composer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Komposer harus diisi'],
  },
  score: {
    type: String,
    required: [true, 'File partitur harus diisi'],
  },
  pdfFile: {
    type: String,
    default: null,
  },
  preview: {
    type: String,
    required: [true, 'Preview partitur harus diisi'],
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stok tidak boleh negatif'],
  },
  sold: {
    type: Number,
    default: 0,
    min: [0, 'Jumlah terjual tidak boleh negatif'],
  },
  isDiscounted: {
    type: Boolean,
    default: false,
  },
  discountPrice: {
    type: Number,
    min: [0, 'Harga diskon tidak boleh negatif'],
  },
  coverImage: {
    type: String,
    default: null,
  },
  sampleImage: {
    type: String,
    default: null,
  },
  audioSample: {
    type: String,
    default: null,
  },
  duration: {
    type: String,
    default: null,
  },
  arrangement: {
    type: String,
    default: 'SATB',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);