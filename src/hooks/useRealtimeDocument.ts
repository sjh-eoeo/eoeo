import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Realtime Firestore document subscription
 */
export function useRealtimeDocument<T>(
  collectionName: string,
  documentId: string,
  onData: (data: T | null) => void
) {
  const onDataRef = useRef(onData);
  
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  useEffect(() => {
    const docRef = doc(db, collectionName, documentId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onDataRef.current({ id: docSnap.id, ...docSnap.data() } as T);
        } else {
          onDataRef.current(null);
        }
      },
      (error) => {
        console.error(`Error subscribing to document ${documentId}:`, error);
      }
    );

    return () => unsubscribe();
  }, [collectionName, documentId]);
}
