'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantStyles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 disabled:hover:bg-primary-500',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 disabled:hover:bg-secondary-500',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 disabled:hover:bg-transparent',
    ghost: 'text-gray-700 hover:bg-gray-100 disabled:hover:bg-transparent',
    danger: 'bg-danger-main text-white hover:bg-danger-dark disabled:hover:bg-danger-main',
  };
  
  return (
    <button
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
