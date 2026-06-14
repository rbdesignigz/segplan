import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut, 
  UserCredential 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRole } from '../context/AuthContext';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<UserCredential> => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const user = userCredential.user;

  // Check if user already exists in Firestore
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    // If it's the specific admin email, make them admin, otherwise viewer
    const role: UserRole = user.email?.toLowerCase() === 'pablo.da.ber@gmail.com' ? 'admin' : 'viewer';

    // Create user profile in Firestore
    await setDoc(userDocRef, {
      email: user.email,
      displayName: user.displayName || 'Unknown User',
      photoURL: user.photoURL,
      role: role,
      createdAt: new Date().toISOString(),
    });
  } else {
    // If user already exists but their email is the admin email, force the admin role
    if (user.email?.toLowerCase() === 'pablo.da.ber@gmail.com') {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(userDocRef, { role: 'admin' });
    }
  }

  return userCredential;
};

export const logoutUser = async (): Promise<void> => {
  return signOut(auth);
};
