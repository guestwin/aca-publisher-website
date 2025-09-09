# Deployment Guide - ACA Publisher Website

Panduan lengkap untuk deploy website ACA Publisher ke production.

## Prerequisites

- [x] Build production berhasil (`npm run build`)
- [ ] GitHub repository
- [ ] MongoDB Atlas account
- [ ] Vercel account

## Step 1: Setup Database Production (MongoDB Atlas)

### 1.1 Buat MongoDB Atlas Cluster

1. Kunjungi [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Buat account atau login
3. Klik "Build a Database"
4. Pilih "Shared" (Free tier)
5. Pilih region terdekat (Singapore untuk Indonesia)
6. Beri nama cluster: `aca-pubweb-prod`

### 1.2 Setup Database User

1. Di Atlas dashboard, klik "Database Access"
2. Klik "Add New Database User"
3. Pilih "Password" authentication
4. Username: `aca-admin`
5. Generate secure password (simpan untuk nanti)
6. Database User Privileges: "Read and write to any database"
7. Klik "Add User"

### 1.3 Setup Network Access

1. Klik "Network Access"
2. Klik "Add IP Address"
3. Pilih "Allow access from anywhere" (0.0.0.0/0)
4. Klik "Confirm"

### 1.4 Get Connection String

1. Klik "Database" → "Connect"
2. Pilih "Connect your application"
3. Driver: Node.js, Version: 4.1 or later
4. Copy connection string:
   ```
   mongodb+srv://aca-admin:<password>@aca-pubweb-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Ganti `<password>` dengan password user yang dibuat
6. Tambahkan nama database di akhir: `/aca-pubweb`

**Final connection string:**
```
mongodb+srv://aca-admin:YOUR_PASSWORD@aca-pubweb-prod.xxxxx.mongodb.net/aca-pubweb?retryWrites=true&w=majority
```

## Step 2: Setup GitHub Repository

### 2.1 Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit - ACA Publisher Website"
```

### 2.2 Create GitHub Repository

1. Kunjungi [GitHub](https://github.com)
2. Klik "New repository"
3. Repository name: `aca-publisher-website`
4. Description: "ACA Publisher - Platform penjualan partitur musik digital"
5. Set to Public atau Private
6. Jangan centang "Add README" (sudah ada)
7. Klik "Create repository"

### 2.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/aca-publisher-website.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy ke Vercel

### 3.1 Connect Repository

1. Kunjungi [Vercel](https://vercel.com)
2. Login dengan GitHub account
3. Klik "New Project"
4. Import repository `aca-publisher-website`
5. Framework Preset: Next.js
6. Root Directory: `./`
7. Jangan deploy dulu, klik "Configure Project"

### 3.2 Setup Environment Variables

Di Vercel dashboard, tambahkan environment variables:

| Name | Value | Notes |
|------|-------|-------|
| `MONGODB_URI` | `mongodb+srv://aca-admin:...` | Connection string dari Atlas |
| `JWT_SECRET` | `your-super-secret-jwt-key-production-2024` | Generate random 32+ chars |
| `JWT_EXPIRE` | `30d` | Token expiration |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Will be updated after deploy |
| `NEXTAUTH_SECRET` | `your-nextauth-secret-production-2024` | Generate random 32+ chars |
| `NODE_ENV` | `production` | Environment mode |

**Generate secure secrets:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 Deploy

1. Klik "Deploy"
2. Tunggu proses deployment (2-5 menit)
3. Setelah selesai, dapatkan URL deployment
4. Update `NEXTAUTH_URL` dengan URL yang didapat

## Step 4: Post-Deployment Setup

### 4.1 Update NEXTAUTH_URL

1. Di Vercel dashboard → Settings → Environment Variables
2. Edit `NEXTAUTH_URL`
3. Ganti dengan URL production: `https://your-app.vercel.app`
4. Redeploy aplikasi

### 4.2 Test Website

1. Buka URL production
2. Test fitur utama:
   - [ ] Landing page loading
   - [ ] Product listing
   - [ ] Product detail
   - [ ] Admin login (`/admin`)
   - [ ] Add product dengan file upload
   - [ ] Cart functionality

### 4.3 Setup Admin User

1. Akses `/admin` di production
2. Buat admin user pertama
3. Test upload file PDF dan gambar
4. Pastikan file tersimpan dengan benar

## Step 5: Custom Domain (Optional)

### 5.1 Beli Domain

1. Beli domain dari provider (Namecheap, GoDaddy, dll)
2. Contoh: `acapublisher.com`

### 5.2 Setup di Vercel

1. Di Vercel dashboard → Settings → Domains
2. Klik "Add Domain"
3. Masukkan domain: `acapublisher.com`
4. Ikuti instruksi DNS setup

### 5.3 Update DNS Records

Di domain provider, tambahkan records:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.61
```

### 5.4 Update Environment Variables

1. Update `NEXTAUTH_URL` ke `https://acapublisher.com`
2. Redeploy aplikasi

## Step 6: Monitoring & Maintenance

### 6.1 Setup Monitoring

1. Monitor di Vercel Analytics
2. Setup error tracking (Sentry - optional)
3. Monitor database usage di MongoDB Atlas

### 6.2 Backup Strategy

1. MongoDB Atlas automatic backups (enabled by default)
2. Regular code backups via Git
3. Export important data periodically

### 6.3 Updates

```bash
# Update code
git add .
git commit -m "Update: description"
git push origin main

# Vercel will auto-deploy
```

## Troubleshooting

### Common Issues

1. **Build Failed**
   - Check build logs di Vercel
   - Pastikan semua dependencies terinstall
   - Test `npm run build` locally

2. **Database Connection Error**
   - Verify MongoDB connection string
   - Check network access settings
   - Verify database user credentials

3. **File Upload Not Working**
   - Check API routes di production
   - Verify file size limits
   - Check Vercel function limits

4. **Environment Variables**
   - Verify all required env vars set
   - Check for typos in variable names
   - Redeploy after env var changes

### Support

Jika ada masalah:
1. Check Vercel deployment logs
2. Check MongoDB Atlas logs
3. Test locally dengan production env vars
4. Contact support jika diperlukan

---

**Deployment Checklist:**

- [ ] MongoDB Atlas cluster setup
- [ ] Database user created
- [ ] Network access configured
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Initial deployment successful
- [ ] NEXTAUTH_URL updated
- [ ] Website tested in production
- [ ] Admin panel tested
- [ ] File upload tested
- [ ] Custom domain setup (optional)
- [ ] Monitoring setup

**Website akan online di:** `https://your-app.vercel.app`