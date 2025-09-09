import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama harus diisi'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email harus diisi'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Format nomor telepon tidak valid'],
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password tidak wajib jika login dengan Google
    },
    minlength: [8, 'Password minimal 8 karakter'],
    select: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Memungkinkan null values yang unique
  },
  role: {
    type: String,
    enum: ['user', 'composer', 'admin'],
    default: 'user',
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio tidak boleh lebih dari 500 karakter'],
  },
  specialization: {
    type: String,
    enum: ['traditional', 'religious', 'national', 'contemporary', 'classical', 'pop', 'jazz', 'other'],
  },
  avatar: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true,
    },
    whatsapp: {
      type: Boolean,
      default: false,
    },
  },
  verificationToken: String,
  phoneVerificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
}, {
  timestamps: true,
});

// Hash password sebelum disimpan
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method untuk verifikasi password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method untuk mengecek apakah akun terkunci
UserSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Method untuk menambah percobaan login
UserSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    await this.updateOne({
      $set: {
        loginAttempts: 1,
        lockUntil: null
      }
    });
    return;
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // Kunci selama 2 jam
    };
  }
  await this.updateOne(updates);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);