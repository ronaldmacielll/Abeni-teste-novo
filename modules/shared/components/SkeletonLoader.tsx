'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'circle' | 'rectangle';
  width?: string;
  height?: string;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'rectangle',
  width,
  height,
  className,
}) => {
  const baseStyles = 'animate-pulse bg-gray-200';

  const variantStyles = {
    card: 'rounded-lg',
    text: 'rounded h-4',
    circle: 'rounded-full',
    rectangle: 'rounded',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={clsx(baseStyles, variantStyles[variant], className)}
      style={style}
      role="status"
      aria-label="Carregando conteúdo"
    />
  );
};

// Skeleton for Post Card
export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Image skeleton */}
      <SkeletonLoader variant="rectangle" height="200px" className="w-full" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Status badge skeleton */}
        <SkeletonLoader variant="rectangle" width="80px" height="24px" />
        
        {/* Metrics skeleton */}
        <div className="space-y-2">
          <SkeletonLoader variant="text" className="w-full" />
          <SkeletonLoader variant="text" className="w-full" />
          <SkeletonLoader variant="text" className="w-full" />
          <SkeletonLoader variant="text" className="w-3/4" />
        </div>
      </div>
    </div>
  );
};

// Skeleton for Summary Card
export const SummaryCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-3">
        {/* Title skeleton */}
        <SkeletonLoader variant="text" width="120px" />
        
        {/* Value skeleton */}
        <SkeletonLoader variant="rectangle" width="150px" height="36px" />
        
        {/* Subtitle skeleton */}
        <SkeletonLoader variant="text" width="180px" />
      </div>
    </div>
  );
};

// Skeleton for Transaction Row
export const TransactionRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200">
      {/* Status indicator skeleton */}
      <SkeletonLoader variant="circle" width="12px" height="12px" />
      
      {/* Description skeleton */}
      <div className="flex-1">
        <SkeletonLoader variant="text" width="200px" />
      </div>
      
      {/* Type skeleton */}
      <SkeletonLoader variant="rectangle" width="80px" height="24px" />
      
      {/* Value skeleton */}
      <SkeletonLoader variant="text" width="100px" />
      
      {/* Date skeleton */}
      <SkeletonLoader variant="text" width="80px" />
    </div>
  );
};

// Skeleton for Transaction List
export const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <TransactionRowSkeleton key={index} />
      ))}
    </div>
  );
};
