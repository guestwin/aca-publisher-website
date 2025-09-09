# ACA Publisher Website

Website untuk ACA Publisher - platform penjualan partitur musik digital untuk paduan suara Indonesia.

## Features

- 🎵 Katalog partitur musik digital
- 🛒 Sistem keranjang belanja
- 💳 Proses checkout dan pembayaran
- 👨‍💼 Panel admin untuk manajemen produk
- 📁 Upload file PDF dan gambar
- 🎨 UI/UX yang modern dan responsif

## Tech Stack

- **Frontend**: Next.js 13, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB dengan Mongoose
- **Authentication**: JWT
- **File Upload**: Multer
- **Deployment**: Vercel

## Local Development

1. Clone repository
```bash
git clone <repository-url>
cd aca-pubweb
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local` dengan konfigurasi database dan secret keys.

4. Run development server
```bash
npm run dev
```

Website akan berjalan di `http://localhost:3000`

## Production Deployment

### 1. Database Setup (MongoDB Atlas)

1. Buat account di [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Buat cluster baru
3. Setup database user dan whitelist IP
4. Dapatkan connection string

### 2. Deploy ke Vercel

1. Push code ke GitHub repository
2. Connect repository ke [Vercel](https://vercel.com)
3. Setup environment variables di Vercel dashboard:
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `JWT_SECRET`: Random secret key untuk JWT
   - `JWT_EXPIRE`: 30d
   - `NEXTAUTH_URL`: https://your-domain.vercel.app
   - `NEXTAUTH_SECRET`: Random secret key untuk NextAuth
   - `NODE_ENV`: production

4. Deploy otomatis akan berjalan

### 3. Custom Domain (Optional)

1. Beli domain dari provider
2. Setup DNS records di Vercel
3. Update `NEXTAUTH_URL` dengan domain baru

## Project Structure

```
├── components/          # React components
├── context/            # React context providers
├── lib/                # Utility libraries
├── middleware/         # Authentication middleware
├── models/             # MongoDB models
├── pages/              # Next.js pages and API routes
│   ├── api/           # API endpoints
│   ├── admin/         # Admin panel pages
│   └── product/       # Product pages
├── public/             # Static assets
├── styles/             # CSS styles
└── uploads/            # Uploaded files
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `JWT_EXPIRE` | JWT token expiration | `30d` |
| `NEXTAUTH_URL` | Base URL of the application | `https://your-domain.com` |
| `NEXTAUTH_SECRET` | Secret key for NextAuth | `your-nextauth-secret` |
| `NODE_ENV` | Environment mode | `production` |

## Admin Panel

Akses admin panel di `/admin` untuk:
- Manajemen produk (tambah, edit, hapus)
- Upload file PDF dan gambar
- Manajemen komposer
- Laporan transaksi
- Pengaturan website

## API Endpoints

- `GET /api/products` - Daftar produk
- `POST /api/products` - Tambah produk baru
- `PUT /api/products/[id]` - Update produk
- `DELETE /api/products/[id]` - Hapus produk
- `POST /api/upload-pdf` - Upload file PDF
- `POST /api/upload-image` - Upload gambar

## License

Private - ACA Publisher