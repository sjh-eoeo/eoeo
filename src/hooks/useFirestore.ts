import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  writeBatch,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Firestore CRUD operations
 */
export const useFirestore = () => {
  /**
   * Add a new document to a collection
   */
  const addDocument = async <T extends DocumentData>(
    collectionName: string,
    data: T
  ) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  };

  /**
   * Set a document with a specific ID (upsert)
   */
  const setDocument = async <T extends DocumentData>(
    collectionName: string,
    documentId: string,
    data: T
  ) => {
    try {
      const docRef = doc(db, collectionName, documentId);
      await setDoc(docRef, data);
    } catch (error) {
      console.error(`Error setting document ${documentId}:`, error);
      throw error;
    }
  };

  /**
   * Update an existing document
   */
  const updateDocument = async <T extends DocumentData>(
    collectionName: string,
    documentId: string,
    updates: Partial<T>
  ) => {
    try {
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, updates as DocumentData);
    } catch (error) {
      console.error(`Error updating document ${documentId}:`, error);
      throw error;
    }
  };

  /**
   * Delete a document
   */
  const deleteDocument = async (collectionName: string, documentId: string) => {
    try {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      throw error;
    }
  };

  /**
   * Batch delete multiple documents
   */
  const batchDeleteDocuments = async (
    collectionName: string,
    documentIds: string[]
  ) => {
    try {
      const batch = writeBatch(db);
      documentIds.forEach((id) => {
        const docRef = doc(db, collectionName, id);
        batch.delete(docRef);
      });
      await batch.commit();
    } catch (error) {
      console.error(`Error batch deleting documents:`, error);
      throw error;
    }
  };

  return {
    addDocument,
    setDocument,
    updateDocument,
    deleteDocument,
    batchDeleteDocuments,
  };
};
