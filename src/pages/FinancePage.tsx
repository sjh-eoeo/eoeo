import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { usePaymentStore } from '../store/usePaymentStore';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { formatCurrency } from '../lib/utils/currency';
import { useStorage } from '../hooks/useStorage';
import { Tutorial } from '../components/ui/Tutorial';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useTableState } from '../hooks/useTableState';
import type { Payment } from '../types';

interface FinanceRecord {
  id: string;
  paymentDate: string;
  userId: string;
  amount: number;
  invoiceFilePath?: string;
  brand: string;
}

const columnHelper = createColumnHelper<FinanceRecord>();

export const FinancePage: React.FC = () => {
  const { appUser } = useAuthStore();
  const { payments } = usePaymentStore();
  const { getFileURL } = useStorage();
  
  // Date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Check if user has finance or admin role
  if (!appUser || (appUser.role !== 'admin' && appUser.role !== 'finance')) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 p-8 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-red-400 text-6xl">🚫</div>
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-gray-400">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Finance page is restricted to admin and finance roles only.
          </p>
        </div>
      </div>
    );
  }

  // Prepare finance records (통합 - 브랜드 구분 없음)
  const financeRecords = useMemo(() => {
    return payments.map((payment) => {
      return {
        id: payment.id,
        paymentDate: payment.paymentDate,
        userId: payment.tiktokId,
        amount: payment.amount,
        invoiceFilePath: payment.invoiceFilePath,
        brand: payment.brand,
      };
    });
  }, [payments]);

  // Filter by date range
  const filteredRecords = useMemo(() => {
    if (!startDate && !endDate) return financeRecords;

    return financeRecords.filter((record) => {
      const recordDate = new Date(record.paymentDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && recordDate < start) return false;
      if (end && recordDate > end) return false;
      return true;
    });
  }, [financeRecords, startDate, endDate]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Payment Date', 'User ID', 'Brand', 'Amount', 'Invoice File'];
    const rows = filteredRecords.map((record) => [
      record.paymentDate,
      record.userId,
      record.brand,
      record.amount.toString(),
      record.invoiceFilePath || 'No file',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `finance_records_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Table columns
  const columns = [
    columnHelper.accessor('paymentDate', {
      header: 'Payment Date',
      cell: (info) => (
        <div className="text-sm text-white">
          {new Date(info.getValue()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      ),
    }),
    columnHelper.accessor('userId', {
      header: 'User ID',
      cell: (info) => (
        <div className="text-sm text-cyan-400 font-medium">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor('brand', {
      header: 'Brand',
      cell: (info) => (
        <div className="text-sm text-purple-400 font-medium uppercase">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: (info) => (
        <div className="text-sm text-green-400 font-semibold">
          {formatCurrency(info.getValue())}
        </div>
      ),
    }),
    columnHelper.accessor('invoiceFilePath', {
      header: 'Invoice File',
      cell: (info) => {
        const filePath = info.getValue();
        
        const handleViewFile = async () => {
          if (!filePath) return;
          try {
            const url = await getFileURL(filePath);
            window.open(url, '_blank');
          } catch (error) {
            console.error('Failed to get file URL:', error);
            alert('Failed to open file');
          }
        };
        
        return filePath ? (
          <button
            onClick={handleViewFile}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
          >
            View File
          </button>
        ) : (
          <span className="text-xs text-gray-500">No file</span>
        );
      },
    }),
  ];

  const { pagination, sorting } = useTableState({ initialPageSize: 20 });

  const table = useReactTable({
    data: filteredRecords,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination, sorting },
  });

  // Summary statistics
  const totalAmount = filteredRecords.reduce((sum, record) => sum + record.amount, 0);
  const recordsWithInvoices = filteredRecords.filter((r) => r.invoiceFilePath).length;

  return (
    <>
      <Tutorial page="finance" />
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Finance Records
            </h2>
            <p className="text-sm text-gray-400">
              View and export payment records for financial tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
            >
              📥 Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Payments</h3>
          <p className="text-3xl font-bold text-white">
            {filteredRecords.length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Amount</h3>
          <p className="text-3xl font-bold text-green-400">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Records with Invoice</h3>
          <p className="text-3xl font-bold text-cyan-400">
            {recordsWithInvoices}
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Filter by Date Range
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-400 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-400 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Finance Records Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Payment Records
        </h3>
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <DataTable
            table={table}
            emptyMessage="No payment records found."
          />
        </div>
      </div>
      </div>
    </>
  );
};
