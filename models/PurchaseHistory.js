const mongoose = require('mongoose');

const purchaseHistorySchema = new mongoose.Schema({
  purchaseId: {
    type: String,
    required: true,
    unique: true
  },
  purchaseUUID: {
    type: String,
    required: true,
    unique: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  buyerName: {
    type: String,
    required: true
  },
  buyerEmail: {
    type: String,
    required: true
  },
  choirName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  pdfPath: {
    type: String,
    required: false // Will be set after PDF is generated
  },
  watermarkedPdfPath: {
    type: String,
    required: false // Will be set after watermarking
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveryMethod: {
    type: String,
    enum: ['email', 'whatsapp', 'both'],
    default: 'email'
  },
  deliveredAt: {
    type: Date
  },
  verificationUrl: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Generate unique purchase ID and UUID before saving
purchaseHistorySchema.pre('save', function(next) {
  if (!this.purchaseId) {
    // Generate 8-digit purchase ID
    this.purchaseId = Math.floor(10000000 + Math.random() * 90000000).toString();
  }
  
  if (!this.purchaseUUID) {
    // Generate UUID v4
    this.purchaseUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  if (!this.verificationUrl) {
    this.verificationUrl = `/sheet-music/eprint-purchase-history?ePrintPurchaseId=${this.purchaseId}&ePrintPurchaseUUID=${this.purchaseUUID}`;
  }
  
  next();
});

// Index for faster queries
purchaseHistorySchema.index({ purchaseId: 1, purchaseUUID: 1 });
purchaseHistorySchema.index({ transactionId: 1 });
purchaseHistorySchema.index({ buyerEmail: 1 });

module.exports = mongoose.models.PurchaseHistory || mongoose.model('PurchaseHistory', purchaseHistorySchema);