'use client';

import React, { useState, useEffect } from 'react';
import ProjectList from '../../components/projects/ProjectList';
import CreateProjectModal from '../../components/projects/CreateProjectModal';
import { useAuth } from '../../context/AuthContext';
import { Project, subscribeToProjects } from '../../services/projects';
import { Task, subscribeToAllTasks } from '../../services/tasks';

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let tasksLoaded = false;
    let projectsLoaded = false;

    const checkLoading = () => {
      if (tasksLoaded && projectsLoaded) {
        setLoading(false);
      }
    };

    const unsubProjects = subscribeToProjects((data) => {
      let visibleProjects = data;
      if (profile?.role === 'viewer' && user) {
        visibleProjects = data.filter(p => p.clientAccess && p.clientAccess[user.uid]);
      }
      setProjects(visibleProjects);
      projectsLoaded = true;
      checkLoading();
    });

    const unsubTasks = subscribeToAllTasks((data) => {
      // For viewers, ideally we filter tasks to only those in projects they have access to.
      // But we can just use the visibleProjects list once projects are loaded.
      // We will do that in the render logic or state effect.
      setTasks(data);
      tasksLoaded = true;
      checkLoading();
    });

    return () => {
      unsubProjects();
      unsubTasks();
    };
  }, []);

  // Calculate Global Metrics
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  
  // Filter tasks to only include those from projects the user can see
  const visibleProjectIds = new Set(projects.map(p => p.id));
  const visibleTasks = tasks.filter(t => visibleProjectIds.has(t.projectId));

  // Pending Tasks = Any task not completed
  const pendingTasksCount = visibleTasks.filter(t => t.status !== 'completed').length;
  
  // Action Required = Tasks assigned to me that are not completed
  const myPendingTasksCount = user 
    ? visibleTasks.filter(t => (t.assigneeIds || []).includes(user.uid) && t.status !== 'completed').length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Header - Hidden for viewers */}
      {profile?.role !== 'viewer' && (
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Overview
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A high-level summary of your company's active operations.
            </p>
          </div>
        </div>
      )}

      {/* Global Dashboard Cards - Hidden for viewers */}
      {profile?.role !== 'viewer' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Projects</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {loading ? '--' : activeProjectsCount}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Global Pending Tasks</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {loading ? '--' : pendingTasksCount}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Action Required (My Tasks)</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
              {loading ? '--' : myPendingTasksCount}
            </p>
          </div>
        </div>
      )}

      {/* Projects Section */}
      <div className={profile?.role !== 'viewer' ? "mt-8" : ""}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Projects
          </h2>
          {profile?.role === 'admin' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Project
            </button>
          )}
        </div>
        
        <ProjectList />
      </div>

      {/* Admin specific controls section placeholder */}
      {profile?.role === 'admin' && (
        <div className="mt-12 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-purple-900 dark:text-purple-300">Admin Controls</h3>
          <p className="mt-2 text-sm text-purple-700 dark:text-purple-400">
            You have administrator access. You can manage users, roles, and global system settings from here.
          </p>
        </div>
      )}

      {profile?.role === 'admin' && (
        <CreateProjectModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
