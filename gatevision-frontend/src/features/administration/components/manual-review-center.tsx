import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusPill } from "@/components/ui/status-pill";
import type { ManualReview, ReviewDecision } from "../types";
import { REVIEW_CONFIG, timeAgo } from "../utils";

const FILTER_TABS = ["all", "pending", "approved", "rejected", "escalated"] as const;

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return "bg-success";
  if (confidence >= 50) return "bg-warning";
  return "bg-danger";
}

function confidenceVariant(confidence: number): "success" | "warning" | "danger" {
  if (confidence >= 80) return "success";
  if (confidence >= 50) return "warning";
  return "danger";
}

function ReviewCard({
  review,
  onUpdate,
  reducedMotion,
  index,
}: {
  review: ManualReview;
  onUpdate: (id: string, status: ReviewDecision, notes?: string) => void;
  reducedMotion: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(review.notes ?? "");
  const [animConfidence, setAnimConfidence] = useState(0);
  const barRef = useRef<HTMLDivElement | null>(null);

  // Animate confidence on mount
  useMemo(() => {
    const timer = setTimeout(() => setAnimConfidence(review.confidence), 100 + index * 60);
    return () => clearTimeout(timer);
  }, [review.confidence, index]);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className={cn(
          "transition-all duration-200 hover:shadow-md",
          review.status === "pending" && "border-warning/30"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-surface to-elevated border border-border flex items-center justify-center">
                <span className="text-lg font-bold font-mono tracking-wider text-foreground">
                  {review.plate}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold truncate">{review.driverName}</h4>
                <StatusPill
                  status={review.status === "pending" ? "pending" : review.status === "approved" ? "success" : review.status === "rejected" ? "denied" : "warning"}
                  label={REVIEW_CONFIG[review.status].label}
                />
              </div>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{review.reason}</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Confidence</span>
                    <span className={cn("text-xs font-semibold", `text-${confidenceVariant(review.confidence)}`)}>
                      {review.confidence}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface overflow-hidden" ref={barRef}>
                    <motion.div
                      className={cn("h-full rounded-full", confidenceColor(review.confidence))}
                      initial={{ width: 0 }}
                      animate={{ width: `${animConfidence}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px]">{timeAgo(review.timestamp)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              {review.status === "pending" && (
                <>
                  <Button
                    variant="success"
                    size="xs"
                    onClick={() => onUpdate(review.id, "approved")}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => onUpdate(review.id, "rejected")}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                  <Button
                    variant="warning"
                    size="xs"
                    onClick={() => setExpanded(!expanded)}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Escalate
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Review Notes
                    </label>
                    <Textarea
                      placeholder="Add notes about this review..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                  {review.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => {
                          onUpdate(review.id, "escalated", notes || undefined);
                          setExpanded(false);
                        }}
                      >
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                        Escalate with Notes
                      </Button>
                    </div>
                  )}
                  {review.reviewer && (
                    <p className="text-[10px] text-muted-foreground">
                      Reviewed by: {review.reviewer}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ManualReviewCenter({
  reviews,
  onUpdate,
}: {
  reviews: ManualReview[];
  onUpdate: (id: string, status: ReviewDecision, notes?: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const reducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    let result = reviews;
    if (activeTab !== "all") {
      result = result.filter((r) => r.status === activeTab);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.plate.toLowerCase().includes(term) ||
          r.driverName.toLowerCase().includes(term)
      );
    }
    return result;
  }, [reviews, activeTab, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reviews.length, pending: 0, approved: 0, rejected: 0, escalated: 0 };
    for (const r of reviews) {
      c[r.status] = (c[r.status] ?? 0) + 1;
    }
    return c;
  }, [reviews]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Manual Review Queue</CardTitle>
            <Badge variant="warning">{counts.pending} pending</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search by plate or driver name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              {FILTER_TABS.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  active={activeTab === tab}
                  className="relative"
                >
                  <span className="capitalize">{tab}</span>
                  {(counts[tab] ?? 0) > 0 && (
                    <span className="ml-1.5 text-[10px] opacity-70">({counts[tab] ?? 0})</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <ScrollArea className="max-h-[600px]">
        <div className="space-y-3 pr-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((review, i) => (
              <ReviewCard
                key={review.id}
                review={review}
                onUpdate={onUpdate}
                reducedMotion={reducedMotion}
                index={i}
              />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Filter className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No reviews match your criteria.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
