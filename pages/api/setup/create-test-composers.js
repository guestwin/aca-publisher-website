import bcrypt from 'bcryptjs';
import connectDB from '../../../lib/db';
import User from '../../../models/User';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    console.log('🎼 Creating test composers...');
    const results = [];
    
    for (const composerData of testComposers) {
      // Check if composer already exists
      const existingComposer = await User.findOne({ email: composerData.email });
      
      if (existingComposer) {
        console.log(`⚠️  Composer ${composerData.name} already exists, updating password...`);
        
        // Hash password and update existing user
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(composerData.password, saltRounds);
        
        await User.findByIdAndUpdate(existingComposer._id, {
          ...composerData,
          password: hashedPassword // Ensure password is hashed
        });
        
        console.log(`✅ Updated composer password for: ${composerData.name}`);
        
        results.push({
          name: composerData.name,
          email: composerData.email,
          status: 'updated'
        });
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
      results.push({
        name: composer.name,
        email: composer.email,
        status: 'created'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Test composers setup completed',
      results,
      loginCredentials: testComposers.map(c => ({
        name: c.name,
        email: c.email,
        password: c.password,
        specialization: c.specialization
      })),
      urls: {
        login: '/composer/login',
        dashboard: '/composer/dashboard'
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating test composers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating test composers',
      error: error.message 
    });
  }
}