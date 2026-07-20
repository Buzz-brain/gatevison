# GateVision - AI Vehicle Access Control System

An intelligent vehicle access control system that combines license plate recognition, facial recognition, vehicle fingerprinting, and AI-powered decision engine for automated security gate management.

## Features

- **Dashboard**: Real-time operations center with live metrics, camera feeds, and system health monitoring
- **Recognition Center**: Multi-stage AI pipeline for license plate detection, OCR, facial recognition, and vehicle fingerprinting
- **Identity Management**: Comprehensive driver and vehicle profiles, enrollment, access policies, and verification
- **Gate Operations**: Live session monitoring, entry/exit control, traffic analytics, and mission replay
- **Reports & Analytics**: Advanced analytics with traffic patterns, decision breakdowns, security insights, and export
- **Administration**: Security command center, manual review queue, event monitoring, and system management
- **System Monitoring**: Real-time health dashboards, AI model status, performance metrics, Digital Twin visualization
- **Settings & Configuration**: Comprehensive configuration for every subsystem

### Hackathon Features

- **AI Story Mode**: Narrated walkthrough of a complete vehicle access request lifecycle
- **Presentation Mode**: Fullscreen slideshow mode for projector/demonstration use
- **Guided Tour**: Interactive step-by-step introduction for first-time users
- **Digital Twin Monitor**: Real-time topology visualization with animated data flows
- **Security Command Center**: 4-view SOC dashboard with incident board and risk gauge
- **Security Intelligence Center**: 6-tab threat analysis with AI confidence analytics
- **Traffic Playback**: Time-travel through recorded gate events with controls
- **AI Configuration Simulator**: What-if analysis for decision engine weights

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 with TypeScript |
| Build Tool | Vite 8 |
| Routing | TanStack Router |
| State (Server) | TanStack React Query |
| State (Client) | Zustand |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix primitives) |
| Animations | Framer Motion |
| Charts | Recharts |
| HTTP Client | Axios |
| Backend | Python FastAPI |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+

### Frontend Setup

```bash
# Clone and install
cd gatevision-frontend
npm install

# Environment
cp .env.example .env  # VITE_API_BASE_URL=http://localhost:8000/api/v1

# Development
npm run dev  # http://localhost:3000

# Build
npm run build
```

### Backend Setup

```bash
cd gatevision-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Environment
cp .env.example .env

# Run
uvicorn app.main:app --reload --port 8000
```

### Default Credentials

- **Email**: admin@gatevision.ai
- **Password**: admin123

## Project Structure

```
gatevision-frontend/
├── public/            # Static assets (favicon, icons)
├── src/
│   ├── components/    # Shared components
│   │   ├── ai/        # AI-related visual components
│   │   ├── brand/     # Logo, branding
│   │   ├── camera/    # Camera feed components
│   │   ├── charts/    # Chart components
│   │   ├── feedback/  # Error boundaries, toasts, offline banner
│   │   ├── forms/     # Form components
│   │   ├── layout/    # Shell, sidebar, top nav, theme
│   │   └── ui/        # shadcn/ui primitives (25+ components)
│   ├── features/      # Feature modules
│   │   ├── dashboard/           # Main operations center
│   │   ├── recognition/         # AI recognition pipeline
│   │   ├── identity/            # Driver/vehicle management
│   │   ├── gate-operations/     # Gate control and monitoring
│   │   ├── reports/             # Analytics and reporting
│   │   ├── administration/      # Security command center
│   │   ├── system/              # Health monitoring
│   │   ├── settings/            # Configuration
│   │   ├── demo/                # AI Story Mode
│   │   ├── tour/                # Guided tour
│   │   ├── auth/                # Authentication
│   │   ├── search/              # Global search
│   │   ├── command-palette/     # Cmd+K palette
│   │   ├── notifications/       # Notification center
│   │   ├── profile/             # User profile
│   │   └── keyboard-shortcuts/  # Shortcuts modal
│   ├── hooks/         # Shared React hooks
│   ├── lib/           # Utilities and API layer
│   │   ├── api/       # Axios client, interceptors, endpoints, query-client
│   │   └── animations.ts
│   ├── routes/        # Route definitions (lazy-loaded)
│   ├── services/api/  # API service functions (29 files)
│   ├── store/         # Zustand stores
│   ├── styles/        # Global CSS
│   ├── types/         # Shared TypeScript types
│   ├── App.tsx        # Root component
│   ├── router.ts      # Route tree
│   └── main.tsx       # Entry point
└── vite.config.ts
```

## API Endpoints

GateVision communicates with a FastAPI backend. Key endpoints:

| Category | Endpoints |
|----------|-----------|
| Auth | `/auth/login`, `/auth/refresh`, `/auth/me` |
| Recognition | `/camera/*`, `/plate-detection/*`, `/ocr/*`, `/face/*`, `/vehicle/*`, `/pipeline/*`, `/decision/*` |
| Identity | `/identity/drivers/*`, `/identity/vehicles/*`, `/identity/policies/*`, `/identity/enroll/*` |
| Gate | `/gate/entry`, `/gate/exit`, `/gate/active`, `/gate/transactions` |
| Dashboard | `/admin/dashboard`, `/admin/analytics`, `/admin/events` |
| Reports | `/admin/reports`, `/admin/search`, `/admin/export` |
| System | `/system/health`, `/system/models`, `/system/performance`, `/system/backup/*` |

## Build Commands

```bash
npm run build      # TypeScript check + Vite build
npx tsc --noEmit   # TypeScript check only
npx vite build      # Vite build only
```

## License

MIT
