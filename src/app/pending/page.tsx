'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/auth';

export default function PendingPage() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Pendiente de Autorización
          </h2>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Hola <span className="font-semibold text-gray-900 dark:text-gray-200">{profile?.displayName}</span>, tu cuenta ha sido creada exitosamente pero está en espera de ser aprobada por un administrador.
          </p>
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Por favor contacta al administrador para que asigne un rol a tu cuenta y puedas acceder al sistema.
            </p>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            onClick={() => logoutUser()}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
