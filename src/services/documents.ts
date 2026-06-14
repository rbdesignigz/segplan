import { collection, addDoc, onSnapshot, query, where, orderBy, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
  storagePath: string;
}

export const uploadDocument = async (
  projectId: string,
  file: File,
  uid: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Check size limit (10 MB)
  const MAX_SIZE_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('File exceeds the 10MB limit.');
  }

  // Create a unique file name to prevent overwriting
  const uniqueName = `${Date.now()}_${file.name}`;
  const storagePath = `projects/${projectId}/documents/${uniqueName}`;
  const storageRef = ref(storage, storagePath);

  // Upload to Firebase Storage
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        // Upload completed successfully, now we can get the download URL
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save metadata to Firestore
          const newDoc = {
            projectId,
            name: file.name,
            url: downloadURL,
            type: file.type || 'unknown',
            size: file.size,
            uploadedBy: uid,
            createdAt: Timestamp.now().toDate().toISOString(),
            storagePath,
          };

          const docRef = await addDoc(collection(db, 'documents'), newDoc);
          resolve(docRef.id);
        } catch (dbError) {
          reject(dbError);
        }
      }
    );
  });
};

export const subscribeToProjectDocuments = (projectId: string, callback: (docs: ProjectDocument[]) => void) => {
  const q = query(
    collection(db, 'documents'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const docsData: ProjectDocument[] = [];
    snapshot.forEach((doc) => {
      docsData.push({ id: doc.id, ...doc.data() } as ProjectDocument);
    });
    callback(docsData);
  });
};

export const deleteProjectDocument = async (documentId: string, storagePath: string): Promise<void> => {
  // 1. Delete from Firebase Storage
  const fileRef = ref(storage, storagePath);
  await deleteObject(fileRef);

  // 2. Delete metadata from Firestore
  const docRef = doc(db, 'documents', documentId);
  await deleteDoc(docRef);
};
