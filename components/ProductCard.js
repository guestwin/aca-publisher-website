import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addItem(product);
      toast.success(`${product.title} ditambahkan ke keranjang!`, {
        duration: 2000,
        position: 'bottom-right',
      });
    } catch (error) {
      toast.error('Gagal menambahkan ke keranjang', {
        duration: 2000,
        position: 'bottom-right',
      });
    } finally {
      setTimeout(() => {
        setIsAdding(false);
      }, 800);
    }
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? `Rp${price.toLocaleString('id-ID')}` : 'Rp0';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <Link href={`/product/${product._id}`} className="block">
        <div className="bg-gray-200 h-40 sm:h-48 md:h-56 relative overflow-hidden">
          {product.isDiscounted && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg z-10">
              Diskon
            </div>
          )}
          
          {/* Loading skeleton */}
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Error state */}
          {imageError && (
            <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">Gambar tidak tersedia</span>
            </div>
          )}
          
          <Image
            src={product.coverImage || product.preview || `/piano-logo.svg`}
            alt={product.title}
            fill
            className={`object-cover hover:scale-105 transition-all duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
        </div>
      </Link>

      <div className="p-4 sm:p-6">
        <Link href={`/product/${product._id}`} className="block">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 hover:text-black transition-colors line-clamp-2">
            {product.title}
          </h3>
          <p className="text-gray-600 mb-2 font-medium text-sm sm:text-base">{product.composer?.name || product.composer}</p>
          <p className="text-gray-500 text-xs sm:text-sm mb-4">{product.category}</p>
        </Link>

        <div className="space-y-4">
          <div>
            {product.isDiscounted ? (
              <div className="space-y-1">
                <span className="text-gray-400 line-through text-sm">{formatPrice(product.price)}</span>
                <span className="block text-red-600 font-bold text-base sm:text-lg">{formatPrice(product.discountPrice)}</span>
              </div>
            ) : (
              <span className="text-gray-900 font-bold text-base sm:text-lg">{formatPrice(product.price)}</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`flex-1 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base relative overflow-hidden ${
                isAdding 
                  ? 'bg-green-500 cursor-not-allowed' 
                  : 'bg-black hover:bg-gray-800 transform hover:scale-105 active:scale-95'
              } text-white`}
            >
              {isAdding && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                </div>
              )}
              <span className={isAdding ? 'invisible' : 'visible'}>
                {isAdding ? 'Menambahkan...' : 'Tambah ke Keranjang'}
              </span>
            </button>
            <Link
              href={`/product/${product._id}`}
              className="flex-1 px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-black text-black hover:bg-gray-50 transition-all duration-200 text-center font-medium text-sm sm:text-base"
            >
              Detail
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}