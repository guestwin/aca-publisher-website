/**
 * Halaman error pembayaran
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FaExclamationTriangle, FaHome, FaReceipt, FaRedo, FaEnvelope, FaWhatsapp } from 'react-icons/fa';

const PaymentErrorPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { order_id } = router.query;
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (order_id && session) {
      fetchTransactionDetails();
    }
  }, [order_id, session]);

  const fetchTransactionDetails = async () => {
    try {
      const response = await fetch(`/api/payment/status/${order_id}`);
      const result = await response.json();

      if (result.success) {
        setTransaction(result.data);
        
        // Redirect if payment is actually successful
        if (result.data.status === 'success') {
          router.push(`/payment/success?order_id=${order_id}`);
        } else if (result.data.status === 'pending') {
          router.push(`/payment/pending?order_id=${order_id}`);
        }
      } else {
        setError(result.message || 'Transaksi tidak ditemukan');
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      setError('Gagal memuat detail transaksi');
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (failureReason) => {
    const errorMessages = {
      'insufficient_funds': 'Saldo tidak mencukupi untuk menyelesaikan transaksi.',
      'card_declined': 'Kartu ditolak oleh bank penerbit.',
      'expired_card': 'Kartu telah kedaluwarsa.',
      'invalid_card': 'Nomor kartu tidak valid.',
      'transaction_timeout': 'Transaksi melebihi batas waktu yang ditentukan.',
      'bank_network_error': 'Terjadi gangguan pada jaringan bank.',
      'user_cancelled': 'Pembayaran dibatalkan oleh pengguna.',
      'fraud_detection': 'Transaksi ditolak karena terdeteksi sebagai aktivitas mencurigakan.',
      'invalid_merchant': 'Merchant tidak valid atau tidak aktif.',
      'system_error': 'Terjadi kesalahan sistem saat memproses pembayaran.'
    };

    return errorMessages[failureReason] || 'Pembayaran gagal diproses. Silakan coba lagi atau hubungi customer service.';
  };

  const handleRetryPayment = () => {
    // Redirect to checkout with the same items
    if (transaction?.items) {
      // Store items in localStorage for checkout
      localStorage.setItem('retryCartItems', JSON.stringify(transaction.items));
      router.push('/checkout');
    } else {
      router.push('/catalog');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Head>
          <title>Error - ACA Publisher</title>
        </Head>
        
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/">
              <a className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <FaHome className="mr-2" />
                Kembali ke Beranda
              </a>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Pembayaran Gagal - ACA Publisher</title>
        <meta name="description" content="Pembayaran tidak berhasil diproses" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Error Header */}
          <div className="text-center mb-8">
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pembayaran Gagal
            </h1>
            <p className="text-gray-600">
              Maaf, pembayaran Anda tidak dapat diproses. Silakan coba lagi atau hubungi customer service.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Transaction Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaReceipt className="mr-2 text-red-600" />
                Detail Transaksi
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{transaction?.orderId}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Gagal
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pembayaran:</span>
                  <span className="font-bold text-lg text-red-600">
                    Rp {transaction?.totalAmount?.toLocaleString('id-ID')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="font-medium">
                    {transaction?.createdAt ? new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Metode Pembayaran:</span>
                  <span className="font-medium capitalize">
                    {transaction?.paymentDetails?.paymentType || 'Digital Payment'}
                  </span>
                </div>
                
                {transaction?.failureReason && (
                  <div className="pt-3 border-t">
                    <span className="text-gray-600 block mb-1">Alasan Kegagalan:</span>
                    <span className="text-red-600 font-medium">
                      {transaction.failureReason}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaExclamationTriangle className="mr-2 text-red-600" />
                Informasi Kesalahan
              </h2>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    {getErrorMessage(transaction?.failureReason)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Kemungkinan Penyebab:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Saldo atau limit kartu tidak mencukupi</li>
                    <li>Informasi kartu tidak valid atau kedaluwarsa</li>
                    <li>Gangguan jaringan saat proses pembayaran</li>
                    <li>Pembayaran dibatalkan atau timeout</li>
                    <li>Sistem keamanan bank menolak transaksi</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Solusi yang Disarankan:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Periksa saldo atau limit kartu Anda</li>
                    <li>Pastikan informasi kartu sudah benar</li>
                    <li>Coba gunakan metode pembayaran lain</li>
                    <li>Hubungi bank penerbit kartu Anda</li>
                    <li>Coba lagi setelah beberapa saat</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Failed Items */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">
              Partitur yang Gagal Dibeli
            </h2>
            
            <div className="space-y-4">
              {transaction?.items?.map((item, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0">
                  <h3 className="font-medium">{item.title}</h3>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>Qty: {item.quantity}</span>
                    <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Catatan:</strong> Item-item di atas masih tersedia untuk dibeli. 
                Anda dapat mencoba melakukan pembelian ulang dengan metode pembayaran yang berbeda.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRetryPayment}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaRedo className="mr-2" />
              Coba Lagi
            </button>
            
            <Link href="/catalog">
              <a className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                Lihat Katalog Lainnya
              </a>
            </Link>
            
            <Link href="/">
              <a className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                <FaHome className="mr-2" />
                Kembali ke Beranda
              </a>
            </Link>
          </div>

          {/* Customer Support */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">
              Butuh Bantuan?
            </h2>
            
            <p className="text-blue-800 mb-4">
              Tim customer service kami siap membantu Anda menyelesaikan masalah pembayaran. 
              Jangan ragu untuk menghubungi kami melalui:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="mailto:support@acapublisher.com?subject=Bantuan Pembayaran Gagal - Order ID: ${transaction?.orderId}"
                className="inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaEnvelope className="mr-2" />
                Email Support
              </a>
              
              <a
                href={`https://wa.me/6281234567890?text=Halo, saya mengalami masalah pembayaran dengan Order ID: ${transaction?.orderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <FaWhatsapp className="mr-2" />
                WhatsApp
              </a>
            </div>
            
            <div className="mt-4 text-sm text-blue-700">
              <p><strong>Jam Operasional:</strong></p>
              <p>Senin - Jumat: 09:00 - 18:00 WIB</p>
              <p>Sabtu: 09:00 - 15:00 WIB</p>
              <p>Minggu: Libur</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">
              Pertanyaan Umum
            </h2>
            
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-medium mb-2">Apakah uang saya akan dikembalikan?</h3>
                <p className="text-sm text-gray-600">
                  Jika pembayaran gagal, tidak ada dana yang akan dipotong dari rekening Anda. 
                  Jika ada hold/pending di kartu kredit, biasanya akan dilepas dalam 1-3 hari kerja.
                </p>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="font-medium mb-2">Bisakah saya menggunakan metode pembayaran lain?</h3>
                <p className="text-sm text-gray-600">
                  Ya, Anda dapat mencoba kembali dengan metode pembayaran yang berbeda seperti 
                  transfer bank, e-wallet, atau kartu kredit/debit lainnya.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Berapa lama saya harus menunggu sebelum mencoba lagi?</h3>
                <p className="text-sm text-gray-600">
                  Anda dapat mencoba lagi segera. Namun jika masalah terkait dengan bank atau kartu, 
                  disarankan menunggu 15-30 menit atau hubungi bank penerbit terlebih dahulu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentErrorPage;