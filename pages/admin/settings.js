import { useState, useEffect } from 'react';
import Link from 'next/link';

const AdminSettings = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Untuk demo, set true
  const [settings, setSettings] = useState({
    website: {
      title: 'ACA Publisher',
      description: 'Platform penjualan karya musik terkemuka',
      email: 'contact@acapublisher.com',
      phone: '+62812345678',
      address: 'Jl. Musik No. 123, Jakarta',
      logo: '/images/logo.png',
      socialMedia: {
        facebook: 'https://facebook.com/acapublisher',
        instagram: 'https://instagram.com/acapublisher',
        youtube: 'https://youtube.com/acapublisher'
      }
    },
    appearance: {
        theme: 'light',
        primaryColor: '#3B82F6',
        secondaryColor: '#6B7280',
        accentColor: '#10B981',
        fontFamily: 'Inter',
        headerStyle: 'modern',
        footerStyle: 'minimal',
        cardStyle: 'shadow',
        buttonStyle: 'rounded',
        layoutStyle: 'normal'
      },
    payment: {
      bankTransfer: true,
      bankAccounts: [
        {
          bank: 'Bank BCA',
          accountNumber: '1234567890',
          accountName: 'PT ACA Publisher'
        },
        {
          bank: 'Bank Mandiri',
          accountNumber: '0987654321',
          accountName: 'PT ACA Publisher'
        }
      ],
      qris: true,
      qrisImage: '/images/qris.png'
    },
    notification: {
      emailNotification: true,
      whatsappNotification: true,
      whatsappNumber: '+62812345678',
      orderConfirmation: true,
      paymentReminder: true,
      downloadNotification: true
    },
    security: {
      requireEmailVerification: true,
      loginAttempts: 3,
      sessionTimeout: 60, // dalam menit
      passwordMinLength: 8,
      requireStrongPassword: true
    }
  });

  const [activeTab, setActiveTab] = useState('website');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Load settings from API on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/appearance');
        const data = await response.json();
        if (data.success) {
          setSettings(prevSettings => ({
            ...prevSettings,
            appearance: data.settings
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
   }, []);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/settings/appearance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appearance: settings.appearance }),
      });
      
      const data = await response.json();
      if (data.success) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        // Reload halaman untuk memperbarui tampilan
        setTimeout(() => window.location.reload(), 1000);
      } else {
        console.error('Failed to save settings:', data.error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const handleSocialMediaChange = (platform, value) => {
    setSettings({
      ...settings,
      website: {
        ...settings.website,
        socialMedia: {
          ...settings.website.socialMedia,
          [platform]: value
        }
      }
    });
  };

  const handleBankAccountChange = (index, field, value) => {
    const newBankAccounts = [...settings.payment.bankAccounts];
    newBankAccounts[index] = {
      ...newBankAccounts[index],
      [field]: value
    };
    setSettings({
      ...settings,
      payment: {
        ...settings.payment,
        bankAccounts: newBankAccounts
      }
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('oldLogo', settings.appearance.logo || '/piano-logo.svg');

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setSettings({
          ...settings,
          appearance: {
            ...settings.appearance,
            logo: data.logoUrl
          }
        });
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
          <Link href="/admin/settings" className="block py-2 px-4 rounded bg-gray-700">
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
          <h1 className="text-3xl font-bold">Pengaturan</h1>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
          >
            Simpan Perubahan
          </button>
        </div>

        {/* Settings Tabs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('website')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'website'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Website
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'appearance'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tampilan
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'payment'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pembayaran
              </button>
              <button
                onClick={() => setActiveTab('notification')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'notification'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Notifikasi
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'security'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Keamanan
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Website Settings */}
            {activeTab === 'website' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Website</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Judul Website
                      </label>
                      <input
                        type="text"
                        value={settings.website.title}
                        onChange={(e) =>
                          handleInputChange('website', 'title', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deskripsi
                      </label>
                      <input
                        type="text"
                        value={settings.website.description}
                        onChange={(e) =>
                          handleInputChange('website', 'description', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={settings.website.email}
                        onChange={(e) =>
                          handleInputChange('website', 'email', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telepon
                      </label>
                      <input
                        type="text"
                        value={settings.website.phone}
                        onChange={(e) =>
                          handleInputChange('website', 'phone', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Media Sosial</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facebook
                      </label>
                      <input
                        type="url"
                        value={settings.website.socialMedia.facebook}
                        onChange={(e) =>
                          handleSocialMediaChange('facebook', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instagram
                      </label>
                      <input
                        type="url"
                        value={settings.website.socialMedia.instagram}
                        onChange={(e) =>
                          handleSocialMediaChange('instagram', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        YouTube
                      </label>
                      <input
                        type="url"
                        value={settings.website.socialMedia.youtube}
                        onChange={(e) =>
                          handleSocialMediaChange('youtube', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Logo & Branding</h3>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo Website
                    </label>
                    <div className="flex items-center space-x-4">
                      <img
                        src={settings.appearance.logo || '/piano-logo.svg'}
                        alt="Logo Preview"
                        className="w-16 h-16 object-contain border rounded-md"
                      />
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
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
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tema & Warna</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tema
                      </label>
                      <select
                        value={settings.appearance.theme}
                        onChange={(e) =>
                          handleInputChange('appearance', 'theme', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="light">Terang</option>
                        <option value="dark">Gelap</option>
                        <option value="auto">Otomatis</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Warna Utama
                      </label>
                      <input
                        type="color"
                        value={settings.appearance.primaryColor}
                        onChange={(e) =>
                          handleInputChange('appearance', 'primaryColor', e.target.value)
                        }
                        className="w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Warna Sekunder
                      </label>
                      <input
                        type="color"
                        value={settings.appearance.secondaryColor}
                        onChange={(e) =>
                          handleInputChange('appearance', 'secondaryColor', e.target.value)
                        }
                        className="w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Warna Aksen
                      </label>
                      <input
                        type="color"
                        value={settings.appearance.accentColor}
                        onChange={(e) =>
                          handleInputChange('appearance', 'accentColor', e.target.value)
                        }
                        className="w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tipografi</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Font Family
                      </label>
                      <select
                        value={settings.appearance.fontFamily}
                        onChange={(e) =>
                          handleInputChange('appearance', 'fontFamily', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Lato">Lato</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Layout & Komponen</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gaya Header
                      </label>
                      <select
                        value={settings.appearance.headerStyle}
                        onChange={(e) =>
                          handleInputChange('appearance', 'headerStyle', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="modern">Modern</option>
                        <option value="classic">Klasik</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gaya Footer
                      </label>
                      <select
                        value={settings.appearance.footerStyle}
                        onChange={(e) =>
                          handleInputChange('appearance', 'footerStyle', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="minimal">Minimal</option>
                        <option value="detailed">Detail</option>
                        <option value="compact">Kompak</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gaya Card
                      </label>
                      <select
                        value={settings.appearance.cardStyle}
                        onChange={(e) =>
                          handleInputChange('appearance', 'cardStyle', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="shadow">Shadow</option>
                        <option value="border">Border</option>
                        <option value="flat">Flat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gaya Button
                      </label>
                      <select
                        value={settings.appearance.buttonStyle}
                        onChange={(e) =>
                          handleInputChange('appearance', 'buttonStyle', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="rounded">Rounded</option>
                        <option value="square">Square</option>
                        <option value="pill">Pill</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Layout</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lebar Layout
                      </label>
                      <select
                        value={settings.appearance.layoutStyle}
                        onChange={(e) =>
                          handleInputChange('appearance', 'layoutStyle', e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="wide">Lebar</option>
                        <option value="normal">Normal</option>
                        <option value="narrow">Sempit</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Metode Pembayaran</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.payment.bankTransfer}
                        onChange={(e) =>
                          handleInputChange('payment', 'bankTransfer', e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Transfer Bank
                      </label>
                    </div>
                    {settings.payment.bankTransfer && (
                      <div className="ml-6 space-y-4">
                        {settings.payment.bankAccounts.map((account, index) => (
                          <div key={index} className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank
                              </label>
                              <input
                                type="text"
                                value={account.bank}
                                onChange={(e) =>
                                  handleBankAccountChange(index, 'bank', e.target.value)
                                }
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor Rekening
                              </label>
                              <input
                                type="text"
                                value={account.accountNumber}
                                onChange={(e) =>
                                  handleBankAccountChange(
                                    index,
                                    'accountNumber',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Pemilik
                              </label>
                              <input
                                type="text"
                                value={account.accountName}
                                onChange={(e) =>
                                  handleBankAccountChange(
                                    index,
                                    'accountName',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.payment.qris}
                        onChange={(e) =>
                          handleInputChange('payment', 'qris', e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">QRIS</label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notification' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Pengaturan Notifikasi
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notification.emailNotification}
                        onChange={(e) =>
                          handleInputChange(
                            'notification',
                            'emailNotification',
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Notifikasi Email
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notification.whatsappNotification}
                        onChange={(e) =>
                          handleInputChange(
                            'notification',
                            'whatsappNotification',
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Notifikasi WhatsApp
                      </label>
                    </div>
                    {settings.notification.whatsappNotification && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nomor WhatsApp
                        </label>
                        <input
                          type="text"
                          value={settings.notification.whatsappNumber}
                          onChange={(e) =>
                            handleInputChange(
                              'notification',
                              'whatsappNumber',
                              e.target.value
                            )
                          }
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notification.orderConfirmation}
                          onChange={(e) =>
                            handleInputChange(
                              'notification',
                              'orderConfirmation',
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Konfirmasi Pesanan
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notification.paymentReminder}
                          onChange={(e) =>
                            handleInputChange(
                              'notification',
                              'paymentReminder',
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Pengingat Pembayaran
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notification.downloadNotification}
                          onChange={(e) =>
                            handleInputChange(
                              'notification',
                              'downloadNotification',
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Notifikasi Unduhan
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Pengaturan Keamanan
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.requireEmailVerification}
                        onChange={(e) =>
                          handleInputChange(
                            'security',
                            'requireEmailVerification',
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Wajib Verifikasi Email
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batas Percobaan Login
                      </label>
                      <input
                        type="number"
                        value={settings.security.loginAttempts}
                        onChange={(e) =>
                          handleInputChange(
                            'security',
                            'loginAttempts',
                            parseInt(e.target.value)
                          )
                        }
                        min="1"
                        max="10"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeout Sesi (menit)
                      </label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) =>
                          handleInputChange(
                            'security',
                            'sessionTimeout',
                            parseInt(e.target.value)
                          )
                        }
                        min="15"
                        max="180"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Panjang Minimal Password
                      </label>
                      <input
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) =>
                          handleInputChange(
                            'security',
                            'passwordMinLength',
                            parseInt(e.target.value)
                          )
                        }
                        min="6"
                        max="16"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.requireStrongPassword}
                        onChange={(e) =>
                          handleInputChange(
                            'security',
                            'requireStrongPassword',
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Wajib Password Kuat
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg">
            Pengaturan berhasil disimpan
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;