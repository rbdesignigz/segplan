'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ArchivedProjectList from '../../components/projects/ArchivedProjectList';

export default function BaulPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only admins can see this page
    if (!authLoading && profile?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [profile, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (profile?.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Baúl
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Archived and discarded items. Here you can restore logically deleted projects.
          </p>
        </div>
      </div>

      <ArchivedProjectList />
    </div>
  );
}
