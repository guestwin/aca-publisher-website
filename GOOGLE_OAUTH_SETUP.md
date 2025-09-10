# Setup Google OAuth untuk ACA Publisher

Panduan lengkap untuk mengkonfigurasi Google OAuth authentication.

## 1. Membuat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik "Select a project" → "New Project"
3. Masukkan nama project: `ACA Publisher`
4. Klik "Create"

## 2. Mengaktifkan Google+ API

1. Di Google Cloud Console, buka "APIs & Services" → "Library"
2. Cari "Google+ API" atau "People API"
3. Klik dan pilih "Enable"

## 3. Membuat OAuth 2.0 Credentials

1. Buka "APIs & Services" → "Credentials"
2. Klik "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Jika diminta, konfigurasi OAuth consent screen terlebih dahulu:
   - User Type: External
   - App name: `ACA Publisher`
   - User support email: email Anda
   - Developer contact: email Anda
   - Scopes: tambahkan `email`, `profile`, `openid`

## 4. Konfigurasi OAuth Client ID

1. Application type: **Web application**
2. Name: `ACA Publisher Web Client`
3. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://yourdomain.com (untuk production)
   ```
4. Authorized redirect URIs:
   ```
   http://localhost:3000/auth
   https://yourdomain.com/auth (untuk production)
   ```
5. Klik "Create"

## 5. Menyalin Credentials

Setelah membuat OAuth client, Anda akan mendapatkan:
- **Client ID**: `xxxxx.apps.googleusercontent.com`
- **Client Secret**: `xxxxx`

## 6. Update Environment Variables

Buka file `.env.local` dan ganti placeholder dengan credentials yang sebenarnya:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

## 7. Testing

1. Restart development server:
   ```bash
   npm run dev
   ```
2. Buka `http://localhost:3000/auth`
3. Klik tombol "Daftar dengan Google" atau "Masuk dengan Google"
4. Verifikasi bahwa popup Google OAuth muncul
5. Setelah login berhasil, periksa database untuk memastikan user tersimpan

## Troubleshooting

### Error: "This app isn't verified"
- Ini normal untuk development
- Klik "Advanced" → "Go to ACA Publisher (unsafe)"
- Untuk production, submit app untuk verification

### Error: "redirect_uri_mismatch"
- Pastikan URL di "Authorized redirect URIs" sesuai dengan domain Anda
- Periksa tidak ada trailing slash

### Error: "invalid_client"
- Periksa GOOGLE_CLIENT_ID di `.env.local`
- Pastikan tidak ada spasi atau karakter tambahan

### Error: "access_denied"
- User membatalkan proses OAuth
- Ini normal, tidak perlu action khusus

## Keamanan

⚠️ **PENTING**: 
- Jangan commit file `.env.local` ke repository
- Gunakan environment variables yang berbeda untuk production
- Regularly rotate client secrets
- Monitor OAuth usage di Google Cloud Console

## Production Deployment

Untuk production:
1. Buat OAuth client ID baru dengan domain production
2. Update environment variables di hosting platform
3. Submit app untuk Google verification jika diperlukan
4. Test thoroughly sebelum go-live