/**
 * SummaryCard Component
 * 
 * Displays financial summary metrics with formatted values and trend indicators
 * Implements Requirements: 7.4
 */

'use client';

import React from 'react';
import { Card } from '@/lib/design-system/components';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

export interface SummaryCardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  variant: 'primary' | 'success' | 'warning' | 'danger';
}

/**
 * Format currency value in BRL
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Get variant-specific styles
 */
function getVariantStyles(variant: SummaryCardProps['variant']) {
  const styles = {
    primary: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500',
    },
    success: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500',
    },
    danger: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500',
    },
  };

  return styles[variant];
}

/**
 * SummaryCard Component
 * 
 * Renders a financial summary card with:
 * - Title
 * - Formatted currency value in BRL
 * - Optional subtitle
 * - Optional trend indicator (up/down arrow)
 * - Color-coded variant styling
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  variant,
}) => {
  const variantStyles = getVariantStyles(variant);

  return (
    <Card className={clsx('border-l-4', variantStyles.border)}>
      <div className="flex flex-col gap-2">
        {/* Title */}
        <h3 className="text-sm font-medium text-gray-300">
          {title}
        </h3>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <p className={clsx('text-2xl font-bold', variantStyles.text)}>
            {formatCurrency(value)}
          </p>

          {/* Trend Indicator */}
          {trend && trend !== 'neutral' && (
            <div className="flex items-center gap-1">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
};
