/**
 * Dashboard Layout
 * 
 * Shared layout for Performance and Financial modules
 * Implements Requirements: 16.1, 16.5
 */

'use client';

import React from 'react';
import { Navigation } from '@/modules/shared/components';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation Header */}
      <Navigation />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
