'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../../services/users';

interface AssigneePopoverProps {
  taskId: string;
  currentAssigneeIds: string[];
  allUsers: Record<string, UserProfile>;
  onAssigneesChange: (taskId: string, newAssigneeIds: string[]) => void;
  children: React.ReactNode;
}

export default function AssigneePopover({ 
  taskId, 
  currentAssigneeIds, 
  allUsers, 
  onAssigneesChange,
  children 
}: AssigneePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const usersList = Object.values(allUsers);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleUser = (userId: string) => {
    let newIds = [...currentAssigneeIds];
    if (newIds.includes(userId)) {
      newIds = newIds.filter(id => id !== userId);
    } else {
      newIds.push(userId);
    }
    onAssigneesChange(taskId, newIds);
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {children}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-700 bottom-full mb-2 left-0 sm:bottom-auto sm:mb-0 sm:top-full">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Collaborators</h4>
          </div>
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {usersList.length === 0 && <p className="text-xs text-gray-500 p-2">No users found.</p>}
            {usersList.map((u) => {
              const isSelected = currentAssigneeIds.includes(u.id);
              return (
                <div 
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex-shrink-0 h-6 w-6">
                    {u.photoURL ? (
                      <img className="h-6 w-6 rounded-full" src={u.photoURL} alt="" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {u.displayName || u.email}
                    </p>
                  </div>
                  <div>
                    {isSelected && (
                      <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
