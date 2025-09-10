/**
 * Halaman pending pembayaran
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FaClock, FaInfoCircle, FaHome, FaReceipt, FaRefresh } from 'react-icons/fa';

const PaymentPendingPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { order_id } = router.query;
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (order_id && session) {
      fetchTransactionDetails();
    }
  }, [order_id, session]);

  // Auto refresh status every 30 seconds
  useEffect(() => {
    if (transaction && transaction.status === 'pending') {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [transaction]);

  // Countdown timer
  useEffect(() => {
    if (transaction?.expiryTime) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(transaction.expiryTime).getTime();
        const difference = expiry - now;

        if (difference > 0) {
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          
          setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeLeft('Expired');
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [transaction]);

  const fetchTransactionDetails = async () => {
    try {
      const response = await fetch(`/api/payment/status/${order_id}`);
      const result = await response.json();

      if (result.success) {
        setTransaction(result.data);
        
        // Redirect if payment is already completed
        if (result.data.status === 'success') {
          router.push(`/payment/success?order_id=${order_id}`);
        } else if (result.data.status === 'failed') {
          router.push(`/payment/error?order_id=${order_id}`);
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

  const checkPaymentStatus = async () => {
    if (checking) return;
    
    setChecking(true);
    try {
      const response = await fetch(`/api/payment/status/${order_id}`);
      const result = await response.json();

      if (result.success) {
        setTransaction(result.data);
        
        // Redirect if status changed
        if (result.data.status === 'success') {
          router.push(`/payment/success?order_id=${order_id}`);
        } else if (result.data.status === 'failed') {
          router.push(`/payment/error?order_id=${order_id}`);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setChecking(false);
    }
  };

  const getPaymentInstructions = (paymentType) => {
    const instructions = {
      'bank_transfer': 'Silakan lakukan transfer ke nomor virtual account yang telah diberikan.',
      'echannel': 'Gunakan kode pembayaran di ATM Mandiri atau internet banking.',
      'bca_va': 'Transfer ke nomor virtual account BCA yang telah diberikan.',
      'bni_va': 'Transfer ke nomor virtual account BNI yang telah diberikan.',
      'bri_va': 'Transfer ke nomor virtual account BRI yang telah diberikan.',
      'permata_va': 'Transfer ke nomor virtual account Permata yang telah diberikan.',
      'gopay': 'Selesaikan pembayaran melalui aplikasi GoPay Anda.',
      'shopeepay': 'Selesaikan pembayaran melalui aplikasi ShopeePay Anda.',
      'qris': 'Scan kode QR dengan aplikasi pembayaran digital Anda.',
      'credit_card': 'Pembayaran kartu kredit sedang diproses.'
    };

    return instructions[paymentType] || 'Silakan selesaikan pembayaran sesuai metode yang dipilih.';
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
        <title>Menunggu Pembayaran - ACA Publisher</title>
        <meta name="description" content="Pembayaran sedang diproses" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Pending Header */}
          <div className="text-center mb-8">
            <div className="bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <FaClock className="w-12 h-12 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Menunggu Pembayaran
            </h1>
            <p className="text-gray-600">
              Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran untuk melanjutkan.
            </p>
          </div>

          {/* Timer */}
          {timeLeft && timeLeft !== 'Expired' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-center">
              <h2 className="text-lg font-bold mb-2">Waktu Pembayaran Tersisa</h2>
              <div className="text-3xl font-mono font-bold text-red-600">
                {timeLeft}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Selesaikan pembayaran sebelum waktu habis
              </p>
            </div>
          )}

          {timeLeft === 'Expired' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-center">
              <h2 className="text-lg font-bold text-red-800 mb-2">Waktu Pembayaran Habis</h2>
              <p className="text-red-700">
                Maaf, waktu pembayaran telah habis. Silakan buat pesanan baru.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Transaction Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <FaReceipt className="mr-2 text-blue-600" />
                  Detail Transaksi
                </h2>
                <button
                  onClick={checkPaymentStatus}
                  disabled={checking}
                  className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  <FaRefresh className={`mr-1 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Checking...' : 'Refresh'}
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{transaction?.orderId}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Menunggu Pembayaran
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pembayaran:</span>
                  <span className="font-bold text-lg text-blue-600">
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
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaInfoCircle className="mr-2 text-blue-600" />
                Instruksi Pembayaran
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    {getPaymentInstructions(transaction?.paymentDetails?.paymentType)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Langkah selanjutnya:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    <li>Selesaikan pembayaran sesuai metode yang dipilih</li>
                    <li>Tunggu konfirmasi pembayaran (biasanya 1-5 menit)</li>
                    <li>Anda akan diarahkan ke halaman sukses secara otomatis</li>
                    <li>Download partitur akan tersedia setelah pembayaran berhasil</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Purchased Items */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">
              Partitur yang Dibeli
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
          </div>

          {/* Auto Refresh Notice */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <FaInfoCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-green-800">Pembaruan Otomatis</h3>
                <p className="text-sm text-green-700 mt-1">
                  Halaman ini akan memperbarui status pembayaran secara otomatis setiap 30 detik. 
                  Anda tidak perlu me-refresh halaman secara manual.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={checkPaymentStatus}
              disabled={checking}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FaRefresh className={`mr-2 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Mengecek...' : 'Cek Status Pembayaran'}
            </button>
            
            <Link href="/">
              <a className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                <FaHome className="mr-2" />
                Kembali ke Beranda
              </a>
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Mengalami kesulitan? Hubungi kami di{' '}
              <a href="mailto:support@acapublisher.com" className="text-blue-600 hover:underline">
                support@acapublisher.com
              </a>
              {' '}atau WhatsApp{' '}
              <a href="https://wa.me/6281234567890" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                +62 812-3456-7890
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPendingPage;