import type { ActiveVehicle } from "../types";
import type { ApiActiveSession } from "./types";

export function mapActiveVehicle(s: ApiActiveSession): ActiveVehicle {
  return {
    id: s.session_id,
    plate: s.vehicle_id,
    gate: "Main Gate",
    entryTime: s.last_entry_time ?? "",
    durationMs: 0,
    status: s.current_state === "PENDING_EXIT" ? "exiting" : "parked",
  };
}
