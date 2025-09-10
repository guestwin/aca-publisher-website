# Automated Workflows - ACA Publisher System

## Overview
Sistem automated workflow yang komprehensif untuk mengelola berbagai tugas otomatis dalam aplikasi ACA Publisher, termasuk cron jobs, queue system, backup, monitoring, dan maintenance.

## 🏗️ Arsitektur Sistem

### Core Components
1. **TaskScheduler** (`lib/scheduler.js`) - Mengelola semua cron jobs
2. **QueueSystem** (`lib/queueSystem.js`) - Background processing untuk tasks berat
3. **BackupService** (`lib/backupService.js`) - Automated database backup
4. **FileCleanupService** (`lib/fileCleanup.js`) - Pembersihan file otomatis
5. **EmailCampaignService** (`lib/emailCampaignService.js`) - Email marketing automation
6. **ReportGenerator** (`lib/reportGenerator.js`) - Automated report generation
7. **SEOMonitoringService** (`lib/seoMonitoring.js`) - SEO performance monitoring

## 📅 Scheduled Tasks

### Daily Tasks
- **01:00** - File Cleanup (temp files, logs, orphaned uploads)
- **02:00** - SEO Generation (sitemap.xml, robots.txt)
- **04:00** - Database Backup (MongoDB dump dengan compression)

### Hourly Tasks
- **Setiap jam** - Email Campaign Processing
- **Setiap 10 menit** - Queue Health Check
- **Setiap 30 menit** - System Health Monitoring
- **Setiap 4 jam** - SEO Performance Monitoring

### Weekly Tasks
- **Senin 06:00** - Weekly Reports Generation
- **Minggu 03:00** - Database Optimization
- **Sabtu 05:00** - Backup Cleanup (hapus backup lama)

### Monthly Tasks
- **Tanggal 1, 07:00** - Comprehensive Monthly Reports

## 🚀 Getting Started

### 1. Installation
```bash
# Install dependencies
npm install node-cron bull mongodb-tools
```

### 2. Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/acapub

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin
ADMIN_EMAIL=admin@acapub.com

# Backup
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30

# SEO Monitoring
SEO_MONITORING_URL=https://your-domain.com
SEO_ALERT_THRESHOLD=80
```

### 3. Manual Initialization
```javascript
// In your main app file (e.g., server.js)
const TaskScheduler = require('./lib/scheduler');
const QueueSystem = require('./lib/queueSystem');

// Start scheduler
const scheduler = new TaskScheduler();
scheduler.start();

// Start queue processing
const queue = new QueueSystem();
queue.startProcessing();
```

## 📊 Monitoring & Alerts

### System Health Monitoring
- **Memory Usage**: Alert jika > 500MB
- **Uptime Tracking**: Log setiap 30 menit
- **Queue Status**: Monitor job processing
- **Database Performance**: Weekly optimization

### SEO Monitoring
- **Page Load Time**: Target < 3 detik
- **SEO Score**: Target > 80
- **Accessibility**: WCAG compliance check
- **Mobile Responsiveness**: Automated testing

### Email Alerts
- High memory usage
- Failed backups
- SEO performance degradation
- Queue processing errors

## 🔧 Manual Operations

### Database Backup
```bash
# Create manual backup
node -e "require('./lib/backupService').createBackup()"

# List all backups
node -e "require('./lib/backupService').listBackups()"

# Restore from backup
node -e "require('./lib/backupService').restoreBackup('backup-filename')"
```

### File Cleanup
```bash
# Run full cleanup
node -e "require('./lib/fileCleanup').runFullCleanup()"

# Get cleanup report
node -e "require('./lib/fileCleanup').generateCleanupReport()"
```

### Report Generation
```bash
# Generate sales report
node -e "require('./lib/reportGenerator').generateSalesReport('monthly', 'pdf')"

# Generate dashboard report
node -e "require('./lib/reportGenerator').generateDashboardReport('weekly', 'csv')"
```

### SEO Monitoring
```bash
# Run SEO check
node -e "require('./lib/seoMonitoring').runSEOMonitoring()"
```

## 📈 Queue System

### Supported Job Types
1. **email** - Email sending (notifications, campaigns)
2. **pdf** - PDF processing (watermarking, generation)
3. **notification** - Push notifications (WhatsApp, SMS)
4. **report** - Report generation
5. **backup** - Database backup operations
6. **cleanup** - File cleanup operations

### Adding Jobs to Queue
```javascript
const { addJob } = require('./lib/queueSystem');

// Add email job
await addJob('email', {
  type: 'campaign',
  recipients: ['user@example.com'],
  template: 'newsletter',
  data: { name: 'John Doe' }
}, { priority: 1 });

// Add PDF processing job
await addJob('pdf', {
  type: 'watermark',
  filePath: '/path/to/file.pdf',
  watermarkText: 'ACA Publisher'
}, { priority: 2 });
```

## 🔒 Security Considerations

1. **Backup Encryption**: Backups dikompresi dan dapat dienkripsi
2. **Access Control**: Hanya admin yang dapat mengakses backup dan reports
3. **Environment Variables**: Semua credentials disimpan dalam env vars
4. **File Permissions**: Temporary files dibersihkan secara berkala
5. **Error Handling**: Comprehensive error logging dan alerting

## 📝 Logging

Semua automated workflows menggunakan structured logging:
- **Info**: Task execution status
- **Warning**: Performance issues, high resource usage
- **Error**: Failed operations, system errors
- **Debug**: Detailed execution information

## 🛠️ Troubleshooting

### Common Issues

1. **Scheduler tidak berjalan**
   ```bash
   # Check if scheduler is initialized
   console.log(scheduler.getStatus());
   ```

2. **Queue jobs stuck**
   ```bash
   # Check queue status
   console.log(await queue.getQueueStats());
   ```

3. **Backup gagal**
   ```bash
   # Check backup directory permissions
   # Verify MongoDB connection
   # Check disk space
   ```

4. **High memory usage**
   ```bash
   # Check running processes
   # Review queue job processing
   # Monitor file cleanup execution
   ```

## 🔄 Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Review backup integrity
2. **Monthly**: Analyze system performance reports
3. **Quarterly**: Update monitoring thresholds
4. **Annually**: Review and optimize cron schedules

### Performance Optimization
- Monitor queue processing times
- Optimize database queries in reports
- Review file cleanup efficiency
- Adjust backup compression settings

## 📞 Support

Untuk issues atau pertanyaan terkait automated workflows:
1. Check logs di `logs/` directory
2. Review system health reports
3. Contact system administrator

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: ACA Publisher Development Team