// FIX: Replaced corrupted file content with a functional React component.
// This new component correctly implements the form for adding a new profile,
// resolving module import errors in App.tsx and providing the required functionality.
import React, { useState } from 'react';
import { Profile } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface NewProfileFormProps {
  onAddProfile: (profileData: Pick<Profile, 'tiktokId' | 'contractAmount' | 'startDate' | 'tiktokProfileLink'>) => void;
}

const NewProfileForm: React.FC<NewProfileFormProps> = ({ onAddProfile }) => {
    const [tiktokId, setTiktokId] = useState('');
    const [tiktokProfileLink, setTiktokProfileLink] = useState('');
    const [contractAmount, setContractAmount] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');

    const handleProfileLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const link = e.target.value;
        setTiktokProfileLink(link);

        // Regex to find username after /@ and before any subsequent / or ?
        const match = link.match(/@([a-zA-Z0-9_.-]+)/);
        if (match && match[1]) {
            setTiktokId(match[1]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalTiktokId = tiktokId.trim();
        if (finalTiktokId.startsWith('@')) {
            finalTiktokId = finalTiktokId.substring(1);
        }

        if (!finalTiktokId || !startDate) {
            setError('TikTok Profile ID and Start Date are required.');
            return;
        }
        setError('');
        onAddProfile({ 
            tiktokId: finalTiktokId,
            contractAmount: Number(contractAmount) || 0, 
            startDate,
            tiktokProfileLink: tiktokProfileLink.trim() || undefined
        });
        
        // Reset form
        setTiktokId('');
        setTiktokProfileLink('');
        setContractAmount('');
        setStartDate(new Date().toISOString().split('T')[0]);
    };

    return (
        <div className="p-2">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="tiktokProfileLink" className="block text-sm font-medium text-gray-300 mb-2">
                        TikTok Profile Link
                    </label>
                    <input
                        id="tiktokProfileLink"
                        type="url"
                        value={tiktokProfileLink}
                        onChange={handleProfileLinkChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        placeholder="https://www.tiktok.com/@username"
                    />
                </div>
                <div>
                    <label htmlFor="tiktokId" className="block text-sm font-medium text-gray-300 mb-2">
                        TikTok Profile ID
                    </label>
                    <input
                        id="tiktokId"
                        type="text"
                        value={tiktokId}
                        onChange={(e) => setTiktokId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        placeholder="Automatically filled from link"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="contractAmount" className="block text-sm font-medium text-gray-300 mb-2">Contract Amount ($)</label>
                        <input
                            id="contractAmount"
                            type="number"
                            value={contractAmount}
                            onChange={(e) => setContractAmount(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">Contract Start Date</label>
                        <input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            required
                        />
                    </div>
                </div>
                
                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    type="submit"
                    className="w-full flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-md hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-105"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Profile
                </button>
            </form>
        </div>
    );
};

export default NewProfileForm;