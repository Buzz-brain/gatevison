# GateVision Release Candidate v1.0

> AI-Powered Vehicle Access Control System
> Audit Date: July 16, 2026 (updated for session-based architecture)
> Build: `tsc --noEmit` 0 errors | `vite build` PASS

---

## 0. Session-Based Verification Architecture (Primary)

Gate decisions run on a **session-based verification model**: every vehicle is tracked through an explicit session lifecycle (entry -> inside -> exit) keyed on the observed license plate. The backend exposes two decision modes; **Mode A is the default and is the model wired through the frontend**.

### Decision Modes

| Mode | Backend flag | Keyed by | Decision basis | Status |
|------|-------------|----------|----------------|--------|
| **A - Session Verification** | `DECISION_MODE="session"` (default) | License plate | Captured signal quality (plate OCR + face embedding + vehicle embedding) | **Active** (frontend + backend) |
| **B - Identity Verification** | `DECISION_MODE="identity"` | Registered `vehicle_id` (+ `driver_id`) | Resolution against registered driver/vehicle profiles | Future enterprise deployment (backend routes exist; not wired in frontend) |

### Session Lifecycle (Mode A)

```
Plate observed at gate -> signal capture (OCR plate, face embedding, vehicle embedding)
        |
        v
POST /gate/entry  -> SessionVerificationService verifies capture quality
        |            SessionGateService.create_entry_session()
        v
GateSession opened  (current_state OUTSIDE -> INSIDE; embeddings stored)
        |            ENTRY transaction recorded
        v        (vehicle parked inside)
POST /gate/exit  -> ActiveSessionMatcher.find_best_match()
        |            scores candidate active sessions:
        |              plate 0.50 + vehicle 0.30 + face 0.20; match threshold >= 0.55
        |              embedding fallback threshold >= 0.85
        v
On match: session closed (INSIDE -> OUTSIDE; exit_confidence stored)
        EXIT transaction recorded
        |
On no match: EXIT rejected (no exit without an entry session)
```

Key rules:

- Only a `GRANT` decision can open or close a session; a `DENY` produces no session.
- A vehicle cannot exit without an active entry session (`ActiveSessionMatcher` rejects).
- Session identity is the plate; `vehicle_id` stores the observed plate in Mode A.
- Session states: `OUTSIDE` (initial) -> `INSIDE` (active) -> closed on validated exit. The UI derives `pending_exit` / `completed` display states from the current state.

### Frontend Mapping (Gate Operations)

| Entry stage sequence | Exit stage sequence |
|----------------------|---------------------|
| recognition -> decision -> barrier_opening -> vehicle_passing -> session_created | session_matching -> verification -> barrier_opening -> vehicle_passing -> session_closed |

- Live "sessions inside" panel filters `GET /gate/active` to `current_state === "INSIDE"`.
- TrafficPlayback replays gate transactions ("Entry session created" / "Exit session validated").
- `use-gate-operations` drives the real API (5s session polling, 10s transaction polling, entry/exit mutations).
- Gate endpoints: `POST /gate/entry`, `POST /gate/exit`, `GET /gate/active`, `GET /gate/transactions`, `GET /gate/session/{vehicle_id}`, `GET /gate/history/{vehicle_id}`, `GET /gate/statistics`.

---

## 1. Architecture Summary

```
gatevision-frontend/
  src/
    App.tsx                    -- root with ErrorBoundary, QueryClient, ThemeProvider, AuthInit
    router.ts                  -- TanStack Router (18 routes: 2 layouts + 16 content)
    routes/                    -- route definitions (lazy-loaded via React.lazy)
    layouts/
      app-layout.tsx           -- Sidebar + TopNav + Outlet + overlays (CmdPalette, Search, etc.)
    components/
      ui/                      -- 15+ primitives (Button, Card, Dialog, Tabs, Badge, Switch, etc.)
      layout/                  -- Sidebar, TopNav, PageContainer, ThemeProvider, Breadcrumb
      feedback/                -- ErrorBoundary, ApiErrorBoundary, Toast, OfflineBanner
      charts/                  -- ChartWrapper (chart-wrapper.tsx is dead)
      forms/                   -- FormField, FileUpload (both dead)
      brand/                   -- Logo, LoadingMark
    features/                  -- 18 feature modules (7 API-integrated, 1 offline, 3 mocks)
      auth/                    -- Login, ForgotPassword, SessionExpired, Unauthorized, NotFound
      dashboard/               -- 14 components, API-integrated (weather widget uses mock)
      access-control/          -- Placeholder page
      live-monitoring/         -- Placeholder page
      recognition/             -- Full pipeline, API-integrated with 7 sub-services
      identity/                -- 5-tab workspace, API-integrated with 5 sub-services
      gate-operations/         -- 12 components, session-based, API-integrated + TrafficPlayback
      reports/                 -- 19 components, API-integrated + SecurityIntelligenceCenter
      administration/          -- 10-tab workspace, API-integrated + SecurityCommandCenter
      system/                  -- API-integrated + DigitalTwinMonitor hackathon
      settings/                -- 14-tab workspace, mock-driven (not API-integrated)
      demo/                    -- 7-view offline Demonstration Center
      (command-palette, notifications, search, profile, keyboard-shortcuts, tour)
    services/
      api/                     -- 29 API service files (6 are dead stubs)
      mock/                    -- 3 mock services (weather, search, notifications)
    store/                     -- 8 Zustand stores (auth, demo, sidebar, ui, presentation, etc.)
    hooks/                     -- 10 custom hooks (useReducedMotion, useSession, useBreakpoint, etc.)
    lib/
      api/                     -- Axios instance, JWT interceptors, endpoints, query-client
      animations.ts            -- Shared framer-motion variants
    styles/
      globals.css              -- Tailwind v4 config + theme variables + animations
    types/
      api.ts                   -- Shared API types (ApiResponse, LoginRequest, etc.)
    utils/                     -- (empty directory)
```

### Data Flow

```
User Action -> React Component -> React Query (use*-api hook)
                                    -> API Service (axios call)
                                       -> JWT Interceptor (attach Bearer token)
                                          -> Backend API (http://localhost:8000/api/v1)
                                    <- Response mapped via mapper.ts
                                    <- Cached by React Query (tanstack-query)
                                    <- UI updates via hook return values

Auth State:    useAuthStore (Zustand + persist) <-> JWT tokens -> localStorage
Server State:  useQuery/useMutation (React Query) <-> API services
Demo State:    useDemoStore (Zustand, no persistence)
Gate State:    GateSession lifecycle (backend) <-> /gate/* endpoints (5s-10s polling)
```

> **Gate decisions are session-based by default (Mode A).** See Section 0 for the session lifecycle: plate-based entry opens a session storing face/vehicle embeddings; exit is validated by `ActiveSessionMatcher` against active sessions before the session closes.

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2.7 |
| Language | TypeScript | 5.7 |
| Build | Vite | 8.1.1 |
| Styling | Tailwind CSS | 4.3.2 |
| UI Components | shadcn/ui (Radix primitives) | -- |
| Animations | Framer Motion | 12.42.2 |
| Routing | TanStack Router | 1.170.17 |
| Server State | TanStack React Query | 5.101.2 |
| Client State | Zustand | 5.0.14 |
| Forms | React Hook Form + Zod | 7.81 / 4.4 |
| Charts | Recharts | 3.9.2 |
| Icons | Lucide React | 1.24.0 |
| HTTP | Axios | 1.18.1 |
| CSS Utilities | CVA, clsx, tailwind-merge | -- |

---

## 3. Statistics

| Metric | Value |
|--------|-------|
| TypeScript/TSX files | 386 |
| Lines of code | 46,387 |
| Feature modules | 18 |
| UI components | 38+ |
| Custom hooks | 10 |
| Zustand stores | 8 |
| API service files | 29 (23 active, 6 dead) |
| API endpoints defined | ~45 |
| React Query hooks | 50+ |
| Registered routes | 18 (2 layouts + 16 content) |
| Lazy-loaded routes | 16/16 (100%) |
| Build modules | 3,315 |
| Bundle size (total) | ~2.2 MB (uncompressed), ~700 KB (gzip) |
| Largest JS chunk | 571 KB (index-CnOpfJTu.js - 177 KB gzip) |
| Largest vendor chunk | 387 KB (recharts AreaChart - 110 KB gzip) |
| CSS size | 106 KB (15.6 KB gzip) |

---

## 4. Pages

| Route | Path | Feature | Lazy | Size (gzip) | Status |
|-------|------|---------|------|-------------|--------|
| Dashboard | `/` | dashboard | Yes | 131 KB (29 KB) | API-integrated |
| Live Monitoring | `/live-monitoring` | live-monitoring | Yes | 50 KB (12 KB) | Placeholder |
| Recognition Center | `/recognition` | recognition | Yes | 185 KB (38 KB) | API-integrated |
| Access Control | `/access-control` | access-control | Yes | 50 KB (12 KB) | Placeholder |
| Identity Center | `/identity` | identity | Yes | 79 KB (16 KB) | API-integrated |
| Gate Operations | `/gate-operations` | gate-operations | Yes | 63 KB (15 KB) | API-integrated |
| Reports | `/reports` | reports | Yes | 131 KB (29 KB) | API-integrated |
| System | `/system` | system | Yes | 150 KB (34 KB) | API-integrated |
| Admin | `/admin` | administration | Yes | 145 KB (34 KB) | API-integrated |
| Settings | `/settings` | settings | Yes | 65 KB (14 KB) | Mock-driven |
| Demo Center | `/demo` | demo | Yes | 42 KB (9 KB) | Offline-only |
| Login | `/login` | auth | Yes | 8 KB (2 KB) | API-driven |
| Forgot Password | `/forgot-password` | auth | Yes | 3 KB (1 KB) | API-driven |
| Session Expired | `/session-expired` | auth | Yes | 1 KB (0.6 KB) | Static |
| Unauthorized | `/unauthorized` | auth | Yes | 1 KB (0.6 KB) | Static |
| 404 Not Found | `/$splat` | auth | Yes | 1 KB (0.6 KB) | Static |

---

## 5. Components

### UI Primitives (15+)
Button, Card, Badge, Dialog, Tabs, Switch, Input, Select, Popover, Tooltip, DropdownMenu, ScrollArea, Progress, Separator, Accordion, Avatar, Checkbox, Label, Toast, LoadingScreen, EmptyState, MetricCard, StatusPill

### Feature Components
| Feature | Components | Notes |
|---------|-----------|-------|
| auth | 5 pages + LoginForm, SystemInitSequence | Full auth flow |
| dashboard | 14 components | Weather uses mock |
| recognition | Pipeline, Timeline, CameraGrid, etc. | API-integrated |
| identity | DriverWizard, VehicleWizard, DriverCard, IdentityIntel, etc. | API-integrated |
| gate-operations | 12 components + TrafficPlayback | Session-based, API-integrated |
| reports | 19 components + SecurityIntelligenceCenter | API-integrated |
| administration | 10-tab workspace + SecurityCommandCenter | API-integrated |
| system | DigitalTwinMonitor, AI model grid, etc. | API-integrated |
| settings | 14-tab workspace + modal dialogs | Mock-driven |
| demo | 7 views + AiStoryMode overlay | Offline-only |

### Hackathon Features
1. **DigitalTwinMonitor** (System) - Live topology graph, particle flows, predictive capacity
2. **SecurityIntelligenceCenter** (Reports) - 6-tab SOC analytics with threat heatmap
3. **SecurityCommandCenter** (Admin) - 4-view SOC with incident board, risk gauge
4. **TrafficPlayback** (Gate Ops) - Timeline scrubber with speed controls
5. **Investigation Timeline** (Recognition) - Case reconstruction
6. **Identity Intelligence Panel** (Identity) - Threat signals, radar, biometric health
7. **AI Configuration Simulator** (Settings) - What-if config tweaking
8. **AiStoryMode** (Demo) - Cinematic fullscreen overlay

---

## 6. API Integrations

| Feature | API Status | Service Files | React Query Hooks |
|---------|-----------|---------------|-------------------|
| Auth | Full | auth.api.ts, health.api.ts | useAuthStore |
| User | Full | user.api.ts | -- (via auth) |
| Recognition | Full (7 services) | recognition, face, ocr, vehicle, pipeline, decision, camera | use-recognition-api, use-camera, use-pipeline |
| Identity | Full (5 services) | identity, driver, vehicle-profile, policy, enrollment | use-identity-api |
| Gate Operations | Full (session-based) | gate-session, gate-transaction, gate, workflow | use-gate-operations-api |
| Identity | Full | identity, driver, vehicle-profile, policy, enrollment | use-identity-api |
| Reports | Full | reports, analytics, export, event | use-reports-api |
| Administration | Full | admin, manual-review | use-admin-api |
| System | Full | system, backup, monitoring | use-system-api |
| Dashboard | Partial | dashboard | use-dashboard-api |
| Settings | **Mock only** | -- | use-settings (mock) |
| Search | **Mock only** | -- | mockSearchService |
| Weather | **Mock only** | -- | mock weather.service |

**Gate workflow endpoints live under `GATE.ENTRY` / `GATE.EXIT`** (top-level `WORKFLOW` block not needed; entry/exit are the workflow). **Missing Endpoint Definitions:** `WATCHLIST`, `TRAINING` (conceptual references in the recognition feature, no backend proxy routes).

**Dead API Service Files (6):** `face.api.ts`, `ocr.api.ts`, `vehicle.api.ts`, `decision.api.ts`, `monitoring.api.ts`, `user.api.ts` -- orphaned, their functionality was consolidated into `system.api.ts` and `pipeline.api.ts`

---

## 7. Performance Metrics

| Metric | Result |
|--------|--------|
| tsc --noEmit | 0 errors (silent) |
| vite build | PASS (48s) |
| Total modules | 3,315 |
| Bundle size (uncompressed) | ~2.2 MB |
| Bundle size (gzip) | ~700 KB |
| Largest chunk (>500KB) | 1 (index-CnOpfJTu.js: 571 KB) |
| Chunks >200KB | 2 (index 571 KB + recharts 387 KB) |
| Lazy-loaded routes | 16/16 (100%) |
| Tree-shaking | Effective (lucide icons individually chunked) |

### Bundle Breakdown

```
index-CnOpfJTu.js        571 KB  (177 KB gzip)  -- Main app shell + shared deps
AreaChart-BYiOXCqk.js    387 KB  (110 KB gzip)  -- recharts (CJS compat)
page-DguCCNsL.js        185 KB  (38 KB gzip)   -- Recognition page
page-B0pJSv_T.js        150 KB  (34 KB gzip)   -- System page
page-B4b9E3LH.js        145 KB  (34 KB gzip)   -- Admin page
page-ByYZ0Clv.js        131 KB  (29 KB gzip)   -- Dashboard / Reports
page-DlH1t_R6.js         79 KB  (16 KB gzip)   -- Identity page
page-BH6phbT4.js         65 KB  (14 KB gzip)   -- Settings page
page--3B7BVAi.js         63 KB  (15 KB gzip)   -- Gate Operations page
page-C_UQpR2D.js         50 KB  (12 KB gzip)   -- Live Monitoring / Access Control
page-DDSfmEdL.js         42 KB  (9 KB gzip)    -- Demo Center
CSS                     106 KB  (15 KB gzip)
```

### Optimization Recommendations
1. **Code-split recharts** -- `import('recharts')` would move the 387 KB out of main chunk
2. **Dynamic import heavy pages** -- Recognition (185 KB), System (150 KB), Admin (145 KB) are already lazy-loaded; consider further splitting hackathon features
3. **Remove dead code** -- ~970 lines of orphaned code could be deleted
4. **Consider lighter chart library** -- recharts at 387 KB is heavy; lightweight alternative would reduce main bundle

---

## 8. Accessibility Score

| Criterion | Status | Notes |
|-----------|--------|-------|
| Keyboard navigation | Partial | Tabs lack arrow-key nav; no skip-to-content link |
| Focus indicators | Good | Global `:focus-visible` with ring-2 style |
| Focus management | **Missing** | No focus reset on route change |
| ARIA landmarks | Partial | nav, main used; no aria-live regions |
| Dialog accessibility | **Missing** | `components/ui/dialog.tsx` lacks `role="dialog"`, `aria-modal`, focus trap |
| Screen reader support | Partial | Icon buttons have aria-label; no live region announcements |
| Color contrast | Good | Dark theme uses high-contrast colors |
| Reduced motion | Partial | CSS fallback present; ~15 framer-motion components skip hook |
| Form validation | Good | `role="alert"` on error messages |
| Breadcrumb | Good | `nav` with `aria-label="Breadcrumb"` |
| Combobox pattern | Good | Search widget has full ARIA combobox pattern |

### Critical Issues
1. `components/ui/dialog.tsx` -- no `role="dialog"`, no `aria-modal`, no focus trapping
2. No skip-to-content link (WCAG 2.4.1 violation)
3. No focus management on route changes
4. ~15 components use `motion.div` without `useReducedMotion()` -- JS animations not suppressed

### Score Estimate
~72/100 (manual audit, not automated). Passes basic checks but fails advanced screen reader and keyboard navigation audits.

---

## 9. Security Checklist

| Requirement | Status | Evidence |
|------------|--------|----------|
| JWT Bearer auth | **PASS** | `interceptors.ts` auto-attaches Bearer token |
| Token auto-refresh | **PASS** | 401 interceptor calls `/auth/refresh`, queues pending requests |
| Refresh token rotation | **PASS** | New refresh token stored on refresh |
| Session expiry redirect | **PASS** | Refresh failure redirects to `/login`, 401 > `/session-expired` |
| Route protection | **PASS** | `AppLayout` redirects to `/login` if not authenticated |
| RBAC in store | **PASS** | `user.permissions[]` on auth store |
| Input validation | **PASS** | Zod schemas on forms |
| File upload (image) | **PASS** | Image type validation in recognition upload |
| XSS prevention | **PASS** | React's built-in escaping; no `dangerouslySetInnerHTML` |
| LocalStorage secrets | **PARTIAL** | JWT token stored in localStorage (XSS vulnerable); no HttpOnly cookies |
| Logout clears state | **PASS** | `logout()` clears user, token, refreshToken |
| Session polling | **PASS** | `useSessionGuard` checks `/me` every 60s |
| Failed login throttling | **PARTIAL** | `remainingAttempts` tracked client-side; server-side assumed |

### Security Gaps
1. **XSS concern**: JWT tokens in localStorage are accessible to any JS running on the page. HttpOnly cookies would be more secure. Mitigation: CSP headers on server side.
2. **Rate limiting**: Login attempt tracking is client-side only. Backend should enforce server-side rate limiting.
3. **No CSRF tokens**: Not an issue for SPA with Bearer tokens on Authorization header, provided CORS is properly configured.

---

## 10. Optimization Summary

### What's Good
- 100% lazy-loaded routes (16/16 content routes)
- TanStack Router with `defaultPreload: "intent"` (prefetches on hover)
- Effective tree-shaking of lucide-react icons (each icon is a separate ~0.2 KB chunk)
- CSS is single file, only 106 KB
- React 19 concurrent features available
- Query caching via React Query reduces API calls
- Zustand stores are small and focused (no monolithic store)

### What Needs Work
| Issue | Impact | Effort to Fix |
|-------|--------|---------------|
| recharts in main chunk (387 KB) | Adds 387 KB to initial load | Low -- dynamic import recharts |
| Dead code (~970 lines, 38 files) | Unnecessary bytes, confusion | Low -- delete orphaned files |
| 6 dead API services | Maintenance burden | Low -- delete or consolidate |
| Dialog accessibility gap | UX for screen reader users | Low -- add 3 attributes |
| No focus management | Keyboard user confusion | Low -- add useEffect in AppLayout |
| 15 components missing useReducedMotion | Motion sensitivity | Low -- pass hook result |
| CSS duplicate @layer base block | Code smell | Trivial -- deduplicate |
| 9 dead barrel export files | False imports available | Trivial -- delete barrels |
| No aria-live regions | Silent dynamic updates | Medium -- add to key areas |
| recharts blocking main chunk (CJS) | 571 KB initial load | Medium -- dynamic import |
| /recognition missing from sidebar | Feature hard to find | Low -- add nav item |
| /admin missing from sidebar | Feature hard to find | Low -- add nav item |
| Settings not API-integrated | Inconsistent experience | High -- backend work needed |
| Weather widget uses mock | Won't show real data | Medium -- add API |
| Search uses mock | Won't search real data | Medium -- add API |

---

## 11. Known Limitations

1. **Settings feature is mock-driven** -- All settings pages show hardcoded data. Requires backend API to become functional.
2. **Dashboard weather widget uses mock** -- Shows simulated weather. No real weather API integration.
3. **Search overlay uses mock** -- Global search only searches mock data. No real search endpoint integration.
4. **Live Monitoring & Access Control pages are placeholders** -- `/live-monitoring` and `/access-control` have basic page shells but no significant component content.
5. **No light mode color palette** -- CSS only defines dark theme colors. The theme toggle exists in UI but light mode may look broken (colors defined via runtime injection).
6. **Chunk size warning** -- Main index chunk is 571 KB (exceeds 500 KB limit) due to recharts CJS compat. Dynamic import of recharts would resolve this.
7. **Missing watchlist/training API endpoints** -- No `WATCHLIST` or `TRAINING` sections in `endpoints.ts`. Recognition feature references these conceptually but lacks backend proxy routes.
8. **Mode B (Identity Verification) not wired in frontend** -- Backend routes support `DECISION_MODE="identity"` (registered-profile resolution), but the frontend gate operations run the default **Mode A (session-based)**. Identity Management Center remains the enterprise-facing module; switching to Mode B requires backend config `DECISION_MODE=identity` plus a frontend wiring pass.
9. **No automated tests** -- Zero test files found in the frontend. No Jest, Vitest, Playwright, or Testing Library setup.
10. **No Storybook** -- `.storybook/` directory exists but is empty. Component library has no visual regression tests.
11. **No PWA support** -- No service worker, no offline fallback (beyond the offline banner component). Full offline mode requires API caching strategy.
12. **Backend at `localhost:8000`** -- No environment-specific backend URL configuration beyond `VITE_API_BASE_URL`. No Docker or deployment config included.

---

## 12. Dead Code Inventory

| Category | Files | Lines | Action |
|----------|-------|-------|--------|
| API services (orphaned) | face.api.ts, ocr.api.ts, vehicle.api.ts, decision.api.ts, monitoring.api.ts, user.api.ts | ~250 | Delete |
| Hooks (orphaned) | use-auth.ts, use-debounce.ts, use-mount-transition.ts, use-keyboard-shortcuts.ts | ~80 | Delete |
| Barrel exports (index.ts) | 9 files across features, components, hooks, layouts | ~50 | Delete |
| Chart wrapper | chart-wrapper.tsx | ~42 | Delete |
| Regular components | breadcrumb.tsx, app-logo.tsx | ~87 | Delete |
| Form components | form-field.tsx, file-upload.tsx | ~120 | Delete |
| Dashboard mapper | dashboard/api/mapper.ts | ~122 | Delete |
| Legacy API setup | services/api.ts | ~38 | Delete |
| Typography utility | styles/typography.ts | ~18 | Delete |
| Brand component (partial) | logo.tsx (GateVisionLogo export only) | ~15 | Clean |
| Route file (orphaned) | routes/auth.tsx | ~40 | Delete |
| Build log files | tsc_*.txt (8 files) | ~100 | Delete + gitignore |
| Empty directories | utils/, .storybook/ | 0 | Delete |
| **TOTAL** | **~38 items** | **~970** | |

---

## 13. Future Roadmap

### Pre-Production (before RC2)
- [ ] Delete all dead code (~970 lines, 38 files)
- [ ] Add `/recognition` and `/admin` to sidebar navigation
- [ ] Fix dialog accessibility (role, aria-modal, focus trap)
- [ ] Add skip-to-content link
- [ ] Add focus management on route change
- [ ] Add `useReducedMotion()` to 15 remaining motion components
- [ ] Add global `aria-live` region for dynamic content
- [ ] Deduplicate CSS `@layer base` block
- [ ] Add `tsc_*.txt` to `.gitignore`

### Short-Term (v1.0)
- [ ] Dynamic import recharts to reduce main chunk
- [ ] Integrate Settings with backend API
- [ ] Integrate search with real backend search endpoint
- [ ] Add real weather API or remove weather widget
- [ ] Add automated test framework (Vitest + React Testing Library)
- [ ] Add light mode color palette to CSS
- [ ] Expand Live Monitoring and Access Control pages

### Medium-Term (v1.1)
- [ ] Code-split hackathon features from their parent routes
- [ ] Add PWA support (service worker, offline cache)
- [ ] Add Storybook for component documentation
- [ ] Configure CSP headers on backend
- [ ] Add E2E tests (Playwright)
- [ ] Expose `GET /gate/session/{vehicle_id}` and `GET /gate/history/{vehicle_id}` in frontend `endpoints.ts` (currently hardcoded paths)

### Future Enterprise Deployment (Mode B - Identity Verification)
- [ ] Backend: verify `DECISION_MODE="identity"` end-to-end (identity service + registered driver/vehicle profiles)
- [ ] Frontend: wire gate entry/exit to send `vehicle_id`/`driver_id` when Mode B is active (gate routes already branch on the flag)
- [ ] Toggle decision mode from Settings or an env var; surface active mode in the Gate Operations UI
- [ ] Document rollout for multi-site enterprise installs (registered fleets, driver enrollment)

### Long-Term (v2.0)
- [ ] Replace recharts with lightweight chart library
- [ ] Consider HttpOnly cookies for JWT (requires auth server change)
- [ ] Internationalization (i18n)
- [ ] Full offline mode with IndexedDB caching
- [ ] Docker Compose for one-command deployment

---

## 14. Acceptance Checklist

| Requirement | Status | Verified By |
|------------|--------|-------------|
| Zero TypeScript errors | **PASS** | `tsc --noEmit` silent |
| vite build passes | **PASS** | `vite build` succeeds (48s) |
| No broken routes | **PASS** | All 16 content routes resolve; sidebar has 0 broken links |
| No broken API calls | **PASS** | React Query hooks correctly reference API services; endpoints.ts covers all active integrations |
| No dead API calls | **PARTIAL** | 6 dead API service files exist; no runtime errors from them |
| Session-based gate flow | **PASS** | Mode A active end-to-end: entry opens GateSession, exit validated by ActiveSessionMatcher, sessions/transactions surfaced in Gate Operations |
| Mode B (enterprise) | **NOT WIRED** | Backend routes support `DECISION_MODE="identity"`; frontend runs Mode A (documented under Future Enterprise Deployment) |
| All features accessible | **PARTIAL** | 7/10 features API-integrated; settings/search/weather use mocks |
| Application ready for demonstration | **PASS** | Can launch, login, navigate all features; Demo Center has 7 presentation views |

### Sign-Off Summary

> **GateVision Release Candidate v1.0 passes the audit with 0 TypeScript errors, a clean build, and 7 of 10 features fully API-integrated. Gate decisions run on the default session-based verification model (Mode A): plate-based entry opens a session storing face/vehicle embeddings, and exit is validated by ActiveSessionMatcher before the session closes. Mode B (identity verification) is documented for future enterprise deployment. Critical accessibility gaps exist (dialog ARIA, focus management, skip-to-content) but do not block demonstration. Dead code cleanup and navigation fixes are recommended before v1.0 release.**
