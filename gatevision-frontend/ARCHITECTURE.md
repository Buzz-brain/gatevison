# GateVision Architecture

## System Overview

GateVision is a single-page application (SPA) that communicates with a Python FastAPI backend. The frontend is built with React 19 and TypeScript, using TanStack Router for navigation and React Query for server state management.

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
└─────────────────────────────────────────────────────────────┘
```

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
