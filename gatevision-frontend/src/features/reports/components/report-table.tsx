import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Columns3,
  X,
} from "lucide-react";
import type { ReportDataset, ReportColumn, ReportRow } from "../types";

interface ReportTableProps {
  datasets: ReportDataset[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isLoading?: boolean;
  isError?: boolean;
}

type SortDir = "asc" | "desc" | null;

const PAGE_SIZES = [10, 25, 50, 100] as const;

function ReportTableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-4">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-4 flex-1 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ReportTableError() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load report data.</p>
      </div>
    </Card>
  );
}

function ReportTableEmpty() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available.</p>
      </div>
    </Card>
  );
}

export function ReportTable({
  datasets,
  activeTab: controlledTab,
  onTabChange,
  isLoading,
  isError,
}: ReportTableProps) {
  const [internalTab, setInternalTab] = useState(datasets[0]?.id ?? "");
  const activeTab = controlledTab ?? internalTab;

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set());
  const [showColToggle, setShowColToggle] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const dataset = useMemo(
    () => datasets.find((d) => d.id === activeTab) ?? datasets[0],
    [datasets, activeTab],
  );

  const columns = dataset?.columns ?? [];
  const rows = dataset?.rows ?? [];

  useEffect(() => {
    if (visibleCols.size === 0 && columns.length > 0) {
      setVisibleCols(new Set(columns.map((c) => c.key)));
    }
  }, [columns]);

  useEffect(() => {
    setPage(0);
    setSortKey(null);
    setSortDir(null);
    setSearch("");
  }, [activeTab]);

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val !== undefined && String(val).toLowerCase().includes(q);
      }),
    );
  }, [rows, columns, search]);

  const sortedRows = useMemo(() => {
    if (!sortKey || !sortDir) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;
      const cmp = typeof aVal === "number" && typeof bVal === "number"
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredRows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = page * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const displayColumns = useMemo(
    () => columns.filter((c) => visibleCols.has(c.key)),
    [columns, visibleCols],
  );

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDir === "asc") setSortDir("desc");
        else if (sortDir === "desc") {
          setSortKey(null);
          setSortDir(null);
        }
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey, sortDir],
  );

  const handleTabChange = useCallback(
    (id: string) => {
      setInternalTab(id);
      onTabChange?.(id);
    },
    [onTabChange],
  );

  const toggleColumn = useCallback((key: string) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (isLoading) return <ReportTableSkeleton />;
  if (isError) return <ReportTableError />;
  if (datasets.length === 0) return <ReportTableEmpty />;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        {datasets.map((ds) => (
          <Button
            key={ds.id}
            variant={ds.id === activeTab ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange(ds.id)}
          >
            {ds.tab}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter rows..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="h-8 w-full rounded-md border border-border bg-transparent pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(0);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColToggle((v) => !v)}
          >
            <Columns3 className="mr-1 h-3.5 w-3.5" />
            Columns
          </Button>
          {showColToggle && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-elevated p-2 shadow-lg">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={visibleCols.has(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-foreground">{col.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div ref={tableRef} className="overflow-x-auto" tabIndex={0}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {displayColumns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground hover:text-foreground",
                    col.numeric && "text-right",
                    col.align === "center" && "text-center",
                  )}
                  onClick={() => handleSort(col.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSort(col.key);
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={displayColumns.length || 1}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No matching rows.
                </td>
              </tr>
            ) : (
              pagedRows.map((row, i) => (
                <tr
                  key={(row["id"] as string) ?? i}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  {displayColumns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "whitespace-nowrap px-3 py-2 text-foreground",
                        col.numeric && "text-right tabular-nums",
                        col.align === "center" && "text-center",
                      )}
                    >
                      {row[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2">
        <p className="text-xs text-muted-foreground">
          {sortedRows.length} row{sortedRows.length !== 1 ? "s" : ""}
          {search ? " (filtered)" : ""}
        </p>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="h-7 rounded border border-border bg-transparent px-1 text-xs text-foreground"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} / page
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
