import { useAuthStore } from '../store/useAuthStore';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import type { ActivityAction, ActivityCollection } from '../types';

export function useActivityLog() {
  const { appUser } = useAuthStore();

  const logActivity = async (
    action: ActivityAction,
    collectionName: ActivityCollection,
    documentId: string,
    details?: string,
    changes?: Record<string, any>
  ) => {
    if (!appUser) {
      console.warn('Cannot log activity: No user logged in');
      return;
    }

    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        userId: appUser.uid,
        userEmail: appUser.email,
        action,
        collection: collectionName,
        documentId,
        details,
        changes,
      };
      
      console.log('Logging activity:', logEntry);
      
      // Directly add to Firestore to avoid circular dependency
      const docRef = await addDoc(collection(db, 'activityLogs'), logEntry);
      
      console.log('Activity logged successfully with ID:', docRef.id);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - logging should not break the main operation
    }
  };

  return { logActivity };
}
