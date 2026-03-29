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
      <div className={isAuthPage ? '' : 'flex h-screen w-screen overflow-hidden'}>
        {!isAuthPage && <Sidebar />}
        <main className={isAuthPage ? 'w-full min-h-screen' : 'flex-grow overflow-y-auto bg-transparent relative custom-scrollbar'}>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
