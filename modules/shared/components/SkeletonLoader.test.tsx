import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SkeletonLoader,
  PostCardSkeleton,
  SummaryCardSkeleton,
  TransactionRowSkeleton,
  TransactionListSkeleton,
} from './SkeletonLoader';

describe('SkeletonLoader', () => {
  it('should render with default variant', () => {
    const { container } = render(<SkeletonLoader />);
    const skeleton = container.querySelector('[role="status"]');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200');
  });

  it('should render card variant', () => {
    const { container } = render(<SkeletonLoader variant="card" />);
    const skeleton = container.querySelector('[role="status"]');
    expect(skeleton).toHaveClass('rounded-lg');
  });

  it('should render text variant', () => {
    const { container } = render(<SkeletonLoader variant="text" />);
    const skeleton = container.querySelector('[role="status"]');
    expect(skeleton).toHaveClass('h-4');
  });

  it('should render circle variant', () => {
    const { container } = render(<SkeletonLoader variant="circle" />);
    const skeleton = container.querySelector('[role="status"]');
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('should apply custom width and height', () => {
    const { container } = render(<SkeletonLoader width="100px" height="50px" />);
    const skeleton = container.querySelector('[role="status"]') as HTMLElement;
    expect(skeleton.style.width).toBe('100px');
    expect(skeleton.style.height).toBe('50px');
  });

  it('should apply custom className', () => {
    const { container } = render(<SkeletonLoader className="custom-class" />);
    const skeleton = container.querySelector('[role="status"]');
    expect(skeleton).toHaveClass('custom-class');
  });

  it('should have aria-label for accessibility', () => {
    render(<SkeletonLoader />);
    const skeleton = screen.getByLabelText('Carregando conteúdo');
    expect(skeleton).toBeInTheDocument();
  });
});

describe('PostCardSkeleton', () => {
  it('should render post card skeleton structure', () => {
    const { container } = render(<PostCardSkeleton />);
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have card container with proper styling', () => {
    const { container } = render(<PostCardSkeleton />);
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm');
  });
});

describe('SummaryCardSkeleton', () => {
  it('should render summary card skeleton structure', () => {
    const { container } = render(<SummaryCardSkeleton />);
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have card container with proper styling', () => {
    const { container } = render(<SummaryCardSkeleton />);
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm');
  });
});

describe('TransactionRowSkeleton', () => {
  it('should render transaction row skeleton structure', () => {
    const { container } = render(<TransactionRowSkeleton />);
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have row container with proper styling', () => {
    const { container } = render(<TransactionRowSkeleton />);
    const row = container.firstChild;
    expect(row).toHaveClass('flex', 'items-center', 'gap-4');
  });
});

describe('TransactionListSkeleton', () => {
  it('should render default number of transaction rows', () => {
    const { container } = render(<TransactionListSkeleton />);
    const rows = container.querySelectorAll('.flex.items-center');
    expect(rows.length).toBe(5);
  });

  it('should render custom number of transaction rows', () => {
    const { container } = render(<TransactionListSkeleton count={3} />);
    const rows = container.querySelectorAll('.flex.items-center');
    expect(rows.length).toBe(3);
  });

  it('should have list container with proper styling', () => {
    const { container } = render(<TransactionListSkeleton />);
    const list = container.firstChild;
    expect(list).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm');
  });
});
