import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary, { useErrorHandler } from '../ErrorBoundary';
import clientLogger from '../../lib/clientLogger';

// Mock clientLogger
jest.mock('../../lib/clientLogger', () => ({
  default: {
    error: jest.fn(),
    reactError: jest.fn(),
    userAction: jest.fn(),
    info: jest.fn()
  }
}));

// Mock component that throws an error
const ThrowError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock component for testing useErrorHandler
const TestComponent = () => {
  const handleError = useErrorHandler();
  
  const triggerError = () => {
    try {
      throw new Error('Handled error');
    } catch (error) {
      handleError(error, { context: 'test' });
    }
  };
  
  return (
    <div>
      <span>Test Component</span>
      <button onClick={triggerError}>Trigger Error</button>
    </div>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('Normal Operation', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render children components normally', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      expect(screen.getByText(/Test error/)).toBeInTheDocument();
    });

    it('should log error to clientLogger when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(clientLogger.reactError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        }),
        expect.any(String)
      );
    });

    it('should display retry button when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should display reload button when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should retry and recover when retry button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Try Again'));
      
      // Rerender with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should reload page when reload button is clicked', () => {
      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      fireEvent.click(screen.getByText('Reload Page'));
      
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Custom Fallback', () => {
    const CustomFallback = ({ error, retry, reload }) => (
      <div>
        <h2>Custom Error UI</h2>
        <p>Error: {error.message}</p>
        <button onClick={retry}>Custom Retry</button>
        <button onClick={reload}>Custom Reload</button>
      </div>
    );

    it('should render custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
      expect(screen.getByText('Custom Retry')).toBeInTheDocument();
      expect(screen.getByText('Custom Reload')).toBeInTheDocument();
    });

    it('should call retry function from custom fallback', () => {
      const { rerender } = render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      fireEvent.click(screen.getByText('Custom Retry'));
      
      rerender(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('useErrorHandler Hook', () => {
    it('should handle errors programmatically', () => {
      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Test Component')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Trigger Error'));
      
      expect(clientLogger.error).toHaveBeenCalledWith(
        'Manual Error Report',
        expect.any(Error),
        expect.objectContaining({
          context: 'test'
        })
      );
    });

    it('should work outside of ErrorBoundary context', () => {
      render(<TestComponent />);
      
      fireEvent.click(screen.getByText('Trigger Error'));
      
      expect(clientLogger.error).toHaveBeenCalled();
    });
  });

  describe('Error Information', () => {
    it('should include component stack in error info', () => {
      render(
        <ErrorBoundary>
          <div>
            <span>
              <ThrowError shouldThrow={true} />
            </span>
          </div>
        </ErrorBoundary>
      );
      
      expect(clientLogger.reactError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.stringContaining('ThrowError')
        }),
        expect.any(String)
      );
    });

    it('should handle different error types', () => {
      const CustomError = () => {
        throw new TypeError('Type error');
      };
      
      render(
        <ErrorBoundary>
          <CustomError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Type error/)).toBeInTheDocument();
      expect(clientLogger.reactError).toHaveBeenCalledWith(
        expect.any(TypeError),
        expect.any(Object),
        expect.any(String)
      );
    });
  });

  describe('Multiple Errors', () => {
    it('should handle multiple consecutive errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(clientLogger.error).toHaveBeenCalledTimes(1);
      
      // Retry
      fireEvent.click(screen.getByText('Try Again'));
      
      // Throw another error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(clientLogger.error).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when no error', () => {
      const renderSpy = jest.fn();
      
      const TestChild = () => {
        renderSpy();
        return <div>Test</div>;
      };
      
      const { rerender } = render(
        <ErrorBoundary>
          <TestChild />
        </ErrorBoundary>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Rerender with same props
      rerender(
        <ErrorBoundary>
          <TestChild />
        </ErrorBoundary>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});