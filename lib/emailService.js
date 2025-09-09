import nodemailer from 'nodemailer';

// Setup email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Template untuk email notifikasi
const emailTemplates = {
  orderConfirmation: (user, order) => ({
    subject: `Konfirmasi Pesanan #${order.id} - ACA Publisher`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Konfirmasi Pesanan</h2>
        <p>Halo ${user.name},</p>
        <p>Terima kasih atas pesanan Anda. Berikut detail pesanan:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Detail Pesanan #${order.id}</h3>
          <p><strong>Total:</strong> Rp ${order.total.toLocaleString('id-ID')}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Tanggal:</strong> ${new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
        </div>
        <p>Kami akan segera memproses pesanan Anda.</p>
        <p>Terima kasih,<br>Tim ACA Publisher</p>
      </div>
    `
  }),

  paymentReceived: (user, transaction) => ({
    subject: `Pembayaran Diterima #${transaction.id} - ACA Publisher`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Pembayaran Diterima</h2>
        <p>Halo ${user.name},</p>
        <p>Pembayaran Anda telah kami terima dan sedang diproses.</p>
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3>Detail Pembayaran #${transaction.id}</h3>
          <p><strong>Jumlah:</strong> Rp ${transaction.amount.toLocaleString('id-ID')}</p>
          <p><strong>Metode:</strong> ${transaction.paymentMethod}</p>
          <p><strong>Status:</strong> Diterima</p>
        </div>
        <p>Pesanan Anda akan segera diproses untuk pengiriman.</p>
        <p>Terima kasih,<br>Tim ACA Publisher</p>
      </div>
    `
  }),

  orderShipped: (user, order, trackingNumber) => ({
    subject: `Pesanan Dikirim #${order.id} - ACA Publisher`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Pesanan Telah Dikirim</h2>
        <p>Halo ${user.name},</p>
        <p>Kabar baik! Pesanan Anda telah dikirim.</p>
        <div style="background-color: #cce5ff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3>Detail Pengiriman #${order.id}</h3>
          <p><strong>Nomor Resi:</strong> ${trackingNumber}</p>
          <p><strong>Estimasi Tiba:</strong> 2-3 hari kerja</p>
        </div>
        <p>Anda dapat melacak paket Anda menggunakan nomor resi di atas.</p>
        <p>Terima kasih,<br>Tim ACA Publisher</p>
      </div>
    `
  }),

  passwordReset: (user, resetUrl) => ({
    subject: 'Reset Password - ACA Publisher',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Password</h2>
        <p>Halo ${user.name},</p>
        <p>Anda telah meminta untuk mereset password akun Anda. Klik tombol di bawah ini untuk mereset password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
        <p>Link ini akan kedaluwarsa dalam 10 menit.</p>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <p>Terima kasih,<br>Tim ACA Publisher</p>
      </div>
    `
  })
};

// Fungsi untuk mengirim email
export const sendEmail = async (to, template, data) => {
  try {
    const transporter = createTransporter();
    const emailContent = emailTemplates[template](data.user, data.order || data.transaction, data.trackingNumber || data.resetUrl);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email ${template} berhasil dikirim ke ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`Error mengirim email ${template}:`, error);
    return { success: false, error: error.message };
  }
};

// Fungsi untuk mengirim notifikasi berdasarkan preferensi user
export const sendNotification = async (user, template, data) => {
  const notifications = [];

  // Kirim email jika user mengaktifkan notifikasi email
  if (user.notificationPreferences?.email) {
    const emailResult = await sendEmail(user.email, template, { user, ...data });
    notifications.push({ type: 'email', ...emailResult });
  }

  // TODO: Implementasi WhatsApp notification jika user mengaktifkan
  if (user.notificationPreferences?.whatsapp && user.phone) {
    // WhatsApp notification akan diimplementasi di whatsappService.js
    console.log(`WhatsApp notification ${template} akan dikirim ke ${user.phone}`);
  }

  return notifications;
};