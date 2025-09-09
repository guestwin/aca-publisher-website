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
      uploadDir: path.join(process.cwd(), 'public'),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const [fields, files] = await form.parse(req);
    const file = files.logo?.[0];

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
    const newFileName = `logo-${timestamp}${extension}`;
    const newFilePath = path.join(process.cwd(), 'public', newFileName);

    // Pindahkan file ke lokasi final
    fs.renameSync(file.filepath, newFilePath);

    // Hapus logo lama jika bukan logo default
    const oldLogoPath = fields.oldLogo?.[0];
    if (oldLogoPath && oldLogoPath !== '/piano-logo.svg' && oldLogoPath !== '/logo.svg') {
      const oldLogoFilePath = path.join(process.cwd(), 'public', oldLogoPath.replace('/', ''));
      if (fs.existsSync(oldLogoFilePath)) {
        fs.unlinkSync(oldLogoFilePath);
      }
    }

    // Return URL logo baru
    const logoUrl = `/${newFileName}`;
    
    res.status(200).json({ 
      success: true, 
      logoUrl,
      message: 'Logo uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}