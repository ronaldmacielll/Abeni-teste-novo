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
  const baseStyles = 'rounded-2xl p-6';
  
  const variantStyles = {
    default: 'bg-dark-card shadow-sm border border-gray-800',
    elevated: 'bg-dark-elevated shadow-xl border border-gray-700',
    outlined: 'bg-dark-card border-2 border-gray-700',
  };
  
  const hoverStyles = hover ? 'hover:shadow-2xl hover:border-purple-500/50 hover:scale-[1.02] transition-all duration-300 cursor-pointer' : '';
  
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
