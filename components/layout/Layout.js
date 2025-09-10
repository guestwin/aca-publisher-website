/**
 * Komponen Layout utama
 */

import React from 'react';
import Head from 'next/head';
import Navbar from '../Navbar';
import Footer from '../Footer';

const Layout = ({ 
  children, 
  title = 'ACA Publisher - Partitur Paduan Suara Berkualitas',
  description = 'Platform terpercaya untuk membeli partitur paduan suara berkualitas tinggi dengan berbagai genre dan tingkat kesulitan.',
  keywords = 'partitur, paduan suara, choir, musik, sheet music, ACA Publisher',
  ogImage = '/images/og-image.jpg',
  canonical,
  noIndex = false,
  className = ''
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="ACA Publisher" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Canonical URL */}
        {canonical && <link rel="canonical" href={canonical} />}
        
        {/* Robots */}
        {noIndex && <meta name="robots" content="noindex, nofollow" />}
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#2563eb" />
        
        {/* Additional Meta Tags */}
        <meta name="author" content="ACA Publisher" />
        <meta name="language" content="id" />
        <meta name="geo.region" content="ID" />
        <meta name="geo.country" content="Indonesia" />
      </Head>
      
      <div className={`min-h-screen flex flex-col ${className}`}>
        <Navbar />
        
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

// Layout khusus untuk halaman admin
export const AdminLayout = ({ 
  children, 
  title = 'Admin - ACA Publisher',
  className = '' 
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className={`min-h-screen bg-gray-100 ${className}`}>
        {/* Admin Navbar bisa ditambahkan di sini */}
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </>
  );
};

// Layout khusus untuk halaman auth
export const AuthLayout = ({ 
  children, 
  title = 'ACA Publisher',
  className = '' 
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className={`min-h-screen bg-gray-50 flex flex-col justify-center ${className}`}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600">ACA Publisher</h1>
            <p className="text-gray-600 mt-2">Platform Partitur Paduan Suara</p>
          </div>
        </div>
        
        <main className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {children}
          </div>
        </main>
        
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>&copy; 2024 ACA Publisher. All rights reserved.</p>
        </div>
      </div>
    </>
  );
};

// Layout khusus untuk halaman checkout/payment
export const CheckoutLayout = ({ 
  children, 
  title = 'Checkout - ACA Publisher',
  step = 1,
  totalSteps = 3,
  className = '' 
}) => {
  const steps = [
    { number: 1, name: 'Keranjang', description: 'Review items' },
    { number: 2, name: 'Checkout', description: 'Payment details' },
    { number: 3, name: 'Konfirmasi', description: 'Order confirmation' }
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <Navbar />
        
        {/* Progress Steps */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <nav aria-label="Progress">
              <ol className="flex items-center justify-center space-x-8">
                {steps.map((stepItem, index) => (
                  <li key={stepItem.number} className="flex items-center">
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        stepItem.number <= step 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-gray-300 text-gray-500'
                      }`}>
                        {stepItem.number <= step ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">{stepItem.number}</span>
                        )}
                      </div>
                      <div className="ml-3 text-left">
                        <p className={`text-sm font-medium ${
                          stepItem.number <= step ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {stepItem.name}
                        </p>
                        <p className="text-xs text-gray-500">{stepItem.description}</p>
                      </div>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={`ml-8 w-16 h-0.5 ${
                        stepItem.number < step ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
        
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Layout;