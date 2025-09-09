import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState({
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

  // Load settings dari API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/appearance');
        const data = await response.json();
        if (data.success && data.settings) {
          setTheme(prev => ({
            ...prev,
            ...data.settings
          }));
        }
      } catch (error) {
        console.error('Error loading theme settings:', error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    // Terapkan tema ke dokumen
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', theme.accentColor);
    document.documentElement.style.setProperty('--font-family', theme.fontFamily);
    
    // Terapkan custom CSS
    let customStyleTag = document.getElementById('custom-css');
    if (!customStyleTag) {
      customStyleTag = document.createElement('style');
      customStyleTag.id = 'custom-css';
      document.head.appendChild(customStyleTag);
    }
    customStyleTag.textContent = theme.customCSS;

    // Update favicon
    let faviconTag = document.querySelector("link[rel*='icon']");
    if (!faviconTag) {
      faviconTag = document.createElement('link');
      faviconTag.rel = 'shortcut icon';
      document.head.appendChild(faviconTag);
    }
    faviconTag.href = theme.favicon;

    // Update title
    document.title = theme.websiteTitle;
  }, [theme]);

  const updateTheme = (newTheme) => {
    setTheme(prev => ({ ...prev, ...newTheme }));
    // Di sini bisa ditambahkan logika untuk menyimpan ke database/API
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      <div className={`font-${theme.fontFamily}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}