import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useState } from 'react';
import Image from 'next/image';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(product);
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? `Rp${price.toLocaleString('id-ID')}` : 'Rp0';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <Link href={`/product/${product._id}`} className="block">
        <div className="bg-gray-200 h-40 sm:h-48 md:h-56 relative">
          {product.isDiscounted && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              Diskon
            </div>
          )}
          <Image
            src={product.coverImage || product.preview || `/piano-logo.svg`}
            alt={product.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
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
              className={`flex-1 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${isAdding ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 transform hover:scale-105'} text-white`}
            >
              {isAdding ? 'Ditambahkan!' : 'Tambah ke Keranjang'}
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