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
      bg: 'bg-primary-50',
      text: 'text-primary-700',
      border: 'border-primary-200',
    },
    success: {
      bg: 'bg-success-light',
      text: 'text-success-text',
      border: 'border-success-main',
    },
    warning: {
      bg: 'bg-warning-light',
      text: 'text-warning-text',
      border: 'border-warning-main',
    },
    danger: {
      bg: 'bg-danger-light',
      text: 'text-danger-text',
      border: 'border-danger-main',
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
        <h3 className="text-sm font-medium text-gray-600">
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
                <TrendingUp className="w-4 h-4 text-success-main" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger-main" />
              )}
            </div>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
};
