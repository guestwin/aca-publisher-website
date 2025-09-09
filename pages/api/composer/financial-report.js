import { connectDB } from '../../../lib/db';
import Transaction from '../../../models/Transaction';
import Product from '../../../models/Product';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify composer token
    const token = req.cookies.composer_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    await connectDB();
    const composer = await User.findById(decoded.userId);
    
    if (!composer || composer.role !== 'composer') {
      return res.status(401).json({ message: 'Akses ditolak' });
    }

    const { period = 'thisMonth' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01');
        endDate = now;
        break;
    }

    // Get composer's products
    const composerProducts = await Product.find({ composer: composer._id });
    const productIds = composerProducts.map(p => p._id);

    // Get transactions for composer's products
    const transactions = await Transaction.find({
      'items.productId': { $in: productIds },
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('items.productId');

    // Calculate total earnings (all time)
    const allTransactions = await Transaction.find({
      'items.productId': { $in: productIds },
      status: 'completed'
    }).populate('items.productId');

    let totalEarnings = 0;
    let monthlyEarnings = 0;
    let totalSales = 0;
    let monthlySales = 0;
    const productStats = {};
    const recentTransactions = [];

    // Calculate all-time totals
    allTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (productIds.some(id => id.toString() === item.productId._id.toString())) {
          const earnings = item.price * item.quantity * 0.7; // 70% for composer
          totalEarnings += earnings;
          totalSales += item.quantity;

          // Track product stats
          const productId = item.productId._id.toString();
          if (!productStats[productId]) {
            productStats[productId] = {
              title: item.productId.title,
              sales: 0,
              earnings: 0
            };
          }
          productStats[productId].sales += item.quantity;
          productStats[productId].earnings += earnings;
        }
      });
    });

    // Calculate period-specific totals and recent transactions
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (productIds.some(id => id.toString() === item.productId._id.toString())) {
          const earnings = item.price * item.quantity * 0.7; // 70% for composer
          monthlyEarnings += earnings;
          monthlySales += item.quantity;

          // Add to recent transactions
          recentTransactions.push({
            productTitle: item.productId.title,
            amount: earnings,
            date: transaction.createdAt,
            quantity: item.quantity
          });
        }
      });
    });

    // Sort and limit recent transactions
    recentTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const limitedRecentTransactions = recentTransactions.slice(0, 10);

    // Get top products
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    // Generate earnings chart data (last 12 months)
    const earningsChart = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthTransactions = await Transaction.find({
        'items.productId': { $in: productIds },
        status: 'completed',
        createdAt: { $gte: monthStart, $lte: monthEnd }
      }).populate('items.productId');

      let monthEarnings = 0;
      monthTransactions.forEach(transaction => {
        transaction.items.forEach(item => {
          if (productIds.some(id => id.toString() === item.productId._id.toString())) {
            monthEarnings += item.price * item.quantity * 0.7;
          }
        });
      });

      earningsChart.push({
        month: monthStart.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        earnings: monthEarnings
      });
    }

    res.status(200).json({
      success: true,
      totalEarnings,
      monthlyEarnings,
      totalSales,
      monthlySales,
      topProducts,
      recentTransactions: limitedRecentTransactions,
      earningsChart,
      period,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}