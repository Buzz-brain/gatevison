import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useActiveSessions, useTransactions, useEntryMutation, useExitMutation, useGateStatistics as useApiGateStats } from "./use-gate-operations-api";
import type {
  GateInfo, CameraFeed, QueueVehicle, ManualReviewItem, SessionInside,
  GateActivityEvent, MovingVehicle, DecisionFlow, DecisionKey, BarrierState,
  EmergencyAction, ReplayFrame, GateHealth,
} from "../types";
import type { ApiGateInfo } from "../api/types";

const DECISION_STAGES: DecisionKey[] = [
  "recognition", "decision", "barrier_opening", "vehicle_passing", "session_created",
];

function mapApiGateToGateInfo(g: ApiGateInfo, index: number): GateInfo {
  const gateNames = ["North Gate", "South Gate", "Visitor Gate", "VIP Gate", "Emergency Gate"];
  const gateMapPositions = [
    { x: 180, y: 70 },
    { x: 180, y: 230 },
    { x: 60, y: 150 },
    { x: 300, y: 150 },
    { x: 300, y: 290 },
  ];
  const pos = gateMapPositions[index] ?? { x: 180 + index * 30, y: 150 + index * 20 };

  return {
    id: g.id,
    name: g.name ?? gateNames[index] ?? `Gate ${index + 1}`,
    status: (g.status === "open" || g.status === "closed" || g.status === "processing" || g.status === "blocked" || g.status === "maintenance" ? g.status : "closed") as GateInfo["status"],
    mode: "normal" as const,
    queue: 0,
    officer: g.operator ?? "Auto",
    currentPlate: g.current_vehicle,
    throughput: (g.entries_today ?? 0) + (g.exits_today ?? 0),
    health: {
      camera: "healthy" as const, barrier: "healthy" as const,
      network: g.connection === "online" ? "healthy" as const : g.connection === "degraded" ? "degraded" as const : "offline" as const,
      ai: "healthy" as const, rfid: "healthy" as const, power: "healthy" as const,
    },
    map: pos,
  };
}

export interface GateOperationsApi {
  gates: GateInfo[];
  cameras: CameraFeed[];
  queue: QueueVehicle[];
  manualReviews: ManualReviewItem[];
  sessions: SessionInside[];
  activity: GateActivityEvent[];
  movingVehicles: MovingVehicle[];
  decisionFlow: DecisionFlow | null;
  barrier: BarrierState;
  selectedGateId: string;
  selectGate: (id: string) => void;
  triggerDecision: () => void;
  resolveManualReview: (id: string, status: "approved" | "rejected") => void;
  emergencyAction: (action: EmergencyAction, gateId: string) => void;
  reorderQueue: (id: string, dir: -1 | 1) => void;
  replay: { frames: ReplayFrame[]; playing: boolean; index: number };
  replayPlay: () => void;
  replayPause: () => void;
  replayRestart: () => void;
  replayStep: (dir: 1 | -1) => void;
  // Loading/error/retry state for UI
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetchAll: () => void;
  // Workflow state
  workflowResult: string | null;
  workflowLoading: boolean;
}

let frameCounter = 0;

function buildReplayFramesFromTransactions(items: any[]): ReplayFrame[] {
  return items.slice(0, 10).map((t: any) => {
    frameCounter++;
    return {
      id: `rf-${frameCounter}`,
      label: `${t.type === "entry" ? "Vehicle Entry" : "Vehicle Exit"}`,
      detail: `${t.plate} — ${t.decision} via ${t.gate_name ?? t.gate}`,
      timestamp: t.timestamp,
    };
  });
}

function useGateOperationsImpl(): GateOperationsApi {
  const [selectedGateId, setSelectedGateId] = useState("gate-north");
  const [decisionFlow, setDecisionFlow] = useState<DecisionFlow | null>(null);
  const [barrier, setBarrier] = useState<BarrierState>("closed");
  const [workflowResult, setWorkflowResult] = useState<string | null>(null);
  const [replay, setReplay] = useState<{ frames: ReplayFrame[]; playing: boolean; index: number }>({
    frames: [], playing: false, index: 0,
  });
  const replayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSessions = useActiveSessions();
  const transactions = useTransactions();
  const gateStats = useApiGateStats();
  const entryMutation = useEntryMutation();
  const exitMutation = useExitMutation();

  // Map API gate data to UI gate info
  const gates = useMemo<GateInfo[]>(() => {
    const apiGates = activeSessions.data?.gates ?? gateStats.data?.gates ?? [];
    if (apiGates.length === 0) return [];
    return apiGates.map(mapApiGateToGateInfo);
  }, [activeSessions.data, gateStats.data]);

  // Generate cameras from gates
  const cameras = useMemo<CameraFeed[]>(() => {
    if (gates.length === 0) return [];
    return gates.flatMap((g) => [
      {
        id: `cam-${g.id}-in`, gateId: g.id, label: `${g.name} — Inbound`,
        status: g.health.network === "healthy" ? "live" as const : "offline" as const,
        fps: g.health.network === "healthy" ? 30 : 0, recording: true, aiActive: true,
        currentPlate: g.currentPlate, vehicleWaiting: false,
      },
      {
        id: `cam-${g.id}-out`, gateId: g.id, label: `${g.name} — Outbound`,
        status: g.health.network === "healthy" ? "live" as const : "offline" as const,
        fps: g.health.network === "healthy" ? 30 : 0, recording: true, aiActive: false,
        currentPlate: undefined, vehicleWaiting: false,
      },
    ]);
  }, [gates]);

  // Empty queue for now (no dedicated queue endpoint)
  const queue: QueueVehicle[] = useMemo(() => [], []);

  // Manual reviews derived from transactions
  const manualReviews = useMemo<ManualReviewItem[]>(() => {
    const items = transactions.data?.items ?? [];
    return items
      .filter((t) => t.decision === "manual_review")
      .slice(0, 5)
      .map((t, i) => ({
        id: `mr-${i}-${t.id}`,
        plate: t.plate,
        driver: t.driver ?? "Unknown",
        confidence: t.confidence ?? 0,
        referenceLabel: `Registered: ${t.vehicle ?? "Unknown"} (${t.gateName})`,
        liveLabel: `Live: ${t.plate}`,
        differences: ["Confidence below threshold"],
        status: "pending" as const,
        notes: "",
      }));
  }, [transactions.data]);

  // Active sessions
  const sessions = useMemo<SessionInside[]>(() => {
    const act = activeSessions.data?.activeVehicles ?? [];
    if (act.length === 0) {
      // Fallback: derive from gate current vehicles
      return gates
        .filter((g) => g.currentPlate)
        .map((g, i) => ({
          id: `s-${g.id}`,
          plate: g.currentPlate ?? "",
          entryTime: new Date(Date.now() - (i + 1) * 600000).toISOString(),
          gate: g.name,
          status: "parked" as const,
          durationMs: (i + 1) * 600000,
        }));
    }
    return act.map((v) => ({
      id: v.id,
      plate: v.plate,
      entryTime: v.entryTime,
      gate: v.gate,
      status: v.status as SessionInside["status"],
      durationMs: v.durationMs,
    }));
  }, [activeSessions.data, gates]);

  // Activity feed from transactions
  const activity = useMemo<GateActivityEvent[]>(() => {
    const items = transactions.data?.items ?? [];
    return items.slice(0, 20).map((t) => {
      const kind = t.type === "entry"
        ? (t.decision === "granted" ? "entered" as const : "alert" as const)
        : (t.decision === "granted" ? "exited" as const : "alert" as const);
      return {
        id: `act-${t.id}`,
        time: new Date(t.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        timestamp: t.timestamp,
        label: `${t.type === "entry" ? "Entry" : "Exit"} — ${t.plate} (${t.decision})`,
        gate: t.gateName,
        kind,
      };
    });
  }, [transactions.data]);

  // Moving vehicles from active sessions
  const movingVehicles = useMemo<MovingVehicle[]>(() => {
    return sessions.slice(0, 6).map((s, i) => ({
      id: `mv-${s.id}`,
      plate: s.plate,
      fromNode: "entrance",
      toNode: ["n-gate", "s-gate", "v-gate", "vip-gate", "parking-a", "parking-b"][i % 6] ?? "parking-a",
      progress: Math.min(1, (Date.now() - new Date(s.entryTime).getTime()) / 300000 % 1),
      status: "granted" as const,
    }));
  }, [sessions]);

  const selectGate = useCallback((id: string) => setSelectedGateId(id), []);

  // Workflow: trigger entry
  const triggerDecision = useCallback(() => {
    const plate = `VEH-${String(Date.now()).slice(-6)}`;
    setDecisionFlow({
      plate, driver: "Processing...", confidence: 0, result: "granted", activeStage: "recognition",
    });
    setBarrier("raising");
    setWorkflowResult("Processing entry...");

    entryMutation.mutate(
      { plate, gate_id: selectedGateId, driver: "Auto" },
      {
        onSuccess: (res) => {
          setDecisionFlow({
            plate: res.plate, driver: "System", confidence: 98.5,
            result: res.decision, activeStage: "session_created",
          });
          setBarrier(res.barrier_state as BarrierState);
          setWorkflowResult(res.message);
          setTimeout(() => setBarrier("closed"), 2000);
        },
        onError: () => {
          setDecisionFlow((prev) => prev ? { ...prev, result: "denied", activeStage: null } : prev);
          setBarrier("closed");
          setWorkflowResult("Entry failed — gate unavailable");
        },
      },
    );

    DECISION_STAGES.forEach((stage, i) => {
      setTimeout(() => {
        setDecisionFlow((prev) => prev ? { ...prev, activeStage: stage } : prev);
      }, (i + 1) * 800);
    });
  }, [selectedGateId, entryMutation]);

  const resolveManualReview = useCallback((id: string, status: "approved" | "rejected") => {
    // No backend endpoint for manual review resolution yet
  }, []);

  const emergencyAction = useCallback((_action: EmergencyAction, _gateId: string) => {
    // No backend endpoint for emergency actions yet
  }, []);

  const reorderQueue = useCallback((_id: string, _dir: -1 | 1) => {
    // No backend queue management yet
  }, []);

  // Replay controls
  const replayPlay = useCallback(() => {
    setReplay((r) => {
      if (r.frames.length === 0) {
        const txFrames = buildReplayFramesFromTransactions(transactions.data?.items ?? []);
        if (txFrames.length === 0) return r;
        return { frames: txFrames, playing: true, index: 0 };
      }
      return { ...r, playing: true };
    });
  }, [transactions.data]);

  useEffect(() => {
    if (replay.playing && replay.frames.length > 0) {
      if (replayTimer.current) clearInterval(replayTimer.current);
      replayTimer.current = setInterval(() => {
        setReplay((r) => {
          if (r.index >= r.frames.length - 1) {
            if (replayTimer.current) clearInterval(replayTimer.current);
            return { ...r, playing: false };
          }
          return { ...r, index: r.index + 1 };
        });
      }, 1400);
    }
    return () => { if (replayTimer.current) clearInterval(replayTimer.current); };
  }, [replay.playing, replay.frames.length]);

  // Update replay frames when transactions change (if not playing)
  useEffect(() => {
    if (!replay.playing && transactions.data?.items) {
      const frames = buildReplayFramesFromTransactions(transactions.data.items);
      if (frames.length > 0 && replay.frames.length === 0) {
        setReplay((r) => ({ ...r, frames }));
      }
    }
  }, [transactions.data, replay.playing]);

  const replayPause = useCallback(() => {
    if (replayTimer.current) clearInterval(replayTimer.current);
    setReplay((r) => ({ ...r, playing: false }));
  }, []);

  const replayRestart = useCallback(() => {
    setReplay((r) => {
      const frames = buildReplayFramesFromTransactions(transactions.data?.items ?? []);
      return { frames, index: 0, playing: true };
    });
  }, [transactions.data]);

  const replayStep = useCallback((dir: 1 | -1) => {
    if (replayTimer.current) clearInterval(replayTimer.current);
    setReplay((r) => {
      const frames = r.frames.length > 0 ? r.frames : buildReplayFramesFromTransactions(transactions.data?.items ?? []);
      return { frames, playing: false, index: Math.max(0, Math.min(frames.length - 1, r.index + dir)) };
    });
  }, [transactions.data]);

  useEffect(() => () => {
    if (replayTimer.current) clearInterval(replayTimer.current);
  }, []);

  const isLoading = activeSessions.isLoading || transactions.isLoading || gateStats.isLoading;
  const isError = activeSessions.isError || transactions.isError || gateStats.isError;
  const errorMessage = activeSessions.error?.message ?? transactions.error?.message ?? gateStats.error?.message ?? null;

  const refetchAll = useCallback(() => {
    activeSessions.refetch();
    transactions.refetch();
    gateStats.refetch();
  }, [activeSessions, transactions, gateStats]);

  const workflowLoading = entryMutation.isPending;

  return {
    gates, cameras, queue, manualReviews, sessions, activity, movingVehicles,
    decisionFlow, barrier, selectedGateId, selectGate, triggerDecision,
    resolveManualReview, emergencyAction, reorderQueue,
    replay, replayPlay, replayPause, replayRestart, replayStep,
    isLoading, isError, errorMessage, refetchAll,
    workflowResult, workflowLoading,
  };
}

export { useGateOperationsImpl as useGateOperations };
