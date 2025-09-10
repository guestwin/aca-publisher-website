import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const TestLogin = () => {
  const router = useRouter();
  const [selectedComposer, setSelectedComposer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testComposers = [
    {
      name: 'Joseph Kristanto Pantioso',
      email: 'joseph@composer.test',
      password: 'password123',
      specialization: 'religious',
      description: 'Komposer musik gereja dengan pengalaman lebih dari 20 tahun'
    },
    {
      name: 'Milton Sandyka',
      email: 'milton@composer.test',
      password: 'password123',
      specialization: 'traditional',
      description: 'Maestro musik tradisional Indonesia dengan fokus pada gamelan kontemporer'
    },
    {
      name: 'Sarah Wijaya',
      email: 'sarah@composer.test',
      password: 'password123',
      specialization: 'national',
      description: 'Komposer muda yang mengkhususkan diri dalam musik nasional dan patriotik'
    },
    {
      name: 'Ahmad Rizki',
      email: 'ahmad@composer.test',
      password: 'password123',
      specialization: 'contemporary',
      description: 'Komposer kontemporer dengan latar belakang musik klasik'
    },
    {
      name: 'Maria Santoso',
      email: 'maria@composer.test',
      password: 'password123',
      specialization: 'classical',
      description: 'Pianis dan komposer dengan spesialisasi musik klasik dan jazz'
    }
  ];

  const handleQuickLogin = async (composer) => {
    setIsLoading(true);
    setSelectedComposer(composer.email);

    try {
      const response = await fetch('/api/composer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: composer.email,
          password: composer.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Quick login successful, redirecting to dashboard...');
        // Cookie sudah diset oleh server dengan HttpOnly
        console.log('Server has set cookie, calling router.push...');
        router.push('/composer/dashboard');
      } else {
        alert('Login gagal: ' + data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
      setSelectedComposer(null);
    }
  };

  const getSpecializationColor = (specialization) => {
    const colors = {
      religious: 'bg-purple-100 text-purple-800',
      traditional: 'bg-orange-100 text-orange-800',
      national: 'bg-red-100 text-red-800',
      contemporary: 'bg-blue-100 text-blue-800',
      classical: 'bg-green-100 text-green-800'
    };
    return colors[specialization] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-100 mb-4">
            <svg className="h-10 w-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Demo Login Komposer
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Pilih salah satu akun komposer untuk login dan melihat dashboard
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Info:</strong> Ini adalah akun demo untuk testing. Semua password adalah "password123"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {testComposers.map((composer, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-lg">
                    {composer.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSpecializationColor(composer.specialization)}`}>
                  {composer.specialization}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {composer.name}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {composer.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500">
                  <strong>Email:</strong> {composer.email}
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Password:</strong> {composer.password}
                </div>
              </div>
              
              <button
                onClick={() => handleQuickLogin(composer)}
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading && selectedComposer === composer.email ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Login...
                  </div>
                ) : (
                  'Quick Login'
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cara Menggunakan</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
              <p>Klik tombol "Quick Login" pada salah satu kartu komposer di atas</p>
            </div>
            <div className="flex items-start">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
              <p>Anda akan otomatis diarahkan ke dashboard komposer</p>
            </div>
            <div className="flex items-start">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
              <p>Di dashboard, Anda dapat melihat laporan keuangan, statistik penjualan, dan data transaksi</p>
            </div>
            <div className="flex items-start">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
              <p>Anda juga dapat menggunakan form login manual di <Link href="/composer/login" className="text-indigo-600 hover:text-indigo-500">halaman login</Link></p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <div className="space-x-4">
            <Link href="/composer/login" className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Form Login Manual
            </Link>
            <Link href="/" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;