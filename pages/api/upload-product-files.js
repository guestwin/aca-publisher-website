import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    
    // Tentukan folder berdasarkan jenis file
    if (file.fieldname === 'pdfFile') {
      uploadPath = './public/products/pdf';
    } else if (file.fieldname === 'coverImage') {
      uploadPath = './public/products/covers';
    } else if (file.fieldname === 'sampleImage') {
      uploadPath = './public/products/samples';
    } else {
      uploadPath = './public/products/misc';
    }
    
    // Buat folder jika belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate nama file unik
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filter file berdasarkan jenis
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'pdfFile') {
    // Hanya terima file PDF
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Hanya file PDF yang diperbolehkan untuk karya!'), false);
    }
  } else if (file.fieldname === 'coverImage' || file.fieldname === 'sampleImage') {
    // Hanya terima file gambar
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan untuk cover dan sample!'), false);
    }
  } else {
    cb(new Error('Field file tidak dikenal!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB untuk PDF
  }
});

// Middleware untuk handle multiple fields
const uploadFields = upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'sampleImage', maxCount: 1 }
]);

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diperbolehkan' });
  }

  uploadFields(req, res, function (err) {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const uploadedFiles = {};
      
      // Process uploaded files
      if (req.files) {
        if (req.files.pdfFile && req.files.pdfFile[0]) {
          uploadedFiles.pdfUrl = `/products/pdf/${req.files.pdfFile[0].filename}`;
        }
        
        if (req.files.coverImage && req.files.coverImage[0]) {
          uploadedFiles.coverUrl = `/products/covers/${req.files.coverImage[0].filename}`;
        }
        
        if (req.files.sampleImage && req.files.sampleImage[0]) {
          uploadedFiles.sampleUrl = `/products/samples/${req.files.sampleImage[0].filename}`;
        }
      }
      
      if (Object.keys(uploadedFiles).length === 0) {
        return res.status(400).json({ error: 'Tidak ada file yang diupload' });
      }
      
      res.status(200).json({
        message: 'File berhasil diupload',
        files: uploadedFiles
      });
      
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};