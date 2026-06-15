'use client';

import React from 'react';
import { Task } from '../../services/tasks';
import { UserProfile } from '../../services/users';
import AssigneePopover from './AssigneePopover';
import { useAuth } from '../../context/AuthContext';
import { getTaskColorClasses } from '../../utils/colors';

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  users: Record<string, UserProfile>;
  onTaskSelect: (task: Task) => void;
  onStatusChange: (task: Task, status: Task['status']) => void;
  onAssigneesChange: (task: Task, assignees: string[]) => void;
}

export default function KanbanBoard({ 
  projectId, 
  tasks, 
  users, 
  onTaskSelect, 
  onStatusChange, 
  onAssigneesChange 
}: KanbanBoardProps) {
  const { profile } = useAuth();
  const isViewer = profile?.role === 'viewer';

  const columns: { id: Task['status']; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'completed', title: 'Completed' },
  ];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-blue-400');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('ring-2', 'ring-blue-400');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: Task['status']) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-blue-400');
    
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === status) return;

    onStatusChange(task, status);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {columns.map(column => {
          const columnTasks = tasks.filter(t => t.status === column.id);
          
          return (
            <div 
              key={column.id} 
              className="flex-1 w-full bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 min-h-[500px] flex flex-col"
              onDragOver={isViewer ? undefined : handleDragOver}
              onDragLeave={isViewer ? undefined : handleDragLeave}
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
                {columnTasks.map(task => {
                  const colorClasses = getTaskColorClasses(task.color);
                  const isCompleted = column.id === 'completed';
                  return (
                  <div 
                    key={task.id} 
                    className={`group ${colorClasses.bg} ${isCompleted ? 'p-3' : 'p-4'} flex flex-col rounded shadow-sm border ${colorClasses.border} transition-all duration-200 relative ${!isViewer ? 'hover:shadow-md cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                    onClick={() => onTaskSelect(task)}
                    draggable={!isViewer}
                    onDragStart={(e) => !isViewer && handleDragStart(e, task.id)}
                  >
                    {task.attachments && task.attachments.length > 0 && (
                      <div className={`absolute top-3 right-3 text-gray-400 ${isCompleted ? 'hidden group-hover:block' : ''}`} title={`${task.attachments.length} attachments`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </div>
                    )}
                    {isCompleted && !isViewer && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onStatusChange(task, 'in_progress'); }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-blue-500 p-1 block group-hover:hidden"
                        title="Move back to In Progress"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                      </button>
                    )}
                    <strong className={`block font-bold text-gray-900 dark:text-white text-sm pr-6 ${isCompleted ? 'truncate mb-0 group-hover:whitespace-normal group-hover:mb-1' : 'mb-1'}`}>{task.title}</strong>
                    <p className={`text-gray-500 dark:text-gray-400 text-xs mb-2 line-clamp-2 ${isCompleted ? 'hidden group-hover:block' : ''}`}>{task.description}</p>
                    
                    {task.checklist && task.checklist.length > 0 && (
                      <div className={`flex items-center text-xs text-gray-600 dark:text-gray-300 mb-3 ${isCompleted ? 'hidden group-hover:flex' : ''}`} title="Checklist progress">
                        <svg className={`w-4 h-4 mr-1 ${task.checklist.filter(i => i.completed).length === task.checklist.length ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span className={task.checklist.filter(i => i.completed).length === task.checklist.length ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                          {task.checklist.filter(i => i.completed).length} / {task.checklist.length}
                        </span>
                      </div>
                    )}

                    <div className={`flex items-center justify-between mt-auto pt-2 ${isCompleted ? 'hidden group-hover:flex' : ''}`}>
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
                            onAssigneesChange={(taskId, newIds) => onAssigneesChange(task, newIds)}
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
                            onClick={(e) => { e.stopPropagation(); onStatusChange(task, column.id === 'completed' ? 'in_progress' : 'todo'); }}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Move Back"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                          </button>
                        )}
                        {column.id !== 'completed' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onStatusChange(task, column.id === 'todo' ? 'in_progress' : 'completed'); }}
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
                  );
                })}
                {columnTasks.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm italic">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
