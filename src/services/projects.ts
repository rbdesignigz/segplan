import { collection, addDoc, getDocs, onSnapshot, query, orderBy, Timestamp, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ClientAccessPermissions {
  overview: boolean;
  tasks: boolean;
  documents: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed';
  clientAccess?: Record<string, ClientAccessPermissions>; // userId -> permissions
  isDeleted?: boolean;
  createdAt: string;
  createdBy: string;
}

export const createProject = async (name: string, description: string, uid: string): Promise<string> => {
  const newProject = {
    name,
    description,
    status: 'active',
    createdAt: Timestamp.now().toDate().toISOString(),
    createdBy: uid,
  };

  const docRef = await addDoc(collection(db, 'projects'), newProject);
  return docRef.id;
};

export const subscribeToProjects = (
  callback: (projects: Project[]) => void, 
  options: { includeDeleted?: boolean, onlyDeleted?: boolean } = {}
) => {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const projectsData: Project[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (options.onlyDeleted) {
        if (data.isDeleted) projectsData.push({ id: doc.id, ...data } as Project);
      } else if (options.includeDeleted) {
        projectsData.push({ id: doc.id, ...data } as Project);
      } else {
        if (!data.isDeleted) projectsData.push({ id: doc.id, ...data } as Project);
      }
    });
    callback(projectsData);
  });
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const docRef = doc(db, 'projects', id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.isDeleted) return null; // Treat soft-deleted as not found for normal flow
    return { id: docSnap.id, ...data } as Project;
  } else {
    return null;
  }
};

export const updateProject = async (id: string, data: Partial<Project>): Promise<void> => {
  const docRef = doc(db, 'projects', id);
  await updateDoc(docRef, data);
};

export const deleteProject = async (id: string): Promise<void> => {
  const docRef = doc(db, 'projects', id);
  await updateDoc(docRef, { isDeleted: true });
};

export const restoreProject = async (id: string): Promise<void> => {
  const { deleteField } = await import('firebase/firestore');
  const docRef = doc(db, 'projects', id);
  await updateDoc(docRef, { isDeleted: deleteField() });
};

export const updateProjectClientAccess = async (projectId: string, clientId: string, permissions: ClientAccessPermissions): Promise<void> => {
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    [`clientAccess.${clientId}`]: permissions
  });
};

export const removeProjectClientAccess = async (projectId: string, clientId: string): Promise<void> => {
  const { deleteField } = await import('firebase/firestore');
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    [`clientAccess.${clientId}`]: deleteField()
  });
};
