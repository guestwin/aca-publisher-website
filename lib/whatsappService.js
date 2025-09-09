import axios from 'axios';

// WhatsApp Business API configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// Template pesan WhatsApp
const whatsappTemplates = {
  orderConfirmation: (user, order) => ({
    messaging_product: 'whatsapp',
    to: user.phone,
    type: 'template',
    template: {
      name: 'order_confirmation',
      language: {
        code: 'id'
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: user.name
            },
            {
              type: 'text',
              text: order.id
            },
            {
              type: 'text',
              text: `Rp ${order.total.toLocaleString('id-ID')}`
            }
          ]
        }
      ]
    }
  }),

  paymentReceived: (user, transaction) => ({
    messaging_product: 'whatsapp',
    to: user.phone,
    type: 'template',
    template: {
      name: 'payment_received',
      language: {
        code: 'id'
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: user.name
            },
            {
              type: 'text',
              text: transaction.id
            },
            {
              type: 'text',
              text: `Rp ${transaction.amount.toLocaleString('id-ID')}`
            }
          ]
        }
      ]
    }
  }),

  orderShipped: (user, order, trackingNumber) => ({
    messaging_product: 'whatsapp',
    to: user.phone,
    type: 'template',
    template: {
      name: 'order_shipped',
      language: {
        code: 'id'
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: user.name
            },
            {
              type: 'text',
              text: order.id
            },
            {
              type: 'text',
              text: trackingNumber
            }
          ]
        }
      ]
    }
  }),

  // Fallback untuk pesan teks biasa jika template tidak tersedia
  textMessage: (user, message) => ({
    messaging_product: 'whatsapp',
    to: user.phone,
    type: 'text',
    text: {
      body: message
    }
  })
};

// Fungsi untuk mengirim pesan WhatsApp
export const sendWhatsAppMessage = async (user, template, data) => {
  try {
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.log('WhatsApp API belum dikonfigurasi');
      return { success: false, error: 'WhatsApp API belum dikonfigurasi' };
    }

    if (!user.phone) {
      console.log('User tidak memiliki nomor telepon');
      return { success: false, error: 'User tidak memiliki nomor telepon' };
    }

    // Format nomor telepon (hapus karakter non-digit dan tambahkan kode negara jika perlu)
    let phoneNumber = user.phone.replace(/\D/g, '');
    if (!phoneNumber.startsWith('62')) {
      phoneNumber = '62' + phoneNumber.replace(/^0/, '');
    }

    const messageData = whatsappTemplates[template] ? 
      whatsappTemplates[template](user, data.order || data.transaction, data.trackingNumber) :
      whatsappTemplates.textMessage(user, data.message);

    // Update nomor telepon yang sudah diformat
    messageData.to = phoneNumber;

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`WhatsApp message ${template} berhasil dikirim ke ${phoneNumber}`);
    return { success: true, messageId: response.data.messages[0].id };
  } catch (error) {
    console.error(`Error mengirim WhatsApp message ${template}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Fungsi untuk verifikasi nomor WhatsApp
export const verifyWhatsAppNumber = async (phoneNumber) => {
  try {
    // Format nomor telepon
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.startsWith('62')) {
      formattedNumber = '62' + formattedNumber.replace(/^0/, '');
    }

    // Kirim kode verifikasi (implementasi sederhana)
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    
    const messageData = {
      messaging_product: 'whatsapp',
      to: formattedNumber,
      type: 'text',
      text: {
        body: `Kode verifikasi ACA Publisher Anda: ${verificationCode}. Jangan bagikan kode ini kepada siapa pun.`
      }
    };

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, verificationCode, messageId: response.data.messages[0].id };
  } catch (error) {
    console.error('Error mengirim kode verifikasi WhatsApp:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Fungsi untuk mengirim notifikasi berdasarkan preferensi user (terintegrasi dengan emailService)
export const sendNotificationWhatsApp = async (user, template, data) => {
  if (!user.notificationPreferences?.whatsapp || !user.phone) {
    return { success: false, error: 'WhatsApp notification tidak diaktifkan atau nomor telepon tidak tersedia' };
  }

  return await sendWhatsAppMessage(user, template, data);
};