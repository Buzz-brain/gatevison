import type { GateSession, GateTransaction, ActiveVehicle, MovementHistory } from "../types";
import type {
  ApiGateSession, ApiGateTransaction, ApiActiveVehicle, ApiVehicleMovement,
  ApiMovementHistory,
} from "./types";

export function mapSession(s: ApiGateSession): GateSession {
  return {
    id: s.id,
    plate: s.plate,
    driver: s.driver,
    vehicle: s.vehicle,
    gate: s.gate,
    entryTime: s.entry_time,
    exitTime: s.exit_time,
    status: s.status as GateSession["status"],
    durationMs: s.duration_ms,
  };
}

export function mapTransaction(t: ApiGateTransaction): GateTransaction {
  return {
    id: t.id,
    gateId: t.gate_id,
    gateName: t.gate_name,
    plate: t.plate,
    driver: t.driver,
    vehicle: t.vehicle,
    type: t.type as GateTransaction["type"],
    decision: t.decision as GateTransaction["decision"],
    confidence: t.confidence,
    timestamp: t.timestamp,
    processingMs: t.processing_ms,
    barrierState: t.barrier_state,
  };
}

export function mapActiveVehicle(v: ApiActiveVehicle): ActiveVehicle {
  return {
    id: v.id,
    plate: v.plate,
    driver: v.driver,
    vehicle: v.vehicle,
    gate: v.gate,
    entryTime: v.entry_time,
    durationMs: v.duration_ms,
    status: v.status as ActiveVehicle["status"],
  };
}

export function mapMovement(m: ApiVehicleMovement): MovementHistory {
  return {
    id: m.id,
    plate: m.plate,
    driver: m.driver,
    vehicle: m.vehicle,
    type: m.type as MovementHistory["type"],
    gate: m.gate,
    decision: m.decision as MovementHistory["decision"],
    timestamp: m.timestamp,
    confidence: m.confidence,
    processingMs: m.processing_ms,
  };
}

export function mapMovementHistory(h: ApiMovementHistory): { plate: string; movements: MovementHistory[] } {
  return {
    plate: h.plate,
    movements: (h.movements ?? []).map(mapMovement),
  };
}
