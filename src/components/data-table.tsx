import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  emptyText?: string;
  rowKey: (row: T) => string;
  onRefresh?: () => void | Promise<unknown>;
  loading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  search,
  onSearchChange,
  searchPlaceholder,
  toolbar,
  emptyText,
  rowKey,
  onRefresh,
  loading,
}: DataTableProps<T>) {
  const [refreshing, setRefreshing] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  ).filter(
    (value) =>
      value === 1 || value === totalPages || Math.abs(value - page) <= 1
  );

  // Adapt the simple Column<T> shape to react-table column defs. Server-side
  // pagination stays fully controlled by the page/total props.
  const tableColumns = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((col, i) => ({
        id: String(i),
        header: () => col.header,
        cell: ({ row }) => col.cell(row.original),
        meta: { className: col.className },
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
    getRowId: (row) => rowKey(row),
  });

  async function handleRefresh() {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  const showHeader = onSearchChange || toolbar || onRefresh;
  const busy = refreshing || loading;

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex flex-wrap items-center gap-2">
          {onSearchChange && (
            <div className="relative min-w-0 flex-1 sm:max-w-sm sm:flex-none">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
              <Input
                value={search || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={
                  searchPlaceholder || m['common.search.placeholder']()
                }
                className="h-9 pl-8"
              />
            </div>
          )}
          {toolbar}
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              className="ml-auto size-9"
              onClick={handleRefresh}
              disabled={busy}
              aria-label={m['common.table.refresh']()}
            >
              <RefreshCw className={cn('size-4', busy && 'animate-spin')} />
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      (header.column.columnDef.meta as { className?: string })
                        ?.className
                    }
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground py-8 text-center"
                >
                  {emptyText || m['common.table.no_data']()}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        (cell.column.columnDef.meta as { className?: string })
                          ?.className
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-2">
        <p className="text-muted-foreground text-center text-sm sm:text-left">
          {m['common.table.total']({ count: total })}
        </p>
        {total > pageSize && (
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="icon-lg"
              className="size-10"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label={m['common.table.previous']()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-muted-foreground min-w-20 text-center text-sm tabular-nums sm:hidden">
              {page} / {totalPages}
            </span>
            <div className="hidden items-center gap-2 sm:flex">
              {pageNumbers.map((pageNumber, index) => {
                const previous = pageNumbers[index - 1];
                return (
                  <div key={pageNumber} className="flex items-center gap-2">
                    {previous && pageNumber - previous > 1 ? (
                      <span className="text-muted-foreground px-1">…</span>
                    ) : null}
                    <Button
                      variant={pageNumber === page ? 'default' : 'outline'}
                      size="icon-sm"
                      onClick={() => onPageChange(pageNumber)}
                      aria-label={m['common.table.page_info']({
                        current: pageNumber,
                        total: totalPages,
                      })}
                      aria-current={pageNumber === page ? 'page' : undefined}
                    >
                      {pageNumber}
                    </Button>
                  </div>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="icon-lg"
              className="size-10"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label={m['common.table.next']()}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
