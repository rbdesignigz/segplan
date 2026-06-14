'use client';

import React, { useEffect, useState } from 'react';
import { Project, subscribeToProjects, restoreProject } from '../../services/projects';

export default function ArchivedProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((data) => {
      setProjects(data);
      setLoading(false);
    }, { onlyDeleted: true });

    return () => unsubscribe();
  }, []);

  const handleRestore = async (id: string) => {
    if (confirm('Are you sure you want to restore this project?')) {
      try {
        await restoreProject(id);
      } catch (e) {
        console.error(e);
        alert('Failed to restore project');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading archived projects...</div>;
  }

  if (projects.length === 0) {
    return null; // Don't show the section if there are no deleted projects
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="bg-gray-50 dark:bg-gray-800/50 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 opacity-75">
            <div className="px-4 py-5 sm:p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-500 dark:text-gray-400 line-through truncate pr-2">
                    {project.name}
                  </h3>
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full shrink-0 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    Deleted
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-400 dark:text-gray-500 line-clamp-2 min-h-[2.5rem]">
                  {project.description || 'No description provided.'}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleRestore(project.id)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 transition-colors"
                >
                  Restore Project
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
