'use client';

import React, { useEffect, useState } from 'react';
import { Task, subscribeToProjectTasks, updateTaskStatus, updateTaskAssignees } from '../../services/tasks';
import { UserProfile, getAllUsers } from '../../services/users';
import { useAuth } from '../../context/AuthContext';
import KanbanBoard from './KanbanBoard';
import TaskListView from './TaskListView';
import TaskDetailsModal from './TaskDetailsModal';

interface TaskViewManagerProps {
  projectId: string;
}

export default function TaskViewManager({ projectId }: TaskViewManagerProps) {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  useEffect(() => {
    // Fetch users for assignee names
    getAllUsers().then(usersList => {
      const userMap: Record<string, UserProfile> = {};
      usersList.forEach(u => {
        userMap[u.id] = u;
      });
      setUsers(userMap);
    }).catch(console.error);

    const unsubscribe = subscribeToProjectTasks(projectId, (data) => {
      setTasks(data);
      setLoading(false);
      // Update selected task if it's currently open to get new attachments/details live
      setSelectedTask(prev => {
        if (!prev) return null;
        return data.find(t => t.id === prev.id) || null;
      });
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    try {
      await updateTaskStatus(task.id, newStatus, projectId, user?.uid, task.title);
    } catch (error) {
      console.error("Failed to update task status", error);
    }
  };

  const handleAssigneesChange = async (task: Task, newAssigneeIds: string[]) => {
    try {
      await updateTaskAssignees(task.id, newAssigneeIds, projectId, user?.uid, task.title);
    } catch (error) {
      console.error("Failed to update task assignees", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'kanban' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard 
          projectId={projectId} 
          tasks={tasks} 
          users={users} 
          onTaskSelect={setSelectedTask} 
          onStatusChange={handleStatusChange}
          onAssigneesChange={handleAssigneesChange}
        />
      ) : (
        <TaskListView 
          projectId={projectId} 
          tasks={tasks} 
          users={users} 
          onTaskSelect={setSelectedTask} 
          onStatusChange={handleStatusChange}
        />
      )}

      <TaskDetailsModal 
        task={selectedTask} 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />
    </div>
  );
}
