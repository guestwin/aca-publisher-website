import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mengambil data produk dari API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setFeaturedProducts(data.products || []);
        } else {
          console.error('Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              ACA Publisher
            </h1>
            <p className="text-lg sm:text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
              Koleksi Partitur Musik Terbaik untuk Paduan Suara Indonesia
            </p>
            <button className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
              Jelajahi Koleksi Kami
            </button>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <main className="flex-grow">
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Produk Unggulan</h2>
              <p className="text-lg text-gray-600">Koleksi partitur terbaik dari komposer Indonesia</p>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-lg text-gray-600">Memuat produk...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-gray-900">
              Mengapa Memilih ACA Publisher?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center group">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-200">
                  <span className="text-blue-600 text-2xl">🎵</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Kualitas Terbaik</h3>
                <p className="text-gray-600 leading-relaxed">Partitur berkualitas tinggi dengan notasi yang jelas dan mudah dibaca</p>
              </div>
              <div className="text-center group">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors duration-200">
                  <span className="text-green-600 text-2xl">📚</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Koleksi Lengkap</h3>
                <p className="text-gray-600 leading-relaxed">Berbagai genre musik dari tradisional hingga kontemporer</p>
              </div>
              <div className="text-center group">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors duration-200">
                  <span className="text-purple-600 text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Mudah Digunakan</h3>
                <p className="text-gray-600 leading-relaxed">Platform yang user-friendly dengan pencarian yang mudah</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}