"use client";
import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface Column<T> {
  key:       keyof T | string;
  header:    string;
  render?:   (row: T) => ReactNode;
  sortable?: boolean;
  width?:    string;
  align?:    "left" | "center" | "right";
}

interface DataTableProps<T extends Record<string, unknown>> {
  data:       T[];
  columns:    Column<T>[];
  loading?:   boolean;
  emptyText?: string;
  onRowClick?:(row: T) => void;
  className?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  data, columns, loading, emptyText = "No data found.", onRowClick, className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey]   = useState<string | null>(null);
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("asc");

  function handleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey] as string | number;
    const bv = b[sortKey] as string | number;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-surface-200 bg-white", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-900">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-white tracking-wide uppercase select-none whitespace-nowrap",
                    col.align === "right"  && "text-right",
                    col.align === "center" && "text-center",
                    col.sortable && "cursor-pointer hover:bg-navy-800 transition-colors",
                  )}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      sortKey === String(col.key)
                        ? sortDir === "asc"
                          ? <ChevronUp className="w-3 h-3 opacity-90" />
                          : <ChevronDown className="w-3 h-3 opacity-90" />
                        : <ChevronsUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-surface-50"}>
                  {columns.map((col, ci) => (
                    <td key={ci} className="px-4 py-3">
                      <div className="skeleton h-4 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-surface-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              sorted.map((row, ri) => (
                <tr
                  key={ri}
                  className={cn(
                    "border-t border-surface-100 transition-colors",
                    ri % 2 === 0 ? "bg-white" : "bg-surface-50",
                    onRowClick && "cursor-pointer hover:bg-navy-50",
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "px-4 py-3 text-navy-950 align-middle",
                        col.align === "right"  && "text-right",
                        col.align === "center" && "text-center",
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[String(col.key)] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
