import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Image from 'next/image';
import Link from 'next/link';

export default function Composers() {
  // Data contoh untuk komposer
  const composers = [
    {
      id: 1,
      name: 'F. A. Warsono',
      image: '/composers/warsono.svg',
      works: ['Panorama', 'Nusantara', 'Pelangi', 'History', 'Spirit'],
      description: 'Komposer dan arranger paduan suara yang telah menciptakan berbagai karya nasional.'
    },
    {
      id: 2,
      name: 'Trisutji Kamal',
      image: '/composers/trisutji.svg',
      works: ['Wayang'],
      description: 'Pionir musik kontemporer Indonesia dengan fokus pada musik tradisional.'
    },
    {
      id: 3,
      name: 'Dody Soetanto',
      image: '/composers/dody.svg',
      works: ['Cantate Domino'],
      description: 'Spesialis musik sakral dengan pengalaman internasional.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Komposer</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {composers.map(composer => (
            <div key={composer.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 relative bg-gray-200">
                <Image
                  src={composer.image}
                  alt={composer.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{composer.name}</h2>
                <p className="text-gray-600 mb-4">{composer.description}</p>
                
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Karya:</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {composer.works.map((work, index) => (
                      <li key={index}>{work}</li>
                    ))}
                  </ul>
                </div>

                <Link 
                  href={`/composer/${composer.id}`}
                  className="inline-block px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Lihat Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}