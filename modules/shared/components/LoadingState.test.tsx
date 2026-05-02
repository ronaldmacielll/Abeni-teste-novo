import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingState } from './LoadingState';

describe('LoadingState Component', () => {
  it('should render spinner with aria-label', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });

  it('should render message when provided', () => {
    render(<LoadingState message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should not render message when not provided', () => {
    const { container } = render(<LoadingState />);
    const message = container.querySelector('p');
    expect(message).not.toBeInTheDocument();
  });

  it('should apply small size styles', () => {
    const { container } = render(<LoadingState size="sm" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('w-6', 'h-6', 'border-2');
  });

  it('should apply medium size styles by default', () => {
    const { container } = render(<LoadingState />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('w-10', 'h-10', 'border-3');
  });

  it('should apply large size styles', () => {
    const { container } = render(<LoadingState size="lg" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('w-16', 'h-16', 'border-4');
  });

  it('should apply spinner animation styles', () => {
    const { container } = render(<LoadingState />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-primary-500', 'border-t-transparent');
  });

  it('should apply custom className', () => {
    const { container } = render(<LoadingState className="custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });
});
