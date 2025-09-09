import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

export default function National() {
  // Data contoh untuk produk musik nasional
  const nationalProducts = [
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
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Musik Nasional</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Koleksi karya musik nasional yang menampilkan keindahan dan keberagaman Indonesia
              dalam aransemen paduan suara modern.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nationalProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}