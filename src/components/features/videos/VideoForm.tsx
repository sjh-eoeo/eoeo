import React, { useState, useEffect } from 'react';
import { useProfileStore } from '../../../store/useProfileStore';
import { useVideoStore } from '../../../store/useVideoStore';
import { useBrandStore } from '../../../store/useBrandStore';
import { useFirestore } from '../../../hooks/useFirestore';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { toISODateString } from '../../../lib/utils/date';

interface VideoFormProps {
  onSuccess?: () => void;
}

export const VideoForm: React.FC<VideoFormProps> = ({ onSuccess }) => {
  const { profiles } = useProfileStore();
  const { videos } = useVideoStore();
  const { selectedBrand } = useBrandStore();
  const { addDocument } = useFirestore();

  const [selectedTiktokId, setSelectedTiktokId] = useState('');
  const [videoId, setVideoId] = useState('');
  const [uploadDate, setUploadDate] = useState(toISODateString());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [profileSearch, setProfileSearch] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateVideos, setDuplicateVideos] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedTiktokId && profiles.length > 0) {
      setSelectedTiktokId(profiles[0].tiktokId);
    }
  }, [profiles, selectedTiktokId]);

  // Parse TikTok URL to extract profile and video ID
  const handleTiktokUrlChange = (url: string) => {
    setTiktokUrl(url);
    
    // Extract profile: /@username/
    const profileMatch = url.match(/\/@([^\/]+)/);
    if (profileMatch) {
      setSelectedTiktokId(profileMatch[1]);
    }
    
    // Extract video ID: /video/123456789
    const videoMatch = url.match(/\/video\/(\d+)/);
    if (videoMatch) {
      setVideoId(videoMatch[1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTiktokId || !videoId.trim() || !uploadDate) {
      setError('TikTok Profile, Video ID, and Upload Date are required.');
      return;
    }

    if (!selectedBrand) {
      setError('Please select a brand first.');
      return;
    }

    // Check for duplicates
    const duplicates = videos.filter(
      (v) => v.tiktokId === selectedTiktokId && v.videoId === videoId.trim()
    );
    
    if (duplicates.length > 0) {
      setDuplicateVideos(duplicates);
      setShowDuplicateModal(true);
      return;
    }

    setError('');
    await saveVideo();
  };

  const saveVideo = async () => {
    setIsSubmitting(true);

    try {
      // Generate URLs
      const profileUrl = `https://www.tiktok.com/@${selectedTiktokId}`;
      const videoUrl = `https://www.tiktok.com/@${selectedTiktokId}/video/${videoId.trim()}`;

      await addDocument('videos', {
        tiktokId: selectedTiktokId,
        videoId: videoId.trim(),
        tiktokProfileUrl: profileUrl,
        videoUrl: videoUrl,
        uploadDate,
        brand: selectedBrand,
        notes: '',
      });

      // Reset form
      setVideoId('');
      setUploadDate(toISODateString());
      setTiktokUrl('');
      setProfileSearch('');
      if (profiles.length > 0) {
        setSelectedTiktokId(profiles[0].tiktokId);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding video:', error);
      setError('Failed to add video record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.tiktokId.toLowerCase().includes(profileSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2">
      {/* TikTok URL Input - Auto-parse profile and video ID */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          TikTok URL (Optional - Auto-fill)
        </label>
        <Input
          type="text"
          value={tiktokUrl}
          onChange={(e) => handleTiktokUrlChange(e.target.value)}
          placeholder="https://www.tiktok.com/@username/video/1234567890"
        />
        <p className="text-xs text-gray-400 mt-1">
          Paste a TikTok URL to auto-fill profile and video ID
        </p>
      </div>

      {/* Profile Dropdown with Search */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          TikTok Profile
        </label>
        <input
          type="text"
          placeholder="Search profiles..."
          value={profileSearch}
          onChange={(e) => setProfileSearch(e.target.value)}
          className="w-full mb-2 bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <select
          value={selectedTiktokId}
          onChange={(e) => setSelectedTiktokId(e.target.value)}
          disabled={profiles.length === 0}
          className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
          size={Math.min(filteredProfiles.length + 1, 5)}
        >
          <option value="">-- Select a Profile --</option>
          {filteredProfiles.map((profile) => (
            <option key={profile.tiktokId} value={profile.tiktokId}>
              {profile.tiktokId}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Video ID"
        type="text"
        value={videoId}
        onChange={(e) => setVideoId(e.target.value)}
        placeholder="7568506179157085471"
        required
      />

      <Input
        label="Upload Date"
        type="date"
        value={uploadDate}
        onChange={(e) => setUploadDate(e.target.value)}
        required
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {profiles.length === 0 && (
        <p className="text-yellow-400 text-sm">
          Please add a profile first before adding videos.
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        disabled={profiles.length === 0 || isSubmitting}
        className="w-full"
      >
        Add Video Record
      </Button>

      {/* Duplicate Warning Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setDuplicateVideos([]);
        }}
        title="Duplicate Video Detected"
        size="md"
      >
        <div className="space-y-4 p-2">
          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-4">
            <p className="text-yellow-300 font-medium mb-3">
              This video already exists in the system:
            </p>
            <div className="space-y-2">
              {duplicateVideos.map((video, index) => (
                <div key={video.id} className="bg-gray-800 rounded p-3 space-y-2 text-sm">
                  {duplicateVideos.length > 1 && (
                    <div className="text-xs text-gray-400 mb-2">
                      Duplicate #{index + 1}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">TikTok ID:</span>
                    <span className="text-white font-medium">{video.tiktokId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Video ID:</span>
                    <span className="text-white font-medium">{video.videoId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Upload Date:</span>
                    <span className="text-white">{video.uploadDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Brand:</span>
                    <span className="text-white">{video.brand}</span>
                  </div>
                  {video.notes && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Notes:</span>
                      <span className="text-white text-right">{video.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-300 text-sm">
            Do you want to add this video anyway? This will create a duplicate entry.
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setShowDuplicateModal(false);
                setDuplicateVideos([]);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={async () => {
                setShowDuplicateModal(false);
                setDuplicateVideos([]);
                await saveVideo();
              }}
              className="flex-1"
            >
              Add Anyway
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
};
