/**
 * PeriodFilter Component
 * 
 * Toggle component for switching between week and month views
 * Implements Requirements: 5.1, 5.2, 5.5
 */

'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface PeriodFilterProps {
  selected: 'week' | 'month';
  onChange: (period: 'week' | 'month') => void;
  className?: string;
}

/**
 * PeriodFilter Component
 * 
 * Provides a toggle button group for selecting time period:
 * - Week (last 7 days)
 * - Month (last 30 days)
 * 
 * The selected period is persisted in the component state
 * and can be controlled by the parent component.
 * 
 * @example
 * ```tsx
 * const [period, setPeriod] = useState<'week' | 'month'>('month');
 * 
 * <PeriodFilter
 *   selected={period}
 *   onChange={setPeriod}
 * />
 * ```
 */
export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  selected,
  onChange,
  className,
}) => {
  const buttonBaseStyles = 'px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
  
  const activeStyles = 'bg-primary-500 text-white';
  const inactiveStyles = 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300';

  return (
    <div className={clsx('inline-flex rounded-lg shadow-sm', className)} role="group">
      <button
        type="button"
        onClick={() => onChange('week')}
        className={clsx(
          buttonBaseStyles,
          'rounded-l-lg',
          selected === 'week' ? activeStyles : inactiveStyles
        )}
        aria-pressed={selected === 'week'}
      >
        Semana
      </button>
      <button
        type="button"
        onClick={() => onChange('month')}
        className={clsx(
          buttonBaseStyles,
          'rounded-r-lg -ml-px',
          selected === 'month' ? activeStyles : inactiveStyles
        )}
        aria-pressed={selected === 'month'}
      >
        Mês
      </button>
    </div>
  );
};
