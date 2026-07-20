import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "../hooks/use-dashboard-api";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const tooltipStyle = {
  contentStyle: {
    background: "hsl(225, 30%, 12%)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#f8fafc",
  },
  itemStyle: { fontSize: "11px" },
  labelStyle: { fontWeight: 600, marginBottom: "4px" },
};

function AnalyticsCharts() {
  const [loaded, setLoaded] = useState(false);
  const prefersReduced = useReducedMotion();
  const { data: analytics, isLoading, isError, refetch } = useAnalytics();

  useEffect(() => { if (!isLoading) setLoaded(true); }, [isLoading]);

  const hourlyFlow = analytics?.hourlyFlow ?? [];
  const accuracyData = analytics?.accuracyPerCamera ?? [];
  const decisionDist = analytics?.decisionDistribution ?? [];
  const trafficTrend = analytics?.trafficTrend ?? [];
  const decisionData = decisionDist.length > 0
    ? decisionDist
    : [{ name: "Granted", value: 0, color: "#22C55E" }, { name: "Denied", value: 0, color: "#EF4444" }, { name: "Manual Review", value: 0, color: "#F59E0B" }];

  if (isLoading && !loaded) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[260px] rounded-xl sm:col-span-2" />
        <Skeleton className="h-[260px] rounded-xl" />
        <Skeleton className="h-[240px] rounded-xl sm:col-span-2" />
        <Skeleton className="h-[240px] rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-xs text-muted-foreground">Failed to load analytics data</p>
        <button onClick={() => refetch()} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="p-4 sm:col-span-2">
        <h3 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Hourly Vehicle Flow</h3>
        {!loaded ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyFlow}>
              <defs>
                <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="total" name="Total" stroke="#3B82F6" strokeWidth={2} fill="url(#flowGradient)" animationBegin={0} animationDuration={prefersReduced ? 0 : 800} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Access Decisions</h3>
        {!loaded ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={decisionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={prefersReduced ? 0 : 800}
              >
                {decisionData.map((entry: any) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="flex justify-center gap-4 mt-2">
          {decisionData.map((d: any) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[10px] text-muted-foreground">{d.name}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:col-span-2">
        <h3 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Recognition Accuracy Per Camera</h3>
        {!loaded ? (
          <Skeleton className="h-[180px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={accuracyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[90, 100]} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="camera" type="category" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} animationBegin={0} animationDuration={prefersReduced ? 0 : 800}>
                {accuracyData.map((entry: any) => (
                  <Cell key={entry.camera} fill={entry.accuracy > 98 ? "#22C55E" : entry.accuracy > 95 ? "#3B82F6" : "#F59E0B"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Traffic Trend</h3>
        {!loaded ? (
          <Skeleton className="h-[180px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyFlow.slice(-6)}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="entries" stroke="#22C55E" strokeWidth={2} fill="url(#trendGradient)" animationBegin={0} animationDuration={prefersReduced ? 0 : 800} />
              <Area type="monotone" dataKey="exits" stroke="#3B82F6" strokeWidth={2} fill="none" strokeDasharray="4 4" animationBegin={0} animationDuration={prefersReduced ? 0 : 800} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

export { AnalyticsCharts };
