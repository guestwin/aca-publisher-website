import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User harus diisi']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Produk harus diisi']
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: [true, 'Transaksi harus diisi']
  },
  rating: {
    type: Number,
    required: [true, 'Rating harus diisi'],
    min: [1, 'Rating minimal 1'],
    max: [5, 'Rating maksimal 5']
  },
  comment: {
    type: String,
    required: [true, 'Komentar harus diisi'],
    maxlength: [1000, 'Komentar tidak boleh lebih dari 1000 karakter']
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return v.match(/\.(jpg|jpeg|png|gif)$/i);
      },
      message: 'Format gambar tidak valid'
    }
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      maxlength: [500, 'Balasan tidak boleh lebih dari 500 karakter']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Middleware untuk memperbarui rating produk setelah review disimpan
ReviewSchema.post('save', async function() {
  const Product = mongoose.models.Product;
  const product = await Product.findById(this.product);
  
  const reviews = await mongoose.models.Review.find({ 
    product: this.product,
    status: 'active'
  });
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
  
  product.rating = averageRating;
  await product.save();
});

// Middleware untuk memperbarui rating produk setelah review dihapus
ReviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && (doc.status === 'deleted' || doc.status === 'hidden')) {
    const Product = mongoose.models.Product;
    const product = await Product.findById(doc.product);
    
    const reviews = await mongoose.models.Review.find({ 
      product: doc.product,
      status: 'active'
    });
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    product.rating = averageRating;
    await product.save();
  }
});

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);