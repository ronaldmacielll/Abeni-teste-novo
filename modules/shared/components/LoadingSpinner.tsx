'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-primary-500 border-t-transparent',
        sizeStyles[size],
        className
      )}
      role="status"
      aria-label="Carregando"
    />
  );
};
