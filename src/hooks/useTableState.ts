import { useState } from 'react';
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

interface UseTableStateOptions {
  initialSorting?: SortingState;
  initialFilters?: ColumnFiltersState;
  initialVisibility?: VisibilityState;
  initialPageSize?: number;
}

export function useTableState(options: UseTableStateOptions = {}) {
  const [sorting, setSorting] = useState<SortingState>(
    options.initialSorting || []
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    options.initialFilters || []
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    options.initialVisibility || {}
  );
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: options.initialPageSize || 20,
  });

  return {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    rowSelection,
    setRowSelection,
    pagination,
    setPagination,
  };
}

interface CreateTableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  state: ReturnType<typeof useTableState>;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  getRowId?: (row: TData, index: number) => string;
}

export function createTable<TData>({
  data,
  columns,
  state,
  enableSorting = true,
  enableFiltering = true,
  enableRowSelection = false,
  enablePagination = true,
  getRowId,
}: CreateTableOptions<TData>) {
  return useReactTable({
    data,
    columns,
    state: {
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      columnVisibility: state.columnVisibility,
      rowSelection: state.rowSelection,
      pagination: state.pagination,
    },
    onSortingChange: state.setSorting,
    onColumnFiltersChange: state.setColumnFilters,
    onColumnVisibilityChange: state.setColumnVisibility,
    onRowSelectionChange: state.setRowSelection,
    onPaginationChange: state.setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    enableRowSelection,
    enableMultiRowSelection: true,
    getRowId,
  });
}
