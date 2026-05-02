/**
 * Financial Dashboard Page
 * 
 * Main dashboard for the Financial Module
 * Implements Requirements: 7.1, 7.2, 7.3, 7.5, 9.1, 9.2, 9.3, 9.4, 14.1, 14.2, 14.3, 14.4, 15.3
 * 
 * Uses dynamic import for code splitting to reduce initial bundle size
 */

'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/modules/shared/components';

// Dynamic import with loading state
const FinancePageContent = dynamic(() => import('./FinancePageContent'), {
  loading: () => (
    <div className="flex justify-center items-center py-12">
      <LoadingState size="lg" message="Carregando módulo financeiro..." />
    </div>
  ),
  ssr: false, // Disable SSR for this component to reduce initial bundle
});

export default function FinancePage() {
  return <FinancePageContent />;
}
