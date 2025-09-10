// Database Optimization Script
// Script untuk menambahkan index dan optimasi query database

import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Import models
import Product from '../models/Product.js';
import User from '../models/User.js';
import Composer from '../models/Composer.js';
import Transaction from '../models/Transaction.js';

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI harus diatur di environment variables');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Helper function to safely create index
const safeCreateIndex = async (collection, indexSpec, options = {}) => {
  try {
    await collection.createIndex(indexSpec, options);
    return true;
  } catch (error) {
    if (error.code === 86) { // IndexKeySpecsConflict
      console.log(`    ⚠️  Index already exists: ${JSON.stringify(indexSpec)}`);
      return false;
    }
    throw error;
  }
};

// Database optimization functions
const optimizeDatabase = async () => {
  try {
    console.log('🚀 Starting database optimization...');
    await connectDB();
    
    // Product Collection Indexes
    console.log('📚 Optimizing Product collection...');
    await safeCreateIndex(Product.collection, { category: 1 }); // For category filtering
    await safeCreateIndex(Product.collection, { composer: 1 }); // For composer filtering
    await safeCreateIndex(Product.collection, { title: 'text', description: 'text' }); // For text search
    await safeCreateIndex(Product.collection, { createdAt: -1 }); // For sorting by date
    await safeCreateIndex(Product.collection, { price: 1 }); // For price filtering
    await safeCreateIndex(Product.collection, { stock: 1 }); // For stock filtering
    await safeCreateIndex(Product.collection, { sold: -1 }); // For popular products
    await safeCreateIndex(Product.collection, { category: 1, price: 1 }); // Compound index
    await safeCreateIndex(Product.collection, { composer: 1, category: 1 }); // Compound index
    await safeCreateIndex(Product.collection, { isDiscounted: 1, discountPrice: 1 }); // For discounted products
    console.log('  ✅ Product indexes processed');
    
    // User Collection Indexes
    console.log('👤 Optimizing User collection...');
    await safeCreateIndex(User.collection, { email: 1 }, { unique: true }); // Unique email
    await safeCreateIndex(User.collection, { role: 1 }); // For role-based queries
    await safeCreateIndex(User.collection, { isVerified: 1 }); // For verification status
    await safeCreateIndex(User.collection, { emailVerified: 1 }); // For email verification
    await safeCreateIndex(User.collection, { createdAt: -1 }); // For user registration date
    await safeCreateIndex(User.collection, { loginAttempts: 1, lockUntil: 1 }); // For login security
    await safeCreateIndex(User.collection, { googleId: 1 }, { sparse: true }); // For Google OAuth
    await safeCreateIndex(User.collection, { specialization: 1 }); // For composer specialization
    console.log('  ✅ User indexes processed');
    
    // Composer Collection Indexes
    console.log('🎼 Optimizing Composer collection...');
    await safeCreateIndex(Composer.collection, { nama: 1 }); // For composer name search
    await safeCreateIndex(Composer.collection, { nama: 'text', biografi: 'text' }); // For text search
    await safeCreateIndex(Composer.collection, { spesialisasi: 1 }); // For specialization filtering
    await safeCreateIndex(Composer.collection, { status: 1 }); // For active composers
    await safeCreateIndex(Composer.collection, { karya: -1 }); // For sorting by number of works
    await safeCreateIndex(Composer.collection, { createdAt: -1 }); // For sorting
    console.log('  ✅ Composer indexes processed');
    
    // Transaction Collection Indexes
    console.log('💳 Optimizing Transaction collection...');
    await safeCreateIndex(Transaction.collection, { user: 1 }); // For user transactions
    await safeCreateIndex(Transaction.collection, { buyerEmail: 1 }); // For buyer email lookup
    await safeCreateIndex(Transaction.collection, { status: 1 }); // For transaction status
    await safeCreateIndex(Transaction.collection, { paymentMethod: 1 }); // For payment method filtering
    await safeCreateIndex(Transaction.collection, { createdAt: -1 }); // For date sorting
    await safeCreateIndex(Transaction.collection, { invoiceNumber: 1 }, { unique: true }); // Unique invoice
    await safeCreateIndex(Transaction.collection, { 'items.productId': 1 }); // For product sales
    await safeCreateIndex(Transaction.collection, { user: 1, status: 1 }); // Compound index
    await safeCreateIndex(Transaction.collection, { createdAt: -1, status: 1 }); // Compound index
    await safeCreateIndex(Transaction.collection, { status: 1, paymentMethod: 1 }); // Compound index
    console.log('  ✅ Transaction indexes processed');
    
    console.log('\n✅ Database optimization completed successfully!');
    
    // Display index information
    await displayIndexInfo();
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
};

// Function to display index information
const displayIndexInfo = async () => {
  console.log('\n📊 Index Information:');
  
  const collections = [
    { name: 'Product', model: Product },
    { name: 'User', model: User },
    { name: 'Composer', model: Composer },
    { name: 'Transaction', model: Transaction }
  ];
  
  for (const collection of collections) {
    try {
      const indexes = await collection.model.collection.getIndexes();
      console.log(`\n${collection.name} Collection Indexes:`);
      Object.keys(indexes).forEach(indexName => {
        const indexKeys = Object.keys(indexes[indexName]);
        console.log(`  - ${indexName}: [${indexKeys.join(', ')}]`);
      });
    } catch (error) {
      console.log(`  - Error getting indexes for ${collection.name}: ${error.message}`);
    }
  }
};

// Function to analyze query performance
const analyzeQueryPerformance = async () => {
  console.log('\n🔍 Analyzing Query Performance...');
  
  try {
    await connectDB();
    
    // Test common queries
    const queries = [
      {
        name: 'Products by category',
        query: async () => {
          const result = await Product.find({ category: 'traditional' }).explain('executionStats');
          return result.executionStats;
        }
      },
      {
        name: 'Products sorted by date',
        query: async () => {
          const result = await Product.find({}).sort({ createdAt: -1 }).limit(10).explain('executionStats');
          return result.executionStats;
        }
      },
      {
        name: 'User by email',
        query: async () => {
          const result = await User.findOne({ email: 'admin@acapubweb.com' }).explain('executionStats');
          return result.executionStats;
        }
      },
      {
        name: 'Transactions by status',
        query: async () => {
          const result = await Transaction.find({ status: 'completed' }).explain('executionStats');
          return result.executionStats;
        }
      },
      {
        name: 'Popular products (by sold)',
        query: async () => {
          const result = await Product.find({}).sort({ sold: -1 }).limit(5).explain('executionStats');
          return result.executionStats;
        }
      }
    ];
    
    for (const testQuery of queries) {
      try {
        const stats = await testQuery.query();
        console.log(`\n${testQuery.name}:`);
        console.log(`  - Execution Time: ${stats.executionTimeMillis}ms`);
        console.log(`  - Documents Examined: ${stats.totalDocsExamined}`);
        console.log(`  - Documents Returned: ${stats.totalDocsReturned}`);
        console.log(`  - Index Used: ${stats.totalDocsExamined === stats.totalDocsReturned ? 'Yes' : 'Partial'}`);
      } catch (error) {
        console.log(`  - Error testing ${testQuery.name}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Query analysis failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Main execution
const command = process.argv[2];

switch (command) {
  case 'optimize':
    optimizeDatabase();
    break;
  case 'analyze':
    analyzeQueryPerformance();
    break;
  default:
    console.log('Usage:');
    console.log('  node scripts/optimizeDatabase.js optimize  - Create database indexes');
    console.log('  node scripts/optimizeDatabase.js analyze   - Analyze query performance');
}

export { optimizeDatabase, analyzeQueryPerformance };