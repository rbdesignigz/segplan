import { collection, addDoc, onSnapshot, query, where, orderBy, Timestamp, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  storagePath: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeIds: string[]; // Changed from assigneeId to an array
  color?: string; // Pastel background color
  attachments?: TaskAttachment[];
  createdAt: string;
  createdBy: string;
}

export const createTask = async (
  projectId: string, 
  title: string, 
  description: string, 
  assigneeIds: string[], 
  uid: string,
  color?: string
): Promise<string> => {
  const newTask = {
    projectId,
    title,
    description,
    status: 'todo' as TaskStatus,
    assigneeIds,
    color: color || 'default',
    createdAt: Timestamp.now().toDate().toISOString(),
    createdBy: uid,
  };

  const docRef = await addDoc(collection(db, 'tasks'), newTask);
  return docRef.id;
};

export const subscribeToProjectTasks = (projectId: string, callback: (tasks: Task[]) => void) => {
  const q = query(
    collection(db, 'tasks'), 
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const tasksData: Task[] = [];
    snapshot.forEach((doc) => {
      tasksData.push({ id: doc.id, ...doc.data() } as Task);
    });
    callback(tasksData);
  });
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
  const docRef = doc(db, 'tasks', taskId);
  await updateDoc(docRef, { status });
};

export const updateTaskDetails = async (taskId: string, title: string, description: string, color?: string): Promise<void> => {
  const docRef = doc(db, 'tasks', taskId);
  const updates: any = { title, description };
  if (color) updates.color = color;
  await updateDoc(docRef, updates);
};

export const uploadTaskAttachment = async (
  taskId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> => {
  const uniqueName = `${Date.now()}_${file.name}`;
  const storagePath = `tasks/${taskId}/attachments/${uniqueName}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newAttachment: TaskAttachment = {
            id: Date.now().toString(),
            name: file.name,
            url: downloadURL,
            type: file.type || 'unknown',
            storagePath,
            createdAt: Timestamp.now().toDate().toISOString(),
          };
          
          const docRef = doc(db, 'tasks', taskId);
          await updateDoc(docRef, {
            attachments: arrayUnion(newAttachment)
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const deleteTaskAttachment = async (taskId: string, attachment: TaskAttachment): Promise<void> => {
  const fileRef = ref(storage, attachment.storagePath);
  try {
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error deleting file from storage:", error);
    // Continue deleting from DB even if storage deletion fails (e.g., file not found)
  }

  const docRef = doc(db, 'tasks', taskId);
  await updateDoc(docRef, {
    attachments: arrayRemove(attachment)
  });
};

export const updateTaskAssignees = async (taskId: string, assigneeIds: string[]): Promise<void> => {
  const docRef = doc(db, 'tasks', taskId);
  await updateDoc(docRef, { assigneeIds });
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const docRef = doc(db, 'tasks', taskId);
  await deleteDoc(docRef);
};

export const subscribeToAllTasks = (callback: (tasks: Task[]) => void) => {
  const q = query(collection(db, 'tasks'));
  
  return onSnapshot(q, (snapshot) => {
    const tasksData: Task[] = [];
    snapshot.forEach((doc) => {
      tasksData.push({ id: doc.id, ...doc.data() } as Task);
    });
    callback(tasksData);
  });
};
