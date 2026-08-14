import { useState, useCallback, useMemo, useRef } from "react";
import { useUIStore } from "@/store/ui-store";
import { useActiveSessions, useEntryMutation, useExitMutation } from "./use-gate-operations-api";
import type {
  GateInfo, SessionInside, DecisionFlow, DecisionKey,
} from "../types";
import { STATIC_GATES } from "../constants";
import { mapActiveVehicle } from "../api/mapper";

const ENTRY_STAGES: DecisionKey[] = [
  "recognition", "decision", "barrier_opening", "vehicle_passing", "session_created",
];

const EXIT_STAGES: DecisionKey[] = [
  "session_matching", "verification", "barrier_opening", "vehicle_passing", "session_closed",
];

export interface GateOperationsApi {
  gates: GateInfo[];
  sessions: SessionInside[];
  decisionFlow: DecisionFlow | null;
  triggerDecision: () => void;
  triggerExit: () => void;
  // Loading/error/retry state for UI
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetchAll: () => void;
}

function useGateOperationsImpl(): GateOperationsApi {
  const [decisionFlow, setDecisionFlow] = useState<DecisionFlow | null>(null);
  const lastEntryPlate = useRef<string | null>(null);

  const addNotification = useUIStore((s) => s.addNotification);

  const activeSessions = useActiveSessions();
  const entryMutation = useEntryMutation();
  const exitMutation = useExitMutation();

  // Static gate topology with live session overlay
  const gates = useMemo<GateInfo[]>(() => STATIC_GATES, []);

  // Active sessions (vehicles currently INSIDE)
  const sessions = useMemo<SessionInside[]>(() => {
    const raw = activeSessions.data?.sessions ?? [];
    const inside = raw.filter((s) => s.current_state === "INSIDE");
    if (inside.length > 0) {
      return inside.map((s) => {
        const v = mapActiveVehicle(s);
        return {
          id: v.id,
          plate: v.plate,
          entryTime: v.entryTime,
          gate: v.gate,
          status: v.status as SessionInside["status"],
          durationMs: v.durationMs,
        };
      });
    }
    return [];
  }, [activeSessions.data]);

  // Workflow: create entry session
  const triggerDecision = useCallback(() => {
    const plate = `VEH-${String(Date.now()).slice(-6)}`;
    setDecisionFlow({
      plate, driver: "Processing...", confidence: 0, result: "granted", activeStage: "recognition", mode: "entry",
    });

    entryMutation.mutate(
      { plate, gate_name: "North Gate" },
      {
        onSuccess: (res) => {
          const stage: DecisionKey = res.success ? "session_created" : "decision";
          if (res.success) lastEntryPlate.current = plate;
          setDecisionFlow({
            plate, driver: "System", confidence: 98.5,
            result: res.success ? "granted" : "denied", activeStage: stage, mode: "entry",
          });
          if (res.success) {
            addNotification({
              type: "success",
              category: "recognition",
              title: "Entry session created",
              description: `${plate} admitted at North Gate`,
            });
          } else {
            addNotification({
              type: "warning",
              category: "security",
              title: "Entry denied",
              description: res.message ?? "Access denied for this vehicle",
            });
          }
        },
        onError: () => {
          setDecisionFlow((prev) => prev ? { ...prev, result: "denied", activeStage: null } : prev);
          addNotification({
            type: "error",
            category: "system",
            title: "Unable to create entry session",
            description: "Recognition is unavailable. Please try another image or check camera connectivity.",
          });
        },
      },
    );

    ENTRY_STAGES.forEach((stage, i) => {
      setTimeout(() => {
        setDecisionFlow((prev) => prev ? { ...prev, activeStage: stage } : prev);
      }, (i + 1) * 800);
    });
  }, [entryMutation]);

  // Workflow: validate exit session
  const triggerExit = useCallback(() => {
    const plate = lastEntryPlate.current ?? `VEH-${String(Date.now()).slice(-6)}`;
    setDecisionFlow({
      plate, driver: "Matching...", confidence: 0, result: "granted", activeStage: "session_matching", mode: "exit",
    });

    exitMutation.mutate(
      { plate, gate_name: "North Gate" },
      {
        onSuccess: (res) => {
          const matched = res.success && res.match?.matched;
          const stage: DecisionKey = matched ? "session_closed" : "verification";
          if (matched) lastEntryPlate.current = null;
          setDecisionFlow({
            plate, driver: "System", confidence: matched ? (res.match?.score ?? 0.98) * 100 : 40,
            result: matched ? "granted" : "manual_review", activeStage: stage, mode: "exit",
          });
          if (matched) {
            addNotification({
              type: "success",
              category: "system",
              title: "Session closed",
              description: `${plate} exited North Gate`,
            });
          } else {
            addNotification({
              type: "warning",
              category: "security",
              title: "No matching session",
              description: `${plate} has no active entry session. Review manually or check the plate.`,
            });
          }
        },
        onError: () => {
          setDecisionFlow((prev) => prev ? { ...prev, result: "manual_review", activeStage: null } : prev);
          addNotification({
            type: "error",
            category: "system",
            title: "Exit verification failed",
            description: "Unable to match an active entry session. Please try exit verification again.",
          });
        },
      },
    );

    EXIT_STAGES.forEach((stage, i) => {
      setTimeout(() => {
        setDecisionFlow((prev) => prev ? { ...prev, activeStage: stage } : prev);
      }, (i + 1) * 800);
    });
  }, [exitMutation]);

  const isLoading = activeSessions.isLoading;
  const isError = activeSessions.isError;
  const errorMessage = activeSessions.error?.message ?? null;

  const refetchAll = useCallback(() => {
    activeSessions.refetch();
  }, [activeSessions]);

  return {
    gates, sessions,
    decisionFlow, triggerDecision, triggerExit,
    isLoading, isError, errorMessage, refetchAll,
  };
}

export { useGateOperationsImpl as useGateOperations };
