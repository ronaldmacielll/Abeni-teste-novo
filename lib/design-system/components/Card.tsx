import React from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  hover = false,
}) => {
  const baseStyles = 'rounded-lg p-6';
  
  const variantStyles = {
    default: 'bg-white shadow-sm border border-gray-200',
    elevated: 'bg-white shadow-lg border border-gray-200',
    outlined: 'bg-white border-2 border-gray-300',
  };
  
  const hoverStyles = hover ? 'hover:shadow-md transition-shadow duration-200' : '';
  
  return (
    <div
      className={clsx(
        baseStyles,
        variantStyles[variant],
        hoverStyles,
        className
      )}
    >
      {children}
    </div>
  );
};
