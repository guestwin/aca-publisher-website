/**
 * Script testing untuk production deployment
 * Melakukan automated testing terhadap website yang sudah di-deploy
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class ProductionTester {
  constructor(baseUrl = process.env.TEST_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.timeout = 30000;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: [],
      startTime: null,
      endTime: null
    };
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

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'ACA-Publisher-Production-Tester/1.0',
          ...options.headers
        },
        timeout: options.timeout || 10000
      };

      const req = protocol.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            responseTime: Date.now() - startTime
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      const startTime = Date.now();
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  async runTest(testName, testFunction) {
    const startTime = Date.now();
    
    try {
      this.log(`Running test: ${testName}`, 'info');
      
      await testFunction();
      
      const duration = Date.now() - startTime;
      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: 'PASSED',
        duration,
        timestamp: new Date().toISOString()
      });
      
      this.log(`✅ ${testName} - PASSED (${duration}ms)`, 'success');
      
    } catch (error) {
      const duration = Date.now() - startTime || 0;
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      });
      
      this.log(`❌ ${testName} - FAILED: ${error.message}`, 'error');
    }
  }

  // Test website accessibility
  async testWebsiteAccessibility() {
    await this.runTest('Website Accessibility', async () => {
      const response = await this.makeRequest('/');
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
      }
      
      if (!response.body.includes('ACA Publisher')) {
        throw new Error('Homepage does not contain expected content');
      }
      
      if (response.responseTime > 5000) {
        throw new Error(`Response time too slow: ${response.responseTime}ms`);
      }
    });
  }

  // Test HTTPS and security headers
  async testSecurityHeaders() {
    await this.runTest('Security Headers', async () => {
      const response = await this.makeRequest('/');
      
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];
      
      for (const header of requiredHeaders) {
        if (!response.headers[header]) {
          throw new Error(`Missing security header: ${header}`);
        }
      }
    });
  }

  // Test main pages
  async testMainPages() {
    const pages = [
      { path: '/', name: 'Homepage' },
      { path: '/catalog', name: 'Catalog' },
      { path: '/about', name: 'About' },
      { path: '/composers', name: 'Composers' },
      { path: '/auth', name: 'Auth' }
    ];

    for (const page of pages) {
      await this.runTest(`Page: ${page.name}`, async () => {
        const response = await this.makeRequest(page.path);
        
        if (response.statusCode !== 200) {
          throw new Error(`${page.name} returned status ${response.statusCode}`);
        }
        
        if (response.responseTime > 3000) {
          throw new Error(`${page.name} response time too slow: ${response.responseTime}ms`);
        }
      });
    }
  }

  // Test API endpoints
  async testAPIEndpoints() {
    const endpoints = [
      { path: '/api/products', name: 'Products API' },
      { path: '/api/composers', name: 'Composers API' },
      { path: '/api/auth/session', name: 'Session API' }
    ];

    for (const endpoint of endpoints) {
      await this.runTest(`API: ${endpoint.name}`, async () => {
        const response = await this.makeRequest(endpoint.path);
        
        // API should return JSON
        if (!response.headers['content-type']?.includes('application/json')) {
          throw new Error(`${endpoint.name} did not return JSON`);
        }
        
        if (response.responseTime > 2000) {
          throw new Error(`${endpoint.name} response time too slow: ${response.responseTime}ms`);
        }
      });
    }
  }

  // Test database connectivity (indirect)
  async testDatabaseConnectivity() {
    await this.runTest('Database Connectivity', async () => {
      const response = await this.makeRequest('/api/products?limit=1');
      
      if (response.statusCode !== 200) {
        throw new Error(`Database test failed with status ${response.statusCode}`);
      }
      
      try {
        const data = JSON.parse(response.body);
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format from database');
        }
      } catch (parseError) {
        throw new Error('Failed to parse database response');
      }
    });
  }

  // Test payment gateway (basic check)
  async testPaymentGateway() {
    await this.runTest('Payment Gateway Check', async () => {
      const response = await this.makeRequest('/checkout');
      
      if (response.statusCode !== 200) {
        throw new Error(`Checkout page returned status ${response.statusCode}`);
      }
      
      // Check if Midtrans script is loaded
      if (!response.body.includes('snap.midtrans.com')) {
        throw new Error('Midtrans script not found on checkout page');
      }
    });
  }

  // Test mobile responsiveness (basic)
  async testMobileResponsiveness() {
    await this.runTest('Mobile Responsiveness', async () => {
      const response = await this.makeRequest('/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
        }
      });
      
      if (response.statusCode !== 200) {
        throw new Error(`Mobile request failed with status ${response.statusCode}`);
      }
      
      // Check for viewport meta tag
      if (!response.body.includes('viewport')) {
        throw new Error('Viewport meta tag not found');
      }
    });
  }

  // Test SEO basics
  async testSEOBasics() {
    await this.runTest('SEO Basics', async () => {
      const response = await this.makeRequest('/');
      
      const requiredSEOElements = [
        '<title>',
        'meta name="description"',
        'meta property="og:title"',
        'meta property="og:description"'
      ];
      
      for (const element of requiredSEOElements) {
        if (!response.body.includes(element)) {
          throw new Error(`Missing SEO element: ${element}`);
        }
      }
    });
  }

  // Test error handling
  async testErrorHandling() {
    await this.runTest('404 Error Handling', async () => {
      const response = await this.makeRequest('/non-existent-page');
      
      if (response.statusCode !== 404) {
        throw new Error(`Expected 404, got ${response.statusCode}`);
      }
    });
  }

  // Generate performance report
  generatePerformanceReport() {
    const totalTests = this.results.passed + this.results.failed;
    const successRate = totalTests > 0 ? (this.results.passed / totalTests * 100).toFixed(2) : 0;
    
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: `${successRate}%`
      },
      tests: this.results.tests,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Check for slow tests
    const slowTests = this.results.tests.filter(test => test.duration > 3000);
    if (slowTests.length > 0) {
      recommendations.push({
        type: 'performance',
        message: `${slowTests.length} tests took longer than 3 seconds. Consider optimizing performance.`,
        tests: slowTests.map(t => t.name)
      });
    }
    
    // Check failure rate
    const failureRate = this.results.failed / (this.results.passed + this.results.failed);
    if (failureRate > 0.1) {
      recommendations.push({
        type: 'reliability',
        message: 'High failure rate detected. Review failed tests and fix issues.',
        failureRate: `${(failureRate * 100).toFixed(2)}%`
      });
    }
    
    return recommendations;
  }

  async runAllTests() {
    this.log('🚀 Starting production testing suite...', 'info');
    this.log(`Testing URL: ${this.baseUrl}`, 'info');
    
    const startTime = Date.now();
    
    // Run all test suites
    await this.testWebsiteAccessibility();
    await this.testSecurityHeaders();
    await this.testMainPages();
    await this.testAPIEndpoints();
    await this.testDatabaseConnectivity();
    await this.testPaymentGateway();
    await this.testMobileResponsiveness();
    await this.testSEOBasics();
    await this.testErrorHandling();
    
    const totalTime = Date.now() - startTime;
    
    // Generate and display report
    const report = this.generatePerformanceReport();
    
    this.log('\n📊 Test Results Summary:', 'info');
    this.log(`Total Tests: ${report.summary.totalTests}`, 'info');
    this.log(`Passed: ${report.summary.passed}`, 'success');
    this.log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'error' : 'info');
    this.log(`Success Rate: ${report.summary.successRate}`, 'info');
    this.log(`Total Time: ${totalTime}ms`, 'info');
    
    if (report.recommendations.length > 0) {
      this.log('\n💡 Recommendations:', 'warning');
      report.recommendations.forEach(rec => {
        this.log(`- ${rec.message}`, 'warning');
      });
    }
    
    // Save report to file
    const fs = require('fs');
    const reportPath = `production-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n📄 Detailed report saved to: ${reportPath}`, 'success');
    
    // Exit with appropriate code
    if (this.results.failed > 0) {
      this.log('\n❌ Some tests failed. Please review and fix issues before going live.', 'error');
      process.exit(1);
    } else {
      this.log('\n✅ All tests passed! Production deployment is ready.', 'success');
      process.exit(0);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  let baseUrl = process.env.TEST_URL || 'http://localhost:3000';
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        baseUrl = args[i + 1];
        i++;
        break;
      case '--help':
        console.log(`
ACA Publisher Production Testing Script

Usage: node scripts/testProduction.js [options]

Options:
  --url <url>    Base URL to test (default: http://localhost:3000)
  --help         Show this help message

Examples:
  node scripts/testProduction.js
  node scripts/testProduction.js --url https://aca-publisher-preview.vercel.app
`);
        process.exit(0);
    }
  }
  
  const tester = new ProductionTester(baseUrl);
  tester.runAllTests().catch(error => {
    console.error('Testing failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionTester;