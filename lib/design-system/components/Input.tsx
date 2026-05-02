'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
  label?: string;
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, errorMessage, label, className, disabled, ...props }, ref) => {
    const baseStyles = 'w-full rounded-lg border px-4 py-2 text-base focus:outline-none focus:ring-2 transition-colors duration-200';
    
    const stateStyles = error
      ? 'border-danger-main focus:ring-danger-main focus:border-transparent'
      : 'border-gray-300 focus:ring-primary-500 focus:border-transparent';
    
    const disabledStyles = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            baseStyles,
            stateStyles,
            disabledStyles,
            className
          )}
          disabled={disabled}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-1 text-sm text-danger-text">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
