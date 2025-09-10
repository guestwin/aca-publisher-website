/**
 * Script untuk setup domain dan DNS configuration
 * Membantu konfigurasi domain www.acapublisher.com untuk production
 */

const https = require('https');
const dns = require('dns').promises;
require('dotenv').config({ path: '.env.production' });

class DomainSetup {
  constructor() {
    this.domain = 'acapublisher.com';
    this.subdomain = 'www.acapublisher.com';
    this.vercelDomain = process.env.VERCEL_URL || 'your-app.vercel.app';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async checkDNSRecords() {
    this.log('Checking DNS records...', 'info');
    
    try {
      // Check A record for root domain
      try {
        const aRecords = await dns.resolve4(this.domain);
        this.log(`✅ A record for ${this.domain}: ${aRecords.join(', ')}`, 'success');
      } catch (error) {
        this.log(`❌ No A record found for ${this.domain}`, 'error');
      }
      
      // Check CNAME record for www subdomain
      try {
        const cnameRecords = await dns.resolveCname(this.subdomain);
        this.log(`✅ CNAME record for ${this.subdomain}: ${cnameRecords.join(', ')}`, 'success');
      } catch (error) {
        this.log(`❌ No CNAME record found for ${this.subdomain}`, 'error');
      }
      
      // Check MX records for email
      try {
        const mxRecords = await dns.resolveMx(this.domain);
        this.log(`✅ MX records for ${this.domain}:`, 'success');
        mxRecords.forEach(record => {
          this.log(`   Priority ${record.priority}: ${record.exchange}`, 'info');
        });
      } catch (error) {
        this.log(`❌ No MX records found for ${this.domain}`, 'error');
      }
      
      // Check TXT records for verification
      try {
        const txtRecords = await dns.resolveTxt(this.domain);
        this.log(`✅ TXT records for ${this.domain}:`, 'success');
        txtRecords.forEach(record => {
          this.log(`   ${record.join('')}`, 'info');
        });
      } catch (error) {
        this.log(`❌ No TXT records found for ${this.domain}`, 'error');
      }
      
    } catch (error) {
      this.log(`❌ DNS check failed: ${error.message}`, 'error');
    }
  }

  async checkSSLCertificate() {
    this.log('Checking SSL certificate...', 'info');
    
    return new Promise((resolve) => {
      const options = {
        hostname: this.subdomain,
        port: 443,
        path: '/',
        method: 'GET',
        timeout: 10000
      };
      
      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        
        if (cert && cert.subject) {
          this.log(`✅ SSL Certificate found`, 'success');
          this.log(`   Subject: ${cert.subject.CN}`, 'info');
          this.log(`   Issuer: ${cert.issuer.O}`, 'info');
          this.log(`   Valid from: ${cert.valid_from}`, 'info');
          this.log(`   Valid to: ${cert.valid_to}`, 'info');
          
          // Check if certificate is valid
          const now = new Date();
          const validFrom = new Date(cert.valid_from);
          const validTo = new Date(cert.valid_to);
          
          if (now >= validFrom && now <= validTo) {
            this.log(`✅ Certificate is valid`, 'success');
          } else {
            this.log(`❌ Certificate is expired or not yet valid`, 'error');
          }
        } else {
          this.log(`❌ No SSL certificate found`, 'error');
        }
        
        resolve();
      });
      
      req.on('error', (error) => {
        this.log(`❌ SSL check failed: ${error.message}`, 'error');
        resolve();
      });
      
      req.on('timeout', () => {
        this.log(`❌ SSL check timed out`, 'error');
        req.destroy();
        resolve();
      });
      
      req.end();
    });
  }

  async checkWebsiteAccessibility() {
    this.log('Checking website accessibility...', 'info');
    
    const urls = [
      `https://${this.subdomain}`,
      `https://${this.domain}`,
      `http://${this.subdomain}`,
      `http://${this.domain}`
    ];
    
    for (const url of urls) {
      try {
        await this.checkUrl(url);
      } catch (error) {
        this.log(`❌ Failed to access ${url}: ${error.message}`, 'error');
      }
    }
  }

  checkUrl(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : require('http');
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname,
        method: 'GET',
        timeout: 10000
      };
      
      const req = client.request(options, (res) => {
        this.log(`✅ ${url} - Status: ${res.statusCode}`, 'success');
        
        if (res.statusCode >= 300 && res.statusCode < 400) {
          this.log(`   Redirects to: ${res.headers.location}`, 'info');
        }
        
        resolve();
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
      
      req.end();
    });
  }

  generateDNSInstructions() {
    this.log('\n📋 DNS Configuration Instructions:', 'info');
    this.log('\nFor your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare):', 'info');
    
    console.log(`
🔧 Required DNS Records:

1. A Record (Root domain):
   Type: A
   Name: @ (or leave empty)
   Value: 76.76.19.61 (Vercel IP)
   TTL: 3600

2. CNAME Record (WWW subdomain):
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600

3. TXT Record (Domain verification):
   Type: TXT
   Name: @ (or leave empty)
   Value: "vercel-domain-verification=your-verification-code"
   TTL: 3600

4. MX Records (Email - Optional):
   Type: MX
   Name: @ (or leave empty)
   Value: mx1.your-email-provider.com
   Priority: 10
   TTL: 3600

📝 Additional Recommendations:

• Enable DNSSEC if supported by your registrar
• Set up CAA records for SSL certificate authority
• Configure SPF, DKIM, and DMARC for email security
• Use Cloudflare for additional security and performance

⚠️  DNS propagation can take 24-48 hours worldwide
`);
  }

  generateVercelInstructions() {
    this.log('\n🚀 Vercel Domain Configuration:', 'info');
    
    console.log(`
📋 Steps to configure domain in Vercel:

1. Login to Vercel Dashboard:
   https://vercel.com/dashboard

2. Go to your project settings:
   Project → Settings → Domains

3. Add custom domain:
   - Enter: ${this.subdomain}
   - Click "Add"

4. Add root domain (optional):
   - Enter: ${this.domain}
   - Set to redirect to ${this.subdomain}

5. Verify domain ownership:
   - Add TXT record provided by Vercel
   - Wait for verification

6. SSL Certificate:
   - Vercel automatically provisions SSL
   - Certificate will be ready within minutes

7. Test configuration:
   - Visit https://${this.subdomain}
   - Check SSL certificate
   - Verify redirects work properly

🔧 Environment Variables:
Make sure these are set in Vercel:
- NEXTAUTH_URL=https://${this.subdomain}
- NEXTAUTH_SECRET=your-secret-key
- MONGODB_URI=your-mongodb-connection
- MIDTRANS_SERVER_KEY=your-midtrans-key
- MIDTRANS_CLIENT_KEY=your-midtrans-client-key
`);
  }

  generateSecurityInstructions() {
    this.log('\n🔒 Security Configuration:', 'info');
    
    console.log(`
🛡️  Security Checklist:

1. SSL/TLS Configuration:
   ✅ Force HTTPS redirects
   ✅ HSTS headers enabled
   ✅ Secure cookie settings

2. DNS Security:
   ✅ DNSSEC enabled
   ✅ CAA records configured
   ✅ Regular DNS monitoring

3. Content Security:
   ✅ CSP headers configured
   ✅ XSS protection enabled
   ✅ CSRF protection active

4. Monitoring:
   ✅ Uptime monitoring
   ✅ SSL certificate monitoring
   ✅ DNS change alerts

5. Backup & Recovery:
   ✅ Domain backup at registrar
   ✅ DNS configuration backup
   ✅ Recovery procedures documented

📊 Recommended Tools:
- Cloudflare (DNS + Security)
- UptimeRobot (Monitoring)
- SSL Labs (SSL Testing)
- DNSChecker (DNS Propagation)
`);
  }

  async performHealthCheck() {
    this.log('\n🏥 Performing domain health check...', 'info');
    
    const checks = {
      dnsResolution: false,
      sslCertificate: false,
      websiteAccess: false,
      redirects: false
    };
    
    try {
      // DNS Resolution Check
      await dns.resolve4(this.subdomain);
      checks.dnsResolution = true;
      this.log('✅ DNS resolution working', 'success');
    } catch (error) {
      this.log('❌ DNS resolution failed', 'error');
    }
    
    try {
      // SSL Certificate Check
      await this.checkSSLCertificate();
      checks.sslCertificate = true;
    } catch (error) {
      this.log('❌ SSL certificate check failed', 'error');
    }
    
    try {
      // Website Access Check
      await this.checkUrl(`https://${this.subdomain}`);
      checks.websiteAccess = true;
    } catch (error) {
      this.log('❌ Website access failed', 'error');
    }
    
    // Generate health report
    this.log('\n📊 Health Check Summary:', 'info');
    Object.entries(checks).forEach(([check, status]) => {
      const icon = status ? '✅' : '❌';
      const statusText = status ? 'PASS' : 'FAIL';
      this.log(`   ${icon} ${check}: ${statusText}`, status ? 'success' : 'error');
    });
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    this.log(`\n📈 Overall Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`, 
             passedChecks === totalChecks ? 'success' : 'warning');
    
    return checks;
  }

  async run() {
    try {
      this.log('🌐 Starting domain setup and verification...', 'info');
      
      // Check current DNS configuration
      await this.checkDNSRecords();
      
      // Check SSL certificate
      await this.checkSSLCertificate();
      
      // Check website accessibility
      await this.checkWebsiteAccessibility();
      
      // Generate configuration instructions
      this.generateDNSInstructions();
      this.generateVercelInstructions();
      this.generateSecurityInstructions();
      
      // Perform health check
      const healthCheck = await this.performHealthCheck();
      
      this.log('\n🎉 Domain setup verification completed!', 'success');
      
      if (Object.values(healthCheck).every(Boolean)) {
        this.log('✅ All checks passed - Domain is ready for production!', 'success');
      } else {
        this.log('⚠️  Some checks failed - Please review the configuration', 'warning');
      }
      
    } catch (error) {
      this.log(`❌ Domain setup failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Domain Setup and Verification Script

Usage: node scripts/setupDomain.js [options]

Options:
  --help    Show this help message
  --check   Only perform health checks

Example:
  node scripts/setupDomain.js
  node scripts/setupDomain.js --check
`);
    process.exit(0);
  }
  
  const setup = new DomainSetup();
  
  if (args.includes('--check')) {
    setup.performHealthCheck().catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
  } else {
    setup.run().catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
  }
}

module.exports = DomainSetup;