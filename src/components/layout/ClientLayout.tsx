'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  const publicRoutes = ['/', '/login', '/register', '/pending'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!loading && user && profile?.role === 'disabled') {
      signOut(auth).then(() => {
        router.push('/login?error=disabled');
      });
      return;
    }

    if (!loading && !user && !isPublicRoute) {
      router.push('/login');
    } else if (!loading && user && profile?.role === 'pending' && pathname !== '/pending') {
      router.push('/pending');
    } else if (!loading && user && profile && profile.role !== 'pending' && profile.role !== 'disabled' && pathname === '/pending') {
      router.push('/dashboard');
    }
  }, [user, profile, loading, isPublicRoute, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not logged in and on a protected route, render nothing until redirect happens
  if (!user && !isPublicRoute) {
    return null;
  }

  // If pending and not on the pending page, render nothing until redirect happens
  if (user && profile?.role === 'pending' && pathname !== '/pending') {
    return null;
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        <main className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
