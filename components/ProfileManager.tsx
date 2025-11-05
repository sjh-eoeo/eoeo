import React, { useState, useEffect, useMemo } from 'react';
import { Profile, VideoRecord } from '../types';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { PlusIcon } from './icons/PlusIcon';
import { DollarIcon } from './icons/DollarIcon';

interface ProfileManagerProps {
  profiles: Profile[];
  videos: VideoRecord[];
  onUpdateProfile: (profile: Profile) => void;
  onAddProfile: (profileData: Pick<Profile, 'tiktokId' | 'contractAmount' | 'startDate'>) => void;
}

interface ProfileEditorProps {
    profile: Profile;
    videoCount: number;
    onUpdateProfile: (profile: Profile) => void;
}

const NewProfileForm: React.FC<{ onAddProfile: ProfileManagerProps['onAddProfile'] }> = ({ onAddProfile }) => {
    const [tiktokId, setTiktokId] = useState('');
    const [contractAmount, setContractAmount] = useState(0);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tiktokId.trim() || !startDate) {
            setError('TikTok Profile ID and Start Date are required.');
            return;
        }
        setError('');
        onAddProfile({ tiktokId, contractAmount, startDate });
        setTiktokId('');
        setContractAmount(0);
        setStartDate(new Date().toISOString().split('T')[0]);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-700/40 rounded-lg space-y-4 mb-6 border border-gray-600">
            <h3 className="text-lg font-semibold text-white">Register New Profile</h3>
            <div>
                 <label htmlFor="newTiktokId" className="text-xs text-gray-400 block mb-1">TikTok Profile ID</label>
                 <input
                    id="newTiktokId"
                    type="text"
                    value={tiktokId}
                    onChange={(e) => setTiktokId(e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500"
                    placeholder="@username"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="newContractAmount" className="text-xs text-gray-400 block mb-1">Contract Amount ($)</label>
                    <input
                        id="newContractAmount"
                        type="number"
                        value={contractAmount}
                        onChange={(e) => setContractAmount(Number(e.target.value))}
                        className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500"
                        placeholder="0"
                    />
                </div>
                <div>
                    <label htmlFor="startDate" className="text-xs text-gray-400 block mb-1">Contract Start Date</label>
                    <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500"
                    />
                </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
                type="submit"
                className="w-full flex items-center justify-center text-sm bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-md transition"
            >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Profile
            </button>
        </form>
    );
};

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, videoCount, onUpdateProfile }) => {
    const [amount, setAmount] = useState(profile.contractAmount);
    const [fileName, setFileName] = useState(profile.contractFileName);

    useEffect(() => {
        setAmount(profile.contractAmount);
        setFileName(profile.contractFileName);
    }, [profile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const newFileName = e.target.files[0].name;
            setFileName(newFileName);
            onUpdateProfile({ ...profile, contractFileName: newFileName });
        }
    };
    
    const handleAmountChange = (newAmount: number) => {
        setAmount(newAmount);
        onUpdateProfile({ ...profile, contractAmount: newAmount });
    }

    const nextPaymentWeek = profile.paymentWeek + 1;
    const requiredVideos = nextPaymentWeek * 12;
    const isEligible = videoCount >= requiredVideos;

    const handleMarkAsPaid = () => {
        if (isEligible && nextPaymentWeek <= 8) {
            onUpdateProfile({ ...profile, paymentWeek: nextPaymentWeek });
        }
    };

    const WEEKS = Array.from({ length: 7 }, (_, i) => i + 2); // Weeks 2 to 8

    return (
        <div className="bg-gray-700/50 p-4 rounded-lg space-y-4">
            <h4 className="font-semibold text-white truncate">{profile.tiktokId}</h4>
            
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Contract Amount ($)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => handleAmountChange(Number(e.target.value))}
                            className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Contract File</label>
                        <label className="w-full text-sm bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-gray-300 hover:bg-gray-500 cursor-pointer flex items-center justify-between">
                            <span className="truncate">{fileName || 'Attach file...'}</span>
                            <input type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-600">
                <h5 className="text-sm font-semibold text-gray-200 mb-3">Payment Progress</h5>
                
                <div className="flex justify-between items-center space-x-1 mb-4">
                    {WEEKS.map(week => (
                        <div key={week} className={`w-full text-center py-1 rounded-md text-xs font-bold
                            ${week <= profile.paymentWeek ? 'bg-cyan-500 text-gray-900' : ''}
                            ${week === nextPaymentWeek ? 'ring-2 ring-cyan-400 text-white' : ''}
                            ${week > nextPaymentWeek ? 'bg-gray-600 text-gray-400' : ''}
                        `}>
                           W{week}
                        </div>
                    ))}
                </div>

                {nextPaymentWeek <= 8 ? (
                    <>
                        <div className="bg-gray-800/50 p-3 rounded-lg text-center space-y-1">
                            <p className="text-xs text-gray-400">Next Payment: <span className="font-bold text-white">Week {nextPaymentWeek}</span></p>
                            <p className="text-xs text-gray-400">
                                Video Goal: <span className="font-bold text-white">{videoCount} / {requiredVideos}</span>
                            </p>
                            <p className={`text-xs font-bold ${isEligible ? 'text-green-400' : 'text-red-400'}`}>
                                {isEligible ? 'Eligible for Payment' : 'Insufficient Videos'}
                            </p>
                        </div>
                        <button
                            onClick={handleMarkAsPaid}
                            disabled={!isEligible}
                            className="w-full mt-3 flex items-center justify-center text-sm bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
                        >
                            <DollarIcon className="h-4 w-4 mr-2" />
                            Mark Week {nextPaymentWeek} as Paid
                        </button>
                    </>
                ) : (
                    <div className="bg-green-900/50 text-green-300 p-3 rounded-lg text-center text-sm font-semibold">
                        All Payments Complete
                    </div>
                )}
            </div>
        </div>
    );
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, videos, onUpdateProfile, onAddProfile }) => {
  
  const videoCountsByProfile = useMemo(() => {
    const counts = new Map<string, number>();
    videos.forEach(video => {
        counts.set(video.tiktokId, (counts.get(video.tiktokId) || 0) + 1);
    });
    return counts;
  }, [videos]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
      <h2 className="text-2xl font-semibold mb-6 text-white flex items-center">
        <UserGroupIcon className="h-6 w-6 mr-3 text-cyan-400" />
        Profile & Contract Management
      </h2>
      
      <NewProfileForm onAddProfile={onAddProfile} />

      <h3 className="text-lg font-semibold text-white mb-4 mt-6 pt-4 border-t border-gray-700">Existing Profiles</h3>
      {profiles.length > 0 ? (
        <div className="space-y-4 max-h-[40rem] overflow-y-auto pr-2">
          {profiles.map(profile => {
            if (!profile) return null;
            return (
                <ProfileEditor 
                    key={profile.tiktokId} 
                    profile={profile}
                    videoCount={videoCountsByProfile.get(profile.tiktokId) || 0}
                    onUpdateProfile={onUpdateProfile} 
                />
            );
          })}
        </div>
      ) : (
        <p className="text-gray-400">No profiles found. Use the form above to register a new profile.</p>
      )}
    </div>
  );
};

export default ProfileManager;