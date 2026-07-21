# DevOpsPilot AI

> AI-powered deployment, monitoring, and DevOps automation platform.

Deploy applications from any GitHub repo, monitor infrastructure in real time, and let AI handle Dockerfile generation, log analysis, and CI/CD workflows.

---

## Features

- **One-click deployment** — clone, build, and run any GitHub repo with a single click. Auto-generates Dockerfile if missing.
- **AI code generators** — Dockerfile and GitHub Actions workflow generation based on tech stack detection.
- **AI log analyzer** — paste deployment or app logs for automated error diagnostics and suggested fixes.
- **Real-time monitoring** — live CPU, RAM, and network metrics with socket.io push. Rolling 20-entry history.
- **Deployment dashboard** — per-project deployment history with status, duration, logs, and health checks.
- **OAuth authentication** — Google and GitHub login with JWT access + refresh tokens.
- **Subdomain routing** — each project gets a unique `*.lvh.me` subdomain; Nginx reverse-proxies to the running container.
- **Prometheus + Grafana** — built-in monitoring stack with pre-configured dashboards.
- **Socket.io** — real-time deployment logs and metric streaming to connected clients.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Recharts, Framer Motion, React Router 7 |
| Backend | Node.js 20+, Express 5, Mongoose 8, Socket.IO 4, Passport.js |
| Database | MongoDB 7, Redis 7 |
| AI | Google Gemini API (plus fallback rule-based generators) |
| Monitoring | Prometheus, Grafana, `systeminformation`, `prom-client` |
| Infrastructure | Docker multi-stage build, docker-compose (6 services) |
| CI/CD | GitHub Actions (lint → build → Docker) |
| Proxy | Nginx with wildcard `*.lvh.me` subdomain routing |

---

## Architecture

```
User ──► Frontend (:5173) ──proxy──► Backend (:5000) ──► MongoDB
                                          │                  │
                                          ├──► Redis          │
                                          ├──► Docker daemon  │
                                          └──► Socket.IO ─────┘
```

Routes:

| Path | Description |
|---|---|
| `/` | Landing page |
| `/login`, `/register` | Auth forms |
| `/dashboard` | System stats + AI insights + recent projects |
| `/projects` | Project CRUD |
| `/projects/:id` | Deployment history + logs + deploy button |
| `/ai` | Dockerfile & workflow generators |
| `/ai/logs` | AI log analyzer |
| `/monitoring` | Live CPU/RAM/network metrics + system logs |
| `/oauth/callback` | OAuth redirect handler |

---

## Quick Start

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- Redis (optional, graceful fallback)
- Docker Desktop (for deployment pipeline)

### Installation

```bash
git clone https://github.com/your-org/devopspilot-ai.git
cd devopspilot-ai

# Install all dependencies
npm run setup

# Configure environment
cp .env.example apps/backend/.env
# Edit apps/backend/.env with your values
```

### Development

```bash
# Start both backend + frontend
npm run dev
# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

Or individually:

```bash
npm run dev:backend   # nodemon server.js
npm run dev:frontend  # vite dev server
```

### Production (Docker)

```bash
docker compose up -d
```

Starts 6 services: backend, MongoDB 7, Redis 7, Nginx, Prometheus, Grafana.

---

## Configuration

Key environment variables (`apps/backend/.env`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Backend server port |
| `MONGODB_URI` | `mongodb://localhost:27017/devopspilot` | MongoDB connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `JWT_SECRET` | — | Access token signing key |
| `JWT_REFRESH_SECRET` | — | Refresh token signing key |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `GITHUB_CLIENT_ID` | — | GitHub OAuth client ID |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |
| `PLATFORM_BASE_DOMAIN` | `lvh.me` | Domain for subdomain routing |
| `DEPLOY_BASE_PORT` | `4000` | Starting port for container host mapping |

---

## API Overview

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/github` | GitHub OAuth |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| DELETE | `/api/projects/:id` | Delete project |

### Deployments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/deployments/:projectId` | List deployments for a project |
| POST | `/api/deployments/:projectId` | Create and run deployment |

### AI

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/generate-dockerfile` | Generate Dockerfile |
| POST | `/api/ai/generate-workflow` | Generate GitHub Actions workflow |
| POST | `/api/ai/analyze-logs` | Analyze deployment logs |

### Monitoring

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/monitoring/metrics` | CPU, RAM, network metrics |
| GET | `/api/monitoring/history` | Deployment history aggregation |
| GET | `/api/monitoring/stats` | Total deployments, active projects |
| GET | `/api/monitoring/insights` | System insights |
| GET | `/api/monitoring/logs` | Recent deployment logs |

---

## Project Structure

```
devopspilot-ai/
├── apps/
│   ├── backend/
│   │   ├── config/          # MongoDB + Redis connection
│   │   ├── controllers/     # Route handlers (auth, project, deployment, AI, monitoring)
│   │   ├── middleware/       # Auth guard, rate limiters, subdomain proxy
│   │   ├── models/          # Mongoose schemas (User, Project, Deployment)
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business logic (deployment pipeline, AI, domain, GitHub)
│   │   ├── socket/          # Socket.IO initialization + auth
│   │   └── server.js        # Entry point
│   └── frontend/
│       ├── src/
│       │   ├── api/         # Axios client with token refresh interceptor
│       │   ├── components/  # Layout, error boundary, route guard
│       │   ├── context/     # Auth context/provider
│       │   ├── hooks/       # useAuth hook
│       │   └── pages/       # All route pages (10 pages)
│       ├── public/          # Static assets
│       └── index.html
├── docker-compose.yml       # 6-service stack
├── Dockerfile               # Multi-stage build (backend + frontend)
├── nginx/
│   └── nginx.conf           # Wildcard subdomain proxy
├── monitoring/
│   ├── prometheus.yml       # Scrape config
│   └── grafana_dashboard.json
└── .github/workflows/
    └── ci.yml               # GitHub Actions
```

---

## Deployment Pipeline

When you click **Deploy**, the backend:

1. **Clones** the GitHub repo to a temp directory
2. **Checks** Docker daemon availability
3. **Detects** tech stack from `package.json` (Vite, React, Express, Vue, Angular, Next.js, Python, Go, Rust, or static HTML)
4. **Auto-generates** a Dockerfile if none exists and pushes it to the repo
5. **Builds** the Docker image
6. **Runs** the container with port mapping
7. **Health checks** against `/api/health`, `/health`, `/`
8. **Cleans up** on failure (container logs, container removal, workspace deletion)

On success: status → `success`, `deployedUrl` and `localUrl` are saved to the deployment record for display in the UI.

---

## License

MIT
