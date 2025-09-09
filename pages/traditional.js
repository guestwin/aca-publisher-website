import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

export default function Traditional() {
  // Data contoh untuk produk musik tradisional
  const traditionalProducts = [
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Musik Tradisional</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Koleksi aransemen paduan suara dari musik tradisional Indonesia, melestarikan
              warisan budaya dalam format yang modern dan inovatif.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {traditionalProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}