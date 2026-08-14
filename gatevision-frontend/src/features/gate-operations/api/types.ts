// Backend-mirror types for Gate Operations (session-based verification mode)

export interface ApiEntryRequest {
  plate: string;
  gate_name?: string;
  notes?: string;
  face_embedding?: number[];
  vehicle_embedding?: number[];
  face_confidence?: number;
  vehicle_confidence?: number;
  decision?: string;
}

export interface ApiExitRequest {
  plate: string;
  gate_name?: string;
  notes?: string;
  face_embedding?: number[];
  vehicle_embedding?: number[];
  decision?: string;
}

export interface ApiSessionRef {
  session_id: string;
  vehicle_id: string;
  current_state: string;
  last_entry_time?: string | null;
  last_exit_time?: string | null;
}

export interface ApiTransactionRef {
  transaction_id: string;
  action: string;
  decision: string;
  timestamp: string;
}

export interface ApiExitCandidate {
  session_id: string;
  vehicle_id: string;
  plate_score: number;
  vehicle_score?: number | null;
  face_score?: number | null;
  score: number;
  embedding_score: number;
}

export interface ApiExitMatch {
  matched: boolean;
  session_id?: string | null;
  vehicle_id?: string | null;
  score: number;
  plate_score: number;
  vehicle_score?: number | null;
  face_score?: number | null;
  reason: string;
  candidates: ApiExitCandidate[];
}

export interface ApiSessionWorkflowResult {
  success: boolean;
  message: string;
  session?: ApiSessionRef;
  transaction?: ApiTransactionRef;
  match?: ApiExitMatch;
}

export interface ApiActiveSession {
  session_id: string;
  vehicle_id: string;
  current_state: string;
  last_entry_time?: string | null;
  last_exit_time?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiGateActive {
  sessions: ApiActiveSession[];
  total: number;
}
