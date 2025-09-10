import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { ShoppingCartIcon, MusicalNoteIcon, UserGroupIcon, StarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Partitur Musik Indonesia
              <span className="block text-gray-600 text-2xl md:text-3xl font-normal mt-2">
                Koleksi Lengkap & Mudah Diakses
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Temukan partitur musik nasional, tradisional, dan religi Indonesia dengan mudah
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link href="/catalog" className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center">
                Mulai Jelajahi
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Kategori Musik</h2>
            <p className="text-lg text-gray-600">Pilih kategori sesuai kebutuhan Anda</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/national" className="group">
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                  <MusicalNoteIcon className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Musik Nasional</h3>
                <p className="text-gray-600">Lagu kebangsaan dan patriotik Indonesia</p>
              </div>
            </Link>
            
            <Link href="/traditional" className="group">
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <UserGroupIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Musik Tradisional</h3>
                <p className="text-gray-600">Warisan budaya musik daerah Nusantara</p>
              </div>
            </Link>
            
            <Link href="/religious" className="group">
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <StarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Musik Religi</h3>
                <p className="text-gray-600">Lagu rohani dan spiritual Indonesia</p>
              </div>
            </Link>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/catalog" className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center">
              Lihat Semua Partitur
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-grow">

        {/* Simple CTA Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Siap Memulai?</h2>
            <p className="text-lg text-gray-600 mb-8">Jelajahi koleksi partitur musik Indonesia terlengkap</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
              <Link href="/catalog" className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Mulai Sekarang
              </Link>
              <Link href="/about" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Pelajari Lebih Lanjut
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}