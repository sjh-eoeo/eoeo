import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeedingReachOutStore } from '../../store/useSeedingReachOutStore';
import { useSeedingProjectStore } from '../../store/useSeedingProjectStore';
import { useSeedingCreatorStore } from '../../store/useSeedingCreatorStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Select } from '../../components/ui/Select';
import { createColumnHelper, useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table';
import { useTableState } from '../../hooks/useTableState';
import type { ReachOut } from '../../types/seeding';

const columnHelper = createColumnHelper<ReachOut>();

export function SeedingReachOutPage() {
  const [searchParams] = useSearchParams();
  const { reachOuts, addReachOut, setResponseStatus } = useSeedingReachOutStore();
  const { projects } = useSeedingProjectStore();
  const { creators } = useSeedingCreatorStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // URL 쿼리 파라미터에서 프로젝트 ID 가져오기
  useEffect(() => {
    const projectIdFromQuery = searchParams.get('project');
    if (projectIdFromQuery) {
      setSelectedProjectId(projectIdFromQuery);
      
      // 해당 프로젝트의 크리에이터들에게 자동으로 reach-out 생성
      const project = projects.find(p => p.id === projectIdFromQuery);
      if (project) {
        project.selectedCreators.forEach(creatorId => {
          const creator = creators.find(c => c.id === creatorId);
          if (creator) {
            // 이미 존재하는 reach-out인지 확인
            const existingReachOut = reachOuts.find(
              ro => ro.projectId === projectIdFromQuery && ro.creatorId === creatorId
            );
            
            if (!existingReachOut) {
              addReachOut({
                id: `ro_${Date.now()}_${creatorId}`,
                projectId: projectIdFromQuery,
                creatorId: creatorId,
                creatorUserId: creator.userId,
                creatorEmail: creator.email,
                status: 'pending',
                reachOutDate: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        });
      }
    }
  }, [searchParams, projects, creators, reachOuts, addReachOut]);

  const filteredReachOuts = useMemo(() => {
    let filtered = reachOuts;
    
    // 프로젝트 필터
    if (selectedProjectId !== 'all') {
      filtered = filtered.filter(r => r.projectId === selectedProjectId);
    }
    
    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const project = projects.find(p => p.id === r.projectId);
        return (
          r.creatorUserId.toLowerCase().includes(query) ||
          r.creatorEmail.toLowerCase().includes(query) ||
          project?.name.toLowerCase().includes(query) ||
          project?.brandName.toLowerCase().includes(query)
        );
      });
    }
    
    return filtered;
  }, [reachOuts, selectedProjectId, searchQuery, projects]);

  const columns = useMemo(() => [
    columnHelper.accessor('projectId', {
      header: 'Project',
      cell: (info) => {
        const project = projects.find(p => p.id === info.getValue());
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{project?.name || 'Unknown'}</Badge>
          </div>
        );
      },
    }),
    columnHelper.accessor('creatorUserId', {
      header: 'Creator',
      cell: (info) => <span className="font-medium text-white">{info.getValue()}</span>,
    }),
    columnHelper.accessor('creatorEmail', {
      header: 'Email',
      cell: (info) => <span className="text-gray-400">{info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const colors = { pending: 'bg-yellow-600', interested: 'bg-green-600', declined: 'bg-red-600' };
        return <Badge className={colors[status]}>{status}</Badge>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setResponseStatus(info.row.original.id, 'interested')}>관심있음</Button>
          <Button size="sm" variant="danger" onClick={() => setResponseStatus(info.row.original.id, 'declined')}>거절</Button>
        </div>
      ),
    }),
  ], [setResponseStatus, projects]);

  const tableState = useTableState({
    initialSorting: [{ id: 'updatedAt', desc: true }],
  });
  const table = useReactTable({
    data: filteredReachOuts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting: tableState.sorting, pagination: tableState.pagination },
    onSortingChange: tableState.setSorting,
    onPaginationChange: tableState.setPagination,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Reach Out Management</h1>
        <p className="text-gray-400">크리에이터에게 연락한 내역을 관리합니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Total Reach Outs</div>
          <div className="text-3xl font-bold text-white">{reachOuts.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Filtered</div>
          <div className="text-3xl font-bold text-cyan-400">{filteredReachOuts.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Interested</div>
          <div className="text-3xl font-bold text-green-400">
            {reachOuts.filter(r => r.status === 'interested').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-400">
            {reachOuts.filter(r => r.status === 'pending').length}
          </div>
        </div>
      </div>
      
      {/* 필터 및 검색 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select
          label="프로젝트 선택"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          options={[
            { value: 'all', label: `전체 프로젝트 (${reachOuts.length})` },
            ...projects.map(p => ({ 
              value: p.id, 
              label: `${p.name} (${reachOuts.filter(r => r.projectId === p.id).length})` 
            })),
          ]}
        />
        
        <Input
          label="검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="크리에이터 User ID, Email, 프로젝트명, 브랜드명 검색..."
        />
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <DataTable table={table} />
      </div>
    </div>
  );
}
