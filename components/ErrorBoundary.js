import React from 'react';
import clientLogger from '../lib/clientLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our logging service
    clientLogger.reactError(error, errorInfo, errorInfo.componentStack);
    
    // Store error details in state
    this.setState({
      error,
      errorInfo
    });

    // Log additional context if provided
    if (this.props.context) {
      clientLogger.error('Error Boundary Context', null, {
        context: this.props.context,
        props: this.props.logProps ? this.props : undefined
      });
    }
  }

  handleRetry = () => {
    clientLogger.userAction('error_boundary_retry', null, {
      error: this.state.error?.message,
      component: this.props.fallbackComponent || 'ErrorBoundary'
    });
    
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleReload = () => {
    clientLogger.userAction('error_boundary_reload', null, {
      error: this.state.error?.message
    });
    
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                {this.props.title || 'Something went wrong'}
              </h3>
              
              <p className="mt-2 text-sm text-gray-500">
                {this.props.message || 'An unexpected error occurred. Please try again or reload the page.'}
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                    <div className="font-semibold text-red-600">{this.state.error.toString()}</div>
                    {this.state.errorInfo.componentStack && (
                      <div className="mt-2">
                        <div className="font-semibold">Component Stack:</div>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reload Page
              </button>
            </div>

            {this.props.showSupport && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  If the problem persists, please{' '}
                  <a href="mailto:support@acapubweb.com" className="text-blue-600 hover:text-blue-500">
                    contact support
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = (WrappedComponent, errorBoundaryProps = {}) => {
  const WithErrorBoundaryComponent = (props) => {
    return (
      <ErrorBoundary 
        {...errorBoundaryProps}
        context={`Component: ${WrappedComponent.displayName || WrappedComponent.name || 'Unknown'}`}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithErrorBoundaryComponent;
};

// Hook for manual error reporting
export const useErrorHandler = () => {
  return React.useCallback((error, errorInfo = {}) => {
    clientLogger.error('Manual Error Report', error, errorInfo);
  }, []);
};

export default ErrorBoundary;