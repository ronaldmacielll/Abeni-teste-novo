'use client';

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/modules/shared/hooks/useAuth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

// Retryable status codes for transient errors
const RETRYABLE_STATUS_CODES = [408, 429, 502, 503, 504];

// Exponential backoff delays in milliseconds
const BACKOFF_DELAYS = [1000, 2000, 4000];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Create a client instance per request to avoid sharing state between users
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          // Don't retry if we've exceeded max attempts
          if (failureCount >= 3) {
            return false;
          }

          // Check if error has a status code
          const statusCode = (error as any)?.status || (error as any)?.response?.status;
          
          // Only retry for retryable status codes
          if (statusCode && RETRYABLE_STATUS_CODES.includes(statusCode)) {
            return true;
          }

          // Don't retry for other errors
          return false;
        },
        retryDelay: (attemptIndex) => {
          // Use exponential backoff: 1s, 2s, 4s
          return BACKOFF_DELAYS[Math.min(attemptIndex, BACKOFF_DELAYS.length - 1)];
        },
      },
    },
  }))

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
