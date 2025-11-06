import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase/config';

/**
 * Firebase Storage operations
 */
export const useStorage = () => {
  /**
   * Upload a file to Firebase Storage
   */
  const uploadFile = async (
    path: string,
    file: File
  ): Promise<{ fileName: string; filePath: string; url: string }> => {
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      return {
        fileName: file.name,
        filePath: path,
        url,
      };
    } catch (error) {
      console.error(`Error uploading file to ${path}:`, error);
      throw error;
    }
  };

  /**
   * Get download URL for a file
   */
  const getFileURL = async (path: string): Promise<string> => {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error(`Error getting file URL for ${path}:`, error);
      throw error;
    }
  };

  return {
    uploadFile,
    getFileURL,
  };
};
