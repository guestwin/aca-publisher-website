import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

export default function Religious() {
  // Data contoh untuk produk musik rohani
  const religiousProducts = [
    {
      id: 3,
      title: 'Cantate Domino',
      composer: 'Dody Soetanto',
      price: 60000,
      arrangement: 'SATB',
      image: 'cantate.svg',
      category: 'religious',
      inStock: true
    },
    {
      id: 4,
      title: 'Ave Maria',
      composer: 'Yosan Cahyadi',
      price: 60000,
      arrangement: 'SATB div.',
      image: 'ave-maria.svg',
      category: 'religious',
      inStock: true
    },
    {
      id: 5,
      title: 'Lux Aeterna',
      composer: 'Milton Sandyka',
      price: 50000,
      arrangement: 'SSATBB',
      image: 'lux-aeterna.svg',
      category: 'religious',
      inStock: true
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Musik Rohani</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Koleksi karya musik rohani dari berbagai komposer Indonesia, mencakup berbagai genre
              dan aransemen untuk paduan suara.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {religiousProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}