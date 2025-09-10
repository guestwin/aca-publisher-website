/**
 * Komponen Loading Spinner
 */

import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  text = '', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    white: 'text-white',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      
      {text && (
        <p className={`mt-2 ${textSizeClasses[size]} ${colorClasses[color]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Komponen Loading Overlay untuk full screen
export const LoadingOverlay = ({ 
  isVisible = false, 
  text = 'Loading...', 
  size = 'lg',
  backgroundColor = 'bg-white bg-opacity-90'
}) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${backgroundColor}`}>
      <LoadingSpinner size={size} text={text} />
    </div>
  );
};

// Komponen Loading Button
export const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false,
  onClick,
  className = '',
  spinnerSize = 'sm',
  spinnerColor = 'white',
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size={spinnerSize} color={spinnerColor} />
        </div>
      )}
      
      <span className={loading ? 'invisible' : 'visible'}>
        {children}
      </span>
    </button>
  );
};

// Komponen Loading Card untuk skeleton loading
export const LoadingCard = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-300 rounded-lg h-48 mb-4"></div>
      <div className="space-y-2">
        <div className="bg-gray-300 h-4 rounded w-3/4"></div>
        <div className="bg-gray-300 h-4 rounded w-1/2"></div>
        <div className="bg-gray-300 h-4 rounded w-2/3"></div>
      </div>
    </div>
  );
};

// Komponen Loading List untuk skeleton loading
export const LoadingList = ({ items = 3, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse flex space-x-4">
          <div className="bg-gray-300 rounded-full h-12 w-12"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="bg-gray-300 h-4 rounded w-3/4"></div>
            <div className="bg-gray-300 h-4 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Komponen Loading Table untuk skeleton loading
export const LoadingTable = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-300 h-8 rounded mb-4"></div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 mb-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="bg-gray-300 h-6 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;