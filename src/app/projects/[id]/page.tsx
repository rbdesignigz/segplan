'use client';

import React, { useEffect, useState, use } from 'react';
import { Task, subscribeToProjectTasks } from '../../../services/tasks';
import { ProjectDocument, subscribeToProjectDocuments } from '../../../services/documents';
import { getProjectById, Project } from '../../../services/projects';

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    const unsubTasks = subscribeToProjectTasks(projectId, (data) => {
      setTasks(data);
      setLoadingTasks(false);
    });

    const unsubDocs = subscribeToProjectDocuments(projectId, (data) => {
      setDocuments(data);
      setLoadingDocs(false);
    });

    return () => {
      unsubTasks();
      unsubDocs();
    };
  }, [projectId]);

  const loading = loadingTasks || loadingDocs;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const totalDocuments = documents.length;

  // Calculate latest activity date
  let latestActivity: Date | null = null;
  const allDates = [
    ...tasks.map(t => new Date(t.createdAt)),
    ...documents.map(d => new Date(d.createdAt))
  ];
  
  if (allDates.length > 0) {
    latestActivity = new Date(Math.max(...allDates.map(d => d.getTime())));
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 lg:px-6 py-4">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
          Project Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Real-time metrics and progress tracking for the current project.
        </p>
        
        {/* KPI Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg border border-gray-100 dark:border-gray-600 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{totalTasks}</p>
            <p className="text-xs text-gray-500 mt-2">{completedTasks} completed</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg border border-gray-100 dark:border-gray-600 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</p>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <div className="flex items-baseline mt-2 space-x-2">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{progressPercentage}%</p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-3">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg border border-gray-100 dark:border-gray-600 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Documents</p>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
            </div>
            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{totalDocuments}</p>
            <p className="text-xs text-gray-500 mt-2">Files uploaded</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg border border-gray-100 dark:border-gray-600 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Latest Activity</p>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-lg font-semibold mt-2 text-gray-900 dark:text-white line-clamp-1">
              {latestActivity ? latestActivity.toLocaleDateString() : 'No activity'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {latestActivity ? latestActivity.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
