import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Checkout() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCart();
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    choirName: '',
    paymentMethod: 'midtrans'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      // Check for JWT token in localStorage
      const token = localStorage.getItem('token');
      const authenticated = !!token;
      setIsUserAuthenticated(authenticated);
      setAuthLoading(false);
      
      if (!authenticated) {
        router.push('/auth?redirect=/checkout');
        return;
      }
    };
    
    checkAuth();
  }, [router]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nama harus diisi';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon harus diisi';
    } else if (!/^[0-9]{10,13}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Format nomor telepon tidak valid';
    }
    if (!formData.choirName.trim()) {
      newErrors.choirName = 'Nama paduan suara harus diisi';
    }
    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    try {
      // Prepare items for payment
      const paymentItems = items.map(item => ({
        productId: item.id,
        quantity: item.quantity || 1,
        price: item.price
      }));

      // Create payment transaction
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: paymentItems,
          customerDetails: {
            firstName: formData.name.split(' ')[0] || formData.name,
            lastName: formData.name.split(' ').slice(1).join(' ') || '',
            email: formData.email,
            phone: formData.phone,
            choirName: formData.choirName
          }
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Gagal membuat transaksi');
      }

      // Load Midtrans Snap
      if (typeof window !== 'undefined' && window.snap) {
        window.snap.pay(result.data.token, {
          onSuccess: function(result) {
            toast.success('Pembayaran berhasil!');
            clearCart();
            localStorage.removeItem('cart');
            router.push(`/payment/success?order_id=${result.order_id}`);
          },
          onPending: function(result) {
            toast.info('Pembayaran pending, silakan selesaikan pembayaran');
            router.push(`/payment/pending?order_id=${result.order_id}`);
          },
          onError: function(result) {
            toast.error('Pembayaran gagal');
            router.push(`/payment/error?order_id=${result.order_id}`);
          },
          onClose: function() {
            toast.info('Pembayaran dibatalkan');
          }
        });
      } else {
        // Fallback: redirect to Midtrans page
        window.location.href = result.data.redirectUrl;
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? `Rp${price.toLocaleString('id-ID')}` : 'Rp0';
  };

  const total = getCartTotal();
  const tax = total * 0.11;
  const grandTotal = total + tax;

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    if (typeof window !== 'undefined') {
      router.push('/cart');
    }
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Checkout - ACA Publisher</title>
        <meta name="description" content="Checkout partitur musik digital" />
        <meta name="robots" content="noindex, nofollow" />
        <script
          type="text/javascript"
          src={`https://app.${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? '' : 'sandbox.'}midtrans.com/snap/snap.js`}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        ></script>
      </Head>
      <Navbar />
      
      <main className="flex-grow bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Content goes here */}
        </div>
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
            <p className="text-gray-600 text-sm sm:text-base">Lengkapi informasi untuk menyelesaikan pembelian</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900">Informasi Pembeli</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm sm:text-base ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Masukkan nama lengkap"
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm sm:text-base ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="nama@email.com"
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Nomor Telepon *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm sm:text-base ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="08xxxxxxxxxx"
                      />
                      {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                    </div>

                    <div>
                      <label htmlFor="choirName" className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Paduan Suara
                      </label>
                      <input
                        type="text"
                        id="choirName"
                        name="choirName"
                        value={formData.choirName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm sm:text-base ${errors.choirName ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Opsional"
                      />
                      {errors.choirName && <p className="mt-1 text-sm text-red-500">{errors.choirName}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Metode Pembayaran
                    </label>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="flex items-start mb-2">
                        <input
                          type="radio"
                          id="midtrans"
                          name="paymentMethod"
                          value="midtrans"
                          checked={formData.paymentMethod === 'midtrans'}
                          onChange={handleInputChange}
                          className="mr-3 mt-1 text-blue-600 flex-shrink-0"
                        />
                        <div>
                          <label htmlFor="midtrans" className="font-medium text-gray-900 text-sm sm:text-base">
                            Pembayaran Digital
                          </label>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Kartu Kredit/Debit, Virtual Account, GoPay, ShopeePay, QRIS
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className={`w-full py-3 sm:py-4 px-6 rounded-lg text-white font-medium transition-colors relative overflow-hidden text-sm sm:text-base ${isSubmitting || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800'}`}
                  >
                    {(isSubmitting || loading) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Memproses...</span>
                      </div>
                    )}
                    <span className={(isSubmitting || loading) ? 'invisible' : 'visible'}>
                      Lanjutkan Pembayaran
                    </span>
                  </button>
                </form>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 sticky top-4">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900">Ringkasan Pesanan</h2>
                
                <div className="space-y-4 mb-6">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1 pr-2">
                        <h3 className="font-medium text-gray-900 text-xs sm:text-sm">{item.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">{item.arrangement}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-medium text-gray-900 text-xs sm:text-sm">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Pajak (11%)</span>
                    <span className="text-gray-900">{formatPrice(tax)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-base sm:text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 text-center">
                    🔒 Pembayaran aman dengan enkripsi SSL
                  </p>
                </div>
              </div>
            </div>
        </div>
      </main>

      <Footer />
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Memproses Pembayaran</h3>
            <p className="text-gray-600 text-sm">Mohon tunggu, jangan tutup halaman ini...</p>
            <div className="mt-4 bg-gray-100 rounded-full h-2">
              <div className="bg-gray-900 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}