'use client';

import React from 'react';
import { Task } from '../../services/tasks';
import { UserProfile } from '../../services/users';
import { getTaskColorClasses } from '../../utils/colors';

interface TaskListViewProps {
  projectId: string;
  tasks: Task[];
  users: Record<string, UserProfile>;
  onTaskSelect: (task: Task) => void;
  onStatusChange: (task: Task, status: Task['status']) => void;
}

export default function TaskListView({ 
  projectId, 
  tasks, 
  users, 
  onTaskSelect, 
  onStatusChange 
}: TaskListViewProps) {

  const statusLabels: Record<Task['status'], string> = {
    'todo': 'To Do',
    'in_progress': 'In Progress',
    'completed': 'Completed'
  };

  const statusColors: Record<Task['status'], string> = {
    'todo': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center text-gray-500 dark:text-gray-400">
        No tasks found for this project.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">
                Task
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Assignees
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Start Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                End Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => {
              const colorClasses = getTaskColorClasses(task.color);
              
              return (
                <tr 
                  key={task.id} 
                  onClick={() => onTaskSelect(task)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${colorClasses.bg} border ${colorClasses.border}`}></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{task.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                      {statusLabels[task.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex -space-x-2 overflow-hidden items-center">
                      {(task.assigneeIds || []).map((assigneeId) => {
                        const u = users[assigneeId];
                        if (!u) return null;
                        return u.photoURL ? (
                          <img key={assigneeId} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800" src={u.photoURL} alt={u.displayName} title={u.displayName} />
                        ) : (
                          <div key={assigneeId} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-800 dark:text-blue-200" title={u.displayName || u.email}>
                            {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                        );
                      })}
                      {(!task.assigneeIds || task.assigneeIds.length === 0) && (
                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(task.startDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(task.endDate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
