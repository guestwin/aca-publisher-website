import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../lib/db.js';
import User from '../models/User.js';

dotenv.config();

// Using existing connectDB function from lib/db.js

// Test composers data
const testComposers = [
  {
    name: 'Joseph Kristanto Pantioso',
    email: 'joseph@composer.test',
    password: 'password123',
    phone: '+62812345678',
    role: 'composer',
    bio: 'Komposer musik gereja dengan pengalaman lebih dari 20 tahun. Spesialis dalam aransemen musik liturgi dan himne kontemporer.',
    specialization: 'religious',
    isVerified: true,
    emailVerified: true
  },
  {
    name: 'Milton Sandyka',
    email: 'milton@composer.test',
    password: 'password123',
    phone: '+62812345679',
    role: 'composer',
    bio: 'Maestro musik tradisional Indonesia dengan fokus pada gamelan kontemporer dan musik etnik Nusantara.',
    specialization: 'traditional',
    isVerified: true,
    emailVerified: true
  },
  {
    name: 'Sarah Wijaya',
    email: 'sarah@composer.test',
    password: 'password123',
    phone: '+62812345680',
    role: 'composer',
    bio: 'Komposer muda yang mengkhususkan diri dalam musik nasional dan patriotik. Alumni Institut Seni Budaya Indonesia.',
    specialization: 'national',
    isVerified: true,
    emailVerified: true
  },
  {
    name: 'Ahmad Rizki',
    email: 'ahmad@composer.test',
    password: 'password123',
    phone: '+62812345681',
    role: 'composer',
    bio: 'Komposer kontemporer dengan latar belakang musik klasik. Aktif dalam penciptaan musik untuk film dan teater.',
    specialization: 'contemporary',
    isVerified: true,
    emailVerified: true
  },
  {
    name: 'Maria Santoso',
    email: 'maria@composer.test',
    password: 'password123',
    phone: '+62812345682',
    role: 'composer',
    bio: 'Pianis dan komposer dengan spesialisasi musik klasik dan jazz. Lulusan Berklee College of Music.',
    specialization: 'classical',
    isVerified: true,
    emailVerified: true
  }
];

// Create test composers
const createTestComposers = async () => {
  try {
    console.log('🎼 Creating test composers...');
    
    for (const composerData of testComposers) {
      // Check if composer already exists
      const existingComposer = await User.findOne({ email: composerData.email });
      
      if (existingComposer) {
        console.log(`⚠️  Composer ${composerData.name} already exists`);
        continue;
      }
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(composerData.password, saltRounds);
      
      // Create composer
      const composer = await User.create({
        ...composerData,
        password: hashedPassword,
        createdAt: new Date(),
        lastLogin: null
      });
      
      console.log(`✅ Created composer: ${composer.name} (${composer.email})`);
    }
    
    console.log('\n🎉 Test composers created successfully!');
    console.log('\n📋 Login credentials:');
    console.log('================================');
    testComposers.forEach(composer => {
      console.log(`👤 ${composer.name}`);
      console.log(`   Email: ${composer.email}`);
      console.log(`   Password: ${composer.password}`);
      console.log(`   Specialization: ${composer.specialization}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error creating test composers:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await createTestComposers();
  
  console.log('\n🔗 Access URLs:');
  console.log('Login Page: http://localhost:3000/composer/login');
  console.log('Dashboard: http://localhost:3000/composer/dashboard');
  
  process.exit(0);
};

// Run script
main().catch(console.error);

export { createTestComposers, testComposers };