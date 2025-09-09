import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArrangement, setSelectedArrangement] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100000]);

  // Data contoh untuk produk
  const allProducts = [
    {
      id: 1,
      title: 'Panorama',
      composer: 'F. A. Warsono',
      price: 40000,
      arrangement: 'SATB div.',
      image: 'panorama.svg',
      category: 'national',
      inStock: true
    },
    {
      id: 2,
      title: 'Wayang',
      composer: 'Trisutji Kamal',
      price: 65000,
      arrangement: 'SSA',
      image: 'wayang.svg',
      category: 'traditional',
      inStock: true
    },
    {
      id: 3,
      title: 'Gloria',
      composer: 'Joseph Kristanto Pantioso',
      price: 50000,
      arrangement: 'SATB',
      image: 'gloria.svg',
      category: 'religious',
      inStock: true
    },
    {
      id: 6,
      title: 'Nusantara',
      composer: 'F. A. Warsono',
      price: 45000,
      arrangement: 'SATB div.',
      image: 'nusantara.svg',
      category: 'national',
      inStock: true,
      isDiscount: true,
      originalPrice: 50000
    },
    {
      id: 7,
      title: 'Pelangi',
      composer: 'F. A. Warsono',
      price: 55000,
      arrangement: 'SATB div.',
      image: 'pelangi.svg',
      category: 'national',
      inStock: true
    },
    {
      id: 8,
      title: 'Surilang',
      composer: 'Joseph Kristanto Pantioso',
      price: 60000,
      arrangement: 'SATB div.',
      image: 'surilang.svg',
      category: 'traditional',
      inStock: true
    },
    {
      id: 9,
      title: 'Butet',
      composer: 'Milton Sandyka',
      price: 54000,
      arrangement: 'SSAA / TTBB',
      image: 'butet.svg',
      category: 'traditional',
      inStock: true,
      isDiscount: true,
      originalPrice: 60000
    }
  ];

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.composer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.arrangement.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-2xl font-bold mb-6">Cari Karya</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-grow">
              <input
                type="text"
                placeholder="Cari judul, komposer, atau jenis aransemen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="all">Semua Kategori</option>
                <option value="religious">Musik Rohani</option>
                <option value="national">Musik Nasional</option>
                <option value="traditional">Musik Tradisional</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada karya yang sesuai dengan pencarian Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}