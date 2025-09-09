import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const { theme } = useTheme();

  const getFooterStyle = () => {
    switch (theme.footerStyle) {
      case 'simple':
        return (
          <div className="container mx-auto py-6 px-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <img src={theme.logo} alt={theme.websiteTitle} className="h-8 w-auto" />
                <span className="text-sm" style={{ color: theme.secondaryColor }}>
                  © {new Date().getFullYear()} {theme.websiteTitle}
                </span>
              </div>
              <div className="flex space-x-4">
                <Link href="/about" className="text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                  Tentang Kami
                </Link>
                <Link href="/contact" className="text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                  Kontak
                </Link>
              </div>
            </div>
          </div>
        );

      case 'detailed':
        return (
          <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <img src={theme.logo} alt={theme.websiteTitle} className="h-10 w-auto" />
                  <span className="font-bold" style={{ color: theme.primaryColor }}>
                    {theme.websiteTitle}
                  </span>
                </div>
                <p className="text-sm" style={{ color: theme.secondaryColor }}>
                  Penerbit musik terkemuka yang menyediakan berbagai genre musik berkualitas.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-4" style={{ color: theme.primaryColor }}>Kategori</h3>
                <div className="space-y-2">
                  <Link href="/national" className="block text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Musik Nasional
                  </Link>
                  <Link href="/traditional" className="block text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Musik Tradisional
                  </Link>
                  <Link href="/religious" className="block text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Musik Religi
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4" style={{ color: theme.primaryColor }}>Informasi</h3>
                <div className="space-y-2">
                  <Link href="/about" className="block text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Tentang Kami
                  </Link>
                  <Link href="/composers" className="block text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Komposer
                  </Link>
                  <Link href="/contact" className="block text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Kontak
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4" style={{ color: theme.primaryColor }}>Bantuan</h3>
                <div className="space-y-2">
                  <Link href="/faq" className="block text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    FAQ
                  </Link>
                  <Link href="/terms" className="block text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Syarat & Ketentuan
                  </Link>
                  <Link href="/privacy" className="block text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Kebijakan Privasi
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t" style={{ borderColor: theme.secondaryColor }}>
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <span className="text-sm text-center sm:text-left" style={{ color: theme.secondaryColor }}>
                  © {new Date().getFullYear()} {theme.websiteTitle}. All rights reserved.
                </span>
                <div className="flex space-x-4">
                  <a href="#" className="text-sm hover:underline transition-colors" style={{ color: theme.accentColor }}>
                    Facebook
                  </a>
                  <a href="#" className="text-sm hover:underline transition-colors" style={{ color: theme.accentColor }}>
                    Twitter
                  </a>
                  <a href="#" className="text-sm hover:underline transition-colors" style={{ color: theme.accentColor }}>
                    Instagram
                  </a>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <img src={theme.logo} alt={theme.websiteTitle} className="h-10 w-auto" />
                  <span className="font-bold" style={{ color: theme.primaryColor }}>
                    {theme.websiteTitle}
                  </span>
                </div>
                <p className="text-sm" style={{ color: theme.secondaryColor }}>
                  Penerbit musik terkemuka yang menyediakan berbagai genre musik berkualitas.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold" style={{ color: theme.primaryColor }}>Menu</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/national" className="text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Musik Nasional
                  </Link>
                  <Link href="/traditional" className="text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Musik Tradisional
                  </Link>
                  <Link href="/religious" className="text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Musik Religi
                  </Link>
                  <Link href="/composers" className="text-sm hover:underline" style={{ color: theme.secondaryColor }}>
                    Komposer
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold" style={{ color: theme.primaryColor }}>Kontak</h3>
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: theme.secondaryColor }}>
                    Email: info@acapublisher.com
                  </p>
                  <p className="text-sm" style={{ color: theme.secondaryColor }}>
                    Telepon: (021) 1234-5678
                  </p>
                  <div className="flex space-x-4">
                    <a href="#" className="text-sm hover:underline" style={{ color: theme.accentColor }}>
                      Facebook
                    </a>
                    <a href="#" className="text-sm hover:underline" style={{ color: theme.accentColor }}>
                      Twitter
                    </a>
                    <a href="#" className="text-sm hover:underline" style={{ color: theme.accentColor }}>
                      Instagram
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 text-center border-t" style={{ borderColor: theme.secondaryColor }}>
              <span className="text-sm" style={{ color: theme.secondaryColor }}>
                © {new Date().getFullYear()} {theme.websiteTitle}. All rights reserved.
              </span>
            </div>
          </div>
        );
    }
  };

  return (
    <footer className="bg-white shadow-md mt-auto pb-safe">
      {getFooterStyle()}
    </footer>
  );
};

export default Footer;