'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { getProjectById, updateProject, deleteProject, Project, updateProjectClientAccess, removeProjectClientAccess, ClientAccessPermissions } from '../../../../services/projects';
import { UserProfile, getAllUsers } from '../../../../services/users';

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = useAuth();
  const router = useRouter();
  const { id: projectId } = use(params);
  
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'completed'>('active');
  
  // Client Access State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [viewerUsers, setViewerUsers] = useState<UserProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientPerms, setClientPerms] = useState<ClientAccessPermissions>({ overview: true, tasks: false, documents: false });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await getProjectById(projectId);
        if (data) {
          setProject(data);
          setName(data.name);
          setDescription(data.description);
          setStatus(data.status);
        }
        const fetchedUsers = await getAllUsers();
        setAllUsers(fetchedUsers);
        setViewerUsers(fetchedUsers.filter(u => u.role === 'viewer'));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      await updateProject(projectId, { name, description, status });
      setMessage({ type: 'success', text: 'Project settings updated successfully.' });
    } catch (error) {
      console.error("Failed to update project", error);
      setMessage({ type: 'error', text: 'Failed to update project settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddClient = async () => {
    if (!selectedClient) return;
    try {
      await updateProjectClientAccess(projectId, selectedClient, clientPerms);
      const data = await getProjectById(projectId);
      if (data) setProject(data);
      setSelectedClient('');
    } catch (e) {
      console.error(e);
      alert("Failed to add client");
    }
  };

  const handleRemoveClient = async (clientId: string) => {
    if (!confirm("Remove access for this client?")) return;
    try {
      await removeProjectClientAccess(projectId, clientId);
      const data = await getProjectById(projectId);
      if (data) setProject(data);
    } catch (e) {
      console.error(e);
      alert("Failed to remove client");
    }
  };

  const handleUpdateClientPerm = async (clientId: string, perms: ClientAccessPermissions) => {
    try {
      await updateProjectClientAccess(projectId, clientId, perms);
      const data = await getProjectById(projectId);
      if (data) setProject(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you absolutely sure you want to delete this project? This action cannot be undone.")) {
      try {
        await deleteProject(projectId);
        router.push('/dashboard');
      } catch (error) {
        console.error("Failed to delete project", error);
        setMessage({ type: 'error', text: 'Failed to delete project. Please try again.' });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (profile?.role !== 'admin' && profile?.role !== 'manager') {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          You do not have permission to view or edit project settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Basic Settings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-6">
          Project Settings
        </h2>
        
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Project Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'completed')}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Client Access Management */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
          Client Access Management
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Grant clients (Viewer role) access to this project and configure which tabs they can see.
        </p>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Client</label>
              <select 
                value={selectedClient} 
                onChange={e => setSelectedClient(e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white sm:text-sm"
              >
                <option value="">-- Choose a viewer --</option>
                {viewerUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input type="checkbox" checked={clientPerms.overview} onChange={e => setClientPerms({...clientPerms, overview: e.target.checked})} className="rounded text-blue-600" />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Overview</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" checked={clientPerms.tasks} onChange={e => setClientPerms({...clientPerms, tasks: e.target.checked})} className="rounded text-blue-600" />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Tasks</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" checked={clientPerms.documents} onChange={e => setClientPerms({...clientPerms, documents: e.target.checked})} className="rounded text-blue-600" />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Documents</span>
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <button 
                onClick={handleAddClient}
                disabled={!selectedClient}
                className="w-full inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none disabled:opacity-50"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>

        {/* Assigned Clients List */}
        {project?.clientAccess && Object.keys(project.clientAccess).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Overview</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(project.clientAccess).map(([clientId, perms]) => {
                  const u = allUsers.find(x => x.id === clientId);
                  return (
                    <tr key={clientId}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {u ? u.displayName : `Deleted User (${clientId.substring(0, 8)}...)`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input type="checkbox" checked={perms.overview} onChange={(e) => handleUpdateClientPerm(clientId, { ...perms, overview: e.target.checked })} className="rounded text-blue-600" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input type="checkbox" checked={perms.tasks} onChange={(e) => handleUpdateClientPerm(clientId, { ...perms, tasks: e.target.checked })} className="rounded text-blue-600" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input type="checkbox" checked={perms.documents} onChange={(e) => handleUpdateClientPerm(clientId, { ...perms, documents: e.target.checked })} className="rounded text-blue-600" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleRemoveClient(clientId)} className="text-red-600 hover:text-red-900">Revoke</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No clients have access to this project yet.</p>
        )}
      </div>

      {/* Danger Zone */}
      {profile?.role === 'admin' && (
        <div className="bg-red-50 dark:bg-red-900/10 shadow rounded-lg p-6 border border-red-200 dark:border-red-800">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-400">Danger Zone</h3>
          <p className="mt-1 text-sm text-red-600 dark:text-red-300">
            Deleting a project will hide it from the active system, but the data will be retained (Logical Deletion).
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
            >
              Delete Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
