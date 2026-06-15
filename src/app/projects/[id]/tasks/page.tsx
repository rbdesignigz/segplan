'use client';

import React, { useState, use } from 'react';
import TaskViewManager from '../../../../components/tasks/TaskViewManager';
import CreateTaskModal from '../../../../components/tasks/CreateTaskModal';
import { useAuth } from '../../../../context/AuthContext';

export default function ProjectTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { id: projectId } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Task Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and track the progress of project tasks.
          </p>
        </div>
        
        {/* Only admins or managers can create tasks (adjust as needed) */}
        {(profile?.role === 'admin' || profile?.role === 'manager') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Task
          </button>
        )}
      </div>

      <TaskViewManager projectId={projectId} />

      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        projectId={projectId}
      />
    </div>
  );
}
