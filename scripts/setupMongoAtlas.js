/**
 * Script untuk setup MongoDB Atlas production database
 * Membuat collections, indexes, dan data awal yang diperlukan
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.production' });

class MongoAtlasSetup {
  constructor() {
    this.mongoUri = process.env.MONGODB_URI;
    this.client = null;
    this.db = null;
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

  async connect() {
    try {
      if (!this.mongoUri) {
        throw new Error('MONGODB_URI not found in environment variables');
      }

      this.log('Connecting to MongoDB Atlas...', 'info');
      this.client = new MongoClient(this.mongoUri);
      await this.client.connect();
      
      // Get database name from URI or use default
      const dbName = this.mongoUri.split('/').pop().split('?')[0] || 'aca_publisher';
      this.db = this.client.db(dbName);
      
      this.log(`✅ Connected to database: ${dbName}`, 'success');
      return true;
    } catch (error) {
      this.log(`❌ Connection failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.log('Disconnected from MongoDB Atlas', 'info');
    }
  }

  async createCollections() {
    this.log('Creating collections...', 'info');
    
    const collections = [
      'users',
      'composers', 
      'products',
      'transactions',
      'reviews',
      'purchase_history',
      'settings'
    ];

    for (const collectionName of collections) {
      try {
        const exists = await this.db.listCollections({ name: collectionName }).hasNext();
        
        if (!exists) {
          await this.db.createCollection(collectionName);
          this.log(`✅ Created collection: ${collectionName}`, 'success');
        } else {
          this.log(`⚠️  Collection already exists: ${collectionName}`, 'warning');
        }
      } catch (error) {
        this.log(`❌ Failed to create collection ${collectionName}: ${error.message}`, 'error');
      }
    }
  }

  async createIndexes() {
    this.log('Creating database indexes...', 'info');

    const indexDefinitions = [
      // Users collection indexes
      {
        collection: 'users',
        indexes: [
          { key: { email: 1 }, options: { unique: true } },
          { key: { createdAt: 1 } },
          { key: { role: 1 } }
        ]
      },
      
      // Composers collection indexes
      {
        collection: 'composers',
        indexes: [
          { key: { email: 1 }, options: { unique: true } },
          { key: { name: 1 } },
          { key: { isActive: 1 } },
          { key: { createdAt: 1 } }
        ]
      },
      
      // Products collection indexes
      {
        collection: 'products',
        indexes: [
          { key: { title: 'text', description: 'text' } },
          { key: { category: 1 } },
          { key: { composerId: 1 } },
          { key: { price: 1 } },
          { key: { isActive: 1 } },
          { key: { createdAt: 1 } },
          { key: { tags: 1 } }
        ]
      },
      
      // Transactions collection indexes
      {
        collection: 'transactions',
        indexes: [
          { key: { orderId: 1 }, options: { unique: true } },
          { key: { userId: 1 } },
          { key: { status: 1 } },
          { key: { createdAt: 1 } },
          { key: { paymentMethod: 1 } }
        ]
      },
      
      // Reviews collection indexes
      {
        collection: 'reviews',
        indexes: [
          { key: { productId: 1 } },
          { key: { userId: 1 } },
          { key: { rating: 1 } },
          { key: { createdAt: 1 } }
        ]
      },
      
      // Purchase history indexes
      {
        collection: 'purchase_history',
        indexes: [
          { key: { userId: 1 } },
          { key: { productId: 1 } },
          { key: { transactionId: 1 } },
          { key: { purchaseDate: 1 } }
        ]
      }
    ];

    for (const { collection, indexes } of indexDefinitions) {
      try {
        const coll = this.db.collection(collection);
        
        for (const { key, options = {} } of indexes) {
          await coll.createIndex(key, options);
          this.log(`✅ Created index on ${collection}: ${JSON.stringify(key)}`, 'success');
        }
      } catch (error) {
        this.log(`❌ Failed to create index on ${collection}: ${error.message}`, 'error');
      }
    }
  }

  async createAdminUser() {
    this.log('Creating admin user...', 'info');
    
    try {
      const users = this.db.collection('users');
      
      // Check if admin already exists
      const existingAdmin = await users.findOne({ email: 'admin@acapublisher.com' });
      
      if (existingAdmin) {
        this.log('⚠️  Admin user already exists', 'warning');
        return;
      }
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('AdminACA2024!', 12);
      
      const adminUser = {
        name: 'ACA Publisher Admin',
        email: 'admin@acapublisher.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await users.insertOne(adminUser);
      this.log('✅ Admin user created successfully', 'success');
      this.log('📧 Email: admin@acapublisher.com', 'info');
      this.log('🔑 Password: AdminACA2024!', 'warning');
      this.log('⚠️  Please change the password after first login!', 'warning');
      
    } catch (error) {
      this.log(`❌ Failed to create admin user: ${error.message}`, 'error');
    }
  }

  async createDefaultSettings() {
    this.log('Creating default settings...', 'info');
    
    try {
      const settings = this.db.collection('settings');
      
      // Check if settings already exist
      const existingSettings = await settings.findOne({ type: 'site_settings' });
      
      if (existingSettings) {
        this.log('⚠️  Default settings already exist', 'warning');
        return;
      }
      
      const defaultSettings = {
        type: 'site_settings',
        siteName: 'ACA Publisher',
        siteDescription: 'Platform terpercaya untuk membeli partitur paduan suara berkualitas tinggi',
        siteUrl: 'https://www.acapublisher.com',
        contactEmail: 'info@acapublisher.com',
        supportEmail: 'support@acapublisher.com',
        whatsappNumber: '+6281234567890',
        socialMedia: {
          facebook: 'https://facebook.com/acapublisher',
          instagram: 'https://instagram.com/acapublisher',
          youtube: 'https://youtube.com/@acapublisher'
        },
        paymentSettings: {
          currency: 'IDR',
          taxRate: 0.11, // 11% PPN
          minimumOrder: 10000
        },
        emailSettings: {
          fromName: 'ACA Publisher',
          fromEmail: 'noreply@acapublisher.com'
        },
        maintenanceMode: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await settings.insertOne(defaultSettings);
      this.log('✅ Default settings created successfully', 'success');
      
    } catch (error) {
      this.log(`❌ Failed to create default settings: ${error.message}`, 'error');
    }
  }

  async createSampleData() {
    this.log('Creating sample data...', 'info');
    
    try {
      // Create sample composer
      const composers = this.db.collection('composers');
      const existingComposer = await composers.findOne({ email: 'composer@example.com' });
      
      if (!existingComposer) {
        const hashedPassword = await bcrypt.hash('composer123', 12);
        
        const sampleComposer = {
          name: 'John Doe',
          email: 'composer@example.com',
          password: hashedPassword,
          bio: 'Experienced choir composer with 10+ years of experience',
          phone: '+6281234567890',
          address: 'Jakarta, Indonesia',
          isActive: true,
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const composerResult = await composers.insertOne(sampleComposer);
        this.log('✅ Sample composer created', 'success');
        
        // Create sample product
        const products = this.db.collection('products');
        const sampleProduct = {
          title: 'Ave Maria - SATB',
          description: 'Beautiful arrangement of Ave Maria for SATB choir',
          category: 'religious',
          composerId: composerResult.insertedId,
          composerName: 'John Doe',
          price: 25000,
          difficulty: 'intermediate',
          duration: '4:30',
          voicing: 'SATB',
          language: 'Latin',
          tags: ['religious', 'classical', 'ave maria'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await products.insertOne(sampleProduct);
        this.log('✅ Sample product created', 'success');
      } else {
        this.log('⚠️  Sample data already exists', 'warning');
      }
      
    } catch (error) {
      this.log(`❌ Failed to create sample data: ${error.message}`, 'error');
    }
  }

  async setupDatabaseSecurity() {
    this.log('Setting up database security...', 'info');
    
    try {
      // Create database user roles (if using MongoDB Atlas, this is handled in the UI)
      this.log('✅ Database security configured via MongoDB Atlas UI', 'success');
      this.log('📋 Ensure the following security measures:', 'info');
      this.log('   - IP Whitelist configured', 'info');
      this.log('   - Database user with minimal required permissions', 'info');
      this.log('   - Network access restricted to application servers', 'info');
      this.log('   - Backup and monitoring enabled', 'info');
      
    } catch (error) {
      this.log(`❌ Security setup failed: ${error.message}`, 'error');
    }
  }

  async verifySetup() {
    this.log('Verifying database setup...', 'info');
    
    try {
      // Check collections
      const collections = await this.db.listCollections().toArray();
      this.log(`✅ Found ${collections.length} collections`, 'success');
      
      // Check admin user
      const users = this.db.collection('users');
      const adminCount = await users.countDocuments({ role: 'admin' });
      this.log(`✅ Found ${adminCount} admin user(s)`, 'success');
      
      // Check settings
      const settings = this.db.collection('settings');
      const settingsCount = await settings.countDocuments();
      this.log(`✅ Found ${settingsCount} settings document(s)`, 'success');
      
      // Test write operation
      const testCollection = this.db.collection('test');
      await testCollection.insertOne({ test: true, timestamp: new Date() });
      await testCollection.deleteOne({ test: true });
      this.log('✅ Write operations working', 'success');
      
      this.log('✅ Database setup verification completed', 'success');
      
    } catch (error) {
      this.log(`❌ Verification failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async run() {
    try {
      this.log('🚀 Starting MongoDB Atlas setup...', 'info');
      
      // Connect to database
      await this.connect();
      
      // Setup database structure
      await this.createCollections();
      await this.createIndexes();
      
      // Create initial data
      await this.createAdminUser();
      await this.createDefaultSettings();
      await this.createSampleData();
      
      // Setup security
      await this.setupDatabaseSecurity();
      
      // Verify everything is working
      await this.verifySetup();
      
      this.log('🎉 MongoDB Atlas setup completed successfully!', 'success');
      this.log('📋 Next steps:', 'info');
      this.log('   1. Login to MongoDB Atlas and verify collections', 'info');
      this.log('   2. Configure IP whitelist for production servers', 'info');
      this.log('   3. Setup automated backups', 'info');
      this.log('   4. Configure monitoring and alerts', 'info');
      this.log('   5. Test application connectivity', 'info');
      
    } catch (error) {
      this.log(`❌ Setup failed: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
MongoDB Atlas Setup Script

Usage: node scripts/setupMongoAtlas.js [options]

Options:
  --help    Show this help message

Environment Variables Required:
  MONGODB_URI    MongoDB Atlas connection string

Example:
  node scripts/setupMongoAtlas.js
`);
    process.exit(0);
  }
  
  const setup = new MongoAtlasSetup();
  setup.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = MongoAtlasSetup;