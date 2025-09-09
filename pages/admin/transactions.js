import { useState } from 'react';
import Link from 'next/link';

const AdminTransactions = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Untuk demo, set true
  const [transactions, setTransactions] = useState([
    {
      id: 'TRX001',
      tanggal: '2024-01-15',
      pembeli: {
        nama: 'John Doe',
        email: 'john@example.com',
        telepon: '+62812345678'
      },
      produk: [
        {
          nama: 'Cantate Domino',
          harga: 750000,
          kategori: 'religious'
        }
      ],
      total: 750000,
      status: 'Selesai',
      metodePembayaran: 'Transfer Bank',
      nomorInvoice: 'INV/20240115/001',
      tanggalPembayaran: '2024-01-15',
      catatan: 'Pembayaran diterima tepat waktu'
    },
    {
      id: 'TRX002',
      tanggal: '2024-01-14',
      pembeli: {
        nama: 'Jane Smith',
        email: 'jane@example.com',
        telepon: '+62812345679'
      },
      produk: [
        {
          nama: 'Panorama Indonesia',
          harga: 500000,
          kategori: 'national'
        },
        {
          nama: 'Wayang Suite',
          harga: 600000,
          kategori: 'traditional'
        }
      ],
      total: 1100000,
      status: 'Pending',
      metodePembayaran: 'QRIS',
      nomorInvoice: 'INV/20240114/002',
      tanggalPembayaran: null,
      catatan: 'Menunggu pembayaran'
    }
  ]);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('tanggal');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleUpdateStatus = (id, newStatus) => {
    setTransactions(
      transactions.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              status: newStatus,
              tanggalPembayaran: newStatus === 'Selesai' ? new Date().toISOString().split('T')[0] : null
            }
          : transaction
      )
    );
  };

  const filteredTransactions = transactions
    .filter((transaction) => filterStatus === 'all' || transaction.status === filterStatus)
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
          <button
            onClick={() => setIsAuthenticated(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Login
          </button>
        </div>
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
          <Link href="/admin/transactions" className="block py-2 px-4 rounded bg-gray-700">
            Transaksi
          </Link>
          <Link href="/admin/reports" className="block py-2 px-4 rounded hover:bg-gray-700">
            Laporan
          </Link>
          <Link href="/admin/settings" className="block py-2 px-4 rounded hover:bg-gray-700">
            Pengaturan
          </Link>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="w-full text-left py-2 px-4 rounded hover:bg-gray-700 text-red-400"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <h1 className="text-3xl font-bold mb-8">Manajemen Transaksi</h1>

        {/* Filters and Sorting */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="Pending">Pending</option>
                <option value="Selesai">Selesai</option>
                <option value="Batal">Batal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutkan Berdasarkan
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="tanggal">Tanggal</option>
                <option value="total">Total</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutan
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="desc">Terbaru</option>
                <option value="asc">Terlama</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Transaksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pembeli
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.tanggal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.pembeli.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rp {transaction.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'Selesai'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowDetailModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Detail
                    </button>
                    {transaction.status === 'Pending' && (
                      <button
                        onClick={() => handleUpdateStatus(transaction.id, 'Selesai')}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Selesai
                      </button>
                    )}
                    {transaction.status === 'Pending' && (
                      <button
                        onClick={() => handleUpdateStatus(transaction.id, 'Batal')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Batal
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Transaction Detail Modal */}
        {showDetailModal && selectedTransaction && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-[800px] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Detail Transaksi</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedTransaction(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Informasi Transaksi</h3>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">ID Transaksi:</span>{' '}
                        {selectedTransaction.id}
                      </p>
                      <p>
                        <span className="font-medium">Nomor Invoice:</span>{' '}
                        {selectedTransaction.nomorInvoice}
                      </p>
                      <p>
                        <span className="font-medium">Tanggal:</span>{' '}
                        {selectedTransaction.tanggal}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            selectedTransaction.status === 'Selesai'
                              ? 'bg-green-100 text-green-800'
                              : selectedTransaction.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {selectedTransaction.status}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Metode Pembayaran:</span>{' '}
                        {selectedTransaction.metodePembayaran}
                      </p>
                      {selectedTransaction.tanggalPembayaran && (
                        <p>
                          <span className="font-medium">Tanggal Pembayaran:</span>{' '}
                          {selectedTransaction.tanggalPembayaran}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Informasi Pembeli</h3>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Nama:</span>{' '}
                        {selectedTransaction.pembeli.nama}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{' '}
                        {selectedTransaction.pembeli.email}
                      </p>
                      <p>
                        <span className="font-medium">Telepon:</span>{' '}
                        {selectedTransaction.pembeli.telepon}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Produk</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Produk
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Harga
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedTransaction.produk.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.nama}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.kategori}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Rp {item.harga.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan="2"
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right"
                        >
                          Total:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Rp {selectedTransaction.total.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedTransaction.catatan && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Catatan</h3>
                    <p className="text-sm text-gray-600">{selectedTransaction.catatan}</p>
                  </div>
                )}

                {selectedTransaction.status === 'Pending' && (
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedTransaction.id, 'Selesai');
                        setShowDetailModal(false);
                        setSelectedTransaction(null);
                      }}
                      className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                    >
                      Tandai Selesai
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedTransaction.id, 'Batal');
                        setShowDetailModal(false);
                        setSelectedTransaction(null);
                      }}
                      className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                    >
                      Batalkan Transaksi
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTransactions;