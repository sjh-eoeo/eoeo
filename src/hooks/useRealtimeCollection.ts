import { useEffect, useRef } from 'react';
import {
  collection,
  query,
  onSnapshot,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Realtime Firestore collection subscription
 * Automatically unsubscribes on unmount
 */
export function useRealtimeCollection<T = DocumentData>(
  collectionName: string,
  onData: (data: T[]) => void,
  constraints: QueryConstraint[] = []
) {
  const onDataRef = useRef(onData);
  
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  useEffect(() => {
    const collectionRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : query(collectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        onDataRef.current(data);
      },
      (error) => {
        console.error(`Error subscribing to ${collectionName}:`, error);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);
}
