/**
 * Dashboard Layout Tests
 * 
 * Tests for the shared dashboard layout
 * Validates Requirements: 16.1, 16.5
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardLayout from './layout';
import { Navigation } from '@/modules/shared/components';

// Mock the Navigation component
jest.mock('@/modules/shared/components', () => ({
  Navigation: jest.fn(() => <nav data-testid="navigation">Navigation</nav>),
}));

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Navigation component', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(Navigation).toHaveBeenCalled();
  });

  it('should render children content', () => {
    render(
      <DashboardLayout>
        <div data-testid="test-content">Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply correct layout structure', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Check for main container with correct classes
    const mainContainer = container.querySelector('.min-h-screen.bg-gray-50');
    expect(mainContainer).toBeInTheDocument();

    // Check for main content area with correct classes
    const mainContent = container.querySelector('main.max-w-7xl.mx-auto');
    expect(mainContent).toBeInTheDocument();
  });

  it('should apply responsive padding classes', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const mainContent = container.querySelector('main');
    expect(mainContent).toHaveClass('px-4', 'sm:px-6', 'lg:px-8', 'py-6');
  });

  it('should render multiple children correctly', () => {
    render(
      <DashboardLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should maintain layout structure with complex children', () => {
    render(
      <DashboardLayout>
        <div>
          <h1>Dashboard Title</h1>
          <div>
            <p>Some content</p>
            <button>Action</button>
          </div>
        </div>
      </DashboardLayout>
    );

    expect(screen.getByText('Dashboard Title')).toBeInTheDocument();
    expect(screen.getByText('Some content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
