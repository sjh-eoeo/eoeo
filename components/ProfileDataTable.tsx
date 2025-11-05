import React, { useMemo, useState, useEffect } from 'react';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';
import { AppUser, Payment, Profile, VideoRecord } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import Modal from './Modal';
import { SearchIcon } from './icons/SearchIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ProfileDataTableProps {
  profiles: Profile[];
  videos: VideoRecord[];
  payments: Payment[];
  onUpdateProfile: (profile: Profile) => void;
  onViewFile: (filePath: string, fileName: string) => void;
  appUser: AppUser;
  onDeleteProfiles: (tiktokIds: string[]) => void;
}

const ProfileDataTable: React.FC<ProfileDataTableProps> = ({ profiles, videos, payments, onUpdateProfile, onViewFile, appUser, onDeleteProfiles }) => {
  const [amountInputs, setAmountInputs] = useState<Record<string, string>>({});
  const [confirmEdit, setConfirmEdit] = useState<{ profile: Profile; newAmount: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState<string | null>(null); // Track uploading by tiktokId
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);


  const filteredProfiles = useMemo(() => {
    if (!searchTerm.trim()) {
      return profiles;
    }
    return profiles.filter(p => p.tiktokId.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [profiles, searchTerm]);
  
  useEffect(() => {
    const initialAmounts = profiles.reduce((acc, p) => {
        if(amountInputs[p.tiktokId] === undefined) {
             acc[p.tiktokId] = String(p.contractAmount);
        }
        return acc;
    }, {} as Record<string, string>);
    setAmountInputs(prev => ({...prev, ...initialAmounts}));
  }, [profiles]);

  const videoCountsByProfile = useMemo(() => {
    const counts = new Map<string, number>();
    videos.forEach(video => {
      counts.set(video.tiktokId, (counts.get(video.tiktokId) || 0) + 1);
    });
    return counts;
  }, [videos]);

  const paymentStatsByProfile = useMemo(() => {
    const stats = new Map<string, { count: number; totalAmount: number }>();
    payments.forEach(payment => {
      const currentStat = stats.get(payment.tiktokId) || { count: 0, totalAmount: 0 };
      currentStat.count += 1;
      currentStat.totalAmount += payment.amount;
      stats.set(payment.tiktokId, currentStat);
    });
    return stats;
  }, [payments]);
  
  const handleAmountChange = (tiktokId: string, value: string) => {
    setAmountInputs(prev => ({ ...prev, [tiktokId]: value }));
  };

  const handleAmountBlur = (profile: Profile) => {
      const inputValue = amountInputs[profile.tiktokId];
      const newAmount = Number(inputValue);
      if (inputValue && !isNaN(newAmount) && newAmount !== profile.contractAmount) {
          setConfirmEdit({ profile, newAmount });
      } else {
          handleAmountChange(profile.tiktokId, String(profile.contractAmount));
      }
  };

  const handleConfirmAmountChange = () => {
      if (confirmEdit) {
          onUpdateProfile({ ...confirmEdit.profile, contractAmount: confirmEdit.newAmount });
          setConfirmEdit(null);
      }
  };

  const handleCancelAmountChange = () => {
      if (confirmEdit) {
          handleAmountChange(confirmEdit.profile.tiktokId, String(confirmEdit.profile.contractAmount));
          setConfirmEdit(null);
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, profile: Profile) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(profile.tiktokId);
      const filePath = `contracts/${profile.tiktokId}/${file.name}`;
      const storageRef = ref(storage, filePath);
      try {
        await uploadBytes(storageRef, file);
        onUpdateProfile({ 
          ...profile, 
          contractFileName: file.name,
          contractFilePath: filePath,
        });
      } catch (error) {
        console.error("File upload error: ", error);
        alert("Failed to upload contract.");
      } finally {
        setUploading(null);
      }
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredProfiles.map(p => p.tiktokId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };
  
  const handleConfirmDelete = () => {
    onDeleteProfiles(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsDeleteModalOpen(false);
  };

  return (
    <>
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-700">
             <div className="flex-1">
                {appUser.role === 'admin' && selectedIds.size > 0 && (
                     <div className="flex items-center gap-4">
                         <span className="text-sm font-medium text-cyan-400">{selectedIds.size} item(s) selected</span>
                         <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center gap-2 text-sm bg-red-600/20 text-red-300 hover:bg-red-600/40 font-semibold py-1 px-3 rounded-md transition"
                        >
                             <TrashIcon className="h-4 w-4" />
                             Delete Selected
                         </button>
                     </div>
                )}
            </div>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search TikTok ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-700 border-gray-600 rounded-md pl-9 pr-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 w-64"
                />
            </div>
        </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
            <tr>
              {appUser.role === 'admin' && (
                <th scope="col" className="p-4">
                  <input type="checkbox" onChange={handleSelectAll} checked={filteredProfiles.length > 0 && selectedIds.size === filteredProfiles.length} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"/>
                </th>
              )}
              <th scope="col" className="px-6 py-3">TikTok ID</th>
              <th scope="col" className="px-6 py-3">Start Date</th>
              <th scope="col" className="px-6 py-3">Contract Amount</th>
              <th scope="col" className="px-6 py-3">Payment Progress</th>
              <th scope="col" className="px-6 py-3 text-center">Video Count</th>
              <th scope="col" className="px-6 py-3">Contract File</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map(profile => {
              const videoCount = videoCountsByProfile.get(profile.tiktokId) || 0;
              const paymentStats = paymentStatsByProfile.get(profile.tiktokId) || { count: 0, totalAmount: 0 };
              const progressPercent = profile.contractAmount > 0 ? (paymentStats.totalAmount / profile.contractAmount) * 100 : 0;
              return (
                <tr key={profile.tiktokId} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                  {appUser.role === 'admin' && (
                      <td className="w-4 p-4">
                        <input type="checkbox" checked={selectedIds.has(profile.tiktokId)} onChange={() => handleSelectOne(profile.tiktokId)} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"/>
                      </td>
                  )}
                  <td className="px-6 py-2 font-medium text-white whitespace-nowrap">{profile.tiktokId}</td>
                  <td className="px-6 py-2 whitespace-nowrap">{profile.startDate}</td>
                  <td className="px-6 py-2">
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                            type="number"
                            value={amountInputs[profile.tiktokId] ?? profile.contractAmount}
                            onChange={(e) => handleAmountChange(profile.tiktokId, e.target.value)}
                            onBlur={() => handleAmountBlur(profile)}
                            className="bg-gray-700 border-gray-600 rounded-md pl-6 pr-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 w-28"
                        />
                    </div>
                  </td>
                  <td className="px-6 py-2 min-w-48">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-white">{paymentStats.count} / 8 Payments</span>
                        <span className="text-gray-400">
                          ${paymentStats.totalAmount.toLocaleString()} / ${profile.contractAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-2 text-center font-semibold">{videoCount}</td>
                  <td className="px-6 py-2">
                    {uploading === profile.tiktokId ? (
                       <span className="text-xs text-yellow-400">Uploading...</span>
                    ) : profile.contractFilePath && profile.contractFileName ? (
                        <button 
                            onClick={() => onViewFile(profile.contractFilePath!, profile.contractFileName!)}
                            className="w-full text-xs bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-cyan-400 hover:bg-gray-600 cursor-pointer flex items-center justify-center font-semibold"
                        >
                            <EyeIcon className="h-4 w-4 mr-1.5" />
                            <span>View Contract</span>
                        </button>
                    ) : (
                        <label className="w-full text-xs bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-gray-300 hover:bg-gray-600 cursor-pointer flex items-center justify-center">
                            <span>Upload File</span>
                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, profile)} />
                        </label>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {profiles.length === 0 && <p className="text-gray-400 text-center p-6">No profiles have been added yet.</p>}
        {profiles.length > 0 && filteredProfiles.length === 0 && <p className="text-gray-400 text-center p-6">No profiles match your search.</p>}
      </div>
    </div>
    {confirmEdit && (
        <Modal isOpen={!!confirmEdit} onClose={handleCancelAmountChange} title="Confirm Edit" size="sm">
            <div className="space-y-6">
                <p>Are you sure you want to save these changes?</p>
                <div className="text-sm text-gray-300 bg-gray-700/50 p-3 rounded-md">
                    Change contract for <span className="font-bold text-white">{confirmEdit.profile.tiktokId}</span>
                    <div className="mt-2 flex justify-between items-center">
                       <span className="text-gray-400">From:</span>
                       <span className="font-mono text-yellow-400">${confirmEdit.profile.contractAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">To:</span>
                        <span className="font-mono text-green-400">${confirmEdit.newAmount.toLocaleString()}</span>
                    </div>
                </div>
                <div className="flex justify-end space-x-3">
                    <button onClick={handleCancelAmountChange} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
                        Cancel
                    </button>
                    <button onClick={handleConfirmAmountChange} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md">
                        Confirm
                    </button>
                </div>
            </div>
        </Modal>
    )}
    {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Deletion"
          size="sm"
        >
          <div className="space-y-6">
            <p className="text-gray-300">
              Are you sure you want to delete{' '}
              <span className="font-bold text-white">{selectedIds.size}</span> profile(s)? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">
                Delete
              </button>
            </div>
          </div>
        </Modal>
    )}
    </>
  );
};

export default ProfileDataTable;