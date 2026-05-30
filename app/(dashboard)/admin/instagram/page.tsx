/**
 * Admin Instagram Page
 * 
 * Main admin interface for Instagram Business integration
 * Implements Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 * 
 * Uses dynamic import for code splitting to reduce initial bundle size
 */

'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/modules/shared/components';

// Dynamic import with loading state
const AdminInstagramContent = dynamic(() => import('./AdminInstagramContent'), {
  loading: () => (
    <div className="flex justify-center items-center py-12">
      <LoadingState size="lg" message="Carregando interface de administração..." />
    </div>
  ),
  ssr: false, // Disable SSR for this component to reduce initial bundle
});

export default function AdminInstagramPage() {
  return <AdminInstagramContent />;
}
