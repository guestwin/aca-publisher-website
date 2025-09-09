import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Tidak wajib untuk guest checkout
  },
  buyerName: {
    type: String,
    required: [true, 'Nama pembeli harus diisi'],
    trim: true
  },
  buyerEmail: {
    type: String,
    required: [true, 'Email pembeli harus diisi'],
    trim: true,
    lowercase: true
  },
  buyerPhone: {
    type: String,
    required: [true, 'Nomor telepon pembeli harus diisi'],
    trim: true
  },
  choirName: {
    type: String,
    required: [true, 'Nama paduan suara harus diisi'],
    trim: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Produk harus diisi']
    },
    title: {
      type: String,
      required: true
    },
    arrangement: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: [true, 'Jumlah harus diisi'],
      min: [1, 'Jumlah minimal 1']
    },
    price: {
      type: Number,
      required: [true, 'Harga harus diisi']
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total harga harus diisi']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Metode pembayaran harus diisi'],
    enum: ['bank_transfer', 'qris', 'virtual_account']
  },
  paymentDetails: {
    bankName: String,
    accountNumber: String,
    accountHolder: String,
    qrCode: String,
    virtualAccount: String
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentProof: {
    type: String
  },
  paymentConfirmedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Catatan tidak boleh lebih dari 500 karakter']
  },
  invoiceNumber: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Generate invoice number before saving
TransactionSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await mongoose.models.Transaction.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    this.invoiceNumber = `INV/${year}${month}/${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);