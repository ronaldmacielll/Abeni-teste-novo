/**
 * Performance Dashboard Page
 * 
 * Main dashboard for viewing social media post performance metrics
 * Implements Requirements: 4.1, 4.5, 5.1, 5.2, 5.4, 13.1, 14.1, 14.2, 14.3, 14.4, 15.3
 * 
 * Uses dynamic import for code splitting to reduce initial bundle size
 */

'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/modules/shared/components';

// Dynamic import with loading state
const PerformancePageContent = dynamic(() => import('./PerformancePageContent'), {
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <LoadingState size="lg" message="Carregando módulo de performance..." />
    </div>
  ),
  ssr: false, // Disable SSR for this component to reduce initial bundle
});

export default function PerformancePage() {
  return <PerformancePageContent />;
}
