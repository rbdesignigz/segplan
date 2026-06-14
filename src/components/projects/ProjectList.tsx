'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project, subscribeToProjects } from '../../services/projects';
import { useAuth } from '../../context/AuthContext';

export default function ProjectList() {
  const { profile, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((data) => {
      let visibleProjects = data;
      if (profile?.role === 'viewer' && user) {
        visibleProjects = data.filter(p => p.clientAccess && p.clientAccess[user.uid]);
      }
      setProjects(visibleProjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new project.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link href={`/projects/${project.id}`} key={project.id}>
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md cursor-pointer h-full">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white truncate pr-2">
                  {project.name}
                </h3>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full shrink-0 ${
                  project.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {project.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5rem]">
                {project.description || 'No description provided.'}
              </div>
              <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                Created on {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
