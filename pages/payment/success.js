/**
 * Halaman sukses pembayaran
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FaCheckCircle, FaDownload, FaEnvelope, FaHome, FaReceipt } from 'react-icons/fa';

const PaymentSuccessPage = () => {
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

  const handleDownload = async (downloadLink) => {
    try {
      const response = await fetch(downloadLink.downloadUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadLink.fileName || `${downloadLink.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Gagal mengunduh file');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Gagal mengunduh file. Silakan coba lagi atau hubungi support.');
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
        <title>Pembayaran Berhasil - ACA Publisher</title>
        <meta name="description" content="Pembayaran berhasil diproses" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pembayaran Berhasil!
            </h1>
            <p className="text-gray-600">
              Terima kasih atas pembelian Anda. Transaksi telah berhasil diproses.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Transaction Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaReceipt className="mr-2 text-blue-600" />
                Detail Transaksi
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{transaction?.orderId}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {transaction?.status === 'success' ? 'Berhasil' : transaction?.status}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pembayaran:</span>
                  <span className="font-bold text-lg text-green-600">
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

            {/* Purchased Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
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
          </div>

          {/* Download Section */}
          {transaction?.downloadLinks && transaction.downloadLinks.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaDownload className="mr-2 text-green-600" />
                Download Partitur
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Penting:</strong> Link download berlaku hingga {' '}
                  {transaction.downloadExpiryDate ? new Date(transaction.downloadExpiryDate).toLocaleDateString('id-ID') : '30 hari'}.
                  Silakan simpan file partitur di perangkat Anda.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transaction.downloadLinks.map((downloadLink, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium mb-2">{downloadLink.title}</h3>
                    <button
                      onClick={() => handleDownload(downloadLink)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <FaDownload className="mr-2" />
                      Download PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Notification */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <FaEnvelope className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-yellow-800">Email Konfirmasi</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Kami telah mengirimkan email konfirmasi beserta link download ke {' '}
                  <strong>{transaction?.customerDetails?.email}</strong>. 
                  Jika tidak menerima email dalam 10 menit, periksa folder spam Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/catalog">
              <a className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Belanja Lagi
              </a>
            </Link>
            
            <Link href="/purchase-history">
              <a className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                <FaReceipt className="mr-2" />
                Riwayat Pembelian
              </a>
            </Link>
            
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
              Butuh bantuan? Hubungi kami di{' '}
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

export default PaymentSuccessPage;