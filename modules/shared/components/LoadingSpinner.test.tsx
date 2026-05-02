import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default size', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('should render with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('should render with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('should apply custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('custom-class');
  });

  it('should have aria-label for accessibility', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByLabelText('Carregando');
    expect(spinner).toBeInTheDocument();
  });

  it('should have animate-spin class', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('animate-spin');
  });
});
