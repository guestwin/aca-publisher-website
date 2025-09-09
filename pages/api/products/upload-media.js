import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { connectDB } from '../../../lib/db';
import Product from '../../../models/Product';

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = file.fieldname === 'coverImage' 
      ? './public/covers' 
      : './public/samples';
    
    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filter file berdasarkan tipe
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'coverImage') {
    // Hanya terima file gambar
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan untuk cover'), false);
    }
  } else if (file.fieldname === 'audioSample') {
    // Hanya terima file audio
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file audio yang diperbolehkan untuk sample'), false);
    }
  } else {
    cb(new Error('Field tidak dikenal'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware untuk handle multiple fields
const uploadFields = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'audioSample', maxCount: 1 }
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Handle upload dengan promise wrapper
    await new Promise((resolve, reject) => {
      uploadFields(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID diperlukan' });
    }

    // Cari produk
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    // Update produk dengan file yang diupload
    const updateData = {};
    
    if (req.files.coverImage) {
      const coverPath = `/covers/${req.files.coverImage[0].filename}`;
      updateData.coverImage = coverPath;
      
      // Hapus cover lama jika ada
      if (product.coverImage && product.coverImage !== '/piano-logo.svg') {
        const oldCoverPath = path.join('./public', product.coverImage);
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath);
        }
      }
    }
    
    if (req.files.audioSample) {
      const samplePath = `/samples/${req.files.audioSample[0].filename}`;
      updateData.audioSample = samplePath;
      
      // Hapus sample lama jika ada
      if (product.audioSample) {
        const oldSamplePath = path.join('./public', product.audioSample);
        if (fs.existsSync(oldSamplePath)) {
          fs.unlinkSync(oldSamplePath);
        }
      }
    }

    // Update produk
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    res.status(200).json({
      message: 'File berhasil diupload',
      product: updatedProduct,
      uploadedFiles: {
        coverImage: req.files.coverImage ? updateData.coverImage : null,
        audioSample: req.files.audioSample ? updateData.audioSample : null
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Gagal mengupload file',
      error: error.message 
    });
  }
}

// Konfigurasi Next.js untuk handle file upload
export const config = {
  api: {
    bodyParser: false,
  },
};