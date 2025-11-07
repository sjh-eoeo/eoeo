import React, { useMemo } from 'react';
import { useNegotiationProjectStore } from '../../store/useNegotiationProjectStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
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

export const PaymentPendingPage: React.FC = () => {
  const { projects } = useNegotiationProjectStore();

  // 결제 대기 상태인 프로젝트만 필터링
  const paymentPendingProjects = useMemo(() => {
    return projects.filter((p) => 
      p.status === 'payment-pending' || 
      (p.status === 'published' && !p.payment?.paid)
    );
  }, [projects]);

  // 총 결제 대기 금액
  const totalPendingAmount = useMemo(() => {
    return paymentPendingProjects.reduce((sum, p) => {
      return sum + (p.agreement?.finalAmount || 0);
    }, 0);
  }, [paymentPendingProjects]);

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
    columnHelper.accessor('agreement', {
      header: 'Amount',
      cell: (info) => {
        const agreement = info.getValue();
        return agreement ? (
          <span className="text-sm font-semibold text-green-400">
            {formatCurrency(agreement.finalAmount)}
          </span>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        );
      },
    }),
    columnHelper.accessor('agreement.paymentMethod', {
      header: 'Payment Method',
      cell: (info) => {
        const method = info.getValue();
        return method ? (
          <Badge variant="default">{method}</Badge>
        ) : (
          <span className="text-xs text-gray-500">-</span>
        );
      },
    }),
    columnHelper.accessor('agreement.paymentInfo', {
      header: 'Payment Info',
      cell: (info) => {
        const info_text = info.getValue();
        return info_text ? (
          <span className="text-xs text-gray-300 font-mono">{info_text}</span>
        ) : (
          <span className="text-xs text-gray-500">-</span>
        );
      },
    }),
    columnHelper.accessor('publishedVideos', {
      header: 'Videos',
      cell: (info) => {
        const videos = info.getValue();
        return (
          <div className="flex flex-col gap-1">
            {videos.slice(0, 2).map((video, idx) => (
              <a
                key={idx}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 underline truncate max-w-xs"
              >
                {video.platform} - {new Date(video.publishedAt).toLocaleDateString()}
              </a>
            ))}
            {videos.length > 2 && (
              <span className="text-xs text-gray-500">+{videos.length - 2} more</span>
            )}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex gap-2">
          <Button size="sm" variant="success">
            Upload Invoice
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Payment Pending</h1>
        <div className="text-sm text-gray-400">
          Total Pending: <span className="text-green-400 font-semibold">{formatCurrency(totalPendingAmount)}</span>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Total Pending</div>
          <div className="text-2xl font-bold text-white">{paymentPendingProjects.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Total Amount</div>
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(totalPendingAmount)}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Payment Methods</div>
          <div className="text-sm text-gray-300 space-y-1">
            <div>
              PayPal: {paymentPendingProjects.filter((p) => p.agreement?.paymentMethod === 'PayPal').length}
            </div>
            <div>
              Bank: {paymentPendingProjects.filter((p) => p.agreement?.paymentMethod === 'Bank Transfer').length}
            </div>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-blue-400 text-lg">💡</span>
          <div>
            <h3 className="text-sm font-semibold text-blue-400 mb-1">Payment Instructions</h3>
            <p className="text-xs text-gray-300">
              1. 크리에이터의 결제 정보를 확인하세요.<br />
              2. PayPal 또는 은행 송금을 진행하세요.<br />
              3. 송금증을 업로드하면 자동으로 완료 처리됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <PaymentPendingTable projects={paymentPendingProjects} columns={columns} />
      </div>
    </div>
  );
};

const PaymentPendingTable: React.FC<{
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
