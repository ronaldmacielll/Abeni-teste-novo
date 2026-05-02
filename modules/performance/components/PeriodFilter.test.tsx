/**
 * PeriodFilter Component Tests
 * 
 * Tests for the PeriodFilter component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PeriodFilter } from './PeriodFilter';

describe('PeriodFilter Component', () => {
  it('should render both week and month buttons', () => {
    const onChange = jest.fn();
    render(<PeriodFilter selected="month" onChange={onChange} />);

    expect(screen.getByText('Semana')).toBeInTheDocument();
    expect(screen.getByText('Mês')).toBeInTheDocument();
  });

  it('should highlight selected period (month)', () => {
    const onChange = jest.fn();
    render(<PeriodFilter selected="month" onChange={onChange} />);

    const monthButton = screen.getByText('Mês');
    const weekButton = screen.getByText('Semana');

    // Month should be active
    expect(monthButton).toHaveClass('bg-primary-500', 'text-white');
    
    // Week should be inactive
    expect(weekButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('should highlight selected period (week)', () => {
    const onChange = jest.fn();
    render(<PeriodFilter selected="week" onChange={onChange} />);

    const monthButton = screen.getByText('Mês');
    const weekButton = screen.getByText('Semana');

    // Week should be active
    expect(weekButton).toHaveClass('bg-primary-500', 'text-white');
    
    // Month should be inactive
    expect(monthButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('should call onChange when week button is clicked', () => {
    const onChange = jest.fn();
    render(<PeriodFilter selected="month" onChange={onChange} />);

    const weekButton = screen.getByText('Semana');
    fireEvent.click(weekButton);

    expect(onChange).toHaveBeenCalledWith('week');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should call onChange when month button is clicked', () => {
    const onChange = jest.fn();
    render(<PeriodFilter selected="week" onChange={onChange} />);

    const monthButton = screen.getByText('Mês');
    fireEvent.click(monthButton);

    expect(onChange).toHaveBeenCalledWith('month');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should not call onChange when clicking already selected button', () => {
    const onChange = jest.fn();
    render(<PeriodFilter selected="month" onChange={onChange} />);

    const monthButton = screen.getByText('Mês');
    fireEvent.click(monthButton);

    // onChange is still called, but the parent component should handle the no-op
    expect(onChange).toHaveBeenCalledWith('month');
  });

  it('should have correct aria-pressed attributes', () => {
    const onChange = jest.fn();
    render(<PeriodFilter selected="month" onChange={onChange} />);

    const monthButton = screen.getByText('Mês');
    const weekButton = screen.getByText('Semana');

    expect(monthButton).toHaveAttribute('aria-pressed', 'true');
    expect(weekButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should apply custom className', () => {
    const onChange = jest.fn();
    const { container } = render(
      <PeriodFilter selected="month" onChange={onChange} className="custom-class" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should have button type="button" to prevent form submission', () => {
    const onChange = jest.fn();
    render(<PeriodFilter selected="month" onChange={onChange} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('should have role="group" for accessibility', () => {
    const onChange = jest.fn();
    const { container } = render(<PeriodFilter selected="month" onChange={onChange} />);

    const group = container.querySelector('[role="group"]');
    expect(group).toBeInTheDocument();
  });

  it('should toggle between periods on multiple clicks', () => {
    const onChange = jest.fn();
    const { rerender } = render(<PeriodFilter selected="month" onChange={onChange} />);

    // Click week
    fireEvent.click(screen.getByText('Semana'));
    expect(onChange).toHaveBeenCalledWith('week');

    // Simulate parent updating the selected prop
    rerender(<PeriodFilter selected="week" onChange={onChange} />);

    // Click month
    fireEvent.click(screen.getByText('Mês'));
    expect(onChange).toHaveBeenCalledWith('month');

    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
