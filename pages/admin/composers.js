import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const AdminComposers = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Untuk demo, set true
  const [composers, setComposers] = useState([
    {
      id: 1,
      nama: 'John Doe',
      foto: '/composers/john-doe.jpg',
      spesialisasi: 'Musik Gereja',
      karya: 15,
      biografi: 'Komposer musik gereja terkenal dengan pengalaman lebih dari 20 tahun.',
      pendidikan: 'S2 Musik Sakral, Universitas Musik Vienna',
      prestasi: ['Penghargaan Komposer Terbaik 2020', 'Grammy Award Nominee 2019']
    },
    {
      id: 2,
      nama: 'Jane Smith',
      foto: '/composers/jane-smith.jpg',
      spesialisasi: 'Musik Nasional',
      karya: 12,
      biografi: 'Spesialis aransemen musik nasional dengan sentuhan modern.',
      pendidikan: 'S1 Komposisi Musik, Institut Seni Indonesia',
      prestasi: ['Penghargaan Arranger Terbaik 2021']
    },
    {
      id: 3,
      nama: 'Ahmad Wijaya',
      foto: '/composers/ahmad-wijaya.jpg',
      spesialisasi: 'Musik Tradisional',
      karya: 18,
      biografi: 'Maestro musik tradisional dengan fokus pada gamelan kontemporer.',
      pendidikan: 'S3 Etnomusikologi, Universitas Gadjah Mada',
      prestasi: ['Penghargaan Pelestari Budaya 2022', 'Asian Music Award 2021']
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedComposer, setSelectedComposer] = useState(null);
  const [newComposer, setNewComposer] = useState({
    nama: '',
    foto: '',
    spesialisasi: '',
    biografi: '',
    pendidikan: '',
    prestasi: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [editUploadError, setEditUploadError] = useState('');

  const handleAddComposer = () => {
    setComposers([...composers, { ...newComposer, id: composers.length + 1, karya: 0 }]);
    setShowAddModal(false);
    setNewComposer({
      nama: '',
      foto: '',
      spesialisasi: '',
      biografi: '',
      pendidikan: '',
      prestasi: []
    });
  };

  const handleEditComposer = () => {
    setComposers(
      composers.map((composer) =>
        composer.id === selectedComposer.id ? selectedComposer : composer
      )
    );
    setShowEditModal(false);
    setSelectedComposer(null);
  };

  const handleDeleteComposer = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus komposer ini?')) {
      setComposers(composers.filter((composer) => composer.id !== id));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('oldPhoto', newComposer.foto || '');

      const response = await fetch('/api/upload-composer-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setNewComposer({
          ...newComposer,
          foto: data.photoUrl
        });
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsEditUploading(true);
    setEditUploadError('');

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('oldPhoto', selectedComposer.foto || '');

      const response = await fetch('/api/upload-composer-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedComposer({
          ...selectedComposer,
          foto: data.photoUrl
        });
      } else {
        setEditUploadError(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setEditUploadError('Upload failed');
    } finally {
      setIsEditUploading(false);
    }
  };

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
          <Link href="/admin/composers" className="block py-2 px-4 rounded bg-gray-700">
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
            onClick={() => setIsAuthenticated(false)}
            className="w-full text-left py-2 px-4 rounded hover:bg-gray-700 text-red-400"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manajemen Komposer</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Tambah Komposer
          </button>
        </div>

        {/* Composers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {composers.map((composer) => (
            <div key={composer.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-48 bg-gray-200">
                {composer.foto && (
                  <Image
                    src={composer.foto}
                    alt={composer.nama}
                    layout="fill"
                    objectFit="cover"
                  />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{composer.nama}</h3>
                <p className="text-gray-600 mb-4">{composer.spesialisasi}</p>
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-500">Jumlah Karya:</span>
                  <span className="ml-2 text-sm text-gray-900">{composer.karya}</span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-3">{composer.biografi}</p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setSelectedComposer(composer);
                      setShowEditModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComposer(composer.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Composer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
              <h2 className="text-2xl font-bold mb-6">Tambah Komposer</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama</label>
                  <input
                    type="text"
                    value={newComposer.nama}
                    onChange={(e) =>
                      setNewComposer({ ...newComposer, nama: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto Profile
                  </label>
                  <div className="flex items-center space-x-4">
                    {newComposer.foto && (
                      <img
                        src={newComposer.foto}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-full border"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={isUploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                      />
                      {isUploading && (
                        <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                      )}
                      {uploadError && (
                        <p className="text-sm text-red-600 mt-1">{uploadError}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Spesialisasi</label>
                  <input
                    type="text"
                    value={newComposer.spesialisasi}
                    onChange={(e) =>
                      setNewComposer({ ...newComposer, spesialisasi: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Biografi</label>
                  <textarea
                    value={newComposer.biografi}
                    onChange={(e) =>
                      setNewComposer({ ...newComposer, biografi: e.target.value })
                    }
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pendidikan</label>
                  <input
                    type="text"
                    value={newComposer.pendidikan}
                    onChange={(e) =>
                      setNewComposer({ ...newComposer, pendidikan: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prestasi</label>
                  <textarea
                    value={newComposer.prestasi.join('\n')}
                    onChange={(e) =>
                      setNewComposer({
                        ...newComposer,
                        prestasi: e.target.value.split('\n').filter((p) => p.trim() !== '')
                      })
                    }
                    placeholder="Satu prestasi per baris"
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddComposer}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Composer Modal */}
        {showEditModal && selectedComposer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
              <h2 className="text-2xl font-bold mb-6">Edit Komposer</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama</label>
                  <input
                    type="text"
                    value={selectedComposer.nama}
                    onChange={(e) =>
                      setSelectedComposer({ ...selectedComposer, nama: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto Profile
                  </label>
                  <div className="flex items-center space-x-4">
                    {selectedComposer.foto && (
                      <img
                        src={selectedComposer.foto}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-full border"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditPhotoUpload}
                        disabled={isEditUploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                      />
                      {isEditUploading && (
                        <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                      )}
                      {editUploadError && (
                        <p className="text-sm text-red-600 mt-1">{editUploadError}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Spesialisasi</label>
                  <input
                    type="text"
                    value={selectedComposer.spesialisasi}
                    onChange={(e) =>
                      setSelectedComposer({ ...selectedComposer, spesialisasi: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Biografi</label>
                  <textarea
                    value={selectedComposer.biografi}
                    onChange={(e) =>
                      setSelectedComposer({ ...selectedComposer, biografi: e.target.value })
                    }
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pendidikan</label>
                  <input
                    type="text"
                    value={selectedComposer.pendidikan}
                    onChange={(e) =>
                      setSelectedComposer({ ...selectedComposer, pendidikan: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prestasi</label>
                  <textarea
                    value={selectedComposer.prestasi.join('\n')}
                    onChange={(e) =>
                      setSelectedComposer({
                        ...selectedComposer,
                        prestasi: e.target.value.split('\n').filter((p) => p.trim() !== '')
                      })
                    }
                    placeholder="Satu prestasi per baris"
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedComposer(null);
                  }}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditComposer}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComposers;