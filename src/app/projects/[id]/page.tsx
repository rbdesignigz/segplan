'use client';

import React, { useEffect, useState, use } from 'react';
import { Task, subscribeToProjectTasks } from '../../../services/tasks';
import { ProjectDocument, subscribeToProjectDocuments } from '../../../services/documents';
import { getProjectById, Project } from '../../../services/projects';
import { Activity, subscribeToProjectActivities } from '../../../services/activities';
import { UserProfile, getAllUsers } from '../../../services/users';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    getAllUsers().then(usersList => {
      const userMap: Record<string, UserProfile> = {};
      usersList.forEach(u => userMap[u.id] = u);
      setUsers(userMap);
    }).catch(console.error);

    const unsubTasks = subscribeToProjectTasks(projectId, (data) => {
      setTasks(data);
      setLoadingTasks(false);
    });

    const unsubDocs = subscribeToProjectDocuments(projectId, (data) => {
      setDocuments(data);
      setLoadingDocs(false);
    });

    const unsubActivities = subscribeToProjectActivities(projectId, (data) => {
      setActivities(data);
      setLoadingActivities(false);
    });

    return () => {
      unsubTasks();
      unsubDocs();
      unsubActivities();
    };
  }, [projectId]);

  const loading = loadingTasks || loadingDocs || loadingActivities;

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
    ...documents.map(d => new Date(d.createdAt)),
    ...activities.map(a => new Date(a.createdAt))
  ];
  
  if (allDates.length > 0) {
    latestActivity = new Date(Math.max(...allDates.map(d => d.getTime())));
  }

  // Action Items for current user
  const myActionItems = tasks.filter(t => 
    t.assigneeIds?.includes(user?.uid || '') && 
    t.status !== 'completed'
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
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

      {/* Two Column Layout for Activity and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity (Left 2/3) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Actividad Reciente</h3>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              Aún no hay actividad registrada en esta obra.
            </p>
          ) : (
            <div className="flow-root mt-4">
              <ul className="-mb-8">
                {activities.map((activity, idx) => {
                  const isLast = idx === activities.length - 1;
                  const u = users[activity.userId];
                  const dateObj = new Date(activity.createdAt);
                  const dateStr = dateObj.toLocaleDateString();
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  let icon = null;
                  let colorClass = 'bg-gray-400';
                  let actionText = '';

                  if (activity.actionType === 'task_created') {
                    icon = <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>;
                    colorClass = 'bg-blue-500';
                    actionText = 'creó la tarea';
                  } else if (activity.actionType === 'task_assigned') {
                    icon = <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>;
                    colorClass = 'bg-purple-500';
                    actionText = 'asignó la tarea';
                  } else if (activity.actionType === 'task_completed') {
                    icon = <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>;
                    colorClass = 'bg-green-500';
                    actionText = 'completó la tarea';
                  } else if (activity.actionType === 'document_uploaded') {
                    icon = <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>;
                    colorClass = 'bg-yellow-500';
                    actionText = 'subió el documento';
                  }

                  return (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {!isLast && <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:bg-gray-800 dark:ring-gray-800 ${colorClass}`}>
                              {icon}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium text-gray-900 dark:text-white mr-1">{u ? u.displayName || u.email : 'Usuario'}</span> 
                                {actionText} 
                                <span className="font-medium text-gray-900 dark:text-white ml-1">"{activity.targetName}"</span>
                              </p>
                            </div>
                            <div className="text-right text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                              <time dateTime={activity.createdAt}>{dateStr} {timeStr}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Action Items (Right 1/3) */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-fit">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center justify-between">
            Mis Acciones
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 py-0.5 px-2.5 rounded-full text-xs font-medium">
              {myActionItems.length}
            </span>
          </h3>
          {myActionItems.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              No tienes tareas pendientes. ¡Genial!
            </p>
          ) : (
            <div className="space-y-3 mt-4">
              {myActionItems.map(task => (
                <div key={task.id} className="block p-4 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 transition-all">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white pr-2">{task.title}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                      {task.status === 'in_progress' ? 'En Curso' : 'To Do'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{task.description}</p>
                  {task.checklist && task.checklist.length > 0 && (
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center bg-white dark:bg-gray-800 rounded px-2 py-1 w-fit border border-gray-200 dark:border-gray-700">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      {task.checklist.filter(i => i.completed).length} / {task.checklist.length} completados
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
