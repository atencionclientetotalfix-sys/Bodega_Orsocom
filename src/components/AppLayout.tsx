'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/providers/AuthProvider';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  return (
    <AuthProvider>
      <div className={isAuthPage ? '' : 'layout-container'}>
        {!isAuthPage && <Sidebar />}
        <main className={isAuthPage ? 'w-full min-h-screen' : 'main-content'}>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
