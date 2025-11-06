import React, { useState } from 'react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { toISODateString } from '../../../lib/utils/date';
import { formatCurrency } from '../../../lib/utils/currency';

interface PaymentFormProps {
  tiktokId: string;
  suggestedAmount: number;
  onSubmit: (data: {
    amount: number;
    paymentDate: string;
    invoiceFile: File | null;
  }) => Promise<void>;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  tiktokId,
  suggestedAmount,
  onSubmit,
}) => {
  const [amount, setAmount] = useState(String(suggestedAmount));
  const [paymentDate, setPaymentDate] = useState(toISODateString());
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    if (!paymentDate) {
      setError('Please select a payment date.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit({
        amount: parsedAmount,
        paymentDate,
        invoiceFile,
      });
    } catch (error) {
      console.error('Error submitting payment:', error);
      setError('Failed to add payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2">
      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-sm text-gray-400">Payment for</p>
        <p className="text-lg font-semibold text-white">{tiktokId}</p>
      </div>

      <Input
        label="Payment Amount ($)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        min="0"
        step="0.01"
        required
      />

      <div className="text-xs text-gray-400">
        Suggested: {formatCurrency(suggestedAmount)}
      </div>

      <Input
        label="Payment Date"
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
        max={toISODateString()}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Invoice Attachment (Optional)
        </label>
        <input
          type="file"
          onChange={(e) =>
            setInvoiceFile(e.target.files ? e.target.files[0] : null)
          }
          accept=".pdf,.jpg,.jpeg,.png"
          className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
        />
        {invoiceFile && (
          <p className="mt-2 text-xs text-gray-400">
            Selected: {invoiceFile.name}
          </p>
        )}
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
        {isSubmitting ? 'Adding Payment...' : 'Add Payment Record'}
      </Button>
    </form>
  );
};
