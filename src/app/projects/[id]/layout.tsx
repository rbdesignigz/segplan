'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getProjectById, Project } from '../../../services/projects';
import { useAuth } from '../../../context/AuthContext';

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { profile, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Unwrap the Promise to get the params in React 19+
  const { id } = use(params);

  useEffect(() => {
    if (authLoading) return;

    const fetchProject = async () => {
      if (!id) return;
      try {
        const data = await getProjectById(id as string);
        if (data) {
          // Security Check: If Viewer, ensure they have access to this project
          if (profile?.role === 'viewer') {
            if (!user || !data.clientAccess || !data.clientAccess[user.uid]) {
              router.push('/dashboard');
              return;
            }
          }
          setProject(data);
        } else {
          // Project not found
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, router, profile, user, authLoading]);

  // Handle Tab Restrictions after project is loaded
  useEffect(() => {
    if (project && profile?.role === 'viewer' && user) {
      const perms = project.clientAccess?.[user.uid];
      if (perms) {
        const isOverview = pathname === `/projects/${id}`;
        const isTasks = pathname.includes('/tasks');
        const isDocs = pathname.includes('/documents');
        const isSettings = pathname.includes('/settings');

        if (isSettings) {
          router.push(`/projects/${id}`);
        } else if (isOverview && !perms.overview) {
          router.push(perms.tasks ? `/projects/${id}/tasks` : `/projects/${id}/documents`);
        } else if (isTasks && !perms.tasks) {
          router.push(perms.overview ? `/projects/${id}` : `/projects/${id}/documents`);
        } else if (isDocs && !perms.documents) {
          router.push(perms.overview ? `/projects/${id}` : `/projects/${id}/tasks`);
        }
      }
    }
  }, [project, pathname, profile, user, id, router]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) return null;

  // Build Tabs based on role
  let tabs = [
    { name: 'Overview', href: `/projects/${id}`, key: 'overview' },
    { name: 'Tasks', href: `/projects/${id}/tasks`, key: 'tasks' },
    { name: 'Documents', href: `/projects/${id}/documents`, key: 'documents' },
    { name: 'Settings', href: `/projects/${id}/settings`, key: 'settings' },
  ];

  if (profile?.role === 'viewer' && user) {
    const perms = project.clientAccess?.[user.uid];
    if (perms) {
      tabs = tabs.filter(tab => {
        if (tab.key === 'overview') return perms.overview;
        if (tab.key === 'tasks') return perms.tasks;
        if (tab.key === 'documents') return perms.documents;
        return false; // Settings is always hidden for Viewers
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg px-6 py-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                project.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-8">
              {project.description}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700 w-full overflow-x-auto overflow-y-hidden">
          <nav className="-mb-px flex space-x-8 min-w-max px-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`
                    whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                    ${isActive 
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-transparent">
        {children}
      </div>
    </div>
  );
}
