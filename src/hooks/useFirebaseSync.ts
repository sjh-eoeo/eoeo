import { useEffect } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { useProfileStore } from '../store/useProfileStore';
import { usePaymentStore } from '../store/usePaymentStore';
import { useBrandStore } from '../store/useBrandStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRealtimeCollection } from '../hooks/useRealtimeCollection';
import { useRealtimeDocument } from '../hooks/useRealtimeDocument';
import type { VideoRecord, Profile, Payment, Brand } from '../types';

/**
 * Hook to initialize all Firebase realtime subscriptions
 */
export const useFirebaseSync = () => {
  const { setVideos } = useVideoStore();
  const { setProfiles } = useProfileStore();
  const { setPayments } = usePaymentStore();
  const { setBrands, setSelectedBrand, selectedBrand, brands } = useBrandStore();
  const { appUser } = useAuthStore();

  // Subscribe to videos collection
  useRealtimeCollection<VideoRecord>('videos', (data) => {
    setVideos(data);
  });

  // Subscribe to profiles collection
  useRealtimeCollection<Profile>('profiles', (data) => {
    setProfiles(data);
  });

  // Subscribe to payments collection
  useRealtimeCollection<Payment>('payments', (data) => {
    setPayments(data);
  });

  // Subscribe to brands document
  useRealtimeDocument<{ names: Brand[] }>(
    'config',
    'brandsDoc',
    (data) => {
      if (data && data.names) {
        setBrands(data.names);
        // Auto-select first brand if none selected
        if (!selectedBrand && data.names.length > 0) {
          setSelectedBrand(data.names[0]);
        }
      }
    }
  );

  // Initialize default brands if none exist
  useEffect(() => {
    if (brands.length === 0) {
      const defaultBrands: Brand[] = ['kahi', 'marsmade'];
      setBrands(defaultBrands);
      setSelectedBrand(defaultBrands[0]);
    }
  }, [brands.length, setBrands, setSelectedBrand]);
};
