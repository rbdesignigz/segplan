'use client';

import React, { useEffect, useState } from 'react';
import { Task, subscribeToProjectTasks, updateTaskStatus, updateTaskAssignees } from '../../services/tasks';
import { UserProfile, getAllUsers } from '../../services/users';
import AssigneePopover from './AssigneePopover';
import TaskDetailsModal from './TaskDetailsModal';
import { useAuth } from '../../context/AuthContext';

interface KanbanBoardProps {
  projectId: string;
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { profile } = useAuth();
  const isViewer = profile?.role === 'viewer';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error("Failed to update task status", error);
    }
  };

  const handleAssigneesChange = async (taskId: string, newAssigneeIds: string[]) => {
    try {
      await updateTaskAssignees(taskId, newAssigneeIds);
    } catch (error) {
      console.error("Failed to update task assignees", error);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    // If the task exists and we are dropping it into a valid column, update it
    if (taskId) {
      // Optimistic update isn't strictly necessary since Firebase onSnapshot is very fast,
      // but we can just call handleStatusChange directly.
      await handleStatusChange(taskId, newStatus);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
    { id: 'completed', title: 'Completed', color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {columns.map((column) => {
        const columnTasks = tasks.filter(task => task.status === column.id);
        
        return (
          <div 
            key={column.id} 
            className={`flex flex-col rounded-lg border ${column.color} p-4 min-h-[500px] transition-colors`}
            onDragOver={(e) => {
              if (isViewer) return;
              e.preventDefault();
              e.currentTarget.classList.add('ring-2', 'ring-blue-400');
            }}
            onDragLeave={(e) => {
              if (isViewer) return;
              e.currentTarget.classList.remove('ring-2', 'ring-blue-400');
            }}
            onDrop={(e) => {
              if (isViewer) return;
              e.currentTarget.classList.remove('ring-2', 'ring-blue-400');
              handleDrop(e, column.id);
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1 px-2.5 rounded-full text-xs font-medium">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-3">
              {columnTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`bg-white dark:bg-gray-800 p-4 rounded shadow-sm border border-gray-200 dark:border-gray-700 transition-shadow relative ${!isViewer ? 'hover:shadow-md cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                  onClick={() => setSelectedTask(task)}
                  draggable={!isViewer}
                  onDragStart={(e) => !isViewer && handleDragStart(e, task.id)}
                >
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="absolute top-3 right-3 text-gray-400" title={`${task.attachments.length} attachments`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                  )}
                  <strong className="block font-bold text-gray-900 dark:text-white text-sm mb-1 pr-6">{task.title}</strong>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-2">{task.description}</p>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                      {isViewer ? (
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
                            <span className="text-xs text-gray-500 italic">Unassigned</span>
                          )}
                        </div>
                      ) : (
                        <AssigneePopover
                          taskId={task.id}
                          currentAssigneeIds={task.assigneeIds || []}
                          allUsers={users}
                          onAssigneesChange={handleAssigneesChange}
                        >
                        <div className="flex -space-x-2 overflow-hidden items-center">
                          {(!task.assigneeIds || task.assigneeIds.length === 0) && (
                            <div className="inline-flex h-6 w-6 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 items-center justify-center bg-white dark:bg-gray-800 text-xs text-gray-400" title="Unassigned">
                              +
                            </div>
                          )}
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
                          {(task.assigneeIds && task.assigneeIds.length > 0) && (
                            <div className="inline-flex h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 items-center justify-center text-xs text-gray-500 hover:bg-gray-200" title="Add collaborator">
                              +
                            </div>
                          )}
                        </div>
                      </AssigneePopover>
                      )}
                    </div>
                    
                    {!isViewer && (
                      <div className="flex space-x-1">
                      {column.id !== 'todo' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, column.id === 'completed' ? 'in_progress' : 'todo'); }}
                          className="text-gray-400 hover:text-blue-500 p-1"
                          title="Move Back"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                      )}
                      {column.id !== 'completed' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, column.id === 'todo' ? 'in_progress' : 'completed'); }}
                          className="text-gray-400 hover:text-blue-500 p-1"
                          title="Move Forward"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                      )}
                    </div>
                    )}
                  </div>
                </div>
              ))}
              
              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
      <TaskDetailsModal 
        task={selectedTask} 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />
    </div>
  );
}
