/**
 * SummaryCard Component Tests
 * 
 * Unit tests for the SummaryCard component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SummaryCard } from './SummaryCard';

describe('SummaryCard Component', () => {
  it('should render title and formatted value', () => {
    render(
      <SummaryCard
        title="Saldo Atual"
        value={45000}
        variant="primary"
      />
    );

    expect(screen.getByText('Saldo Atual')).toBeInTheDocument();
    expect(screen.getByText('R$ 45.000,00')).toBeInTheDocument();
  });

  it('should format currency in BRL locale', () => {
    render(
      <SummaryCard
        title="Faturamento"
        value={1234.56}
        variant="success"
      />
    );

    expect(screen.getByText('R$ 1.234,56')).toBeInTheDocument();
  });

  it('should display subtitle when provided', () => {
    render(
      <SummaryCard
        title="Saldo"
        value={1000}
        subtitle="Receitas - Despesas"
        variant="primary"
      />
    );

    expect(screen.getByText('Receitas - Despesas')).toBeInTheDocument();
  });

  it('should display up trend indicator', () => {
    const { container } = render(
      <SummaryCard
        title="Receitas"
        value={5000}
        trend="up"
        variant="success"
      />
    );

    // Check for TrendingUp icon (lucide-react renders as svg)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should display down trend indicator', () => {
    const { container } = render(
      <SummaryCard
        title="Despesas"
        value={3000}
        trend="down"
        variant="danger"
      />
    );

    // Check for TrendingDown icon
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should not display trend indicator when neutral', () => {
    const { container } = render(
      <SummaryCard
        title="Saldo"
        value={1000}
        trend="neutral"
        variant="primary"
      />
    );

    // Should not have trend icons
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(0);
  });

  it('should apply primary variant styles', () => {
    const { container } = render(
      <SummaryCard
        title="Test"
        value={100}
        variant="primary"
      />
    );

    const card = container.querySelector('.border-primary-200');
    expect(card).toBeInTheDocument();
  });

  it('should apply success variant styles', () => {
    const { container } = render(
      <SummaryCard
        title="Test"
        value={100}
        variant="success"
      />
    );

    const card = container.querySelector('.border-success-main');
    expect(card).toBeInTheDocument();
  });

  it('should apply warning variant styles', () => {
    const { container } = render(
      <SummaryCard
        title="Test"
        value={100}
        variant="warning"
      />
    );

    const card = container.querySelector('.border-warning-main');
    expect(card).toBeInTheDocument();
  });

  it('should apply danger variant styles', () => {
    const { container } = render(
      <SummaryCard
        title="Test"
        value={100}
        variant="danger"
      />
    );

    const card = container.querySelector('.border-danger-main');
    expect(card).toBeInTheDocument();
  });

  it('should handle zero value', () => {
    render(
      <SummaryCard
        title="Empty"
        value={0}
        variant="primary"
      />
    );

    expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
  });

  it('should handle negative value', () => {
    render(
      <SummaryCard
        title="Deficit"
        value={-1500.50}
        variant="danger"
      />
    );

    expect(screen.getByText('-R$ 1.500,50')).toBeInTheDocument();
  });

  it('should handle large values', () => {
    render(
      <SummaryCard
        title="Large Amount"
        value={1234567.89}
        variant="success"
      />
    );

    expect(screen.getByText('R$ 1.234.567,89')).toBeInTheDocument();
  });

  it('should render without subtitle when not provided', () => {
    const { container } = render(
      <SummaryCard
        title="Simple Card"
        value={1000}
        variant="primary"
      />
    );

    // Should not have any subtitle text
    const subtitles = container.querySelectorAll('.text-xs.text-gray-500');
    expect(subtitles.length).toBe(0);
  });

  it('should render without trend when not provided', () => {
    const { container } = render(
      <SummaryCard
        title="No Trend"
        value={1000}
        variant="primary"
      />
    );

    // Should not have any SVG icons
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(0);
  });

  it('should format decimal values correctly', () => {
    render(
      <SummaryCard
        title="Decimal Test"
        value={999.99}
        variant="primary"
      />
    );

    expect(screen.getByText('R$ 999,99')).toBeInTheDocument();
  });

  it('should format values with thousands separator', () => {
    render(
      <SummaryCard
        title="Thousands Test"
        value={10000}
        variant="primary"
      />
    );

    expect(screen.getByText('R$ 10.000,00')).toBeInTheDocument();
  });

  it('should display all variant styles correctly', () => {
    const { rerender, container } = render(
      <SummaryCard title="Test" value={100} variant="primary" />
    );
    expect(container.querySelector('.border-primary-200')).toBeInTheDocument();

    rerender(<SummaryCard title="Test" value={100} variant="success" />);
    expect(container.querySelector('.border-success-main')).toBeInTheDocument();

    rerender(<SummaryCard title="Test" value={100} variant="warning" />);
    expect(container.querySelector('.border-warning-main')).toBeInTheDocument();

    rerender(<SummaryCard title="Test" value={100} variant="danger" />);
    expect(container.querySelector('.border-danger-main')).toBeInTheDocument();
  });

  it('should use BRL currency formatting for all values', () => {
    const { rerender } = render(
      <SummaryCard title="Test" value={1234.56} variant="primary" />
    );

    // Check that the format uses Brazilian locale (. for thousands, , for decimals)
    expect(screen.getByText('R$ 1.234,56')).toBeInTheDocument();

    rerender(<SummaryCard title="Test" value={5000000} variant="primary" />);
    expect(screen.getByText('R$ 5.000.000,00')).toBeInTheDocument();
  });
});
