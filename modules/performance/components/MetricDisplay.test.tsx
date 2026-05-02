/**
 * MetricDisplay Component Tests
 * 
 * Tests for the MetricDisplay component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricDisplay } from './MetricDisplay';
import { Users } from 'lucide-react';

describe('MetricDisplay Component', () => {
  it('should render label and value', () => {
    render(<MetricDisplay label="Alcance" value={1234} />);

    expect(screen.getByText('Alcance')).toBeInTheDocument();
    expect(screen.getByText('1.234')).toBeInTheDocument();
  });

  it('should format number values with locale formatting', () => {
    render(<MetricDisplay label="Test Metric" value={1234567} format="number" />);

    expect(screen.getByText('1.234.567')).toBeInTheDocument();
  });

  it('should format percentage values correctly', () => {
    render(<MetricDisplay label="Taxa de Conversão" value={45.678} format="percentage" />);

    expect(screen.getByText('45.7%')).toBeInTheDocument();
  });

  it('should render with icon when provided', () => {
    const { container } = render(
      <MetricDisplay 
        label="Usuários" 
        value={100} 
        icon={<Users data-testid="users-icon" />} 
      />
    );

    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
  });

  it('should render without icon when not provided', () => {
    const { container } = render(<MetricDisplay label="Métrica" value={100} />);

    // Check that no icon container is rendered
    const iconContainer = container.querySelector('.flex-shrink-0');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('should handle zero values', () => {
    render(<MetricDisplay label="Cliques" value={0} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle decimal values for numbers', () => {
    render(<MetricDisplay label="Média" value={123.45} format="number" />);

    expect(screen.getByText('123,45')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MetricDisplay label="Test" value={100} className="custom-class" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should default to number format when format is not specified', () => {
    render(<MetricDisplay label="Default Format" value={5000} />);

    // Should format as number, not percentage
    expect(screen.getByText('5.000')).toBeInTheDocument();
    expect(screen.queryByText('5000%')).not.toBeInTheDocument();
  });

  it('should handle large percentage values', () => {
    render(<MetricDisplay label="Growth" value={150.5} format="percentage" />);

    expect(screen.getByText('150.5%')).toBeInTheDocument();
  });

  it('should handle negative values', () => {
    render(<MetricDisplay label="Change" value={-25} format="number" />);

    expect(screen.getByText('-25')).toBeInTheDocument();
  });

  it('should truncate long values with text-truncate', () => {
    const { container } = render(
      <MetricDisplay label="Very Long Metric Name" value={999999999} />
    );

    const valueElement = screen.getByText('999.999.999');
    expect(valueElement).toHaveClass('truncate');
  });
});
