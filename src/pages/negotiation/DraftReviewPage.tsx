import React, { useMemo } from 'react';
import { useNegotiationProjectStore } from '../../store/useNegotiationProjectStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
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

export const DraftReviewPage: React.FC = () => {
  const { projects } = useNegotiationProjectStore();

  // Draft 관련 상태인 프로젝트만 필터링
  const draftProjects = useMemo(() => {
    return projects.filter((p) => 
      ['in-production', 'draft-submitted', 'under-review', 'revision-requested', 'approved'].includes(p.status)
    );
  }, [projects]);

  // 업데이트 순 정렬 (새 댓글/Draft 업로드 우선)
  const sortedProjects = useMemo(() => {
    return [...draftProjects].sort((a, b) => {
      // unread comments가 있는 것 우선
      if (a.unreadCommentCount > 0 && b.unreadCommentCount === 0) return -1;
      if (a.unreadCommentCount === 0 && b.unreadCommentCount > 0) return 1;
      
      // 최근 업데이트 순
      return new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime();
    });
  }, [draftProjects]);

  // 새 업데이트가 있는 프로젝트
  const recentlyUpdated = useMemo(() => {
    const now = new Date();
    return sortedProjects.filter((p) => {
      const hoursSinceUpdate = (now.getTime() - new Date(p.lastUpdatedAt).getTime()) / (1000 * 60 * 60);
      return hoursSinceUpdate < 1 || p.unreadCommentCount > 0;
    });
  }, [sortedProjects]);

  const columns = [
    columnHelper.accessor('creatorName', {
      header: 'Creator',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{info.getValue()}</span>
          {info.row.original.unreadCommentCount > 0 && (
            <Badge variant="danger">{info.row.original.unreadCommentCount} new</Badge>
          )}
        </div>
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
    columnHelper.accessor('draftCount', {
      header: 'Drafts',
      cell: (info) => {
        const count = info.getValue();
        const version = info.row.original.latestDraftVersion;
        return (
          <div className="text-sm">
            <span className="text-white font-medium">{count}</span>
            {version && <span className="text-gray-400 ml-1">(v{version})</span>}
          </div>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const statusConfig: Record<string, { label: string; variant: any }> = {
          'in-production': { label: '🎬 제작 중', variant: 'warning' },
          'draft-submitted': { label: '📹 Draft 제출', variant: 'info' },
          'under-review': { label: '👀 리뷰 중', variant: 'info' },
          'revision-requested': { label: '✏️ 수정 요청', variant: 'warning' },
          'approved': { label: '✅ 승인됨', variant: 'success' },
        };
        const config = statusConfig[status] || { label: status, variant: 'default' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    }),
    columnHelper.accessor('lastUpdatedAt', {
      header: 'Last Update',
      cell: (info) => {
        const date = new Date(info.getValue());
        const now = new Date();
        const minutesDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        let timeStr = '';
        let color = 'text-gray-400';
        
        if (minutesDiff < 60) {
          timeStr = `${minutesDiff}분 전`;
          color = 'text-green-400';
        } else if (minutesDiff < 1440) {
          timeStr = `${Math.floor(minutesDiff / 60)}시간 전`;
          color = minutesDiff < 180 ? 'text-green-400' : 'text-gray-400';
        } else {
          timeStr = `${Math.floor(minutesDiff / 1440)}일 전`;
        }
        
        return <span className={`text-xs font-medium ${color}`}>{timeStr}</span>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex gap-2">
          <Button size="sm" variant="primary">
            Review
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Draft Review</h1>
        <div className="text-sm text-gray-400">
          Total: {draftProjects.length} | 
          <span className="text-green-400 ml-2">Recent Updates: {recentlyUpdated.length}</span>
        </div>
      </div>

      {/* 새 업데이트 알림 */}
      {recentlyUpdated.length > 0 && (
        <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-400 text-lg">⭐</span>
            <h3 className="text-lg font-semibold text-green-400">
              Recent Updates ({recentlyUpdated.length})
            </h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            다음 프로젝트들에 새로운 업데이트가 있습니다:
          </p>
          <div className="space-y-1">
            {recentlyUpdated.slice(0, 5).map((project) => {
              const minutesSince = Math.floor(
                (new Date().getTime() - new Date(project.lastUpdatedAt).getTime()) / (1000 * 60)
              );
              return (
                <div key={project.id} className="text-sm text-gray-300">
                  • <span className="text-white font-medium">{project.creatorName}</span>
                  {' - '}{project.category.projectName}
                  {project.unreadCommentCount > 0 && (
                    <span className="text-green-400 ml-2">💬 {project.unreadCommentCount} new comments</span>
                  )}
                  <span className="text-gray-400 ml-2">
                    ({minutesSince < 60 ? `${minutesSince}분 전` : `${Math.floor(minutesSince / 60)}시간 전`})
                  </span>
                </div>
              );
            })}
            {recentlyUpdated.length > 5 && (
              <div className="text-xs text-gray-400 mt-2">
                ... and {recentlyUpdated.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">제작 중</div>
          <div className="text-2xl font-bold text-yellow-400">
            {draftProjects.filter((p) => p.status === 'in-production').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Draft 제출</div>
          <div className="text-2xl font-bold text-cyan-400">
            {draftProjects.filter((p) => p.status === 'draft-submitted').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">리뷰 중</div>
          <div className="text-2xl font-bold text-blue-400">
            {draftProjects.filter((p) => p.status === 'under-review').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">수정 요청</div>
          <div className="text-2xl font-bold text-orange-400">
            {draftProjects.filter((p) => p.status === 'revision-requested').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">승인됨</div>
          <div className="text-2xl font-bold text-green-400">
            {draftProjects.filter((p) => p.status === 'approved').length}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <DraftReviewTable projects={sortedProjects} columns={columns} />
      </div>
    </div>
  );
};

const DraftReviewTable: React.FC<{
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
