import { useState } from 'react';
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';

interface UseTableStateOptions {
  initialSorting?: SortingState;
  initialFilters?: ColumnFiltersState;
  initialVisibility?: VisibilityState;
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

  return {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    rowSelection,
    setRowSelection,
  };
}

interface CreateTableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  state: ReturnType<typeof useTableState>;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableRowSelection?: boolean;
  getRowId?: (row: TData, index: number) => string;
}

export function createTable<TData>({
  data,
  columns,
  state,
  enableSorting = true,
  enableFiltering = true,
  enableRowSelection = false,
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
    },
    onSortingChange: state.setSorting,
    onColumnFiltersChange: state.setColumnFilters,
    onColumnVisibilityChange: state.setColumnVisibility,
    onRowSelectionChange: state.setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    enableRowSelection,
    enableMultiRowSelection: true,
    getRowId,
  });
}
