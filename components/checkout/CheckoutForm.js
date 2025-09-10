/**
 * Komponen form checkout untuk proses pembayaran
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { FaCreditCard, FaShoppingCart, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';

const CheckoutForm = ({ cartItems, totalAmount, onPaymentSuccess }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Jakarta',
    postalCode: ''
  });

  // Initialize form with user data
  useEffect(() => {
    if (session?.user) {
      setCustomerDetails(prev => ({
        ...prev,
        firstName: session.user.name?.split(' ')[0] || '',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        email: session.user.email || ''
      }));
    }
  }, [session]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const required = ['firstName', 'email'];
    for (const field of required) {
      if (!customerDetails[field].trim()) {
        toast.error(`${field === 'firstName' ? 'Nama depan' : 'Email'} wajib diisi`);
        return false;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerDetails.email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!cartItems || cartItems.length === 0) {
      toast.error('Keranjang belanja kosong');
      return;
    }

    setLoading(true);

    try {
      // Prepare items for payment
      const items = cartItems.map(item => ({
        productId: item._id,
        quantity: item.quantity || 1,
        price: item.isDiscounted && item.discountPrice ? item.discountPrice : item.price
      }));

      // Create payment transaction
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          customerDetails
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
            if (onPaymentSuccess) {
              onPaymentSuccess(result);
            }
            router.push(`/payment/success?order_id=${result.data.orderId}`);
          },
          onPending: function(result) {
            toast.info('Pembayaran pending, silakan selesaikan pembayaran');
            router.push(`/payment/pending?order_id=${result.data.orderId}`);
          },
          onError: function(result) {
            toast.error('Pembayaran gagal');
            router.push(`/payment/error?order_id=${result.data.orderId}`);
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
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FaShoppingCart className="mr-2 text-blue-600" />
            Ringkasan Pesanan
          </h2>
          
          <div className="space-y-4">
            {cartItems?.map((item, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2">
                <div className="flex-1">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-gray-600">
                    {item.composer?.name || 'Unknown Composer'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Qty: {item.quantity || 1}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    Rp {((item.isDiscounted && item.discountPrice ? item.discountPrice : item.price) * (item.quantity || 1)).toLocaleString('id-ID')}
                  </p>
                  {item.isDiscounted && (
                    <p className="text-sm text-gray-500 line-through">
                      Rp {(item.price * (item.quantity || 1)).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-blue-600">
                  Rp {totalAmount?.toLocaleString('id-ID') || '0'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FaUser className="mr-2 text-blue-600" />
            Detail Pembeli
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Depan *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={customerDetails.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Belakang
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={customerDetails.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaEnvelope className="inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={customerDetails.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaPhone className="inline mr-1" />
                Nomor Telepon
              </label>
              <input
                type="tel"
                name="phone"
                value={customerDetails.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaMapMarkerAlt className="inline mr-1" />
                Alamat
              </label>
              <textarea
                name="address"
                value={customerDetails.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Alamat lengkap (opsional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kota
                </label>
                <input
                  type="text"
                  name="city"
                  value={customerDetails.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={customerDetails.postalCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12345"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading || !cartItems?.length}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md font-medium flex items-center justify-center"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FaCreditCard className="mr-2" />
                    Bayar Sekarang - Rp {totalAmount?.toLocaleString('id-ID') || '0'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Payment Methods Info */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Metode Pembayaran yang Tersedia</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Kartu Kredit/Debit
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Virtual Account
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            GoPay
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            QRIS
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;