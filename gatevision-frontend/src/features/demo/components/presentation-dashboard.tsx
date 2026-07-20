import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2, Shield, Car, Users, Activity, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateMetricsTick } from "../utils";
import type { MetricsSnapshot } from "../types";

const SLIDES = [
  { id: "overview", label: "System Overview", bg: "from-slate-900 via-primary/5 to-slate-900" },
  { id: "traffic", label: "Traffic Analytics", bg: "from-slate-900 via-info/5 to-slate-900" },
  { id: "security", label: "Security Status", bg: "from-slate-900 via-danger/5 to-slate-900" },
  { id: "performance", label: "Performance", bg: "from-slate-900 via-success/5 to-slate-900" },
];

export function PresentationDashboard() {
  const prefersReduced = useReducedMotion();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [metrics, setMetrics] = useState<MetricsSnapshot>(generateMetricsTick());

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setMetrics((prev) => generateMetricsTick(prev));
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const slide = SLIDES[currentSlide];

  const statCards = useMemo(() => [
    { label: "Total Entries", value: metrics.entries, icon: ArrowDownRight, color: "text-success", bg: "bg-success/10" },
    { label: "Total Exits", value: metrics.exits, icon: ArrowUpRight, color: "text-info", bg: "bg-info/10" },
    { label: "Denied", value: metrics.denied, icon: Shield, color: "text-danger", bg: "bg-danger/10" },
    { label: "Manual Reviews", value: metrics.manualReviews, icon: Users, color: "text-warning", bg: "bg-warning/10" },
    { label: "Incidents", value: metrics.incidents, icon: Activity, color: "text-danger", bg: "bg-danger/10" },
    { label: "Avg Processing", value: `${(metrics.avgProcessingTime / 1000).toFixed(1)}s`, icon: Clock, color: "text-primary", bg: "bg-primary/10" },
  ], [metrics]);

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-[500] bg-background p-8" : ""}`}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Fullscreen presentation dashboard optimized for projectors and large displays.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-16 text-center">{slide!.label}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setIsPlaying((p) => !p)}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={prefersReduced ? {} : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4 }}
          className={`min-h-[60vh] rounded-2xl bg-gradient-to-br ${slide!.bg} border border-border/50 p-8 flex flex-col items-center justify-center`}
        >
          {currentSlide === 0 && (
            <div className="text-center space-y-8 max-w-4xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 10 }}
              >
                <Monitor className="h-24 w-24 text-primary mx-auto" />
              </motion.div>
              <div>
                <h1 className="text-6xl font-bold tracking-tight">GateVision</h1>
                <p className="text-2xl text-muted-foreground mt-4">AI Vehicle Access Control System</p>
              </div>
              <div className="grid grid-cols-3 gap-6 w-full max-w-2xl mx-auto">
                {statCards.slice(0, 3).map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-center"
                    >
                      <p className="text-5xl font-bold font-mono tracking-tight">{stat.value}</p>
                      <p className="text-lg text-muted-foreground mt-2">{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>
              <Badge variant="success" className="text-base px-4 py-1.5">All Systems Operational</Badge>
            </div>
          )}

          {currentSlide === 1 && (
            <div className="text-center space-y-8 max-w-4xl">
              <h2 className="text-5xl font-bold">Traffic Analytics</h2>
              <div className="grid grid-cols-2 gap-8 w-full max-w-2xl mx-auto">
                <motion.div className="p-6 rounded-xl bg-background/20 backdrop-blur-sm">
                  <p className="text-6xl font-bold font-mono text-success">{metrics.entries}</p>
                  <p className="text-xl text-muted-foreground mt-2">Entries Today</p>
                  <p className="text-sm text-success mt-1">▲ 12.3% vs yesterday</p>
                </motion.div>
                <motion.div className="p-6 rounded-xl bg-background/20 backdrop-blur-sm">
                  <p className="text-6xl font-bold font-mono text-info">{metrics.exits}</p>
                  <p className="text-xl text-muted-foreground mt-2">Exits Today</p>
                  <p className="text-sm text-info mt-1">▲ 8.7% vs yesterday</p>
                </motion.div>
              </div>
              <p className="text-xl text-muted-foreground/70">Throughput: {metrics.throughput} vehicles/min</p>
            </div>
          )}

          {currentSlide === 2 && (
            <div className="text-center space-y-8 max-w-4xl">
              <h2 className="text-5xl font-bold">Security Status</h2>
              <div className="grid grid-cols-3 gap-6 w-full max-w-3xl mx-auto">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-6 rounded-xl bg-danger/10"
                >
                  <p className="text-6xl font-bold font-mono text-danger">{metrics.denied}</p>
                  <p className="text-lg text-muted-foreground mt-1">Denied</p>
                </motion.div>
                <motion.div className="p-6 rounded-xl bg-warning/10">
                  <p className="text-6xl font-bold font-mono text-warning">{metrics.manualReviews}</p>
                  <p className="text-lg text-muted-foreground mt-1">Reviews</p>
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="p-6 rounded-xl bg-danger/10"
                >
                  <p className="text-6xl font-bold font-mono text-danger">{metrics.incidents}</p>
                  <p className="text-lg text-muted-foreground mt-1">Incidents</p>
                </motion.div>
              </div>
              <Badge variant="success" className="text-base px-4 py-1.5">
                Security Score: {(100 - metrics.incidents * 5 - metrics.denied).toFixed(0)}%
              </Badge>
            </div>
          )}

          {currentSlide === 3 && (
            <div className="text-center space-y-8 max-w-4xl">
              <h2 className="text-5xl font-bold">System Performance</h2>
              <div className="grid grid-cols-2 gap-8 w-full max-w-2xl mx-auto">
                <motion.div className="p-6 rounded-xl bg-background/20 backdrop-blur-sm">
                  <p className="text-6xl font-bold font-mono text-primary">{metrics.avgProcessingTime}</p>
                  <p className="text-xl text-muted-foreground mt-2">Avg Processing (ms)</p>
                </motion.div>
                <motion.div className="p-6 rounded-xl bg-background/20 backdrop-blur-sm">
                  <p className="text-6xl font-bold font-mono text-success">{metrics.throughput}</p>
                  <p className="text-xl text-muted-foreground mt-2">Throughput (veh/min)</p>
                </motion.div>
              </div>
              <Badge variant="info" className="text-base px-4 py-1.5">
                Uptime: 99.97% · 0 Critical Alerts
              </Badge>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Slide indicator */}
      <div className="flex justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentSlide(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentSlide ? "w-8 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
