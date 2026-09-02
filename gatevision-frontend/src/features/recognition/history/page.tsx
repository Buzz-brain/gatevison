import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageContainer, SectionHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { History, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { HistoryTable } from "../components/history-table";
import { useRecognitionHistory, useDeleteHistoryEntry, useClearHistory } from "../hooks/use-recognition-api";
import type { RecognitionHistoryEntry } from "../types";

const PAGE_SIZE = 50;

function RecognitionHistoryPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const addNotification = useUIStore((s) => s.addNotification);

  const { data, isFetching, isError, refetch } = useRecognitionHistory(page);
  const deleteHistoryMutation = useDeleteHistoryEntry();
  const clearHistoryMutation = useClearHistory();

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const goToPage = (next: number) => {
    const clamped = Math.max(1, Math.min(next, Math.max(1, totalPages)));
    setPage(clamped);
  };

  const handleReplay = (entry: RecognitionHistoryEntry) => {
    navigate({ to: "/recognition" });
  };

  return (
    <PageContainer className="space-y-6 pb-10">
      <SectionHeader
        title="Recognition History"
        description="Review past recognition runs, decisions and gate actions. Replay a result or delete records."
        action={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <History className="h-4 w-4" />
            <span>{total} record(s)</span>
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </div>
        }
      />

      {isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-danger/20 bg-danger/5 p-10 text-center">
          <p className="text-sm font-medium text-danger">Failed to load recognition history</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <HistoryTable
          entries={entries}
          onReplay={handleReplay}
          onDelete={(entry) => {
            deleteHistoryMutation.mutate(entry.id, {
              onSuccess: () => {
                addNotification({
                  type: "success",
                  category: "recognition",
                  title: "Entry deleted",
                  description: `${entry.plate} removed from recognition history.`,
                });
              },
              onError: (err) => {
                const message = (err as { message?: string })?.message || "Could not delete the history entry.";
                addNotification({
                  type: "error",
                  category: "recognition",
                  title: "Delete failed",
                  description: message,
                });
              },
            });
          }}
          onClear={() => {
            clearHistoryMutation.mutate(undefined, {
              onSuccess: (result) => {
                addNotification({
                  type: "success",
                  category: "recognition",
                  title: "History cleared",
                  description: `Removed ${result.deleted_records ?? 0} history record(s) from the database.`,
                });
              },
              onError: (err) => {
                const message = (err as { message?: string })?.message || "Could not clear history.";
                addNotification({
                  type: "error",
                  category: "recognition",
                  title: "Clear failed",
                  description: message,
                });
              },
            });
          }}
          isDeleting={deleteHistoryMutation.isPending}
          isClearing={clearHistoryMutation.isPending}
        />
      )}

      {!isError && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => goToPage(page - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isFetching}
              onClick={() => goToPage(page + 1)}
              className="gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export { RecognitionHistoryPage };