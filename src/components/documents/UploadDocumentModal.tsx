'use client';

import React, { useState, useRef } from 'react';
import { uploadDocument } from '../../services/documents';
import { useAuth } from '../../context/AuthContext';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export default function UploadDocumentModal({ isOpen, onClose, projectId }: UploadDocumentModalProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Limit to 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File is too large. Maximum size is 10 MB.");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) {
      setError("Please select a file to upload.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      await uploadDocument(
        projectId, 
        file, 
        user.uid,
        (progressPercent) => {
          setProgress(Math.round(progressPercent));
        }
      );
      
      // Reset and close
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload document. Ensure Storage is enabled and rules allow writes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80" aria-hidden="true" onClick={!loading ? onClose : undefined}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative z-10 inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white" id="modal-title">
                Upload Document
              </h3>
              <div className="mt-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-2 text-sm text-red-600 bg-red-100 rounded">
                      {error}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select File (Max 10 MB)
                    </label>
                    <input
                      type="file"
                      required
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        dark:file:bg-blue-900/30 dark:file:text-blue-400"
                    />
                  </div>

                  {loading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                      <p className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">{progress}%</p>
                    </div>
                  )}

                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={loading || !file}
                      className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {loading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
