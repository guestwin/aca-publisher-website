import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

const AdminProducts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const router = useRouter();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: '',
    price: 0,
    stock: 0,
    isDiscounted: false,
    discountPrice: 0,
    description: '',
    score: '',
    preview: '',
    arrangement: 'SATB',
    duration: '',
    pdfFile: '',
    coverImage: '',
    sampleImage: ''
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingSample, setUploadingSample] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [uploadingSampleImage, setUploadingSampleImage] = useState(false);
  const coverInputRef = useRef(null);
  const sampleInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const coverImageInputRef = useRef(null);
  const sampleImageInputRef = useRef(null);

  useEffect(() => {
    checkAuthAndLoadProducts();
  }, []);

  // Upload functions for new product
  const handleNewProductFileUpload = async (file, fileType) => {
    if (!file) return;
    
    const setUploading = {
      'pdfFile': setUploadingPdf,
      'coverImage': setUploadingCoverImage,
      'sampleImage': setUploadingSampleImage
    }[fileType];
    
    setUploading(true);
    const formData = new FormData();
    formData.append(fileType, file);
    
    try {
      const response = await fetch('/api/upload-product-files', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        const urlKey = {
          'pdfFile': 'pdfUrl',
          'coverImage': 'coverUrl',
          'sampleImage': 'sampleUrl'
        }[fileType];
        
        setNewProduct(prev => ({
          ...prev,
          [fileType]: result.files[urlKey]
        }));
        alert(`${fileType === 'pdfFile' ? 'PDF' : fileType === 'coverImage' ? 'Cover' : 'Sample'} berhasil diupload!`);
      } else {
        const error = await response.json();
        alert(`Gagal mengupload: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Terjadi kesalahan saat upload');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (file, productId) => {
    if (!file) return;
    
    setUploadingCover(true);
    const formData = new FormData();
    formData.append('coverImage', file);
    formData.append('productId', productId);
    
    try {
      const response = await fetch('/api/products/upload-media', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setSelectedProduct(prev => ({
          ...prev,
          coverImage: result.uploadedFiles.coverImage
        }));
        alert('Cover berhasil diupload!');
        // Refresh products list
        await loadProducts();
      } else {
        alert('Gagal mengupload cover');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Terjadi kesalahan saat upload');
    } finally {
      setUploadingCover(false);
    }
  };
  
  const handleSampleUpload = async (file, productId) => {
    if (!file) return;
    
    setUploadingSample(true);
    const formData = new FormData();
    formData.append('audioSample', file);
    formData.append('productId', productId);
    
    try {
      const response = await fetch('/api/products/upload-media', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setSelectedProduct(prev => ({
          ...prev,
          audioSample: result.uploadedFiles.audioSample
        }));
        alert('Sample audio berhasil diupload!');
        // Refresh products list
        await loadProducts();
      } else {
        alert('Gagal mengupload sample audio');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Terjadi kesalahan saat upload');
    } finally {
      setUploadingSample(false);
    }
  };

  const checkAuthAndLoadProducts = async () => {
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

      await loadProducts();
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth');
    }
  };

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAddProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });

      const data = await response.json();
      if (data.success) {
        await loadProducts();
        setShowAddModal(false);
        setNewProduct({
          title: '',
          category: 'religious',
          price: 0,
          stock: 0,
          isDiscounted: false,
          discountPrice: 0,
          description: '',
          score: '',
          preview: ''
        });
        alert('Produk berhasil ditambahkan!');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Terjadi kesalahan saat menambah produk');
    }
  };

  const handleEditProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${selectedProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(selectedProduct)
      });

      const data = await response.json();
      if (data.success) {
        await loadProducts();
        setShowEditModal(false);
        setSelectedProduct(null);
        alert('Produk berhasil diupdate!');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Terjadi kesalahan saat mengupdate produk');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          await loadProducts();
          alert('Produk berhasil dihapus!');
        } else {
          alert('Error: ' + data.message);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Terjadi kesalahan saat menghapus produk');
      }
    }
  };

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
          <Link href="/admin/products" className="block py-2 px-4 rounded bg-gray-700">
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manajemen Produk</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Tambah Produk
          </button>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Komposer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terjual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.title}</div>
                    {product.isDiscounted && (
                      <div className="text-xs text-red-500">Diskon</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.composer?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.isDiscounted ? (
                      <div>
                        <div className="text-sm line-through text-gray-500">
                          Rp {product.price.toLocaleString()}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          Rp {product.discountPrice.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900">
                        Rp {product.price.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sold}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                    <div className="truncate">{product.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
              <h2 className="text-2xl font-bold mb-6">Tambah Produk</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Judul</label>
                  <input
                    type="text"
                    value={newProduct.title}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, title: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, category: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="religious">Religious</option>
                    <option value="national">National</option>
                    <option value="traditional">Traditional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Harga</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: parseInt(e.target.value) })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stok</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, description: e.target.value })
                    }
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">File Partitur (URL)</label>
                  <input
                    type="text"
                    value={newProduct.score}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, score: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preview (URL)</label>
                  <input
                    type="text"
                    value={newProduct.preview}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, preview: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                {/* Upload PDF File */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File PDF Karya</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      ref={pdfInputRef}
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleNewProductFileUpload(file, 'pdfFile');
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={uploadingPdf}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
                    </button>
                    {newProduct.pdfFile && (
                      <span className="text-green-600 text-sm">✓ PDF uploaded</span>
                    )}
                  </div>
                  {newProduct.pdfFile && (
                    <div className="mt-2">
                      <a href={newProduct.pdfFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        View PDF: {newProduct.pdfFile}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Upload Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      ref={coverImageInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleNewProductFileUpload(file, 'coverImage');
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverImageInputRef.current?.click()}
                      disabled={uploadingCoverImage}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {uploadingCoverImage ? 'Uploading...' : 'Upload Cover'}
                    </button>
                    {newProduct.coverImage && (
                      <span className="text-green-600 text-sm">✓ Cover uploaded</span>
                    )}
                  </div>
                  {newProduct.coverImage && (
                    <div className="mt-2">
                      <img src={newProduct.coverImage} alt="Cover preview" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                </div>
                
                {/* Upload Sample Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sample Image</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      ref={sampleImageInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleNewProductFileUpload(file, 'sampleImage');
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => sampleImageInputRef.current?.click()}
                      disabled={uploadingSampleImage}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      {uploadingSampleImage ? 'Uploading...' : 'Upload Sample'}
                    </button>
                    {newProduct.sampleImage && (
                      <span className="text-green-600 text-sm">✓ Sample uploaded</span>
                    )}
                  </div>
                  {newProduct.sampleImage && (
                    <div className="mt-2">
                      <img src={newProduct.sampleImage} alt="Sample preview" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.isDiscounted}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, isDiscounted: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Diskon</label>
                </div>
                {newProduct.isDiscounted && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Harga Diskon
                    </label>
                    <input
                      type="number"
                      value={newProduct.discountPrice}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          discountPrice: parseInt(e.target.value)
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddProduct}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditModal && selectedProduct && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Edit Produk</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama</label>
                  <input
                    type="text"
                    value={selectedProduct.nama}
                    onChange={(e) =>
                      setSelectedProduct({ ...selectedProduct, nama: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    value={selectedProduct.kategori}
                    onChange={(e) =>
                      setSelectedProduct({ ...selectedProduct, kategori: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="religious">Religious</option>
                    <option value="national">National</option>
                    <option value="traditional">Traditional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Komposer</label>
                  <input
                    type="text"
                    value={selectedProduct.komposer}
                    onChange={(e) =>
                      setSelectedProduct({ ...selectedProduct, komposer: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Harga</label>
                  <input
                    type="number"
                    value={selectedProduct.harga}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        harga: parseInt(e.target.value)
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stok</label>
                  <input
                    type="number"
                    value={selectedProduct.stok}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        stok: parseInt(e.target.value)
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Arrangement</label>
                  <input
                    type="text"
                    value={selectedProduct.arrangement || 'SATB'}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        arrangement: e.target.value
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., SATB, SSA, TTBB"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Durasi</label>
                  <input
                    type="text"
                    value={selectedProduct.duration || ''}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        duration: e.target.value
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 4 menit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                  <textarea
                    value={selectedProduct.description || selectedProduct.deskripsi || ''}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        description: e.target.value,
                        deskripsi: e.target.value
                      })
                    }
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedProduct.isDiscount || selectedProduct.isDiscounted}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        isDiscount: e.target.checked,
                        isDiscounted: e.target.checked
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Diskon</label>
                </div>
                {(selectedProduct.isDiscount || selectedProduct.isDiscounted) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Harga Diskon
                    </label>
                    <input
                      type="number"
                      value={selectedProduct.discountPrice || selectedProduct.originalPrice || 0}
                      onChange={(e) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          discountPrice: parseInt(e.target.value),
                          originalPrice: parseInt(e.target.value)
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
                </div>
                
                {/* Right Column - Media Upload */}
                <div className="space-y-6">
                  {/* Cover Image Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Cover Image</h3>
                    <div className="space-y-4">
                      {/* Current Cover Preview */}
                      {selectedProduct.coverImage && (
                        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={selectedProduct.coverImage}
                            alt="Current cover"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Upload Cover */}
                      <div>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleCoverUpload(file, selectedProduct._id);
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={uploadingCover}
                          className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {uploadingCover ? 'Uploading...' : 'Upload Cover Image'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Audio Sample Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Audio Sample</h3>
                    <div className="space-y-4">
                      {/* Current Audio Preview */}
                      {selectedProduct.audioSample && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Current audio sample:</p>
                          <audio controls className="w-full">
                            <source src={selectedProduct.audioSample} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                      
                      {/* Upload Audio Sample */}
                      <div>
                        <input
                          ref={sampleInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleSampleUpload(file, selectedProduct._id);
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => sampleInputRef.current?.click()}
                          disabled={uploadingSample}
                          className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {uploadingSample ? 'Uploading...' : 'Upload Audio Sample'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* PDF File Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">PDF File</h3>
                    <div className="space-y-4">
                      {/* Current PDF Preview */}
                      {selectedProduct.pdfFile && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Current PDF file:</p>
                          <a href={selectedProduct.pdfFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View PDF
                          </a>
                        </div>
                      )}
                      
                      {/* Upload PDF */}
                      <div>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleNewProductFileUpload(file, 'pdfFile');
                            }
                          }}
                          className="hidden"
                          id="edit-pdf-upload"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-pdf-upload')?.click()}
                          disabled={uploadingPdf}
                          className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {uploadingPdf ? 'Uploading...' : 'Upload PDF File'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sample Image Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Sample Image</h3>
                    <div className="space-y-4">
                      {/* Current Sample Image Preview */}
                      {selectedProduct.sampleImage && (
                        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={selectedProduct.sampleImage}
                            alt="Current sample"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Upload Sample Image */}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleNewProductFileUpload(file, 'sampleImage');
                            }
                          }}
                          className="hidden"
                          id="edit-sample-upload"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-sample-upload')?.click()}
                          disabled={uploadingSampleImage}
                          className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {uploadingSampleImage ? 'Uploading...' : 'Upload Sample Image'}
                        </button>
                      </div>
                      
                      {/* Upload Audio */}
                      <div>
                        <input
                          ref={sampleInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleSampleUpload(file, selectedProduct._id);
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => sampleInputRef.current?.click()}
                          disabled={uploadingSample}
                          className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {uploadingSample ? 'Uploading...' : 'Upload Audio Sample'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
               <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                  }}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditProduct}
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

export default AdminProducts;