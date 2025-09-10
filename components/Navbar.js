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
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <img src={theme.logo} alt={theme.websiteTitle} className="w-12 h-6 sm:w-16 sm:h-8 object-contain" />
              <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 hidden md:block truncate">
                {theme.websiteTitle}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-4 lg:space-x-6 flex-1 justify-center max-w-2xl">
            <Link href="/catalog" className="nav-link hover:text-black transition-colors whitespace-nowrap text-sm lg:text-base">
              Katalog
            </Link>
            <Link href="/national" className="nav-link hover:text-black transition-colors whitespace-nowrap text-sm lg:text-base">
              Musik Nasional
            </Link>
            <Link href="/traditional" className="nav-link hover:text-black transition-colors whitespace-nowrap text-sm lg:text-base">
              Musik Tradisional
            </Link>
            <Link href="/religious" className="nav-link hover:text-black transition-colors whitespace-nowrap text-sm lg:text-base">
              Musik Religi
            </Link>
            <Link href="/composers" className="nav-link hover:text-black transition-colors whitespace-nowrap text-sm lg:text-base">
              Komposer
            </Link>
            <Link href="/about" className="nav-link hover:text-black transition-colors whitespace-nowrap text-sm lg:text-base">
              Tentang
            </Link>
          </nav>
          
          {/* Search Box - Desktop */}
          <div className="hidden lg:flex items-center navbar-search">
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
              className="input-field pl-10 pr-4 text-sm"
            />
            <button
              onClick={() => {
                if (searchTerm.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                }
              }}
              className="search-button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-shrink-0">
            {/* Cart */}
            <Link href="/cart" className="relative p-1.5 sm:p-2 text-gray-600 hover:text-black transition-colors">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
              </svg>
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {items.length}
                </span>
              )}
            </Link>

            {/* Login Button */}
            <Link href="/auth" className="btn-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap">
              Login
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 focus:outline-none ml-2"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="xl:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-3 sm:px-4 py-3 space-y-2">
              <Link 
                href="/catalog" 
                className="block px-3 py-2.5 text-sm sm:text-base text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Katalog
              </Link>
              <Link 
                href="/national" 
                className="block px-3 py-2.5 text-sm sm:text-base text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Musik Nasional
              </Link>
              <Link 
                href="/traditional" 
                className="block px-3 py-2.5 text-sm sm:text-base text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Musik Tradisional
              </Link>
              <Link 
                href="/religious" 
                className="block px-3 py-2.5 text-sm sm:text-base text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Musik Religi
              </Link>
              <Link 
                href="/composers" 
                className="block px-3 py-2.5 text-sm sm:text-base text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Komposer
              </Link>
              <Link 
                href="/about" 
                className="block px-3 py-2.5 text-sm sm:text-base text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tentang
              </Link>
              
              {/* Mobile Search */}
              <div className="px-3 py-2 border-t border-gray-100 mt-3 pt-3">
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
                    className="input-field w-full pl-10 pr-4 text-sm"
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