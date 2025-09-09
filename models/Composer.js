import mongoose from 'mongoose';

const ComposerSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: [true, 'Nama komposer harus diisi'],
    trim: true,
    maxlength: [100, 'Nama tidak boleh lebih dari 100 karakter']
  },
  foto: {
    type: String,
    default: '/composers/default-composer.jpg'
  },
  spesialisasi: {
    type: String,
    required: [true, 'Spesialisasi harus diisi'],
    trim: true,
    maxlength: [100, 'Spesialisasi tidak boleh lebih dari 100 karakter']
  },
  biografi: {
    type: String,
    required: [true, 'Biografi harus diisi'],
    trim: true,
    maxlength: [2000, 'Biografi tidak boleh lebih dari 2000 karakter']
  },
  pendidikan: {
    type: String,
    trim: true,
    maxlength: [500, 'Pendidikan tidak boleh lebih dari 500 karakter']
  },
  prestasi: [{
    type: String,
    trim: true,
    maxlength: [200, 'Prestasi tidak boleh lebih dari 200 karakter']
  }],
  karya: {
    type: Number,
    default: 0,
    min: [0, 'Jumlah karya tidak boleh negatif']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid']
  },
  website: {
    type: String,
    trim: true
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
ComposerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
ComposerSchema.index({ nama: 1 });
ComposerSchema.index({ spesialisasi: 1 });
ComposerSchema.index({ status: 1 });

export default mongoose.models.Composer || mongoose.model('Composer', ComposerSchema);