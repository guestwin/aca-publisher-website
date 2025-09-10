# Panduan Deployment Production - www.acapublisher.com

Panduan lengkap untuk deploy ACA Publisher Website ke production dengan domain www.acapublisher.com

## 🚀 Langkah-Langkah Deployment

### 1. Setup MongoDB Atlas (Production Database)

#### 1.1 Buat MongoDB Atlas Cluster
1. Kunjungi [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Buat account atau login
3. Klik "Build a Database"
4. Pilih "M0 Sandbox" (Free tier) atau "M10" untuk production
5. Pilih region: **Singapore** (terdekat dengan Indonesia)
6. Nama cluster: `aca-publisher-prod`

#### 1.2 Setup Database User
1. Database Access → Add New Database User
2. Username: `aca-admin`
3. Password: Generate secure password (simpan!)
4. Database User Privileges: "Atlas admin"

#### 1.3 Network Access
1. Network Access → Add IP Address
2. Pilih "Allow access from anywhere" (0.0.0.0/0)
3. Atau tambahkan IP Vercel jika ingin lebih secure

#### 1.4 Connection String
```
mongodb+srv://aca-admin:YOUR_PASSWORD@aca-publisher-prod.xxxxx.mongodb.net/aca-publisher?retryWrites=true&w=majority
```

### 2. Deploy ke Vercel

#### 2.1 Import Project ke Vercel
1. Kunjungi [Vercel](https://vercel.com)
2. Login dengan GitHub
3. New Project → Import `guestwin/aca-publisher-website`
4. Framework: Next.js
5. **JANGAN deploy dulu** - Setup environment variables dulu

#### 2.2 Environment Variables
Tambahkan di Vercel → Settings → Environment Variables:

```bash
# Database
MONGODB_URI=mongodb+srv://aca-admin:YOUR_PASSWORD@aca-publisher-prod.xxxxx.mongodb.net/aca-publisher?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-production-2024-32chars
JWT_EXPIRE=30d

# NextAuth Configuration
NEXTAUTH_URL=https://www.acapublisher.com
NEXTAUTH_SECRET=your-nextauth-secret-production-2024-32chars

# Environment
NODE_ENV=production

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Gateway (Akan disetup nanti)
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=true
```

**Generate Secure Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2.3 Deploy
1. Klik "Deploy"
2. Tunggu build selesai (3-5 menit)
3. Catat URL deployment: `https://aca-publisher-website-xxx.vercel.app`

### 3. Setup Custom Domain (www.acapublisher.com)

#### 3.1 Beli Domain
1. Beli domain `acapublisher.com` dari:
   - Namecheap (Recommended)
   - GoDaddy
   - Niagahoster (Indonesia)
   - Cloudflare Registrar

#### 3.2 Setup di Vercel
1. Vercel Dashboard → Settings → Domains
2. Add Domain: `acapublisher.com`
3. Add Domain: `www.acapublisher.com`
4. Vercel akan memberikan DNS records

#### 3.3 Configure DNS
Di domain provider, tambahkan records:

```
# Root domain
Type: A
Name: @
Value: 76.76.19.61

# WWW subdomain
Type: CNAME
Name: www
Value: cname.vercel-dns.com

# Optional: Email records
Type: MX
Name: @
Value: 10 mail.acapublisher.com
```

#### 3.4 Update Environment Variables
1. Update `NEXTAUTH_URL` ke `https://www.acapublisher.com`
2. Redeploy aplikasi

### 4. Setup Payment Gateway (Midtrans)

#### 4.1 Daftar Midtrans
1. Kunjungi [Midtrans](https://midtrans.com)
2. Daftar akun merchant
3. Verifikasi dokumen bisnis
4. Dapatkan Server Key dan Client Key

#### 4.2 Konfigurasi Payment
1. Tambahkan environment variables Midtrans
2. Setup webhook URL: `https://www.acapublisher.com/api/payment/webhook`
3. Test payment di sandbox mode dulu

### 5. Optimasi Performance

#### 5.1 CDN dan Caching
- Vercel sudah include CDN global
- Setup Redis untuk caching (optional):
  ```bash
  REDIS_URL=redis://your-redis-instance
  ```

#### 5.2 Image Optimization
- Gunakan Vercel Image Optimization (sudah aktif)
- Compress images sebelum upload
- Setup WebP format

#### 5.3 Database Optimization
```bash
# Jalankan script optimasi
node scripts/optimizeDatabase.js optimize
```

### 6. Security Setup

#### 6.1 SSL Certificate
- Vercel otomatis provide SSL certificate
- Pastikan HTTPS redirect aktif

#### 6.2 Security Headers
- Sudah dikonfigurasi di `next.config.js`
- CORS policy untuk API
- Rate limiting untuk API endpoints

#### 6.3 Environment Security
- Jangan commit `.env` files
- Gunakan Vercel environment variables
- Regular rotate secrets

### 7. Monitoring dan Analytics

#### 7.1 Vercel Analytics
1. Enable di Vercel Dashboard
2. Monitor performance metrics
3. Track user behavior

#### 7.2 Error Monitoring
```bash
# Optional: Setup Sentry
SENTRY_DSN=your-sentry-dsn
```

#### 7.3 Database Monitoring
- MongoDB Atlas built-in monitoring
- Setup alerts untuk usage
- Monitor connection pool

### 8. Testing Production

#### 8.1 Functional Testing
- [ ] Homepage loading
- [ ] Product catalog
- [ ] Product detail pages
- [ ] User registration/login
- [ ] Composer dashboard
- [ ] Admin panel
- [ ] File upload (PDF, images)
- [ ] Cart functionality
- [ ] Checkout process
- [ ] Payment integration
- [ ] Email notifications

#### 8.2 Performance Testing
- [ ] Page load speed < 3 seconds
- [ ] Mobile responsiveness
- [ ] SEO optimization
- [ ] Image optimization
- [ ] API response time

#### 8.3 Security Testing
- [ ] HTTPS enforcement
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting

### 9. Go Live Checklist

#### Pre-Launch
- [ ] MongoDB Atlas production ready
- [ ] All environment variables set
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] Payment gateway configured
- [ ] Admin user created
- [ ] Test data populated
- [ ] Backup strategy implemented

#### Launch Day
- [ ] Final deployment
- [ ] DNS propagation check
- [ ] Full functionality test
- [ ] Performance monitoring active
- [ ] Error tracking active
- [ ] Customer support ready

#### Post-Launch
- [ ] Monitor error logs
- [ ] Check payment transactions
- [ ] Monitor database performance
- [ ] User feedback collection
- [ ] SEO indexing verification

### 10. Maintenance

#### Daily
- Monitor error logs
- Check payment transactions
- Database performance

#### Weekly
- Security updates
- Performance optimization
- Backup verification

#### Monthly
- Dependency updates
- Security audit
- Performance review
- Cost optimization

---

## 🔧 Troubleshooting

### Common Issues

1. **Build Failed**
   ```bash
   # Check locally
   npm run build
   # Fix errors and redeploy
   ```

2. **Database Connection Error**
   - Verify MongoDB URI
   - Check network access
   - Verify credentials

3. **Domain Not Working**
   - Check DNS propagation: `nslookup acapublisher.com`
   - Verify DNS records
   - Wait 24-48 hours for full propagation

4. **Payment Issues**
   - Check Midtrans configuration
   - Verify webhook URL
   - Test in sandbox mode

### Support Contacts
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- MongoDB Atlas: [support.mongodb.com](https://support.mongodb.com)
- Midtrans: [support.midtrans.com](https://support.midtrans.com)

---

## 📊 Expected Results

**Website akan online di:**
- Primary: `https://www.acapublisher.com`
- Backup: `https://acapublisher.com`

**Performance Targets:**
- Page load: < 3 seconds
- Uptime: > 99.9%
- Mobile score: > 90
- SEO score: > 85

**Features Ready:**
- ✅ E-commerce functionality
- ✅ Payment processing
- ✅ User management
- ✅ Admin panel
- ✅ File management
- ✅ SEO optimization
- ✅ Mobile responsive
- ✅ Security features

---

**Total Estimated Time:** 1-2 hari (tergantung DNS propagation)
**Estimated Cost:** $0-50/bulan (tergantung traffic dan storage)