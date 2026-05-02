/**
 * Tests for Performance Page with Dynamic Import
 * 
 * Validates that the page loads correctly with code splitting
 */

import { render, screen, waitFor } from '@testing-library/react';
import PerformancePage from './page';

// Mock the dynamic import
jest.mock('./PerformancePageContent', () => {
  return function MockPerformancePageContent() {
    return <div data-testid="performance-content">Performance Content Loaded</div>;
  };
});

// Mock the LoadingState component
jest.mock('@/modules/shared/components', () => ({
  LoadingState: ({ message }: { message: string }) => (
    <div data-testid="loading-state">{message}</div>
  ),
}));

describe('PerformancePage with Code Splitting', () => {
  it('should render loading state initially', () => {
    render(<PerformancePage />);
    
    // Should show loading state while dynamic import loads
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.getByText('Carregando módulo de performance...')).toBeInTheDocument();
  });

  it('should render content after dynamic import loads', async () => {
    render(<PerformancePage />);
    
    // Wait for dynamic import to resolve
    await waitFor(() => {
      expect(screen.getByTestId('performance-content')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Performance Content Loaded')).toBeInTheDocument();
  });

  it('should not show loading state after content loads', async () => {
    render(<PerformancePage />);
    
    // Wait for dynamic import to resolve
    await waitFor(() => {
      expect(screen.getByTestId('performance-content')).toBeInTheDocument();
    });
    
    // Loading state should be gone
    expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
  });
});
