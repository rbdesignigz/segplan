'use client';

import React, { useState, useRef } from 'react';
import { Task, updateTaskDetails, uploadTaskAttachment, deleteTaskAttachment, TaskAttachment, TaskChecklistItem, updateTaskChecklist } from '../../services/tasks';
import { useAuth } from '../../context/AuthContext';
import { PASTEL_COLORS } from '../../utils/colors';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailsModal({ task, isOpen, onClose }: TaskDetailsModalProps) {
  const { profile } = useAuth();
  const isViewer = profile?.role === 'viewer';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('default');
  
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening modal
  React.useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description);
      setColor(task.color || 'default');
      setChecklist(task.checklist || []);
      setNewItemText('');
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSaveDetails = async () => {
    if (title !== task.title || description !== task.description || color !== task.color) {
      try {
        await updateTaskDetails(task.id, title, description, color);
      } catch (error) {
        console.error("Failed to update task details", error);
      }
    }
  };

  const handleColorChange = async (newColor: string) => {
    setColor(newColor);
    try {
      await updateTaskDetails(task.id, title, description, newColor);
    } catch (error) {
      console.error("Failed to update task color", error);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || isViewer) return;
    
    const newItem: TaskChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false
    };
    const newChecklist = [...checklist, newItem];
    setChecklist(newChecklist);
    setNewItemText('');
    await updateTaskChecklist(task.id, newChecklist);
  };

  const handleToggleChecklistItem = async (id: string) => {
    if (isViewer) return;
    const newChecklist = checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(newChecklist);
    await updateTaskChecklist(task.id, newChecklist);
  };

  const handleDeleteChecklistItem = async (id: string) => {
    if (isViewer) return;
    const newChecklist = checklist.filter(item => item.id !== id);
    setChecklist(newChecklist);
    await updateTaskChecklist(task.id, newChecklist);
  };

  const handleEditChecklistItemText = async (id: string, newText: string) => {
    if (isViewer) return;
    const trimmed = newText.trim();
    if (!trimmed) {
      return handleDeleteChecklistItem(id);
    }
    const newChecklist = checklist.map(item => 
      item.id === id ? { ...item, text: trimmed } : item
    );
    setChecklist(newChecklist);
    await updateTaskChecklist(task.id, newChecklist);
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetId || isViewer) {
      setDraggedItemId(null);
      return;
    }
    
    const oldIndex = checklist.findIndex(item => item.id === draggedItemId);
    const newIndex = checklist.findIndex(item => item.id === targetId);
    
    if (oldIndex === -1 || newIndex === -1) {
      setDraggedItemId(null);
      return;
    }
    
    const newChecklist = [...checklist];
    const [movedItem] = newChecklist.splice(oldIndex, 1);
    newChecklist.splice(newIndex, 0, movedItem);
    
    setChecklist(newChecklist);
    setDraggedItemId(null);
    await updateTaskChecklist(task.id, newChecklist);
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadTaskAttachment(task.id, file, (progress) => {
        setUploadProgress(progress);
      });
    } catch (error) {
      console.error("Failed to upload attachment", error);
      alert("Error uploading file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachment: TaskAttachment) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;
    try {
      await deleteTaskAttachment(task.id, attachment);
    } catch (error) {
      console.error("Failed to delete attachment", error);
      alert("Error deleting attachment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative z-10 inline-block w-full max-w-2xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
              {!isViewer ? (
                <div className="mb-6 space-y-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveDetails}
                    className="w-full text-xl font-medium leading-6 text-gray-900 dark:text-white bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded p-1 -ml-1 transition-colors outline-none"
                    placeholder="Task Title"
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleSaveDetails}
                    rows={Math.max(2, description.split('\n').length)}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded p-1 -ml-1 resize-none transition-colors outline-none"
                    placeholder="Add a description..."
                  />
                  <div className="flex items-center space-x-2 mt-2 ml-1">
                    <div className="flex flex-wrap gap-1.5">
                      {PASTEL_COLORS.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleColorChange(c.id)}
                          className={`w-5 h-5 rounded-full border transition-transform ${c.bg} ${color === c.id ? 'border-blue-500 ring-2 ring-offset-1 ring-blue-500 scale-110 dark:ring-offset-gray-800' : 'border-gray-300 dark:border-gray-600 hover:scale-110'}`}
                          title={c.id}
                          aria-label={`Select ${c.id} color`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <h3 className="text-xl font-medium leading-6 text-gray-900 dark:text-white" id="modal-title">
                    {task.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                    {task.description || "No description provided."}
                  </p>
                </div>
              )}

              {/* Checklist Section */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center justify-between">
                  Checklist
                  <span className="text-xs text-gray-500 font-normal">
                    {checklist.filter(i => i.completed).length} / {checklist.length}
                  </span>
                </h4>
                <ul className="space-y-2 mb-3">
                  {checklist.map(item => (
                    <li 
                      key={item.id} 
                      className={`flex items-start space-x-3 group p-1 rounded transition-colors ${draggedItemId === item.id ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      draggable={!isViewer}
                      onDragStart={(e) => !isViewer && handleDragStart(e, item.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => !isViewer && handleDrop(e, item.id)}
                      onDragEnd={() => setDraggedItemId(null)}
                    >
                      {!isViewer && (
                        <div className="flex items-center h-5 cursor-grab active:cursor-grabbing text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Drag to reorder">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                          </svg>
                        </div>
                      )}
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklistItem(item.id)}
                          disabled={isViewer}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-sm">
                        {isViewer ? (
                          <span className={`block text-gray-900 dark:text-gray-200 ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                            {item.text}
                          </span>
                        ) : (
                          <input
                            type="text"
                            defaultValue={item.text}
                            onBlur={(e) => {
                              if (e.target.value !== item.text) {
                                handleEditChecklistItemText(item.id, e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                            }}
                            className={`w-full border-0 bg-transparent px-1 py-0.5 focus:ring-0 focus:outline-none ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-200'}`}
                          />
                        )}
                      </div>
                      {!isViewer && (
                        <button
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {!isViewer && (
                  <form onSubmit={handleAddChecklistItem} className="flex items-center mt-2">
                    <button type="submit" disabled={!newItemText.trim()} className="mr-2 text-gray-400 hover:text-blue-500 disabled:opacity-50">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <input
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Agregar ítem"
                      className="block w-full border-0 border-b border-transparent bg-transparent focus:border-blue-500 focus:ring-0 focus:outline-none sm:text-sm text-gray-900 dark:text-white placeholder-gray-500 px-2 py-1"
                    />
                  </form>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Attachments / Evidencia</h4>
                  {!isViewer && (
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept="image/*,application/pdf"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none disabled:opacity-50"
                      >
                        {uploading ? `Uploading ${Math.round(uploadProgress)}%` : '+ Subir Archivo'}
                      </button>
                    </div>
                  )}
                </div>

                {(!task.attachments || task.attachments.length === 0) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    No attachments yet.
                  </p>
                )}

                {task.attachments && task.attachments.length > 0 && (
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {task.attachments.map((file) => {
                      const isImage = file.type.startsWith('image/');
                      return (
                        <li key={file.id} className="relative group rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="block w-full aspect-w-10 aspect-h-7 focus:outline-none">
                            {isImage ? (
                              <img src={file.url} alt={file.name} className="object-cover w-full h-24" />
                            ) : (
                              <div className="flex items-center justify-center w-full h-24 bg-gray-100 dark:bg-gray-800 text-gray-400">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </a>
                          <div className="p-2 flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={file.name}>
                              {file.name}
                            </p>
                            {!isViewer && (
                              <button 
                                onClick={() => handleDeleteAttachment(file)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete attachment"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
