import React, { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useProfileStore } from '../store/useProfileStore';
import { useVideoStore } from '../store/useVideoStore';
import { usePaymentStore } from '../store/usePaymentStore';
import { useBrandStore } from '../store/useBrandStore';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Modal } from '../components/ui/Modal';
import { Tutorial } from '../components/ui/Tutorial';
import { PaymentForm } from '../components/features/payments/PaymentForm';
import { useTableState, createTable } from '../hooks/useTableState';
import { useFirestore } from '../hooks/useFirestore';
import { useStorage } from '../hooks/useStorage';
import { usePaymentCalculation, getNextPaymentDate } from '../hooks/usePaymentCalculation';
import { formatCurrency } from '../lib/utils/currency';
import { getDaysUntil, getOverdueDays, getContractDuration } from '../lib/utils/date';
import type { Profile } from '../types';

type DueProfile = Profile & {
  nextPaymentDate: Date | null;
  amountDue: number;
};

export const PaymentsPage: React.FC = () => {
  const { profiles } = useProfileStore();
  const { videos } = useVideoStore();
  const { payments } = usePaymentStore();
  const { selectedBrand } = useBrandStore();
  const { addDocument, updateDocument } = useFirestore();
  const { uploadFile } = useStorage();

  const [dueSearchTerm, setDueSearchTerm] = useState('');
  const [overviewSearchTerm, setOverviewSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<DueProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate payment data
  const { paymentsByProfile, videoCountsByProfile, dueProfiles } =
    usePaymentCalculation(profiles, payments, videos);

  // Filter due profiles by search
  const filteredDueProfiles = useMemo(() => {
    if (!dueSearchTerm.trim()) return dueProfiles;
    const term = dueSearchTerm.toLowerCase();
    return dueProfiles.filter((p) => p.tiktokId.toLowerCase().includes(term));
  }, [dueProfiles, dueSearchTerm]);

  // Filter overview profiles by search only (show all profiles regardless of brand)
  const filteredOverviewProfiles = useMemo(() => {
    let result = [...profiles];

    // Filter by brand
    if (selectedBrand) {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    // Filter by search
    if (overviewSearchTerm.trim()) {
      const term = overviewSearchTerm.toLowerCase();
      result = result.filter((p) => p.tiktokId.toLowerCase().includes(term));
    }

    return result;
  }, [profiles, selectedBrand, overviewSearchTerm]);

  const handleAddPayment = async (data: {
    amount: number;
    paymentDate: string;
    invoiceFile: File | null;
  }) => {
    if (!selectedProfile) return;

    setIsSubmitting(true);

    try {
      let invoiceFileName: string | undefined;
      let invoiceFilePath: string | undefined;

      // Upload invoice if provided
      if (data.invoiceFile && selectedBrand) {
        const path = `${selectedBrand}/invoices/${selectedProfile.tiktokId}/${Date.now()}-${data.invoiceFile.name}`;
        const result = await uploadFile(path, data.invoiceFile);
        invoiceFileName = result.fileName;
        invoiceFilePath = result.filePath;
      }

      // Add payment document
      await addDocument('payments', {
        tiktokId: selectedProfile.tiktokId,
        brand: selectedProfile.brand,
        amount: data.amount,
        paymentDate: data.paymentDate,
        invoiceFileName,
        invoiceFilePath,
      });

      // Close modal
      setSelectedProfile(null);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error adding payment:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  // Due Profiles Table Columns
  const dueColumns = useMemo<ColumnDef<DueProfile>[]>(
    () => [
      {
        accessorKey: 'tiktokId',
        header: 'TikTok ID',
        cell: (info) => (
          <span className="font-medium text-white whitespace-nowrap">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        id: 'nextDue',
        header: 'Next Due',
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-semibold">
            {row.original.nextPaymentDate?.toISOString().split('T')[0] || 'N/A'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const overdue = getOverdueDays(row.original.nextPaymentDate);
          return (
            <span className={`font-bold ${overdue.color}`}>{overdue.text}</span>
          );
        },
      },
      {
        id: 'amountDue',
        header: 'Amount Due',
        cell: ({ row }) => (
          <span className="font-semibold text-base">
            {formatCurrency(row.original.amountDue)}
          </span>
        ),
      },
      {
        accessorKey: 'paymentInfo',
        header: 'Payment Info',
        cell: (info) => <span className="text-xs">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setSelectedProfile(row.original)}
          >
            + Add Payment
          </Button>
        ),
      },
    ],
    []
  );

  // Overview Table Columns
  const overviewColumns = useMemo<ColumnDef<Profile>[]>(
    () => [
      {
        accessorKey: 'tiktokId',
        header: 'TikTok ID',
        cell: (info) => (
          <span className="font-medium text-white whitespace-nowrap">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        id: 'videoCount',
        header: 'Videos',
        cell: ({ row }) => {
          const count = videoCountsByProfile.get(row.original.tiktokId) || 0;
          return <span className="font-semibold text-center block">{count}</span>;
        },
      },
      {
        id: 'duration',
        header: 'Since',
        cell: ({ row }) => getContractDuration(row.original.startDate),
      },
      {
        id: 'nextDue',
        header: 'Next Due',
        cell: ({ row }) => {
          const profilePayments = paymentsByProfile.get(row.original.tiktokId) || [];
          const lastPayment =
            profilePayments.length > 0
              ? [...profilePayments].sort(
                  (a, b) =>
                    new Date(b.paymentDate).getTime() -
                    new Date(a.paymentDate).getTime()
                )[0]
              : null;
          const nextDate = getNextPaymentDate(
            row.original,
            lastPayment,
            profilePayments.length
          );
          const daysUntil = getDaysUntil(nextDate);
          return <span className={`font-bold ${daysUntil.color}`}>{daysUntil.text}</span>;
        },
      },
      {
        accessorKey: 'paymentInfo',
        header: 'Payment Info',
        cell: (info) => <span className="text-xs">{info.getValue() as string || '-'}</span>,
      },
      {
        id: 'lastPayment',
        header: 'Last Payment',
        cell: ({ row }) => {
          const profilePayments = paymentsByProfile.get(row.original.tiktokId) || [];
          const lastPayment =
            profilePayments.length > 0
              ? [...profilePayments].sort(
                  (a, b) =>
                    new Date(b.paymentDate).getTime() -
                    new Date(a.paymentDate).getTime()
                )[0]
              : null;
          return lastPayment?.paymentDate || 'N/A';
        },
      },
    ],
    [videoCountsByProfile, paymentsByProfile]
  );

  const dueTableState = useTableState();
  const overviewTableState = useTableState();

  const dueTable = createTable({
    data: filteredDueProfiles,
    columns: dueColumns,
    state: dueTableState,
  });

  const overviewTable = createTable({
    data: filteredOverviewProfiles,
    columns: overviewColumns,
    state: overviewTableState,
  });

  return (
    <>
      <Tutorial page="payments" />
      <div className="space-y-8">
        {/* Payments Due Section */}
        <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">
            Action Required: Payments Due
          </h3>
          <SearchBar
            placeholder="Search TikTok ID..."
            value={dueSearchTerm}
            onChange={(e) => setDueSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <DataTable
            table={dueTable}
            emptyMessage="No payments are currently due."
          />
        </div>
      </div>

      {/* Payment Overview Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">
            Payment Status Overview
          </h3>
          <SearchBar
            placeholder="Search TikTok ID..."
            value={overviewSearchTerm}
            onChange={(e) => setOverviewSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <DataTable
            table={overviewTable}
            emptyMessage="No profiles found for the selected brand."
          />
        </div>
      </div>

      {/* Add Payment Modal */}
      {selectedProfile && (
        <Modal
          isOpen={!!selectedProfile}
          onClose={() => !isSubmitting && setSelectedProfile(null)}
          title={`Add Payment for ${selectedProfile.tiktokId}`}
          size="md"
        >
          <PaymentForm
            tiktokId={selectedProfile.tiktokId}
            suggestedAmount={selectedProfile.amountDue}
            paymentInfo={selectedProfile.paymentInfo}
            onSubmit={handleAddPayment}
          />
        </Modal>
      )}
      </div>
    </>
  );
};
