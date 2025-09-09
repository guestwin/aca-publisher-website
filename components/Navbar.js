import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { theme } = useTheme();
  const { items } = useCart();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getHeaderStyle = () => {
    switch (theme.headerStyle) {
      case 'centered':
        return 'flex-col items-center space-y-4';
      case 'minimal':
        return 'justify-between items-center px-4';
      default:
        return 'justify-between items-center px-8';
    }
  };

  return (
    <header className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img src={theme.logo} alt={theme.websiteTitle} className="w-16 h-8 object-contain" />
              <span className="text-xl font-bold text-gray-800 hidden sm:block">
                {theme.websiteTitle}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link href="/national" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
              Musik Nasional
            </Link>
            <Link href="/traditional" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
              Musik Tradisional
            </Link>
            <Link href="/religious" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
              Musik Religi
            </Link>
            <Link href="/composers" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
              Komposer
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
              Tentang
            </Link>
            
            {/* Search Box */}
            <div className="relative">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Cari partitur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                    }
                  }}
                  className="w-64 px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    if (searchTerm.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                    }
                  }}
                  className="absolute left-3 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </nav>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
              </svg>
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {items.length}
                </span>
              )}
            </Link>

            {/* Login Button */}
            <Link href="/auth" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Login
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link href="/national" className="text-gray-600 hover:text-blue-600 transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Musik Nasional
              </Link>
              <Link href="/traditional" className="text-gray-600 hover:text-blue-600 transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Musik Tradisional
              </Link>
              <Link href="/religious" className="text-gray-600 hover:text-blue-600 transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Musik Religi
              </Link>
              <Link href="/composers" className="text-gray-600 hover:text-blue-600 transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Komposer
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Tentang
              </Link>
              
              {/* Mobile Search */}
              <div className="pt-4 border-t border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari partitur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && searchTerm.trim()) {
                        router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      if (searchTerm.trim()) {
                        router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;