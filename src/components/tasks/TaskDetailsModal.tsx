'use client';

import React, { useState, useRef } from 'react';
import { Task, updateTaskDetails, uploadTaskAttachment, deleteTaskAttachment, TaskAttachment } from '../../services/tasks';
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
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('default');
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening modal
  React.useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description);
      setColor(task.color || 'default');
      setIsEditing(false);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSaveDetails = async () => {
    try {
      await updateTaskDetails(task.id, title, description, color);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update task details", error);
      alert("Error saving details");
    }
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
              {isEditing ? (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 border px-3 py-2 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea 
                      rows={4}
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 border px-3 py-2 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PASTEL_COLORS.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setColor(c.id)}
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${c.bg} ${color === c.id ? 'border-blue-500 scale-110' : 'border-transparent hover:scale-110'}`}
                          title={c.id}
                          aria-label={`Select ${c.id} color`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={handleSaveDetails} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none">
                      Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
                      Cancel
                    </button>
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
                  {!isViewer && (
                    <button onClick={() => setIsEditing(true)} className="mt-4 text-sm text-blue-600 hover:text-blue-500 font-medium">
                      Edit Details
                    </button>
                  )}
                </div>
              )}

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
