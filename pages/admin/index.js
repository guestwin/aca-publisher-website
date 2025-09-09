import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth');
          return;
        }

        const response = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (!response.ok || data.user.role !== 'admin') {
          localStorage.removeItem('token');
          router.push('/auth');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth');
      }
    };

    checkAuth();
  }, []);

  // Contoh data statistik
  const stats = {
    totalPenjualan: 150,
    pendapatanBulanIni: 15000000,
    produkTerlaris: 'Cantate Domino',
    transaksiPending: 5
  };

  // Contoh data transaksi terbaru
  const recentTransactions = [
    {
      id: 'TRX001',
      tanggal: '2024-01-15',
      pembeli: 'John Doe',
      produk: 'Cantate Domino',
      total: 750000,
      status: 'Selesai'
    },
    {
      id: 'TRX002',
      tanggal: '2024-01-14',
      pembeli: 'Jane Smith',
      produk: 'Panorama Indonesia',
      total: 500000,
      status: 'Pending'
    }
  ];

  // Contoh data produk terlaris
  const topProducts = [
    { nama: 'Cantate Domino', penjualan: 45 },
    { nama: 'Panorama Indonesia', penjualan: 32 },
    { nama: 'Wayang Suite', penjualan: 28 }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed w-64 h-full bg-gray-800 text-white p-6">
        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
        <nav className="space-y-4">
          <Link href="/admin" className="block py-2 px-4 rounded hover:bg-gray-700">
            Dashboard
          </Link>
          <Link href="/admin/products" className="block py-2 px-4 rounded hover:bg-gray-700">
            Produk
          </Link>
          <Link href="/admin/composers" className="block py-2 px-4 rounded hover:bg-gray-700">
            Komposer
          </Link>
          <Link href="/admin/transactions" className="block py-2 px-4 rounded hover:bg-gray-700">
            Transaksi
          </Link>
          <Link href="/admin/reports" className="block py-2 px-4 rounded hover:bg-gray-700">
            Laporan
          </Link>
          <Link href="/admin/settings" className="block py-2 px-4 rounded hover:bg-gray-700">
            Pengaturan
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left py-2 px-4 rounded hover:bg-gray-700 text-red-400"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Statistik */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Total Penjualan</h3>
            <p className="text-2xl font-bold">{stats.totalPenjualan}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Pendapatan Bulan Ini</h3>
            <p className="text-2xl font-bold">
              Rp {stats.pendapatanBulanIni.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Produk Terlaris</h3>
            <p className="text-2xl font-bold">{stats.produkTerlaris}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Transaksi Pending</h3>
            <p className="text-2xl font-bold">{stats.transaksiPending}</p>
          </div>
        </div>

        {/* Transaksi Terbaru */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Transaksi Terbaru</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pembeli
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.tanggal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.pembeli}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.produk}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {transaction.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'Selesai'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Produk Terlaris */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Produk Terlaris</h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-900">{product.nama}</span>
                <span className="text-gray-500">{product.penjualan} penjualan</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;