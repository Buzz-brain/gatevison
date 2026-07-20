import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface BulkImportProps {
  onClose: () => void;
  onImported: (count: number) => void;
}

const sampleRows = [
  { name: "Ada Okeke", dept: "Logistics", plate: "KJA-8842", status: "valid" },
  { name: "Tunde Bello", dept: "Security", plate: "KJA-1190", status: "valid" },
  { name: "Chidi Eze", dept: "Engineering", plate: "INVALID", status: "error" },
  { name: "Ngozi Ahmed", dept: "Admin", plate: "KJA-5521", status: "valid" },
];

function BulkImport({ onClose, onImported }: BulkImportProps) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [done, setDone] = useState(false);
  const prefersReduced = useReducedMotion();

  const runImport = () => {
    setParsing(true);
    setTimeout(() => { setParsing(false); setDone(true); }, 1400);
  };

  const validCount = sampleRows.filter((r) => r.status === "valid").length;

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md overflow-hidden p-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-medium">Bulk Driver Import</h3>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button>
        </div>

        {!done ? (
          <div className="py-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); runImport(); }}
              className={cn("flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors", dragging ? "border-primary bg-primary/5" : "border-border")}
            >
              <Upload className="h-8 w-8 text-muted-foreground/60" />
              <p className="mt-2 text-xs font-medium">Drop CSV or click to upload</p>
              <p className="text-[10px] text-muted-foreground/50">Columns: name, department, plate, model</p>
              <Button size="sm" className="mt-3" onClick={runImport} disabled={parsing}>
                {parsing ? "Parsing…" : "Load Sample Sheet"}
              </Button>
            </div>

            <div className="mt-3 rounded-lg bg-surface p-3">
              <p className="mb-2 text-[10px] font-medium text-muted-foreground/60">Preview ({sampleRows.length} rows)</p>
              <div className="space-y-1">
                {sampleRows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-elevated px-2 py-1 text-[10px]">
                    <span>{r.name} · {r.dept}</span>
                    <span className={cn("font-mono", r.status === "error" ? "text-danger" : "text-muted-foreground/60")}>{r.plate}</span>
                    {r.status === "error" ? <AlertTriangle className="h-3 w-3 text-danger" /> : <CheckCircle2 className="h-3 w-3 text-success" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </motion.div>
            <p className="mt-3 text-sm font-medium">Import Complete</p>
            <p className="text-[11px] text-muted-foreground/60">{validCount} drivers enrolled · 1 skipped</p>
            <Button size="sm" className="mt-4" onClick={() => { onImported(validCount); onClose(); }}>Done</Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export { BulkImport };
