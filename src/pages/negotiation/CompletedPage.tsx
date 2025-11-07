import React, { useMemo, useState } from 'react';
import { useNegotiationProjectStore } from '../../store/useNegotiationProjectStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { formatCurrency } from '../../lib/utils/currency';
import { 
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { DataTable } from '../../components/ui/DataTable';
import { useTableState } from '../../hooks/useTableState';
import type { Project } from '../../types/negotiation';

const columnHelper = createColumnHelper<Project>();

export const CompletedPage: React.FC = () => {
  const { projects } = useNegotiationProjectStore();
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // 완료된 프로젝트만 필터링
  const completedProjects = useMemo(() => {
    let filtered = projects.filter((p) => p.status === 'completed');

    // 브랜드 필터
    if (brandFilter !== 'all') {
      filtered = filtered.filter((p) => p.category.brand === brandFilter);
    }

    // 날짜 필터
    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((p) => 
        p.completedAt && new Date(p.completedAt) >= cutoffDate
      );
    }

    return filtered.sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [projects, brandFilter, dateRange]);

  // 총 수익
  const totalEarnings = useMemo(() => {
    return completedProjects.reduce((sum, p) => {
      return sum + (p.payment?.amount || 0);
    }, 0);
  }, [completedProjects]);

  const columns = [
    columnHelper.accessor('creatorName', {
      header: 'Creator',
      cell: (info) => (
        <span className="text-sm font-medium text-white">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('category.brand', {
      header: 'Brand',
      cell: (info) => <Badge variant="info">{info.getValue().toUpperCase()}</Badge>,
    }),
    columnHelper.accessor('category.projectName', {
      header: 'Project',
      cell: (info) => <span className="text-sm text-gray-300">{info.getValue()}</span>,
    }),
    columnHelper.accessor('payment', {
      header: 'Amount',
      cell: (info) => {
        const payment = info.getValue();
        return payment ? (
          <span className="text-sm font-semibold text-green-400">
            {formatCurrency(payment.amount)}
          </span>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        );
      },
    }),
    columnHelper.accessor('publishedVideos', {
      header: 'Videos',
      cell: (info) => {
        const videos = info.getValue();
        return (
          <div className="text-sm text-gray-300">
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </div>
        );
      },
    }),
    columnHelper.accessor('completedAt', {
      header: 'Completed',
      cell: (info) => {
        const date = info.getValue();
        return date ? (
          <span className="text-xs text-gray-400">
            {new Date(date).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-xs text-gray-500">-</span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary">
            View Details
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Completed Projects</h1>
        <div className="text-sm text-gray-400">
          Total: {completedProjects.length} | 
          <span className="text-green-400 ml-2">Earnings: {formatCurrency(totalEarnings)}</span>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Brand"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Brands' },
              { value: 'egongegong', label: 'EGONGEGONG' },
              { value: 'eoeo', label: 'EOEO' },
              { value: '10k', label: '10K' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Select
            label="Time Period"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: 'all', label: 'All Time' },
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
            ]}
          />
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Total Projects</div>
          <div className="text-2xl font-bold text-white">{completedProjects.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Total Earnings</div>
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(totalEarnings)}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Total Videos</div>
          <div className="text-2xl font-bold text-cyan-400">
            {completedProjects.reduce((sum, p) => sum + p.publishedVideos.length, 0)}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Avg. Amount</div>
          <div className="text-2xl font-bold text-purple-400">
            {completedProjects.length > 0 ? formatCurrency(totalEarnings / completedProjects.length) : '$0'}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <CompletedTable projects={completedProjects} columns={columns} />
      </div>
    </div>
  );
};

const CompletedTable: React.FC<{
  projects: Project[];
  columns: any[];
}> = ({ projects, columns }) => {
  const { pagination, sorting } = useTableState({ initialPageSize: 20 });

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination, sorting },
  });

  return <DataTable table={table} />;
};
