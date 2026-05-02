import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variantStyles = {
    success: 'bg-success-light text-success-text',
    warning: 'bg-warning-light text-warning-text',
    danger: 'bg-danger-light text-danger-text',
    info: 'bg-info-light text-info-text',
    neutral: 'bg-gray-100 text-gray-800',
  };
  
  return (
    <span
      className={clsx(
        baseStyles,
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
