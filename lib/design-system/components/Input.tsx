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
    const baseStyles = 'w-full rounded-xl border px-4 py-3 text-base focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm';
    
    const stateStyles = error
      ? 'border-red-500 focus:ring-red-500 focus:border-transparent text-white bg-red-900/10'
      : 'border-gray-700 focus:ring-purple-500 focus:border-transparent text-white hover:border-gray-600';
    
    const disabledStyles = disabled ? 'bg-gray-900 cursor-not-allowed' : 'bg-gray-800/50';
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
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
          <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
