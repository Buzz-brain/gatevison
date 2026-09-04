export function formatClock(iso: string): string {
  const t = iso?.trim() ?? "";
  // Backend historically emits naive UTC ISO strings (no offset). Treat
  // naive timestamps as UTC so they convert correctly to local time.
  const normalized = /(z|[+-]\d{2}:\d{2})$/i.test(t) ? t : `${t}Z`;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
