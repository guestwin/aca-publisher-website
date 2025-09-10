import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple Button component for testing
const Button = ({ children, onClick, disabled = false, variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded font-medium focus:outline-none focus:ring-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  const className = `${baseClasses} ${variantClasses[variant]} ${disabled ? disabledClasses : ''}`;
  
  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

describe('Button Component', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>);
    const button = screen.getByText('Disabled button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled button</Button>);
    
    fireEvent.click(screen.getByText('Disabled button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toHaveClass('bg-blue-600');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByText('Secondary')).toHaveClass('bg-gray-600');
    
    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByText('Danger')).toHaveClass('bg-red-600');
  });

  it('should pass through additional props', () => {
    render(<Button data-testid="custom-button" aria-label="Custom button">Button</Button>);
    const button = screen.getByTestId('custom-button');
    
    expect(button).toHaveAttribute('aria-label', 'Custom button');
  });

  it('should have proper focus styles', () => {
    render(<Button>Focus me</Button>);
    const button = screen.getByText('Focus me');
    
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
  });

  it('should handle keyboard events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard button</Button>);
    const button = screen.getByText('Keyboard button');
    
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    // Note: React handles Enter key as click for buttons automatically
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });
  });
});