import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should render default error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Ocorreu um erro inesperado')).toBeInTheDocument();
  });

  it('should display error message in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test error');
  });

  it('should reset error state when retry button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Tentar novamente');
    fireEvent.click(retryButton);
    
    // After reset, re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should have retry button in default error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const retryButton = screen.getByText('Tentar novamente');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton.tagName).toBe('BUTTON');
  });

  it('should have back to home button in default error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const backButton = screen.getByText('Voltar para o início');
    expect(backButton).toBeInTheDocument();
    expect(backButton.tagName).toBe('BUTTON');
  });

  it('should log error details for monitoring', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error');
    
    render(
      <ErrorBoundary moduleName="TestModule">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorLog = consoleErrorSpy.mock.calls.find(call => 
      call[0] === '[ErrorBoundary] Error details:'
    );
    expect(errorLog).toBeDefined();
    
    consoleErrorSpy.mockRestore();
  });
});
