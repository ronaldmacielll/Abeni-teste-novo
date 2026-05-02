/**
 * MetricDisplay Component
 * 
 * Reusable component for displaying a metric with label, value, and icon
 * Implements Requirements: 4.2
 */

'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface MetricDisplayProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  format?: 'number' | 'percentage';
  className?: string;
}

/**
 * Format value based on format type
 */
function formatValue(value: number, format: 'number' | 'percentage'): string {
  if (format === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * MetricDisplay Component
 * 
 * Displays a metric with:
 * - Optional icon
 * - Label text
 * - Formatted value (number or percentage)
 * 
 * @example
 * ```tsx
 * <MetricDisplay
 *   label="Alcance"
 *   value={1234}
 *   icon={<Users className="w-5 h-5" />}
 *   format="number"
 * />
 * ```
 */
export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  icon,
  format = 'number',
  className,
}) => {
  return (
    <div className={clsx('flex items-start gap-3', className)}>
      {icon && (
        <div className="flex-shrink-0 mt-1">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-600 mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 truncate">
          {formatValue(value, format)}
        </p>
      </div>
    </div>
  );
};
