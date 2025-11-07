import React, { useState } from 'react';
import { useSeedingBrandStore } from '../../store/useSeedingBrandStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useTableState } from '../../hooks/useTableState';
import type { Brand } from '../../types/seeding';

const columnHelper = createColumnHelper<Brand>();

/**
 * Seeding System - Admin Page
 * 
 * 브랜드 관리 및 시스템 설정
 */
export function SeedingAdminPage() {
  const { brands, addBrand, deleteBrand } = useSeedingBrandStore();
  
  // 모달 상태
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  
  // 브랜드 폼 상태
  const [newBrand, setNewBrand] = useState({ name: '', description: '' });

  // 브랜드 테이블 컬럼
  const columns = React.useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Brand Name',
      cell: (info) => (
        <span className="font-medium text-white">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: (info) => (
        <span className="text-gray-400">{info.getValue() || '-'}</span>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created At',
      cell: (info) => (
        <span className="text-gray-400">
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            if (confirm(`브랜드 "${info.row.original.name}"을(를) 삭제하시겠습니까?`)) {
              deleteBrand(info.row.original.id);
            }
          }}
        >
          삭제
        </Button>
      ),
    }),
  ], [deleteBrand]);

  const tableState = useTableState({
    initialSorting: [{ id: 'createdAt', desc: true }],
  });

  const table = useReactTable({
    data: brands,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: tableState.sorting,
      pagination: tableState.pagination,
    },
    onSortingChange: tableState.setSorting,
    onPaginationChange: tableState.setPagination,
  });

  // 브랜드 추가
  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.name) {
      alert('브랜드명을 입력하세요.');
      return;
    }

    const brand: Brand = {
      id: `brand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newBrand.name,
      description: newBrand.description || undefined,
      createdAt: new Date().toISOString(),
    };

    addBrand(brand);
    setIsAddBrandModalOpen(false);
    setNewBrand({ name: '', description: '' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          시스템 관리
        </h1>
        <p className="text-gray-400">
          브랜드 관리 및 시스템 설정
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-2">총 브랜드 수</div>
          <div className="text-3xl font-bold text-white">{brands.length}</div>
        </div>
      </div>

      {/* 브랜드 관리 섹션 */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">브랜드 관리</h2>
          <Button onClick={() => setIsAddBrandModalOpen(true)}>
            브랜드 추가
          </Button>
        </div>

        {/* 브랜드 테이블 */}
        <DataTable table={table} />
      </div>

      {/* 브랜드 추가 모달 */}
      <Modal
        isOpen={isAddBrandModalOpen}
        onClose={() => {
          setIsAddBrandModalOpen(false);
          setNewBrand({ name: '', description: '' });
        }}
        title="브랜드 추가"
      >
        <form onSubmit={handleAddBrand} className="space-y-4">
          <Input
            label="브랜드명 *"
            value={newBrand.name}
            onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
            placeholder="브랜드명 입력"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              설명
            </label>
            <textarea
              value={newBrand.description}
              onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="브랜드 설명 (선택)"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddBrandModalOpen(false);
                setNewBrand({ name: '', description: '' });
              }}
            >
              취소
            </Button>
            <Button type="submit">추가</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
