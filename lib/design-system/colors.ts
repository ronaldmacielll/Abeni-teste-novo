/**
 * Design System - Colors
 * 
 * Centralized color palette for the application
 */

export const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  success: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#059669',
    text: '#065f46',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#d97706',
    text: '#92400e',
  },
  danger: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#dc2626',
    text: '#991b1b',
  },
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#2563eb',
    text: '#1e40af',
  },
  neutral: {
    white: '#ffffff',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    black: '#000000',
  },
  background: {
    page: '#f9fafb',
    card: '#ffffff',
    cardHover: '#f3f4f6',
    sidebar: '#ffffff',
    header: '#ffffff',
  },
} as const

export type ColorPalette = typeof colors
