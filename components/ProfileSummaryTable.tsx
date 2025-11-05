import React, { useState, useMemo } from 'react';
import { Profile, VideoRecord } from '../types';
import Modal from './Modal';
import { EyeIcon } from './icons/EyeIcon';
import { DollarIcon } from './icons/DollarIcon';

interface ProfileSummaryTableProps {
  profiles: Profile[];
  videos: VideoRecord[];
  onUpdateProfile: (profile: Profile) => void;
}

const ProfileSummaryTable: React.FC<ProfileSummaryTableProps> = ({ profiles, videos, onUpdateProfile }) => {
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const completedProfiles = useMemo(() => {
        return profiles.filter(p => p.paymentWeek >= 8);
    }, [profiles]);
    
    const videosByProfile = useMemo(() => {
        const map = new Map<string, VideoRecord[]>();
        videos.forEach(video => {
            if (!map.has(video.tiktokId)) {
                map.set(video.tiktokId, []);
            }
            map.get(video.tiktokId)!.push(video);
        });
        return map;
    }, [videos]);

    const handleViewVideos = (profile: Profile) => {
        setSelectedProfile(profile);
        setIsModalOpen(true);
    };

    if (completedProfiles.length === 0) {
        return null;
    }

    return (
        <>
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                <h3 className="text-xl font-semibold text-white p-6 border-b border-gray-700">Completed Contracts Summary</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">TikTok ID</th>
                                <th scope="col" className="px-6 py-3 text-center">Video Count</th>
                                <th scope="col" className="px-6 py-3">Payment Status</th>
                                <th scope="col" className="px-6 py-3 text-center">Video IDs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {completedProfiles.map(profile => {
                                const profileVideos = videosByProfile.get(profile.tiktokId) || [];
                                return (
                                    <tr key={profile.tiktokId} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{profile.tiktokId}</td>
                                        <td className="px-6 py-4 text-center">{profileVideos.length}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                                                <DollarIcon className="h-4 w-4 mr-1.5" />
                                                All Paid (W8)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleViewVideos(profile)} className="text-cyan-400 hover:text-cyan-300 flex items-center justify-center mx-auto text-xs font-semibold">
                                                <EyeIcon className="h-4 w-4 mr-1"/>
                                                View ({profileVideos.length})
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedProfile && (
                 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Video IDs for ${selectedProfile.tiktokId}`}>
                    <div className="space-y-2">
                        {videosByProfile.get(selectedProfile.tiktokId)?.length > 0 ? (
                            <ul className="divide-y divide-gray-700">
                                {videosByProfile.get(selectedProfile.tiktokId)?.map(video => (
                                    <li key={video.id} className="py-2 flex justify-between items-center">
                                        <span className="text-gray-300 font-mono">{video.videoId}</span>
                                        <span className="text-xs text-gray-400">{video.uploadDate}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No videos found for this profile.</p>
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
};

export default ProfileSummaryTable;