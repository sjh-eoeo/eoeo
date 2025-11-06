import React, { useState } from 'react';
import { Profile, PaymentCycle } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface NewProfileFormProps {
  onAddProfile: (profileData: Omit<Profile, 'paymentInfo' | 'contractFileName' | 'contractFilePath'>) => void;
}

const NewProfileForm: React.FC<NewProfileFormProps> = ({ onAddProfile }) => {
    const [tiktokId, setTiktokId] = useState('');
    const [tiktokProfileLink, setTiktokProfileLink] = useState('');
    const [contractAmount, setContractAmount] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [totalVideoCount, setTotalVideoCount] = useState('96');
    const [paymentCycle, setPaymentCycle] = useState<PaymentCycle>('weekly');
    const [numberOfPayments, setNumberOfPayments] = useState('8');
    const [error, setError] = useState('');

    const handleProfileLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const link = e.target.value;
        setTiktokProfileLink(link);
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

        if (!finalTiktokId || !startDate || !endDate || !totalVideoCount || !numberOfPayments) {
            setError('All fields are required.');
            return;
        }
        setError('');
        onAddProfile({ 
            tiktokId: finalTiktokId,
            contractAmount: Number(contractAmount) || 0, 
            startDate,
            endDate,
            totalVideoCount: Number(totalVideoCount),
            paymentCycle,
            numberOfPayments: Number(numberOfPayments),
            tiktokProfileLink: tiktokProfileLink.trim() || undefined
        });
        
        // Reset form
        setTiktokId('');
        setTiktokProfileLink('');
        setContractAmount('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setTotalVideoCount('96');
        setPaymentCycle('weekly');
        setNumberOfPayments('8');
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
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">Contract End Date</label>
                        <input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="contractAmount" className="block text-sm font-medium text-gray-300 mb-2">Total Contract Amount ($)</label>
                    <input
                        id="contractAmount"
                        type="number"
                        value={contractAmount}
                        onChange={(e) => setContractAmount(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        placeholder="e.g., 5000"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="totalVideoCount" className="block text-sm font-medium text-gray-300 mb-2">Total Videos</label>
                        <input
                            id="totalVideoCount"
                            type="number"
                            value={totalVideoCount}
                            onChange={(e) => setTotalVideoCount(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            placeholder="e.g., 96"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="numberOfPayments" className="block text-sm font-medium text-gray-300 mb-2">Number of Payments</label>
                        <input
                            id="numberOfPayments"
                            type="number"
                            value={numberOfPayments}
                            onChange={(e) => setNumberOfPayments(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            placeholder="e.g., 8"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="paymentCycle" className="block text-sm font-medium text-gray-300 mb-2">Payment Cycle</label>
                    <select
                        id="paymentCycle"
                        value={paymentCycle}
                        onChange={(e) => setPaymentCycle(e.target.value as PaymentCycle)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
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