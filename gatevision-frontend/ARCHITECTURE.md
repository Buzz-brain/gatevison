# GateVision Architecture

## System Overview

GateVision is a single-page application (SPA) that communicates with a Python FastAPI backend. The frontend is built with React 19 and TypeScript, using TanStack Router for navigation and React Query for server state management.

Gate decisions run on a **session-based verification model** by default (Mode A): every vehicle is tracked through an explicit entry -> inside -> exit session lifecycle keyed on the observed license plate. The backend also supports Mode B (identity verification against registered profiles) for future enterprise deployments.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (SPA)                           │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Auth Init  │  │  Router  │  │  Layout  │  │ Features │  │
│  │ (JWT)     │  │ (Lazy)   │  │ (Shell)  │  │ (14)     │  │
│  └───────────┘  └──────────┘  └──────────┘  └──────────┘  │
│         │              │             │             │        │
│         ▼              ▼             ▼             ▼        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React Query (Server State)              │   │
│  │              Zustand (Client State)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Axios HTTP Client                       │   │
│  │   (JWT Interceptor + Auto-Refresh on 401)           │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (JSON)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Auth     │  │ AI       │  │ Identity │  │ Gate     │   │
│  │ Service  │  │ Pipeline │  │ Service  │  │ Control  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│     Gate Control (Mode A session-based, default):           │
│       SessionGateService -> create_entry_session /          │
│         validate_exit_session                                │
│       SessionVerificationService -> capture quality check    │
│       ActiveSessionMatcher -> exit matching (plate .5,       │
│         vehicle .3, face .2, threshold .55)                  │
│       GateSession (OUTSIDE -> INSIDE -> OUTSIDE)             │
└─────────────────────────────────────────────────────────────┘
```

## Gate Session Lifecycle (Mode A - Session Verification)

```
Plate observed at gate -> signal capture (OCR plate, face/vehicle embeddings)
        |
        v
POST /gate/entry -> SessionVerificationService verifies capture quality
                  -> SessionGateService.create_entry_session()
        |
        v
GateSession opened (OUTSIDE -> INSIDE; embeddings stored) + ENTRY transaction
        |
        v   (vehicle parked inside)
POST /gate/exit -> ActiveSessionMatcher.find_best_match() against active sessions
        |          (plate 0.50 + vehicle 0.30 + face 0.20, threshold >= 0.55)
        |
        v
On match: session closed (INSIDE -> OUTSIDE, exit confidence stored) + EXIT transaction
On no match: exit rejected (no exit without an entry session)
```

- Session identity is the plate; `vehicle_id` stores the observed plate in Mode A.
- Only a `GRANT` decision opens/closes a session; `DENY` produces no session.
- The frontend polls `GET /gate/active` (5s) and `GET /gate/transactions` (10s); the Gate Operations UI filters to `current_state === "INSIDE"` for the live sessions panel.

### Mode B - Identity Verification (future enterprise deployment)

Backend routes branch on `DECISION_MODE` (default `"session"`). With `DECISION_MODE="identity"`, gate entry/exit resolve against registered driver/vehicle profiles using `vehicle_id` / `driver_id` instead of the observed plate. Frontend wiring for Mode B is not active yet.

## State Architecture

Two state management layers:

1. **Server State** (TanStack React Query)
   - All API data fetched via React Query hooks
   - Automatic caching, background refetching, polling
   - Cache invalidation on mutations

2. **Client State** (Zustand)
   - Auth state (persisted to localStorage)
   - UI preferences (sidebar, theme)
   - Demo mode, presentation mode
   - Notifications and command palette

## Lazy Loading

Every route is wrapped with `React.lazy()` and `Suspense`:

- Pages only load when navigated to
- Separate bundles for each major feature
- Shared dependencies (Recharts, Framer Motion) loaded on first use

## Authentication Flow

1. User logs in → JWT tokens stored in Zustand (persisted to localStorage)
2. Axios interceptor attaches Bearer token to all requests
3. On 401 response → refresh token used to get new access token
4. If refresh fails → redirect to login

## Key Design Decisions

- **No mock data in production**: All features fully API-integrated
- **Backend-mirror types**: API response types defined per feature
- **Mappers**: API snake_case mapped to UI camelCase
- **Polling**: Live data (gate sessions, system health) polled at 5-30s intervals
- **Animations**: All motion respects `prefers-reduced-motion`
