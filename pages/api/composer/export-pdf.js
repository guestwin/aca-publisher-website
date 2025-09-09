import { connectDB } from '../../../lib/db';
import Transaction from '../../../models/Transaction';
import Product from '../../../models/Product';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Simple PDF generation function (you can replace with puppeteer or jsPDF for better results)
const generatePDFContent = (data, composer, period) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPeriodText = (period) => {
    switch (period) {
      case 'thisMonth': return 'Bulan Ini';
      case 'lastMonth': return 'Bulan Lalu';
      case 'thisYear': return 'Tahun Ini';
      case 'lastYear': return 'Tahun Lalu';
      case 'all': return 'Semua Waktu';
      default: return 'Periode Tertentu';
    }
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laporan Keuangan - ${composer.name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4F46E5;
            margin: 0;
            font-size: 28px;
        }
        .header h2 {
            color: #666;
            margin: 5px 0;
            font-size: 18px;
            font-weight: normal;
        }
        .composer-info {
            background: #F8FAFC;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h3 {
            color: #374151;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #E5E7EB;
        }
        th {
            background: #F9FAFB;
            font-weight: 600;
            color: #374151;
        }
        .text-right {
            text-align: right;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #E5E7EB;
            padding-top: 20px;
        }
        @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LAPORAN KEUANGAN KOMPOSER</h1>
        <h2>${composer.name}</h2>
        <p>Periode: ${getPeriodText(period)}</p>
        <p>Tanggal Cetak: ${formatDate(new Date())}</p>
    </div>

    <div class="composer-info">
        <h3>Informasi Komposer</h3>
        <p><strong>Nama:</strong> ${composer.name}</p>
        <p><strong>Email:</strong> ${composer.email}</p>
        <p><strong>Bergabung:</strong> ${formatDate(composer.createdAt)}</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">${formatCurrency(data.totalEarnings)}</div>
            <div class="stat-label">Total Pendapatan</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${formatCurrency(data.monthlyEarnings)}</div>
            <div class="stat-label">Pendapatan Periode Ini</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.totalSales}</div>
            <div class="stat-label">Total Penjualan</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.monthlySales}</div>
            <div class="stat-label">Penjualan Periode Ini</div>
        </div>
    </div>

    <div class="section">
        <h3>Produk Terlaris</h3>
        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Judul Produk</th>
                    <th class="text-right">Penjualan</th>
                    <th class="text-right">Pendapatan</th>
                </tr>
            </thead>
            <tbody>
                ${data.topProducts.map((product, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${product.title}</td>
                    <td class="text-right">${product.sales} item</td>
                    <td class="text-right">${formatCurrency(product.earnings)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h3>Transaksi Terbaru</h3>
        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>Produk</th>
                    <th class="text-right">Jumlah</th>
                    <th class="text-right">Pendapatan</th>
                </tr>
            </thead>
            <tbody>
                ${data.recentTransactions.map(transaction => `
                <tr>
                    <td>${formatDate(transaction.date)}</td>
                    <td>${transaction.productTitle}</td>
                    <td class="text-right">${transaction.quantity} item</td>
                    <td class="text-right">${formatCurrency(transaction.amount)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h3>Grafik Pendapatan (12 Bulan Terakhir)</h3>
        <table>
            <thead>
                <tr>
                    <th>Bulan</th>
                    <th class="text-right">Pendapatan</th>
                </tr>
            </thead>
            <tbody>
                ${data.earningsChart.map(item => `
                <tr>
                    <td>${item.month}</td>
                    <td class="text-right">${formatCurrency(item.earnings)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Laporan ini dibuat secara otomatis oleh sistem ACA Publisher</p>
        <p>© ${new Date().getFullYear()} ACA Publisher. Semua hak dilindungi.</p>
    </div>
</body>
</html>
  `;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const { period = 'thisMonth' } = req.body;

    // Get financial data (reuse logic from financial-report.js)
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

    // Calculate financial data (simplified version)
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

    // Calculate totals
    allTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (productIds.some(id => id.toString() === item.productId._id.toString())) {
          const earnings = item.price * item.quantity * 0.7;
          totalEarnings += earnings;
          totalSales += item.quantity;

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

    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (productIds.some(id => id.toString() === item.productId._id.toString())) {
          const earnings = item.price * item.quantity * 0.7;
          monthlyEarnings += earnings;
          monthlySales += item.quantity;

          recentTransactions.push({
            productTitle: item.productId.title,
            amount: earnings,
            date: transaction.createdAt,
            quantity: item.quantity
          });
        }
      });
    });

    recentTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const limitedRecentTransactions = recentTransactions.slice(0, 10);

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    // Generate earnings chart data
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

    const financialData = {
      totalEarnings,
      monthlyEarnings,
      totalSales,
      monthlySales,
      topProducts,
      recentTransactions: limitedRecentTransactions,
      earningsChart
    };

    // Generate PDF content
    const htmlContent = generatePDFContent(financialData, composer, period);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-keuangan-${composer.name}-${period}.html"`);
    
    // For now, return HTML that can be printed as PDF
    // In production, you might want to use puppeteer to generate actual PDF
    res.status(200).send(htmlContent);

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}