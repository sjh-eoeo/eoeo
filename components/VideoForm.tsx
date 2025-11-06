import React, { useState, useEffect } from 'react';
import { VideoRecord, Brand, Profile } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface VideoFormProps {
  onAddVideo: (video: Omit<VideoRecord, 'id' | 'notes' | 'brand'>) => void;
  profiles: Profile[];
}

const VideoForm: React.FC<VideoFormProps> = ({ onAddVideo, profiles }) => {
  const [selectedTiktokId, setSelectedTiktokId] = useState('');
  const [videoId, setVideoId] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedTiktokId && profiles.length > 0) {
      setSelectedTiktokId(profiles[0].tiktokId);
    }
  }, [profiles, selectedTiktokId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTiktokId || !videoId.trim() || !uploadDate) {
      setError('TikTok Profile, Video ID, and Upload Date are required.');
      return;
    }
    setError('');
    onAddVideo({ tiktokId: selectedTiktokId, videoId, uploadDate });
    // Reset form for next entry
    setVideoId('');
    // Reselecting defaults after submit
    setSelectedTiktokId(profiles[0]?.tiktokId || '');
  };

  return (
    <div className="p-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="tiktokId" className="block text-sm font-medium text-gray-300 mb-2">
            TikTok Profile
          </label>
          <select
            id="tiktokId"
            value={selectedTiktokId}
            onChange={(e) => setSelectedTiktokId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          >
            <option value="" disabled>-- Select a Profile --</option>
            {profiles.map(profile => (
              <option key={profile.tiktokId} value={profile.tiktokId}>
                {profile.tiktokId}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="videoId" className="block text-sm font-medium text-gray-300 mb-2">
            Video ID
          </label>
          <input
            type="text"
            id="videoId"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="738..."
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          />
        </div>
        <div>
          <label htmlFor="uploadDate" className="block text-sm font-medium text-gray-300 mb-2">
            Upload Date
          </label>
          <input
            type="date"
            id="uploadDate"
            value={uploadDate}
            onChange={(e) => setUploadDate(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={profiles.length === 0}
          className="w-full flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-md hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Video Record
        </button>
        {profiles.length === 0 && <p className="text-yellow-400 text-xs mt-2 text-center">Please add a profile first.</p>}
      </form>
    </div>
  );
};

export default VideoForm;