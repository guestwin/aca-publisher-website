import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useCart } from '../../context/CartContext';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [product, setProduct] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Fetch product data
  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (response.ok) {
        const productData = await response.json();
        setProduct(productData);
      } else {
        console.error('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  // Audio player functions
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Data contoh untuk produk (fallback)
  const sampleProducts = [
    {
      id: 1,
      title: 'Panorama',
      composer: 'F. A. Warsono',
      price: 40000,
      arrangement: 'SATB div.',
      image: 'panorama.svg',
      category: 'national',
      inStock: true,
      description: 'Karya paduan suara yang menggambarkan keindahan panorama Indonesia, dengan harmoni yang kaya dan dinamika yang menarik.',
      details: [
        'Durasi: 4 menit',
        'Tingkat kesulitan: Menengah',
        'Bahasa: Indonesia',
        'Format: PDF (Partitur Digital)',
        'Lisensi: Untuk satu paduan suara'
      ],
      preview_pages: ['preview1.svg', 'preview2.svg']
    },
    {
      id: 2,
      title: 'Wayang',
      composer: 'Trisutji Kamal',
      price: 65000,
      arrangement: 'SSA',
      image: 'wayang.svg',
      category: 'traditional',
      inStock: true,
      description: 'Aransemen paduan suara berdasarkan musik gamelan Jawa yang menghadirkan suasana pertunjukan wayang.',
      details: [
        'Durasi: 6 menit',
        'Tingkat kesulitan: Sulit',
        'Bahasa: Jawa',
        'Format: PDF (Partitur Digital)',
        'Lisensi: Untuk satu paduan suara'
      ],
      preview_pages: ['preview1.svg', 'preview2.svg']
    },
    {
      id: 3,
      title: 'Gloria',
      composer: 'Joseph Kristanto Pantioso',
      price: 50000,
      arrangement: 'SATB',
      image: 'gloria.svg',
      category: 'religious',
      inStock: true,
      description: 'Karya sakral dengan nuansa kontemporer yang menggabungkan elemen tradisional dan modern.',
      details: [
        'Durasi: 5 menit',
        'Tingkat kesulitan: Menengah-Sulit',
        'Bahasa: Latin',
        'Format: PDF (Partitur Digital)',
        'Lisensi: Untuk satu paduan suara'
      ],
      preview_pages: ['preview1.svg', 'preview2.svg']
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
      originalPrice: 50000,
      description: 'Sebuah karya yang memadukan berbagai unsur musik tradisional Indonesia dalam format paduan suara modern.',
      details: [
        'Durasi: 5 menit',
        'Tingkat kesulitan: Menengah-Sulit',
        'Bahasa: Indonesia',
        'Format: PDF (Partitur Digital)',
        'Lisensi: Untuk satu paduan suara'
      ],
      preview_pages: ['preview1.svg', 'preview2.svg']
    },
    {
      id: 7,
      title: 'Pelangi',
      composer: 'F. A. Warsono',
      price: 55000,
      arrangement: 'SATB div.',
      image: 'pelangi.svg',
      category: 'national',
      inStock: true,
      description: 'Interpretasi musikal dari keindahan pelangi dalam format paduan suara yang colorful.',
      details: [
        'Durasi: 4 menit',
        'Tingkat kesulitan: Menengah',
        'Bahasa: Indonesia',
        'Format: PDF (Partitur Digital)',
        'Lisensi: Untuk satu paduan suara'
      ],
      preview_pages: ['preview1.svg', 'preview2.svg']
    },
    {
      id: 8,
      title: 'Surilang',
      composer: 'Joseph Kristanto Pantioso',
      price: 60000,
      arrangement: 'SATB div.',
      image: 'surilang.svg',
      category: 'traditional',
      inStock: true,
      description: 'Aransemen lagu daerah Sulawesi Utara yang kaya akan harmoni dan kontrapung.',
      details: [
        'Durasi: 5 menit',
        'Tingkat kesulitan: Sulit',
        'Bahasa: Daerah Sulawesi Utara',
        'Format: PDF (Partitur Digital)',
        'Lisensi: Untuk satu paduan suara'
      ],
      preview_pages: ['preview1.svg', 'preview2.svg']
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
      originalPrice: 60000,
      description: 'Aransemen lagu daerah Batak yang dapat dinyanyikan oleh paduan suara wanita atau pria.',
      details: [
        'Durasi: 4 menit',
        'Tingkat kesulitan: Menengah',
        'Bahasa: Batak',
        'Format: PDF (Partitur Digital)',
        'Lisensi: Untuk satu paduan suara'
      ],
      preview_pages: ['preview1.svg', 'preview2.svg']
    }
  ];

  // Use fetched product or fallback to sample data
  const currentProduct = product || sampleProducts.find(p => p.id === Number(id));

  const formatPrice = (price) => {
    return typeof price === 'number' ? `Rp${price.toLocaleString('id-ID')}` : 'Rp0';
  };

  const handleAddToCart = () => {
    if (!product.inStock) return;

    setIsAdding(true);
    addItem(product);

    // Tampilkan feedback visual
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  if (!currentProduct) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-gray-500">Produk tidak ditemukan</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="text-sm text-gray-600">
              <span onClick={() => router.push('/')} className="hover:text-gray-900 cursor-pointer">Beranda</span>
              <span className="mx-2">/</span>
              <span onClick={() => router.push(`/${currentProduct.category}`)} className="hover:text-gray-900 cursor-pointer capitalize">{currentProduct.category}</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{currentProduct.title}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cover Image */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="aspect-square relative bg-gray-100">
                  <Image
                    src={currentProduct.coverImage || `/scores/${currentProduct.image}` || '/piano-logo.svg'}
                    alt={currentProduct.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                {/* Composer Info */}
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">{currentProduct.composer}</h2>
                </div>

                {/* Title and Arrangement */}
                <h1 className="text-3xl font-bold mb-2">{currentProduct.title} ({currentProduct.arrangement})</h1>
                
                {/* Description */}
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed">{currentProduct.description}</p>
                </div>

                {/* Audio Preview */}
                {currentProduct.audioSample && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Audio Preview</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <audio
                        ref={audioRef}
                        src={currentProduct.audioSample}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                      />
                      
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={togglePlay}
                          className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        >
                          {isPlaying ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                            <span>{formatTime(currentTime)}</span>
                            <span>/</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                          <div 
                            className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
                            onClick={handleSeek}
                          >
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF Preview */}
                {currentProduct.pdfFile && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Preview Partitur</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">File PDF tersedia untuk preview</span>
                        <a
                          href={currentProduct.pdfFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          Lihat PDF
                        </a>
                      </div>
                      {currentProduct.sampleImage && (
                        <div className="aspect-[4/3] relative bg-white rounded border">
                          <Image
                            src={currentProduct.sampleImage}
                            alt={`Preview ${currentProduct.title}`}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Detail Produk</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li><strong>Arrangement:</strong> {currentProduct.arrangement}</li>
                      <li><strong>Kategori:</strong> <span className="capitalize">{currentProduct.category}</span></li>
                      {currentProduct.duration && <li><strong>Durasi:</strong> {currentProduct.duration}</li>}
                      <li><strong>Format:</strong> PDF (Partitur Digital)</li>
                      <li><strong>Lisensi:</strong> Untuk satu paduan suara</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Informasi Pembelian</h3>
                    <div className="space-y-3">
                      {currentProduct.isDiscount ? (
                        <div>
                          <span className="text-2xl font-bold text-red-600">{formatPrice(currentProduct.price)}</span>
                          <span className="text-lg text-gray-500 line-through ml-2">{formatPrice(currentProduct.originalPrice)}</span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">{formatPrice(currentProduct.price)}</span>
                      )}
                      
                      <div className="space-y-2">
                        <button
                          onClick={handleAddToCart}
                          disabled={!currentProduct.inStock || isAdding}
                          className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-colors ${
                            !currentProduct.inStock 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : isAdding 
                              ? 'bg-green-600' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {!currentProduct.inStock ? 'Stok Habis' : isAdding ? 'Ditambahkan!' : 'Tambah ke Keranjang'}
                        </button>

                        <button
                          onClick={() => router.push('/cart')}
                          className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-md hover:bg-blue-50 transition-colors font-semibold"
                        >
                          Lihat Keranjang
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}