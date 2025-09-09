import { useState, useEffect } from 'react';
import Link from 'next/link';

const AdminAppearance = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Untuk demo, set true
  const [settings, setSettings] = useState({
    websiteTitle: 'ACA Publisher',
    primaryColor: '#1E40AF',
    secondaryColor: '#60A5FA',
    accentColor: '#F59E0B',
    logo: '/piano-logo.svg',
    favicon: '/favicon.ico',
    fontFamily: 'Inter',
    headerStyle: 'default',
    footerStyle: 'default',
    customCSS: ''
  });

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Load settings saat komponen dimount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/logo');
      const data = await response.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/settings/logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logo: settings.logo }),
      });
      
      const data = await response.json();
      if (data.success) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        // Reload halaman untuk memperbarui logo di navbar
        window.location.reload();
      } else {
        setUploadError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setUploadError('Failed to save settings');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('oldLogo', settings.logo);

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setSettings({ ...settings, logo: data.logoUrl });
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
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

  const handleFaviconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Upload favicon dan dapatkan URL
      // setSettings({ ...settings, favicon: uploadedFaviconUrl });
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
          <Link href="/admin/appearance" className="block py-2 px-4 rounded bg-gray-700">
            Tampilan
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
          <h1 className="text-3xl font-bold">Pengaturan Tampilan</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pengaturan Dasar */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Pengaturan Dasar</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Website
                </label>
                <input
                  type="text"
                  value={settings.websiteTitle}
                  onChange={(e) => setSettings({ ...settings, websiteTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Website
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <img
                      src={settings.logo}
                      alt="Logo Preview"
                      className="w-16 h-8 object-contain border rounded-md bg-white p-1"
                    />
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  
                  {isUploading && (
                    <div className="text-sm text-blue-600">
                      Uploading logo...
                    </div>
                  )}
                  
                  {uploadError && (
                    <div className="text-sm text-red-600">
                      {uploadError}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Format yang didukung: JPEG, PNG, SVG, WebP (maksimal 5MB)
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon
                </label>
                <div className="flex items-center space-x-4">
                  <img
                    src={settings.favicon}
                    alt="Favicon Preview"
                    className="w-8 h-8 object-contain border rounded-md"
                  />
                  <input
                    type="file"
                    accept="image/x-icon,image/png"
                    onChange={handleFaviconUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Pengaturan Warna */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Pengaturan Warna</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warna Utama
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-8 h-8 p-0 border-0 rounded-md"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warna Sekunder
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="w-8 h-8 p-0 border-0 rounded-md"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warna Aksen
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="w-8 h-8 p-0 border-0 rounded-md"
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Pengaturan Font */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Pengaturan Font</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Utama
                </label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Poppins">Poppins</option>
                </select>
              </div>
            </div>

            {/* Pengaturan Layout */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Pengaturan Layout</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gaya Header
                </label>
                <select
                  value={settings.headerStyle}
                  onChange={(e) => setSettings({ ...settings, headerStyle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">Default</option>
                  <option value="centered">Centered</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gaya Footer
                </label>
                <select
                  value={settings.footerStyle}
                  onChange={(e) => setSettings({ ...settings, footerStyle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">Default</option>
                  <option value="simple">Simple</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom CSS */}
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Custom CSS</h2>
            <textarea
              value={settings.customCSS}
              onChange={(e) => setSettings({ ...settings, customCSS: e.target.value })}
              rows="6"
              placeholder="Tambahkan CSS kustom di sini..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>

      {/* Toast Sukses */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg">
          Pengaturan berhasil disimpan!
        </div>
      )}
    </div>
  );
};

export default AdminAppearance;