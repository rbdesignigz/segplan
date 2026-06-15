'use client';

import React, { useState } from 'react';
import { Task } from '../../services/tasks';
import { UserProfile } from '../../services/users';
import { getTaskColorClasses } from '../../utils/colors';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const [sortField, setSortField] = useState<'title' | 'status' | 'startDate' | 'endDate'>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);

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

  const handleSort = (field: 'title' | 'status' | 'startDate' | 'endDate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-50 transition-opacity inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
    }
    return sortDirection === 'asc' 
      ? <svg className="w-4 h-4 ml-1 text-blue-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
      : <svg className="w-4 h-4 ml-1 text-blue-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;
  };

  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (assignedToMeOnly && user && !(task.assigneeIds || []).includes(user.uid)) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    if (sortField === 'title') {
      aVal = a.title.toLowerCase();
      bVal = b.title.toLowerCase();
    } else if (sortField === 'status') {
      const order = { 'todo': 1, 'in_progress': 2, 'completed': 3 };
      aVal = order[a.status];
      bVal = order[b.status];
    } else if (sortField === 'startDate') {
      aVal = a.startDate || 'zzzzzz'; // Empty dates go to the bottom
      bVal = b.startDate || 'zzzzzz';
    } else if (sortField === 'endDate') {
      aVal = a.endDate || 'zzzzzz';
      bVal = b.endDate || 'zzzzzz';
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center text-gray-500 dark:text-gray-400">
        No tasks found for this project.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status:</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-1.5"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          {user && (
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={assignedToMeOnly}
                onChange={(e) => setAssignedToMeOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned to me</span>
            </label>
          )}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Showing {sortedTasks.length} tasks
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3 cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">Task {renderSortIcon('title')}</div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">Status {renderSortIcon('status')}</div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assignees
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('startDate')}
                >
                  <div className="flex items-center">Start Date {renderSortIcon('startDate')}</div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('endDate')}
                >
                  <div className="flex items-center">End Date {renderSortIcon('endDate')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTasks.map((task) => {
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
        {sortedTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No tasks match your current filter.
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
