/**
 * Navigation Component
 * 
 * Main navigation between Performance and Financial modules
 * Implements Requirements: 16.1, 16.2, 16.3, 16.4
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/modules/shared/hooks/useAuth';
import { BarChart3, DollarSign, LogOut, User } from 'lucide-react';
import { Button } from '@/lib/design-system/components';

export interface NavigationProps {
  currentModule?: 'performance' | 'finance';
  userRole?: 'client' | 'internal';
}

export function Navigation({ currentModule, userRole }: NavigationProps) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  // Determine current module from pathname if not provided
  const activeModule = currentModule || (pathname?.includes('/finance') ? 'finance' : 'performance');
  
  // Determine user role from auth context if not provided
  const role = userRole || user?.role || 'client';

  // Client users only see Performance module
  // Internal users see both Performance and Finance modules
  const showFinanceModule = role === 'internal';

  return (
    <nav className="bg-dark-elevated border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Module Links */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-logo text-white">
                ALUA
              </h1>
              <span className="ml-2 text-xs text-purple-400 font-medium hidden sm:inline">
                Social Media
              </span>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-700 hidden sm:block"></div>

            {/* Module Links */}
            <div className="flex space-x-6">
              {/* Performance Module Link */}
              <Link
                href="/performance"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  activeModule === 'performance'
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }`}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance
              </Link>

              {/* Finance Module Link - Only for internal users */}
              {showFinanceModule && (
                <Link
                  href="/finance"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    activeModule === 'finance'
                      ? 'border-purple-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Financeiro
                </Link>
              )}
            </div>
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center space-x-4">
            {/* User Information */}
            <div className="hidden sm:flex items-center text-sm text-gray-300">
              <User className="w-4 h-4 mr-2 text-gray-500" />
              <div className="flex flex-col">
                <span className="font-medium">
                  {user?.metadata?.name || user?.email}
                </span>
                <span className="text-xs text-gray-500">
                  {role === 'client' ? 'Cliente' : 'Interno'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
