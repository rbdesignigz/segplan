'use client';

import React, { useState, use } from 'react';
import DocumentList from '../../../../components/documents/DocumentList';
import UploadDocumentModal from '../../../../components/documents/UploadDocumentModal';
import { useAuth } from '../../../../context/AuthContext';

export default function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { id: projectId } = use(params);
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Project Documents
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload and manage plans, permits, photos, and other files.
          </p>
        </div>
        
        {profile?.role !== 'viewer' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            Upload Document
          </button>
        )}
      </div>

      <DocumentList projectId={projectId} />

      <UploadDocumentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        projectId={projectId}
      />
    </div>
  );
}
