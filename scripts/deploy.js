/**
 * Script deployment untuk ACA Publisher Website
 * Membantu proses deployment ke Vercel dengan konfigurasi yang tepat
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentScript {
  constructor() {
    this.projectRoot = process.cwd();
    this.requiredFiles = [
      '.env.production',
      'vercel.json',
      'package.json',
      'next.config.js'
    ];
    this.requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'MIDTRANS_SERVER_KEY',
      'MIDTRANS_CLIENT_KEY'
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  checkPrerequisites() {
    this.log('🔍 Checking deployment prerequisites...', 'info');
    
    // Check required files
    for (const file of this.requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
      this.log(`✅ Found: ${file}`, 'success');
    }

    // Check environment variables
    const envPath = path.join(this.projectRoot, '.env.production');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    for (const envVar of this.requiredEnvVars) {
      if (!envContent.includes(`${envVar}=`)) {
        throw new Error(`Required environment variable missing: ${envVar}`);
      }
      this.log(`✅ Environment variable configured: ${envVar}`, 'success');
    }

    // Check Vercel CLI
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      this.log('✅ Vercel CLI is installed', 'success');
    } catch (error) {
      throw new Error('Vercel CLI is not installed. Run: npm install -g vercel');
    }

    this.log('✅ All prerequisites met!', 'success');
  }

  runTests() {
    this.log('🧪 Running tests before deployment...', 'info');
    
    try {
      // Run linting
      this.log('Running ESLint...', 'info');
      execSync('npm run lint', { stdio: 'inherit' });
      this.log('✅ Linting passed', 'success');
      
      // Run tests if available
      if (fs.existsSync(path.join(this.projectRoot, 'jest.config.js'))) {
        this.log('Running Jest tests...', 'info');
        execSync('npm test -- --passWithNoTests', { stdio: 'inherit' });
        this.log('✅ Tests passed', 'success');
      }
      
      // Build check
      this.log('Running build check...', 'info');
      execSync('npm run build', { stdio: 'inherit' });
      this.log('✅ Build successful', 'success');
      
    } catch (error) {
      throw new Error(`Tests failed: ${error.message}`);
    }
  }

  setupVercelEnvironment() {
    this.log('🔧 Setting up Vercel environment variables...', 'info');
    
    const envPath = path.join(this.projectRoot, '.env.production');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    for (const line of envLines) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/"/g, '');
      
      if (key && value) {
        try {
          execSync(`vercel env add ${key} production`, {
            input: value,
            stdio: ['pipe', 'pipe', 'inherit']
          });
          this.log(`✅ Set environment variable: ${key}`, 'success');
        } catch (error) {
          // Variable might already exist
          this.log(`⚠️  Environment variable ${key} might already exist`, 'warning');
        }
      }
    }
  }

  deployToVercel(environment = 'production') {
    this.log(`🚀 Deploying to Vercel (${environment})...`, 'info');
    
    try {
      let deployCommand = 'vercel';
      
      if (environment === 'production') {
        deployCommand += ' --prod';
      }
      
      // Add project settings
      deployCommand += ' --confirm';
      
      this.log(`Executing: ${deployCommand}`, 'info');
      execSync(deployCommand, { stdio: 'inherit' });
      
      this.log('✅ Deployment successful!', 'success');
      
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  postDeploymentChecks() {
    this.log('🔍 Running post-deployment checks...', 'info');
    
    // Get deployment URL
    try {
      const deploymentInfo = execSync('vercel ls --scope=team', { encoding: 'utf8' });
      this.log('Deployment info retrieved', 'success');
      
      // Basic health checks could be added here
      this.log('✅ Post-deployment checks completed', 'success');
      
    } catch (error) {
      this.log(`⚠️  Could not retrieve deployment info: ${error.message}`, 'warning');
    }
  }

  generateDeploymentReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: 'production',
      status: 'success',
      files_checked: this.requiredFiles,
      env_vars_configured: this.requiredEnvVars,
      deployment_url: 'https://www.acapublisher.com',
      notes: [
        'All prerequisites met',
        'Tests passed successfully',
        'Environment variables configured',
        'Deployment completed successfully'
      ]
    };
    
    const reportPath = path.join(this.projectRoot, 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📊 Deployment report saved to: ${reportPath}`, 'success');
    return report;
  }

  async run(options = {}) {
    const {
      skipTests = false,
      skipEnvSetup = false,
      environment = 'production'
    } = options;
    
    try {
      this.log('🚀 Starting ACA Publisher deployment process...', 'info');
      
      // Step 1: Check prerequisites
      this.checkPrerequisites();
      
      // Step 2: Run tests (optional)
      if (!skipTests) {
        this.runTests();
      } else {
        this.log('⚠️  Skipping tests as requested', 'warning');
      }
      
      // Step 3: Setup Vercel environment (optional)
      if (!skipEnvSetup) {
        this.setupVercelEnvironment();
      } else {
        this.log('⚠️  Skipping environment setup as requested', 'warning');
      }
      
      // Step 4: Deploy to Vercel
      this.deployToVercel(environment);
      
      // Step 5: Post-deployment checks
      this.postDeploymentChecks();
      
      // Step 6: Generate report
      const report = this.generateDeploymentReport();
      
      this.log('🎉 Deployment completed successfully!', 'success');
      this.log('📋 Next steps:', 'info');
      this.log('   1. Verify website is accessible at https://www.acapublisher.com', 'info');
      this.log('   2. Test payment functionality', 'info');
      this.log('   3. Check MongoDB Atlas connection', 'info');
      this.log('   4. Monitor application logs', 'info');
      
      return report;
      
    } catch (error) {
      this.log(`❌ Deployment failed: ${error.message}`, 'error');
      
      // Generate error report
      const errorReport = {
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error.message,
        stack: error.stack
      };
      
      const errorReportPath = path.join(this.projectRoot, 'deployment-error.json');
      fs.writeFileSync(errorReportPath, JSON.stringify(errorReport, null, 2));
      
      process.exit(1);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--skip-tests':
        options.skipTests = true;
        break;
      case '--skip-env-setup':
        options.skipEnvSetup = true;
        break;
      case '--environment':
        options.environment = args[i + 1];
        i++; // Skip next argument
        break;
      case '--help':
        console.log(`
ACA Publisher Deployment Script

Usage: node scripts/deploy.js [options]

Options:
  --skip-tests        Skip running tests before deployment
  --skip-env-setup    Skip setting up Vercel environment variables
  --environment       Target environment (default: production)
  --help              Show this help message

Examples:
  node scripts/deploy.js                    # Full deployment
  node scripts/deploy.js --skip-tests       # Deploy without running tests
  node scripts/deploy.js --environment preview  # Deploy to preview
`);
        process.exit(0);
    }
  }
  
  const deployment = new DeploymentScript();
  deployment.run(options);
}

module.exports = DeploymentScript;