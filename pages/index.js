import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

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
      <SEO 
        title="Premium Sheet Music & Choral Arrangements"
        description="Discover premium sheet music and choral arrangements from talented Indonesian composers. Download high-quality PDF scores for your choir, orchestra, or solo performance."
        keywords="sheet music, choral arrangements, Indonesian composers, PDF scores, music download, choir music, classical music, traditional music, religious music"
        type="website"
      />
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-responsive-xl font-bold mb-4 leading-tight">
              ACA Publisher
            </h1>
            <p className="text-responsive-md mb-8 max-w-3xl mx-auto leading-relaxed opacity-90">
              Koleksi Partitur Musik Terbaik untuk Paduan Suara Indonesia
            </p>
            <button 
              onClick={() => window.location.href = '/catalog'}
              className="bg-white text-black px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base cursor-pointer"
            >
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
              <h2 className="text-responsive-lg font-bold text-gray-900 mb-4">Produk Unggulan</h2>
              <p className="text-base sm:text-lg text-gray-600">Koleksi partitur terbaik dari komposer Indonesia</p>
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
            <h2 className="text-responsive-lg font-bold text-center mb-12 text-gray-900">
              Mengapa Memilih ACA Publisher?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center group">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-200">
                  <span className="text-black text-2xl">🎵</span>
                </div>
                <h3 className="text-responsive-md font-semibold mb-3 text-gray-900">Kualitas Terbaik</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Partitur berkualitas tinggi dengan notasi yang jelas dan mudah dibaca</p>
              </div>
              <div className="text-center group">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-200">
                  <span className="text-black text-2xl">📚</span>
                </div>
                <h3 className="text-responsive-md font-semibold mb-3 text-gray-900">Koleksi Lengkap</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Berbagai genre musik dari tradisional hingga kontemporer</p>
              </div>
              <div className="text-center group">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-200">
                  <span className="text-black text-2xl">🎯</span>
                </div>
                <h3 className="text-responsive-md font-semibold mb-3 text-gray-900">Mudah Digunakan</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Platform yang user-friendly dengan pencarian yang mudah</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}