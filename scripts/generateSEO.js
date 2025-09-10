#!/usr/bin/env node

// SEO Files Generation Script
// Run this script to generate sitemap.xml and robots.txt

import { generateSEOFiles } from '../lib/sitemap.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const main = async () => {
  try {
    console.log('🚀 Starting SEO files generation...');
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://acapubweb.com';
    const publicDir = path.join(__dirname, '../public');
    
    console.log(`📍 Base URL: ${baseUrl}`);
    console.log(`📁 Public directory: ${publicDir}`);
    
    await generateSEOFiles(baseUrl, publicDir);
    
    console.log('✅ SEO files generated successfully!');
    console.log('📄 Files created:');
    console.log('   - sitemap.xml');
    console.log('   - robots.txt');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Submit sitemap to Google Search Console');
    console.log('   2. Submit sitemap to Bing Webmaster Tools');
    console.log('   3. Verify robots.txt is accessible at /robots.txt');
    console.log('   4. Set up regular sitemap regeneration (daily/weekly)');
    
  } catch (error) {
    console.error('❌ Error generating SEO files:', error);
    process.exit(1);
  }
};

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'generate':
  case undefined:
    main();
    break;
  case 'help':
  case '--help':
  case '-h':
    console.log('SEO Files Generator');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/generateSEO.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  generate    Generate sitemap.xml and robots.txt (default)');
    console.log('  help        Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  NEXTAUTH_URL    Base URL of the website');
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Run "node scripts/generateSEO.js help" for usage information.');
    process.exit(1);
}

export { main };