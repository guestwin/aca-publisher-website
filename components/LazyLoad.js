import { lazy, Suspense, forwardRef } from 'react';
import { useState, useEffect, useRef } from 'react';

// Intersection Observer hook for lazy loading
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);
        
        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return [elementRef, isIntersecting, hasIntersected];
};

// Loading skeleton component
const LoadingSkeleton = ({ className = '', height = '200px' }) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ height }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

// Error boundary for lazy loaded components
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">Failed to load component. Please try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main LazyLoad component
const LazyLoad = ({
  children,
  fallback,
  height = '200px',
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
  once = true,
  ...props
}) => {
  const [elementRef, isIntersecting, hasIntersected] = useIntersectionObserver({
    threshold,
    rootMargin
  });

  const shouldRender = once ? hasIntersected : isIntersecting;

  return (
    <div ref={elementRef} className={className} {...props}>
      {shouldRender ? (
        <LazyErrorBoundary>
          <Suspense fallback={fallback || <LoadingSkeleton height={height} />}>
            {children}
          </Suspense>
        </LazyErrorBoundary>
      ) : (
        fallback || <LoadingSkeleton height={height} className={className} />
      )}
    </div>
  );
};

// HOC for lazy loading components
const withLazyLoad = (Component, options = {}) => {
  const LazyComponent = forwardRef((props, ref) => {
    return (
      <LazyLoad {...options}>
        <Component {...props} ref={ref} />
      </LazyLoad>
    );
  });
  
  LazyComponent.displayName = `LazyLoad(${Component.displayName || Component.name})`;
  return LazyComponent;
};

// Utility function to create lazy components
const createLazyComponent = (importFunc, options = {}) => {
  const LazyComponent = lazy(importFunc);
  
  return forwardRef((props, ref) => (
    <LazyLoad {...options}>
      <LazyComponent {...props} ref={ref} />
    </LazyLoad>
  ));
};

export default LazyLoad;
export { withLazyLoad, createLazyComponent, LoadingSkeleton, useIntersectionObserver };