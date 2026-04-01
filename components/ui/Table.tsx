"use client";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export default function Table<T>({
  columns, data, keyExtractor, loading, emptyTitle, emptyMessage, onRowClick, className,
}: TableProps<T>) {
  return (
    <div className={cn("w-full overflow-auto rounded-2xl border border-surface-200", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-900">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  "text-left py-3 px-4 text-xs font-semibold text-white uppercase tracking-wider first:rounded-tl-2xl last:rounded-tr-2xl",
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-surface-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map(col => (
                  <td key={col.key} className="py-3 px-4">
                    <div className="h-4 bg-surface-200 rounded-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16 px-4 text-center">
                <p className="text-2xl mb-2">📋</p>
                <p className="font-medium text-navy-900">{emptyTitle || "No data found"}</p>
                {emptyMessage && <p className="text-sm text-surface-400 mt-1">{emptyMessage}</p>}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "transition-colors",
                  rowIdx % 2 === 1 && "bg-surface-50/50",
                  onRowClick && "cursor-pointer hover:bg-navy-50",
                )}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={cn("py-3 px-4 text-navy-900", col.className)}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
