import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserRole } from '../context/AuthContext';

export interface UserProfile {
  id: string; // same as uid
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
}

export const subscribeToUsers = (callback: (users: UserProfile[]) => void) => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const usersData: UserProfile[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (doc.id !== 'undefined' && data.email) {
        usersData.push({ id: doc.id, ...data } as UserProfile);
      }
    });
    callback(usersData);
  });
};

export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, { role: newRole });
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  const users: UserProfile[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (doc.id !== 'undefined' && data.email) {
      users.push({ id: doc.id, ...data } as UserProfile);
    }
  });
  return users;
};
