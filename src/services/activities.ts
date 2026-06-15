import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';

export type ActivityActionType = 
  | 'task_created' 
  | 'task_completed' 
  | 'task_assigned' 
  | 'document_uploaded';

export interface Activity {
  id: string;
  projectId: string;
  userId: string;
  actionType: ActivityActionType;
  targetName: string;
  targetId?: string;
  createdAt: string;
}

export const logActivity = async (
  projectId: string,
  userId: string,
  actionType: ActivityActionType,
  targetName: string,
  targetId?: string
): Promise<void> => {
  try {
    const activityRef = collection(db, 'activities');
    await addDoc(activityRef, {
      projectId,
      userId,
      actionType,
      targetName,
      targetId: targetId || null,
      createdAt: Timestamp.now().toDate().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // We don't throw here to avoid breaking the main flow if logging fails
  }
};

export const subscribeToProjectActivities = (
  projectId: string,
  callback: (activities: Activity[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'activities'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (querySnapshot) => {
    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() } as Activity);
    });
    callback(activities);
  }, (error) => {
    console.error("Error subscribing to activities:", error);
    callback([]); // Prevent infinite loading if index is missing
  });
};
