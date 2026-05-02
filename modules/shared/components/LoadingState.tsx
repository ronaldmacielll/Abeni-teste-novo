'use client';

import React from 'react';
import { clsx } from 'clsx';
import { LoadingSpinner } from './LoadingSpinner';

export interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'md',
  message,
  className,
}) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <LoadingSpinner size={size} />
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};
