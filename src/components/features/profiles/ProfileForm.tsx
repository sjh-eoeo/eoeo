import React, { useState } from 'react';
import { useFirestore } from '../../../hooks/useFirestore';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { toISODateString } from '../../../lib/utils/date';

interface ProfileFormProps {
  onSuccess?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess }) => {
  const { setDocument } = useFirestore();

  const [tiktokIdInput, setTiktokIdInput] = useState('');
  const [tiktokId, setTiktokId] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [startDate, setStartDate] = useState(toISODateString());
  const [totalVideoCount, setTotalVideoCount] = useState('96');
  const [numberOfPayments, setNumberOfPayments] = useState('8');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract TikTok ID from URL or input
  const handleTiktokIdChange = (value: string) => {
    setTiktokIdInput(value);
    
    // Check if input is a TikTok URL
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([^/?#]+)/i;
    const match = value.match(urlPattern);
    
    if (match && match[1]) {
      // Extracted ID from URL
      setTiktokId(match[1]);
    } else {
      // Direct ID input (remove @ if present)
      setTiktokId(value.replace(/^@/, '').trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tiktokId.trim() || !startDate) {
      setError('TikTok Profile ID and Start Date are required.');
      return;
    }

    const amount = Number(contractAmount);
    if (contractAmount && isNaN(amount)) {
      setError('Contract amount must be a valid number.');
      return;
    }

    const videoCount = Number(totalVideoCount);
    if (!totalVideoCount || isNaN(videoCount) || videoCount <= 0) {
      setError('Total video count must be a valid positive number.');
      return;
    }

    const paymentCount = Number(numberOfPayments);
    if (!numberOfPayments || isNaN(paymentCount) || paymentCount <= 0) {
      setError('Number of payments must be a valid positive number.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await setDocument('profiles', tiktokId.trim(), {
        tiktokId: tiktokId.trim(),
        contractAmount: amount || 0,
        startDate,
        endDate: '',
        totalVideoCount: videoCount,
        paymentCycle: 'weekly' as const,
        numberOfPayments: paymentCount,
        paymentInfo: '',
      });

      // Reset form
      setTiktokIdInput('');
      setTiktokId('');
      setContractAmount('');
      setStartDate(toISODateString());
      setTotalVideoCount('96');
      setNumberOfPayments('8');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error adding profile:', error);
      if (error.code === 'permission-denied') {
        setError('Permission denied. Please contact an administrator.');
      } else {
        setError('Failed to add profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2">
      <div>
        <Input
          label="TikTok Profile URL or ID"
          type="text"
          value={tiktokIdInput}
          onChange={(e) => handleTiktokIdChange(e.target.value)}
          placeholder="https://tiktok.com/@username or @username"
          required
        />
        {tiktokId && tiktokId !== tiktokIdInput && (
          <p className="text-xs text-cyan-400 mt-1">
            Extracted ID: <span className="font-semibold">@{tiktokId}</span>
          </p>
        )}
      </div>

      <Input
        label="Contract Amount ($)"
        type="number"
        value={contractAmount}
        onChange={(e) => setContractAmount(e.target.value)}
        placeholder="0"
        min="0"
        step="0.01"
      />

      <Input
        label="Contract Start Date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Total Videos"
          type="number"
          value={totalVideoCount}
          onChange={(e) => setTotalVideoCount(e.target.value)}
          placeholder="96"
          min="1"
          required
        />

        <Input
          label="Number of Payments"
          type="number"
          value={numberOfPayments}
          onChange={(e) => setNumberOfPayments(e.target.value)}
          placeholder="8"
          min="1"
          required
        />
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg text-sm text-gray-300">
        <h4 className="font-semibold mb-2">Payment Info:</h4>
        <ul className="space-y-1">
          <li>• Payment Cycle: Weekly</li>
          <li>
            • Videos per Payment:{' '}
            {totalVideoCount && numberOfPayments
              ? Math.ceil(Number(totalVideoCount) / Number(numberOfPayments))
              : 'N/A'}
          </li>
          <li>
            • Amount per Payment:{' '}
            {contractAmount && numberOfPayments
              ? `$${(Number(contractAmount) / Number(numberOfPayments)).toFixed(2)}`
              : 'N/A'}
          </li>
        </ul>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        disabled={isSubmitting}
        className="w-full"
      >
        Add Profile
      </Button>
    </form>
  );
};
