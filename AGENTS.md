## Objective
- Build GateVision (AI Vehicle Access Control System): completed auth + all feature centers + Demo Center. Both Recognition Center and Identity Management Center are now fully API-integrated (no mock imports).

## Important Details
- React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui; npm registry `registry.npmmirror.com`
- `noUncheckedIndexedAccess: true`, `strict: true`; `noUnusedLocals: false`
- React 19 `useRef<T>()` no-arg fails -> use `useRef<T | null>(null)`
- All motion respects `prefers-reduced-motion` via `useReducedMotion()`
- Build: `.\node_modules\.bin\tsc --noEmit` (0 errors = silent), `.\node_modules\.bin\vite build` (only <650kB chunk-size warning = OK)
- **Write tool gotcha**: special Unicode chars (`...`, `---`) cause JSON parse failure - use ASCII only
- **Subagent gotcha**: subagents may overwrite existing foundation files (types, utils, mocks, hooks) with truncated versions - always verify foundation files survive subagent writes
- **TypeScript `noUncheckedIndexedAccess`** requires `!` on all array accesses (`arr[i]!`), optional chaining for object property access
- Badge component supports variants: `"default" | "success" | "warning" | "danger" | "info" | "neutral" | "outline"`
- Backend runs at `http://localhost:8000`, Vite proxies `/api` -> `http://localhost:8000`; API base URL from `VITE_API_BASE_URL` env var (`http://localhost:8000/api/v1`)
- JWT Bearer auth - token persisted to localStorage under `gatevision-auth`, auto-refreshed on 401 via refresh token
- All authentication is backend-driven; `@tanstack/react-query` for server state, Zustand for auth client state
- React Query hooks file `use-identity-api.ts` provides all identity API hooks; `use-identity.ts` is a convenience wrapper with search/filtering
- Demo Center is offline/simulated-only (no backend calls) — presentation and demonstration tool; no barrel exports; uses `@tanstack/react-router` for routing
- AiStoryMode renders as fullscreen overlay (z-300) independently in AppLayout; "story" view in Demo Center launches it

## Work State
### Completed
- **Auth (Phase 1)**: full mock auth/session/store/hooks/components/pages; CommandPalette, NotificationCenter, GlobalSearch, KeyboardShortcuts
- **Dashboard (Prompt 3)**: 14 components, build passes
- **Auth bug fixes**: GuestRoute login redirect, ActivityFeed `manual_review` union, session-persist on every login
- **Gate Operations (Prompt 6)**: 12 components + page, route `/gate-operations`, builds pass
- **Reports & Analytics (Prompt 7)**: 18 components + page, route `/reports`, builds pass
- **System Monitoring & AI Ops Center API Integration**: Fully API-driven. `api/types.ts` (12 backend-mirror interfaces: ApiSystemHealth, ApiModelHealth, ApiDatabaseHealth, ApiStorageInfo, ApiPerformanceMetrics, ApiConfigurationItem, ApiVersionInformation, ApiBackupRecord, ApiLogStatistics, ApiCleanupResult, ApiMonitoringStatus, ApiSystemAlert), `api/mapper.ts` (10 mappers: mapOverallHealth, mapAiModels, mapPerfMetrics, mapStorageInfo, mapConfigItems, mapVersionInfo, mapBackupRecords, mapCleanupResult, mapLogEntries, mapAlerts). 3 API services (`system.api.ts` with 9 endpoints, `backup.api.ts` with 3 endpoints, `monitoring.api.ts` with log stats). Updated `endpoints.ts` (SYSTEM section with 10 endpoints), `query-client.ts` (SYSTEM keys with 9 keys). `hooks/use-system-api.ts` (9 React Query hooks with 30s polling + 3 mutations). Rewritten `hooks/use-system.ts` (composite hook uses real API via React Query + mapper, derived static data for cameras/pipeline/topology/security, live log simulation preserved). `page.tsx` updated with loading skeleton + error/retry states. `DigitalTwinMonitor` hackathon (live topology graph with animated nodes, particle data flows, interactive node inspection panel, 24h health timeline SVG chart, Predictive Capacity panel with disk exhaustion forecast/throughput/suggested actions). Zero active mock imports (`mocks/data.ts` dead file remains). `tsc --noEmit` silent, `vite build` passes (chunk-size warning only).
- **Administration & Security Center**: types, utils, mocks, hooks, 20 components, page with 10-tab workspace, route `/admin`. Builds pass.
- **Settings & Configuration Center**: types, utils, mocks, hooks, 22 component files, page with sidebar + 14 workspace tabs + 8 modal dialogs, AI Configuration Simulator hackathon feature. Route `/settings`. Builds pass.
- **API Integration Layer (base)**: `src/types/api.ts` (ApiResponse, LoginRequest, LoginResponseData, HealthResponse, MeResponse, NormalizedError); `src/lib/api/` (axios.ts, interceptors.ts with JWT auto-attach and 401 auto-refresh, errors.ts, endpoints.ts, query-client.ts with QueryClient + QUERY_KEYS, api-client.ts typed wrapper); `src/services/api/` (auth.api.ts, health.api.ts, user.api.ts, recognition/*.api.ts x7, identity/*.api.ts x5, gate-session.api.ts, gate-transaction.api.ts, workflow.api.ts); App.tsx updated with ApiErrorBoundary; BackendStatus component with health check query. Builds pass.
- **Recognition Center API Integration**: Fully API-driven. `src/features/recognition/types/api.ts` (24 backend-mirror interfaces), `api/mapper.ts` (converts API->UI), 7 API service files, 2 React Query hooks (`use-recognition-api.ts`, `use-camera.ts`), updated `use-pipeline.ts`/`use-recognition.ts`, rewrote `page.tsx` (file upload -> backend pipeline -> polling -> result), updated all components to use API, built Investigation Timeline hackathon. Zero mock imports. Builds pass.
- **Gate Operations API Integration**: Fully API-driven. `api/types.ts` (backend-mirror request/response interfaces: ApiGateActive, ApiGateStatistics, ApiGateSession, ApiGateTransaction, ApiWorkflowResult, ApiMovementHistory, ApiActiveVehicle, ApiEntryRequest, ApiExitRequest, ApiSessionState), `api/mapper.ts` (5 mappers: mapSession, mapTransaction, mapActiveVehicle, mapMovement, mapMovementHistory). 3 API service files (gate-session.api.ts, gate-transaction.api.ts, workflow.api.ts). `hooks/use-gate-operations-api.ts` (8 React Query hooks: useActiveSessions 5s polling, useTransactions 10s, useGateStatistics 15s, useVehicleHistory, usePipelineStatus 5s, usePipelineMetrics 5s, useSystemHealth 30s, useEntryMutation, useExitMutation). Rewritten `hooks/use-gate-operations.ts` (composite hook uses real API, same GateOperationsApi interface, all 12 components work unchanged). `constants.ts` for static SiteMap layout (replaces mock import). `TrafficPlayback` hackathon with play/pause/rewind/speed/skip/timeline scrubber, stats bar, animated event list. Zero mock imports in gate-operations feature. Builds pass (tsc silent, vite build succeeds).
- **Reports & Analytics API Integration**: Fully API-driven. `api/types.ts` (12 backend-mirror interfaces: ApiReportRecord, ApiAnalyticsSummary, ApiHourlyTraffic, ApiDailyTrendData, ApiDecisionBreakdownData, ApiProcessingMetrics, ApiDenialTrend, ApiRecognitionStatistics, ApiPeakHourData, ApiGateComparison, ApiVehicleDistribution, ApiManualReviewTrend, ApiSearchResult, ApiManualReviewSummary, ApiEventSummary, ApiDecisionHistoryItem), `api/mapper.ts` (8 mappers: mapReportRecord, mapAnalyticsSummary, mapSearchResult, mapManualReviewSummary, mapEventSummary, mapDecisionHistoryItem + sub-mappers). 3 API service files (reports.api.ts, export.api.ts + updated analytics.api.ts). Updated `endpoints.ts` (ADMIN section), `query-client.ts` (REPORTS keys). `hooks/use-reports-api.ts` (8 React Query hooks: useApiReports, useApiAnalytics 30s, useApiSearch debounced, useApiManualReviews, useApiEvents 30s, useApiDecisionHistory 30s, useApiGateStatistics 30s, useApiExportMutation). Rewritten `hooks/use-reports.ts` (composite hook uses real API, computes derived KPIs from analytics data, same ReportsApi interface, 30+ data properties). 19 new components (traffic-hourly-chart, daily-trend-chart, decision-breakdown-chart, recognition-metrics, pipeline-stages, gate-utilization-chart, heatmap-grid, queue-wait-chart, models-status, security-insights-panel, risk-score-card, report-table, search-widget, export-widget, events-feed, decision-history-table, manual-review-queue, insights-feed, forecast-chart). Rewritten `page.tsx` with 11 sections + loading/error/retry states. `SecurityIntelligenceCenter` hackathon with 6-tab SOC analytics dashboard (Executive Summary, Security Timeline with risk assessment, Threat Heatmap 7x24 grid, AI Confidence Analytics with animated bars, Failure Explorer with deny/review stats, What-If Decision Weight Simulator with sliders + instant simulation). Zero mock imports in reports feature. Builds pass (tsc silent, vite build succeeds, chunk-size warning only).
- **Identity Management Center API Integration**:
  - `types/api.ts`: backend-mirror interfaces for DriverProfile, VehicleProfile, AccessPolicy, BiometricInfo, Timeline, Documents, Relationships, Stats, Enrollment, Verification
  - `api/mapper.ts`: converts API snake_case -> UI camelCase types
  - `services/api/`: identity.api.ts, driver.api.ts, vehicle-profile.api.ts, policy.api.ts, enrollment.api.ts (5 files)
  - `hooks/use-identity-api.ts`: 18 React Query hooks (useDrivers, useVehicles, usePolicies, useIdentityStats, useIdentityActivity, useIdentityRelationships, useCreateDriver, useCreateVehicle, useEnrollDriver, useEnrollVehicle, useVerifyIdentity, useUpdateDriver, useUpdateVehicle, useUpdatePolicy, useDeleteDriver, useDeleteVehicle, useDeletePolicy, useDuplicatePolicy)
  - `hooks/use-identity.ts`: rewritten to use React Query hooks internally; same return interface; no mock imports
  - `page.tsx`: removed MOCK_RELATIONSHIPS import, uses `useIdentityRelationships()` hook; added Identity Intelligence Panel as 6th tab
  - `driver-wizard.tsx`: accepts `vehicles` and `policies` as props (no more MOCK_VEHICLES/MOCK_POLICIES imports)
  - `vehicle-wizard.tsx`: accepts `drivers` and `policies` as props (no more MOCK_DRIVERS/MOCK_POLICIES imports)
  - `components/identity-intelligence-panel.tsx`: hackathon feature with live threat signals, interactive identity radar, biometric health, AI confidence score, animated metrics
  - `query-client.ts`: IDENTITY keys added (DRIVERS, DRIVER, VEHICLES, VEHICLE, POLICIES, POLICY, STATS, ACTIVITY, RELATIONSHIPS)
  - Zero mock imports anywhere in identity feature. Builds pass.
- **Administration & Security Center API Integration**: Fully API-driven. `api/types.ts` (9 backend-mirror interfaces), `api/mapper.ts` (6 mappers), 2 API services (`admin.api.ts` with getDashboard/getReviews/getEvents/getHealth/getModels/getPerformance + `manual-review.api.ts` with approveReview/rejectReview), updated `endpoints.ts` (approve/reject review endpoints), updated `query-client.ts` (ADMIN keys). `hooks/use-admin-api.ts` (7 React Query hooks with 15s-30s polling + approve/reject mutations). Rewritten `hooks/use-admin.ts` (composite hook, reviews/events/health/models/performance from real API, users/roles/rbac/sessions/notifications/org/score/insights/activity/quick-actions from static constants). `constants.ts` replaces all mock data imports with static typed data. `page.tsx` updated with loading skeleton + error/retry states, SecurityCommandCenter wired into overview tab. `user-profile.tsx` fixed (removed inline MOCK_ACTIVITIES). `SecurityCommandCenter` hackathon (4-view SOC: Operations Wall, Incident Board with drag-and-drop + collaboration notes, Risk Gauge with animated SVG donut, Executive Snapshot with print). Zero mock imports. `tsc --noEmit` silent, `vite build` passes.

### Active
- (none)

### Blocked
- (none)

## Next Move
- Demo Center is complete. Optional follow-ups: add tests for demo components; code-split remaining large routes to silence chunk-size warning; add more scenarios (weather, multi-vehicle, night-time); wire bulk-import `onImported`/`onDuplicate` to real state; verify passport print button.

## Relevant Files
- `src/features/demo/` — entire new offline feature: types, constants (10 scenarios), utils, page, 8 components, AiStoryMode overlay
- `src/store/demo-store.ts` — enhanced Zustand store for all demo state (view, scenario, auto/motion/presentation/judge/metrics/playback)
- `src/routes/demo.tsx` — lazy-loaded route at `/demo`
- `src/router.ts` — registered `demoRoute`
- `src/components/layout/sidebar.tsx` — Demo Center nav item, removed dead `bottomItems`
- `src/components/layout/top-nav.tsx` — replaced old Play button with /demo link
- `src/features/identity/`: fully API-integrated (types/api.ts, api/mapper.ts, hooks/, page.tsx, components/, zero mock imports)
- `src/features/recognition/`: fully API-integrated (types/api.ts, api/mapper.ts, hooks/, updated components)
- `src/features/gate-operations/`: fully API-integrated (api/types.ts, api/mapper.ts, hooks/, constants.ts, TrafficPlayback hackathon)
- `src/features/reports/`: fully API-integrated (api/types.ts, api/mapper.ts, hooks/, 19 components, SecurityIntelligenceCenter hackathon)
- `src/features/administration/`: fully API-integrated (api/types.ts, api/mapper.ts, hooks/, constants.ts, SecurityCommandCenter hackathon, page.tsx with loading/error/retry)
- `src/features/system/`: fully API-integrated (api/types.ts, api/mapper.ts, hooks/, DigitalTwinMonitor hackathon, page.tsx with loading/error/retry)
- `src/services/api/`: auth, health, user, recognition/* (7), identity/* (5), gate-session, gate-transaction, workflow, reports, export, analytics, admin, manual-review, system, backup, monitoring
- `src/lib/api/`: endpoints.ts, query-client.ts, axios.ts, interceptors.ts, errors.ts, api-client.ts
