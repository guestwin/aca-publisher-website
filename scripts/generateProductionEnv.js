#!/usr/bin/env node

/**
 * Script untuk generate environment variables production yang secure
 * Usage: node scripts/generateProductionEnv.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate secure random string
function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate production environment variables
function generateProductionEnv() {
  const jwtSecret = generateSecureSecret(32);
  const nextAuthSecret = generateSecureSecret(32);
  
  const envTemplate = `# Production Environment Variables for www.acapublisher.com
# Generated on: ${new Date().toISOString()}
# IMPORTANT: Keep these secrets secure and never commit to version control

# Database Configuration
MONGODB_URI=mongodb+srv://aca-admin:YOUR_PASSWORD@aca-publisher-prod.xxxxx.mongodb.net/aca-publisher?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRE=30d

# NextAuth Configuration
NEXTAUTH_URL=https://www.acapublisher.com
NEXTAUTH_SECRET=${nextAuthSecret}

# Environment
NODE_ENV=production

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@acapublisher.com

# Payment Gateway - Midtrans
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_WEBHOOK_URL=https://www.acapublisher.com/api/payment/webhook

# Redis Cache (Optional)
REDIS_URL=redis://your-redis-instance

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://www.acapublisher.com
NEXT_PUBLIC_SITE_NAME=ACA Publisher
NEXT_PUBLIC_SITE_DESCRIPTION=Platform penjualan partitur musik digital untuk paduan suara Indonesia

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=public/uploads

# Security
CSRF_SECRET=${generateSecureSecret(16)}
SESSION_SECRET=${generateSecureSecret(24)}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
`;

  // Write to .env.production file
  const envPath = path.join(process.cwd(), '.env.production');
  fs.writeFileSync(envPath, envTemplate);
  
  console.log('🔐 Production Environment Variables Generated!');
  console.log('📁 File saved to: .env.production');
  console.log('');
  console.log('🚨 IMPORTANT SECURITY NOTES:');
  console.log('1. Never commit .env.production to version control');
  console.log('2. Update MongoDB URI with your actual credentials');
  console.log('3. Configure Midtrans keys from your merchant dashboard');
  console.log('4. Setup email credentials for notifications');
  console.log('5. Add these variables to Vercel environment settings');
  console.log('');
  console.log('📋 Generated Secrets:');
  console.log(`JWT_SECRET: ${jwtSecret}`);
  console.log(`NEXTAUTH_SECRET: ${nextAuthSecret}`);
  console.log('');
  console.log('🔗 Next Steps:');
  console.log('1. Copy variables to Vercel Dashboard → Settings → Environment Variables');
  console.log('2. Update MongoDB URI with your Atlas credentials');
  console.log('3. Configure payment gateway credentials');
  console.log('4. Deploy to production');
  
  return {
    jwtSecret,
    nextAuthSecret,
    envPath
  };
}

// Generate Vercel environment variables format
function generateVercelEnvFormat() {
  const secrets = generateProductionEnv();
  
  const vercelEnvTemplate = `# Vercel Environment Variables
# Copy these to Vercel Dashboard → Settings → Environment Variables

# Database
MONGODB_URI="mongodb+srv://aca-admin:YOUR_PASSWORD@aca-publisher-prod.xxxxx.mongodb.net/aca-publisher?retryWrites=true&w=majority"

# JWT
JWT_SECRET="${secrets.jwtSecret}"
JWT_EXPIRE="30d"

# NextAuth
NEXTAUTH_URL="https://www.acapublisher.com"
NEXTAUTH_SECRET="${secrets.nextAuthSecret}"

# Environment
NODE_ENV="production"

# Payment Gateway
MIDTRANS_SERVER_KEY="your-midtrans-server-key"
MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
MIDTRANS_IS_PRODUCTION="true"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://www.acapublisher.com"
NEXT_PUBLIC_SITE_NAME="ACA Publisher"
`;
  
  const vercelEnvPath = path.join(process.cwd(), 'vercel-env-variables.txt');
  fs.writeFileSync(vercelEnvPath, vercelEnvTemplate);
  
  console.log('📋 Vercel environment variables format saved to: vercel-env-variables.txt');
}

// Main execution
if (require.main === module) {
  try {
    console.log('🚀 Generating Production Environment Variables...');
    console.log('');
    
    generateProductionEnv();
    generateVercelEnvFormat();
    
    console.log('');
    console.log('✅ Environment variables generated successfully!');
    console.log('🔒 Keep these secrets secure!');
    
  } catch (error) {
    console.error('❌ Error generating environment variables:', error.message);
    process.exit(1);
  }
}

module.exports = {
  generateSecureSecret,
  generateProductionEnv,
  generateVercelEnvFormat
};