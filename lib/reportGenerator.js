import { connectDB } from './mongodb.js';
import fs from 'fs/promises';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';

/**
 * Automated Report Generation Service
 * Generates sales, user activity, and system performance reports
 */
class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.templatesDir = path.join(process.cwd(), 'report-templates');
  }

  /**
   * Generate sales report
   */
  async generateSalesReport(period = 'monthly', format = 'pdf') {
    console.log(`📊 Generating sales report (${period}, ${format})...`);
    
    try {
      await connectDB();
      const { Transaction } = await import('../models/Transaction.js');
      const { Product } = await import('../models/Product.js');
      
      const dateRange = this.getDateRange(period);
      
      // Get transaction data
      const transactions = await Transaction.find({
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        status: 'completed'
      }).populate('productId userId');
      
      // Calculate metrics
      const metrics = await this.calculateSalesMetrics(transactions, dateRange);
      
      // Generate report
      const reportData = {
        title: `Sales Report - ${this.formatPeriod(period, dateRange)}`,
        period,
        dateRange,
        metrics,
        transactions: transactions.slice(0, 100), // Limit for performance
        generatedAt: new Date().toISOString()
      };
      
      let filePath;
      if (format === 'pdf') {
        filePath = await this.generatePDFReport(reportData, 'sales');
      } else if (format === 'csv') {
        filePath = await this.generateCSVReport(reportData, 'sales');
      } else {
        filePath = await this.generateJSONReport(reportData, 'sales');
      }
      
      console.log(`✅ Sales report generated: ${filePath}`);
      return { filePath, data: reportData };
      
    } catch (error) {
      console.error(`❌ Failed to generate sales report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate user activity report
   */
  async generateUserActivityReport(period = 'monthly', format = 'pdf') {
    console.log(`👥 Generating user activity report (${period}, ${format})...`);
    
    try {
      await connectDB();
      const { User } = await import('../models/User.js');
      const { Composer } = await import('../models/Composer.js');
      
      const dateRange = this.getDateRange(period);
      
      // Get user data
      const totalUsers = await User.countDocuments();
      const newUsers = await User.countDocuments({
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      });
      
      const activeUsers = await User.countDocuments({
        lastLoginAt: { $gte: dateRange.start, $lte: dateRange.end }
      });
      
      const totalComposers = await Composer.countDocuments();
      const newComposers = await Composer.countDocuments({
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      });
      
      // Calculate metrics
      const metrics = {
        totalUsers,
        newUsers,
        activeUsers,
        totalComposers,
        newComposers,
        userGrowthRate: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(2) : 0,
        userActivityRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0
      };
      
      const reportData = {
        title: `User Activity Report - ${this.formatPeriod(period, dateRange)}`,
        period,
        dateRange,
        metrics,
        generatedAt: new Date().toISOString()
      };
      
      let filePath;
      if (format === 'pdf') {
        filePath = await this.generatePDFReport(reportData, 'user-activity');
      } else {
        filePath = await this.generateJSONReport(reportData, 'user-activity');
      }
      
      console.log(`✅ User activity report generated: ${filePath}`);
      return { filePath, data: reportData };
      
    } catch (error) {
      console.error(`❌ Failed to generate user activity report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate system performance report
   */
  async generateSystemReport(period = 'daily', format = 'json') {
    console.log(`⚙️  Generating system performance report (${period}, ${format})...`);
    
    try {
      const dateRange = this.getDateRange(period);
      
      // Get system metrics
      const metrics = await this.getSystemMetrics();
      
      // Get database stats
      const dbStats = await this.getDatabaseStats();
      
      // Get file system stats
      const fsStats = await this.getFileSystemStats();
      
      const reportData = {
        title: `System Performance Report - ${this.formatPeriod(period, dateRange)}`,
        period,
        dateRange,
        system: metrics,
        database: dbStats,
        filesystem: fsStats,
        generatedAt: new Date().toISOString()
      };
      
      let filePath;
      if (format === 'pdf') {
        filePath = await this.generatePDFReport(reportData, 'system');
      } else {
        filePath = await this.generateJSONReport(reportData, 'system');
      }
      
      console.log(`✅ System report generated: ${filePath}`);
      return { filePath, data: reportData };
      
    } catch (error) {
      console.error(`❌ Failed to generate system report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate comprehensive dashboard report
   */
  async generateDashboardReport(period = 'weekly', format = 'pdf') {
    console.log(`📈 Generating dashboard report (${period}, ${format})...`);
    
    try {
      const dateRange = this.getDateRange(period);
      
      // Get all metrics
      const salesReport = await this.generateSalesReport(period, 'json');
      const userReport = await this.generateUserActivityReport(period, 'json');
      const systemReport = await this.generateSystemReport(period, 'json');
      
      const reportData = {
        title: `Dashboard Report - ${this.formatPeriod(period, dateRange)}`,
        period,
        dateRange,
        summary: {
          sales: salesReport.data.metrics,
          users: userReport.data.metrics,
          system: systemReport.data.system
        },
        generatedAt: new Date().toISOString()
      };
      
      let filePath;
      if (format === 'pdf') {
        filePath = await this.generatePDFReport(reportData, 'dashboard');
      } else {
        filePath = await this.generateJSONReport(reportData, 'dashboard');
      }
      
      console.log(`✅ Dashboard report generated: ${filePath}`);
      return { filePath, data: reportData };
      
    } catch (error) {
      console.error(`❌ Failed to generate dashboard report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate sales metrics
   */
  async calculateSalesMetrics(transactions, dateRange) {
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalTransactions = transactions.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Group by product
    const productSales = {};
    transactions.forEach(t => {
      if (t.productId) {
        const productId = t.productId._id.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            product: t.productId,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productId].quantity += 1;
        productSales[productId].revenue += t.amount || 0;
      }
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Group by date
    const dailySales = {};
    transactions.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { transactions: 0, revenue: 0 };
      }
      dailySales[date].transactions += 1;
      dailySales[date].revenue += t.amount || 0;
    });
    
    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTransactions,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      topProducts,
      dailySales
    };
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    const { performance, os } = await import('perf_hooks');
    
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: Date.now()
    };
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      await connectDB();
      const { default: mongoose } = await import('mongoose');
      
      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        objects: stats.objects
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get file system statistics
   */
  async getFileSystemStats() {
    try {
      const stats = await fs.stat(process.cwd());
      
      // Get directory sizes
      const directories = ['public', 'uploads', 'backups', 'reports', 'logs'];
      const dirStats = {};
      
      for (const dir of directories) {
        try {
          const dirPath = path.join(process.cwd(), dir);
          const dirStat = await this.getDirectorySize(dirPath);
          dirStats[dir] = dirStat;
        } catch (error) {
          dirStats[dir] = { size: 0, files: 0, error: error.message };
        }
      }
      
      return {
        projectRoot: {
          size: stats.size,
          modified: stats.mtime
        },
        directories: dirStats
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get directory size recursively
   */
  async getDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;
    
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.isDirectory()) {
            const subDir = await this.getDirectorySize(filePath);
            totalSize += subDir.size;
            fileCount += subDir.files;
          } else {
            totalSize += stats.size;
            fileCount++;
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be accessed
    }
    
    return {
      size: totalSize,
      sizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      files: fileCount
    };
  }

  /**
   * Generate PDF report
   */
  async generatePDFReport(data, type) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}-report-${timestamp}.pdf`;
    const filePath = path.join(this.reportsDir, filename);
    
    await fs.mkdir(this.reportsDir, { recursive: true });
    
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).text(data.title, 50, 50);
      doc.fontSize(12).text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, 50, 80);
      doc.text(`Period: ${data.period} (${new Date(data.dateRange.start).toLocaleDateString()} - ${new Date(data.dateRange.end).toLocaleDateString()})`, 50, 100);
      
      let yPosition = 140;
      
      // Content based on report type
      if (type === 'sales' && data.metrics) {
        doc.fontSize(16).text('Sales Summary', 50, yPosition);
        yPosition += 30;
        
        doc.fontSize(12)
          .text(`Total Revenue: $${data.metrics.totalRevenue}`, 50, yPosition)
          .text(`Total Transactions: ${data.metrics.totalTransactions}`, 50, yPosition + 20)
          .text(`Average Order Value: $${data.metrics.averageOrderValue}`, 50, yPosition + 40);
        
        yPosition += 80;
        
        if (data.metrics.topProducts && data.metrics.topProducts.length > 0) {
          doc.fontSize(16).text('Top Products', 50, yPosition);
          yPosition += 30;
          
          data.metrics.topProducts.slice(0, 5).forEach((product, index) => {
            doc.fontSize(10)
              .text(`${index + 1}. ${product.product.title} - $${product.revenue} (${product.quantity} sales)`, 50, yPosition);
            yPosition += 15;
          });
        }
      }
      
      if (type === 'user-activity' && data.metrics) {
        doc.fontSize(16).text('User Activity Summary', 50, yPosition);
        yPosition += 30;
        
        doc.fontSize(12)
          .text(`Total Users: ${data.metrics.totalUsers}`, 50, yPosition)
          .text(`New Users: ${data.metrics.newUsers}`, 50, yPosition + 20)
          .text(`Active Users: ${data.metrics.activeUsers}`, 50, yPosition + 40)
          .text(`User Growth Rate: ${data.metrics.userGrowthRate}%`, 50, yPosition + 60)
          .text(`User Activity Rate: ${data.metrics.userActivityRate}%`, 50, yPosition + 80);
      }
      
      if (type === 'system' && data.system) {
        doc.fontSize(16).text('System Performance', 50, yPosition);
        yPosition += 30;
        
        doc.fontSize(12)
          .text(`Uptime: ${Math.round(data.system.uptime / 3600)} hours`, 50, yPosition)
          .text(`Memory Usage: ${Math.round(data.system.memoryUsage.heapUsed / 1024 / 1024)} MB`, 50, yPosition + 20)
          .text(`Platform: ${data.system.platform}`, 50, yPosition + 40)
          .text(`Node Version: ${data.system.nodeVersion}`, 50, yPosition + 60);
      }
      
      doc.end();
      
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  /**
   * Generate CSV report
   */
  async generateCSVReport(data, type) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}-report-${timestamp}.csv`;
    const filePath = path.join(this.reportsDir, filename);
    
    await fs.mkdir(this.reportsDir, { recursive: true });
    
    if (type === 'sales' && data.transactions) {
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'Transaction ID' },
          { id: 'date', title: 'Date' },
          { id: 'amount', title: 'Amount' },
          { id: 'product', title: 'Product' },
          { id: 'user', title: 'User' },
          { id: 'status', title: 'Status' }
        ]
      });
      
      const records = data.transactions.map(t => ({
        id: t._id,
        date: new Date(t.createdAt).toLocaleDateString(),
        amount: t.amount,
        product: t.productId?.title || 'N/A',
        user: t.userId?.email || 'N/A',
        status: t.status
      }));
      
      await csvWriter.writeRecords(records);
    }
    
    return filePath;
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(data, type) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}-report-${timestamp}.json`;
    const filePath = path.join(this.reportsDir, filename);
    
    await fs.mkdir(this.reportsDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    return filePath;
  }

  /**
   * Utility functions
   */
  getDateRange(period) {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'yearly':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }
    
    return { start, end };
  }
  
  formatPeriod(period, dateRange) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return `${dateRange.start.toLocaleDateString('en-US', options)} to ${dateRange.end.toLocaleDateString('en-US', options)}`;
  }

  /**
   * Schedule automated reports
   */
  async scheduleReports() {
    const { addJob } = await import('./queueSystem.js');
    
    // Schedule daily system reports
    await addJob('reports', {
      type: 'system-report',
      data: { period: 'daily', format: 'json' }
    }, { priority: 2 });
    
    // Schedule weekly sales reports
    await addJob('reports', {
      type: 'sales-report',
      data: { period: 'weekly', format: 'pdf' }
    }, { priority: 3 });
    
    // Schedule monthly dashboard reports
    await addJob('reports', {
      type: 'dashboard-report',
      data: { period: 'monthly', format: 'pdf' }
    }, { priority: 4 });
    
    console.log('📅 Automated reports scheduled');
  }
}

// Create service instance
const reportGenerator = new ReportGenerator();

// Export functions
export const generateSalesReport = (period, format) => reportGenerator.generateSalesReport(period, format);
export const generateUserActivityReport = (period, format) => reportGenerator.generateUserActivityReport(period, format);
export const generateSystemReport = (period, format) => reportGenerator.generateSystemReport(period, format);
export const generateDashboardReport = (period, format) => reportGenerator.generateDashboardReport(period, format);
export const scheduleReports = () => reportGenerator.scheduleReports();

export default reportGenerator;

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const reportType = process.argv[2] || 'dashboard';
  const period = process.argv[3] || 'monthly';
  const format = process.argv[4] || 'pdf';
  
  switch (reportType) {
    case 'sales':
      await generateSalesReport(period, format);
      break;
    case 'users':
      await generateUserActivityReport(period, format);
      break;
    case 'system':
      await generateSystemReport(period, format);
      break;
    case 'dashboard':
    default:
      await generateDashboardReport(period, format);
      break;
  }
}