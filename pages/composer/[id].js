import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Image from 'next/image';
import ProductCard from '../../components/ProductCard';

export default function ComposerDetail() {
  const router = useRouter();
  const { id } = router.query;

  // Data contoh untuk komposer
  const composers = [
    {
      id: 1,
      name: 'F. A. Warsono',
      image: '/composers/warsono.jpg',
      foto: '/composers/warsono.jpg',
      bio: 'F. A. Warsono adalah seorang komposer dan arranger paduan suara yang telah aktif berkarya selama lebih dari 20 tahun. Karyanya banyak dipengaruhi oleh musik tradisional Indonesia yang dipadukan dengan teknik komposisi modern.',
      education: [
        'S1 Musik, Institut Seni Indonesia Yogyakarta',
        'S2 Komposisi Musik, Institut Seni Indonesia Surakarta'
      ],
      achievements: [
        'Juara 1 Kompetisi Komposisi Paduan Suara Nasional 2018',
        'Penghargaan Komposer Muda Berbakat 2019',
        'Dosen Tamu di berbagai institusi musik di Indonesia'
      ],
      works: [
        {
          id: 1,
          title: 'Panorama',
          arrangement: 'SATB div.',
          price: 40000,
          image: 'panorama.svg',
          category: 'national',
          inStock: true
        },
        {
          id: 6,
          title: 'Nusantara',
          arrangement: 'SATB div.',
          price: 45000,
          image: 'nusantara.svg',
          category: 'national',
          inStock: true,
          isDiscount: true,
          originalPrice: 50000
        },
        {
          id: 7,
          title: 'Pelangi',
          arrangement: 'SATB div.',
          price: 55000,
          image: 'pelangi.svg',
          category: 'national',
          inStock: true
        }
      ]
    },
    // Tambahkan data komposer lainnya di sini
  ];

  const composer = composers.find(c => c.id === Number(id));

  if (!composer) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <p className="text-center text-gray-600">Komposer tidak ditemukan.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Profil Komposer */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="md:flex">
              <div className="md:w-1/3">
                <div className="h-64 md:h-full relative">
                  <Image
                    src={composer.foto || composer.image}
                    alt={composer.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="p-8 md:w-2/3">
                <h1 className="text-3xl font-bold mb-4">{composer.name}</h1>
                <p className="text-gray-600 mb-6">{composer.bio}</p>
                
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Pendidikan</h2>
                    <ul className="list-disc list-inside text-gray-600">
                      {composer.education.map((edu, index) => (
                        <li key={index}>{edu}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-2">Prestasi</h2>
                    <ul className="list-disc list-inside text-gray-600">
                      {composer.achievements.map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Karya-karya */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Karya-karya</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {composer.works.map(work => (
                <ProductCard
                  key={work.id}
                  product={{ ...work, composer: composer.name }}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}