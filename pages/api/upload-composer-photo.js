import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public', 'composers'),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    // Create composers directory if it doesn't exist
    const composersDir = path.join(process.cwd(), 'public', 'composers');
    if (!fs.existsSync(composersDir)) {
      fs.mkdirSync(composersDir, { recursive: true });
    }

    const [fields, files] = await form.parse(req);
    const file = files.photo?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      // Hapus file yang tidak valid
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed.' });
    }

    // Generate nama file baru
    const timestamp = Date.now();
    const extension = path.extname(file.originalFilename || file.newFilename);
    const newFileName = `composer-${timestamp}${extension}`;
    const newFilePath = path.join(composersDir, newFileName);

    // Pindahkan file ke lokasi final
    fs.renameSync(file.filepath, newFilePath);

    // Hapus foto lama jika ada
    const oldPhotoPath = fields.oldPhoto?.[0];
    if (oldPhotoPath && oldPhotoPath.startsWith('/composers/')) {
      const oldPhotoFilePath = path.join(process.cwd(), 'public', oldPhotoPath);
      if (fs.existsSync(oldPhotoFilePath)) {
        fs.unlinkSync(oldPhotoFilePath);
      }
    }

    // Return URL foto baru
    const photoUrl = `/composers/${newFileName}`;
    
    res.status(200).json({ 
      success: true, 
      photoUrl,
      message: 'Photo uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}