import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Image from 'next/image';

export default function About() {
  const teamMembers = [
    {
      name: 'Berryl Carlos Manuel',
      role: 'Pendiri dan Direktur Pemasaran',
      image: '/team/berryl.svg'
    },
    {
      name: 'Handy Kwong',
      role: 'Pendiri dan Direktur Keuangan',
      image: '/team/handy.svg'
    },
    {
      name: 'Kristian Wirjadi',
      role: 'Pendiri, Direktur Ekosistem Digital, dan Kurator',
      image: '/team/kristian.svg'
    },
    {
      name: 'Mahardhika Simbolon',
      role: 'Pendiri, Direktur Operasional, dan Kurator',
      image: '/team/mahardhika.svg'
    },
    {
      name: 'Milton Sandyka',
      role: 'Pendiri dan Kepala Editor',
      image: '/team/milton.svg'
    },
    {
      name: 'Amar Hidayat Akbar',
      role: 'Penanggung Jawab Hukum',
      image: '/team/amar.svg'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gray-900 text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Tentang ACA Publisher</h1>
            <p className="text-xl max-w-3xl">
              ACA Publisher adalah penerbit musik dari Indonesia yang berfokus pada penerbitan partitur musik secara digital.
              Dengan komitmen untuk mendukung perkembangan industri musik di Indonesia, kami memberikan wadah bagi
              komposer dan penggubah Indonesia untuk menampilkan karya-karya mereka secara luas.
            </p>
          </div>
        </div>

        {/* Vision & Mission */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">Visi & Misi</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Visi</h3>
                  <p className="text-gray-600">
                    Menjadi penerbit musik terkemuka yang mendukung dan mempromosikan karya-karya musik Indonesia
                    ke panggung internasional.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Misi</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>Menyediakan platform digital yang mudah diakses untuk distribusi partitur musik</li>
                    <li>Mendukung komposer dan arranger Indonesia dalam berkarya</li>
                    <li>Melestarikan dan mengembangkan musik tradisional Indonesia</li>
                    <li>Memfasilitasi kolaborasi antara musisi lokal dan internasional</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Tim ACA Publisher</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="aspect-w-1 aspect-h-1 relative bg-gray-200">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                    <p className="text-gray-600">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Hubungi Kami</h2>
              <p className="text-gray-600 mb-8">
                Untuk informasi lebih lanjut atau kerja sama, silakan hubungi kami melalui:
              </p>
              <div className="space-y-4">
                <p className="text-gray-800">
                  <strong>Email:</strong> info@acapublisher.com
                </p>
                <p className="text-gray-800">
                  <strong>Telepon:</strong> +62 21 1234 5678
                </p>
                <p className="text-gray-800">
                  <strong>Alamat:</strong> Jl. Musik No. 123, Jakarta Pusat, Indonesia
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}