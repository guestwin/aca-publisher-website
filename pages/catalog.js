import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

export default function Catalog() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'Semua Kategori', count: 0 },
    { id: 'national', name: 'Musik Nasional', count: 0 },
    { id: 'traditional', name: 'Musik Tradisional', count: 0 },
    { id: 'religious', name: 'Musik Religi', count: 0 }
  ];

  // Mengambil data produk dari API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
          setFilteredProducts(data.products || []);
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

  // Filter dan sort produk
  useEffect(() => {
    let filtered = [...products];

    // Filter berdasarkan kategori
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter berdasarkan pencarian
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.composer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort berdasarkan pilihan
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'composer':
          return a.composer.localeCompare(b.composer);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, selectedCategory, sortBy, searchTerm]);

  // Hitung jumlah produk per kategori
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return products.length;
    return products.filter(product => product.category === categoryId).length;
  };

  // Kelompokkan produk berdasarkan huruf pertama
  const groupProductsByAlphabet = (products) => {
    const grouped = {};
    products.forEach(product => {
      const firstLetter = product.title.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(product);
    });
    return grouped;
  };

  const groupedProducts = groupProductsByAlphabet(filteredProducts);
  const alphabetKeys = Object.keys(groupedProducts).sort();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white shadow-sm pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Katalog Produk
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Jelajahi koleksi lengkap partitur musik dari ACA Publisher
            </p>
          </div>
        </div>
      </div>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar Filter */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                
                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cari Produk
                  </label>
                  <input
                    type="text"
                    placeholder="Nama produk atau komposer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategori</h3>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-black text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{category.name}</span>
                          <span className="text-sm opacity-75">
                            ({getCategoryCount(category.id)})
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Urutkan</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="name">Nama A-Z</option>
                    <option value="name-desc">Nama Z-A</option>
                    <option value="price-low">Harga Terendah</option>
                    <option value="price-high">Harga Tertinggi</option>
                    <option value="composer">Komposer A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white rounded-lg shadow-sm p-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedCategory === 'all' 
                      ? 'Semua Produk' 
                      : categories.find(cat => cat.id === selectedCategory)?.name
                    }
                  </h2>
                  <p className="text-gray-600">
                    Menampilkan {filteredProducts.length} dari {products.length} produk
                  </p>
                </div>
                
                {/* Quick Sort Mobile */}
                <div className="mt-4 sm:mt-0 sm:hidden">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="name">Nama A-Z</option>
                    <option value="name-desc">Nama Z-A</option>
                    <option value="price-low">Harga Terendah</option>
                    <option value="price-high">Harga Tertinggi</option>
                    <option value="composer">Komposer A-Z</option>
                  </select>
                </div>
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-gray-600">Memuat produk...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada produk ditemukan</h3>
                  <p className="text-gray-600 mb-4">Coba ubah filter atau kata kunci pencarian</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchTerm('');
                      setSortBy('name');
                    }}
                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                /* Products by Alphabet */
                <div className="space-y-8">
                  {alphabetKeys.map(letter => (
                    <div key={letter} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center mb-6">
                        <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mr-4">
                          {letter}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            Huruf {letter}
                          </h3>
                          <p className="text-gray-600">
                            {groupedProducts[letter].length} produk
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedProducts[letter].map(product => (
                          <ProductCard key={product._id} product={product} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}