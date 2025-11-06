import React, { useState } from 'react';
import { useProfileStore } from '../../../store/useProfileStore';
import { useBrandStore } from '../../../store/useBrandStore';
import { useFirestore } from '../../../hooks/useFirestore';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { toISODateString } from '../../../lib/utils/date';

interface ProfileFormProps {
  onSuccess?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess }) => {
  const { profiles } = useProfileStore();
  const { selectedBrand } = useBrandStore();
  const { setDocument } = useFirestore();

  const [tiktokIdInput, setTiktokIdInput] = useState('');
  const [tiktokId, setTiktokId] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [startDate, setStartDate] = useState(toISODateString());
  const [totalVideoCount, setTotalVideoCount] = useState('96');
  const [numberOfPayments, setNumberOfPayments] = useState('8');
  const [paymentMethod, setPaymentMethod] = useState<'bank-transfer' | 'paypal'>('bank-transfer');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [paypalInfo, setPaypalInfo] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateProfile, setDuplicateProfile] = useState<any>(null);

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

    if (!selectedBrand) {
      setError('Please select a brand first.');
      return;
    }

    // Check for duplicate within the same brand
    const existing = profiles.find(
      (p) => p.tiktokId === tiktokId.trim() && p.brand === selectedBrand
    );
    if (existing) {
      setDuplicateProfile(existing);
      setShowDuplicateModal(true);
      return;
    }

    setError('');
    await saveProfile();
  };

  const saveProfile = async () => {
    setIsSubmitting(true);

    const amount = Number(contractAmount);
    const videoCount = Number(totalVideoCount);
    const paymentCount = Number(numberOfPayments);

    // Generate payment info string
    let paymentInfoText = '';
    if (paymentMethod === 'bank-transfer') {
      paymentInfoText = `Bank: ${bankName} | Account: ${accountNumber}`;
    } else if (paymentMethod === 'paypal') {
      paymentInfoText = `PayPal: ${paypalInfo}`;
    }

    try {
      await setDocument('profiles', `${selectedBrand}_${tiktokId.trim()}`, {
        tiktokId: tiktokId.trim(),
        brand: selectedBrand,
        contractAmount: amount || 0,
        startDate,
        endDate: '',
        totalVideoCount: videoCount,
        paymentCycle: 'weekly' as const,
        numberOfPayments: paymentCount,
        paymentMethod,
        paymentInfo: paymentInfoText,
      });

      // Reset form
      setTiktokIdInput('');
      setTiktokId('');
      setContractAmount('');
      setStartDate(toISODateString());
      setTotalVideoCount('96');
      setNumberOfPayments('8');
      setPaymentMethod('bank-transfer');
      setBankName('');
      setAccountNumber('');
      setPaypalInfo('');

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

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Payment Method
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="bank-transfer"
              checked={paymentMethod === 'bank-transfer'}
              onChange={(e) => setPaymentMethod(e.target.value as 'bank-transfer' | 'paypal')}
              className="w-4 h-4 text-cyan-500 bg-gray-900 border-gray-600 focus:ring-cyan-500"
            />
            <span className="text-sm text-gray-300">Bank Transfer (입금)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="paypal"
              checked={paymentMethod === 'paypal'}
              onChange={(e) => setPaymentMethod(e.target.value as 'bank-transfer' | 'paypal')}
              className="w-4 h-4 text-cyan-500 bg-gray-900 border-gray-600 focus:ring-cyan-500"
            />
            <span className="text-sm text-gray-300">PayPal</span>
          </label>
        </div>
      </div>

      {paymentMethod === 'bank-transfer' ? (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Bank Name (은행명)"
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="e.g., Bank of America"
          />
          <Input
            label="Account Number (계좌번호)"
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="e.g., 1234567890"
          />
        </div>
      ) : (
        <Input
          label="PayPal Information"
          type="text"
          value={paypalInfo}
          onChange={(e) => setPaypalInfo(e.target.value)}
          placeholder="e.g., email@example.com"
        />
      )}

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

      {/* Duplicate Warning Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setDuplicateProfile(null);
        }}
        title="Duplicate Profile Detected"
        size="md"
      >
        <div className="space-y-4 p-2">
          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-4">
            <p className="text-yellow-300 font-medium mb-2">
              A profile with this TikTok ID already exists:
            </p>
            <div className="bg-gray-800 rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">TikTok ID:</span>
                <span className="text-white font-medium">{duplicateProfile?.tiktokId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Contract Amount:</span>
                <span className="text-white">${duplicateProfile?.contractAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Start Date:</span>
                <span className="text-white">{duplicateProfile?.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Videos:</span>
                <span className="text-white">{duplicateProfile?.totalVideoCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Number of Payments:</span>
                <span className="text-white">{duplicateProfile?.numberOfPayments}</span>
              </div>
            </div>
          </div>

          <p className="text-gray-300 text-sm">
            Do you want to overwrite this profile with the new data?
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setShowDuplicateModal(false);
                setDuplicateProfile(null);
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
                setDuplicateProfile(null);
                await saveProfile();
              }}
              className="flex-1"
            >
              Overwrite
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
};
