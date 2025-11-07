import React, { useMemo, useState } from 'react';
import { useNegotiationProjectStore } from '../../store/useNegotiationProjectStore';
import { useCreatorStore } from '../../store/useCreatorStore';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useTableState } from '../../hooks/useTableState';
import type { Project } from '../../types/negotiation';

const columnHelper = createColumnHelper<Project>();

export const ResponseTrackingPage: React.FC = () => {
  const { projects } = useNegotiationProjectStore();
  const { creators } = useCreatorStore();

  // 메일 발송 상태인 프로젝트들만 필터링
  const emailSentProjects = useMemo(() => {
    return projects.filter((p) => 
      p.emailSent && 
      !['dropped-by-us', 'rejected-by-creator', 'completed'].includes(p.status)
    );
  }, [projects]);

  // 48시간 이상 업데이트 없는 프로젝트
  const needsAttentionProjects = useMemo(() => {
    return emailSentProjects.filter((p) => p.needsAttention);
  }, [emailSentProjects]);

  // 최근 업데이트 순으로 정렬
  const sortedProjects = useMemo(() => {
    return [...emailSentProjects].sort((a, b) => {
      return new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime();
    });
  }, [emailSentProjects]);

  const columns = [
    columnHelper.accessor('creatorName', {
      header: 'Creator',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{info.getValue()}</span>
          {info.row.original.needsAttention && (
            <span className="text-xs text-red-400">🚨</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('category.brand', {
      header: 'Brand',
      cell: (info) => (
        <Badge variant="info">{info.getValue().toUpperCase()}</Badge>
      ),
    }),
    columnHelper.accessor('category.projectName', {
      header: 'Project',
      cell: (info) => (
        <span className="text-sm text-gray-300">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('emailSentAt', {
      header: 'Email Sent',
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
    columnHelper.accessor('responseReceived', {
      header: 'Response',
      cell: (info) => {
        const received = info.getValue();
        const responseType = info.row.original.responseType;
        
        if (!received) {
          return <Badge variant="warning">No Response</Badge>;
        }
        
        if (responseType === 'interested') {
          return <Badge variant="success">✅ Interested</Badge>;
        } else if (responseType === 'rejected') {
          return <Badge variant="danger">❌ Rejected</Badge>;
        } else {
          return <Badge variant="info">💬 Negotiating</Badge>;
        }
      },
    }),
    columnHelper.accessor('lastUpdatedAt', {
      header: 'Last Update',
      cell: (info) => {
        const date = new Date(info.getValue());
        const now = new Date();
        const hoursDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        let color = 'text-gray-400';
        if (hoursDiff > 48) color = 'text-red-400';
        else if (hoursDiff > 24) color = 'text-yellow-400';
        else if (hoursDiff < 1) color = 'text-green-400';
        
        const timeStr = hoursDiff < 1 
          ? `${Math.floor((now.getTime() - date.getTime()) / (1000 * 60))}분 전`
          : hoursDiff < 24
          ? `${hoursDiff}시간 전`
          : `${Math.floor(hoursDiff / 24)}일 전`;
        
        return (
          <span className={`text-xs font-medium ${color}`}>
            {timeStr}
            {hoursDiff > 48 && ' 🚨'}
          </span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const statusLabels: Record<string, string> = {
          'email-sent': '📧 Email Sent',
          'response-received': '📬 Response Received',
          'negotiating': '💬 Negotiating',
          'agreed': '✅ Agreed',
        };
        return (
          <span className="text-xs text-gray-400">
            {statusLabels[status] || status}
          </span>
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
        <h1 className="text-3xl font-bold text-white">Response Tracking</h1>
        <div className="text-sm text-gray-400">
          Total: {emailSentProjects.length} | 
          <span className="text-red-400 ml-2">Needs Attention: {needsAttentionProjects.length}</span>
        </div>
      </div>

      {/* 알림: 48시간 넘은 항목 */}
      {needsAttentionProjects.length > 0 && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-400 text-lg">🚨</span>
            <h3 className="text-lg font-semibold text-red-400">
              Attention Required ({needsAttentionProjects.length})
            </h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            다음 프로젝트들이 48시간 이상 업데이트되지 않았습니다:
          </p>
          <div className="space-y-1">
            {needsAttentionProjects.slice(0, 5).map((project) => {
              const hoursSinceUpdate = Math.floor(
                (new Date().getTime() - new Date(project.lastUpdatedAt).getTime()) / (1000 * 60 * 60)
              );
              return (
                <div key={project.id} className="text-sm text-gray-300">
                  • <span className="text-white font-medium">{project.creatorName}</span> 
                  {' - '}{project.category.projectName}
                  {' '}
                  <span className="text-red-400">({Math.floor(hoursSinceUpdate / 24)}일 전)</span>
                </div>
              );
            })}
            {needsAttentionProjects.length > 5 && (
              <div className="text-xs text-gray-400 mt-2">
                ... and {needsAttentionProjects.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Total Emails Sent</div>
          <div className="text-2xl font-bold text-white">{emailSentProjects.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Responses Received</div>
          <div className="text-2xl font-bold text-green-400">
            {emailSentProjects.filter((p) => p.responseReceived).length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">No Response</div>
          <div className="text-2xl font-bold text-yellow-400">
            {emailSentProjects.filter((p) => !p.responseReceived).length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Needs Attention</div>
          <div className="text-2xl font-bold text-red-400">
            {needsAttentionProjects.length}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <ResponseTrackingTable projects={sortedProjects} columns={columns} />
      </div>
    </div>
  );
};

// 별도 테이블 컴포넌트
const ResponseTrackingTable: React.FC<{
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
