import { ThemeProvider } from '../context/ThemeContext';
import { CartProvider } from '../context/CartContext';
import ErrorBoundary from '../components/ErrorBoundary';
// import clientLogger from '../lib/clientLogger'; // Temporarily disabled
import { initGA4, trackPageView, initSEOMonitoring } from '../lib/seoAnalytics';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Log initial page load
    // clientLogger.info('App Initialized', {
    //   page: router.pathname,
    //   userAgent: navigator.userAgent,
    //   timestamp: Date.now()
    // });

    // Log route changes
    const handleRouteChange = (url, { shallow }) => {
      // clientLogger.navigation(router.pathname, url, { shallow });
    };

    const handleRouteChangeStart = (url) => {
      // clientLogger.info('Route Change Start', { from: router.pathname, to: url });
    };

    const handleRouteChangeComplete = (url) => {
      // clientLogger.info('Route Change Complete', { url });
      // Track page view for route changes
      trackPageView(url, document.title);
    };

    const handleRouteChangeError = (err, url) => {
      // clientLogger.error('Route Change Error', err, { url });
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);
    router.events.on('beforeHistoryChange', handleRouteChange);

    // Performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          if (perfData) {
            clientLogger.performance('page_load_time', perfData.loadEventEnd - perfData.fetchStart, {
              page: router.pathname,
              domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
              firstPaint: perfData.responseEnd - perfData.fetchStart
            });
          }
        }, 0);
      });
    }

    // Initialize Google Analytics
    if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      initGA4(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
    }

    // Initialize SEO monitoring
    const seoMonitor = initSEOMonitoring();

    // Track initial page view
    trackPageView(window.location.href, document.title);

    // Cleanup
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
      router.events.off('beforeHistoryChange', handleRouteChange);
    };
  }, [router]);

  return (
    <ErrorBoundary
      title="Application Error"
      message="The application encountered an unexpected error. Please try refreshing the page."
      showSupport={true}
      context="App Root"
    >
      <ThemeProvider>
        <CartProvider>
          <Component {...pageProps} />
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default MyApp;