<div align="center">

# 🌿 CropGuard

### Detect. Diagnose. Protect.

**AI-powered crop disease detection for the modern farmer.**  
Upload a leaf photo → get an instant diagnosis → receive ranked treatment recommendations.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Development Guide](#-development-guide)
- [Connecting a Real ML Model](#-connecting-a-real-ml-model)
- [Production Deployment](#-production-deployment)
- [CI / CD](#-ci--cd)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌱 Overview

CropGuard is a full-stack agricultural SaaS MVP that empowers farmers, agronomists, and agri-businesses to identify crop diseases early and act with precision. A farmer photographs a diseased leaf on their phone, uploads it to CropGuard, and receives:

- **Disease identification** with confidence score
- **Severity classification** (Low → Critical)
- **Ranked treatment options** — organic and chemical — with dosage, timing, and cost data
- **Outbreak heatmap** to track disease spread across regions
- **Personal scan history** with feedback loop for model improvement

The ML inference layer ships in **mock mode** out of the box and is architected so that swapping in a real PyTorch / ONNX model requires changes to exactly **one file**.

---

## ✨ Features

| Category | Features |
| :--- | :--- |
| **Authentication** | JWT-based register / login, profile management, password change, role-based access (farmer · agronomist · admin) |
| **Diagnosis** | Drag-and-drop image upload, mock inference engine, confidence meter, top-5 prediction breakdown |
| **Treatments** | Organic & chemical treatment library per disease, filterable by type and effectiveness, dosage & waiting periods |
| **History** | Paginated scan history, date & health filters, full detail view with nested disease and treatment data |
| **Dashboard** | Real-time stats from DB, weekly scan trend chart, most-detected disease card |
| **Outbreak Map** | Geo-clustered heatmap of disease detections using Leaflet + PostGIS-ready backend |
| **Admin Panel** | User management, prediction audit log, seed data trigger |
| **i18n** | English + Hindi UI, language switcher in topbar, preference persisted to user profile |
| **PWA Ready** | `manifest.json` + cache-first service worker, installable on Android/iOS |
| **Performance** | `React.memo`, `useMemo`, `useCallback`, `loading="lazy"` on images, gzip middleware |
| **Security** | slowapi rate limiting, JWT auth, bcrypt passwords, CORS lockdown, Gzip |
| **Observability** | Structured HTTP request logging: `[timestamp] METHOD /path STATUS DURATIONms user_id=xxx` |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / PWA                        │
│          React 18 + TypeScript + Vite + Zustand             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST
┌──────────────────────────▼──────────────────────────────────┐
│                  Nginx Reverse Proxy                         │
│           (SSL termination in production)                    │
└──────────┬────────────────────────────────┬─────────────────┘
           │                                │
┌──────────▼──────────┐          ┌──────────▼──────────┐
│   FastAPI Backend   │          │   Static Files       │
│   Python 3.11       │          │   (/uploads)         │
│   Uvicorn ASGI      │          └─────────────────────-┘
└──────┬──────┬───────┘
       │      │
┌──────▼──┐ ┌─▼────────────┐ ┌─────────────────────┐
│PostgreSQL│ │    Redis     │ │   Celery Worker      │
│15+PostGIS│ │  7-alpine    │ │  (async task queue)  │
└──────────┘ └──────────────┘ └─────────────────────┘
```

All services are containerised via **Docker Compose**. Development uses hot-reload mounts; production uses multi-stage optimised images behind Nginx.

---

## 🛠 Tech Stack

### Backend
| Layer | Technology |
| :--- | :--- |
| Runtime | Python 3.11 |
| Framework | FastAPI 0.111+ |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Auth | python-jose (HS256 JWT) · passlib (bcrypt, 12 rounds) |
| Validation | Pydantic v2 |
| Rate Limiting | slowapi |
| Task Queue | Celery + Redis |
| Image Processing | Pillow |
| Settings | pydantic-settings |
| Linting | ruff · black |
| Testing | pytest · httpx (async) |

### Frontend
| Layer | Technology |
| :--- | :--- |
| Framework | React 18 + TypeScript (strict mode) |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| Global State | Zustand |
| Server State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios (interceptors for auth + 401 redirect) |
| UI Primitives | Radix UI (headless, accessible) |
| Styling | Tailwind CSS v3 (custom dark design system) |
| Maps | Leaflet + React Leaflet |
| Charts | Recharts |
| i18n | i18next + react-i18next |
| Toasts | Sonner |
| 3D Elements | Three.js + React Three Fiber (landing page) |

### Infrastructure
| Layer | Technology |
| :--- | :--- |
| Database | PostgreSQL 15 + PostGIS |
| Cache / Queue | Redis 7 |
| Containers | Docker + Docker Compose |
| Reverse Proxy | Nginx (production) |
| CI | GitHub Actions |
| Storage | Local filesystem (S3-compatible interface) |

---

## 📁 Project Structure

```
cropguard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py                  # Shared FastAPI dependencies
│   │   │   └── v1/
│   │   │       ├── router.py            # API router aggregator
│   │   │       └── endpoints/           # auth · predictions · diseases
│   │   │                                # treatments · stats · admin
│   │   ├── core/
│   │   │   ├── config.py                # pydantic-settings (all env vars)
│   │   │   ├── database.py              # Async SQLAlchemy engine + session
│   │   │   ├── exceptions.py            # Typed exception hierarchy
│   │   │   ├── limiter.py               # slowapi rate limiting config
│   │   │   └── security.py             # JWT + bcrypt helpers
│   │   ├── models/                      # SQLAlchemy ORM models
│   │   ├── schemas/                     # Pydantic v2 request/response schemas
│   │   ├── services/
│   │   │   ├── inference.py             # ⭐ ML inference layer (mock / real)
│   │   │   ├── image_processor.py       # Upload validation + thumbnail gen
│   │   │   └── stats_service.py         # Dashboard aggregation queries
│   │   ├── seeds/                       # Idempotent DB seed scripts
│   │   └── main.py                      # FastAPI app factory
│   ├── alembic/                         # Database migrations
│   ├── tests/                           # pytest test suite
│   ├── Dockerfile                        # Dev image
│   ├── Dockerfile.prod                   # Multi-stage production image
│   └── requirements.txt / requirements.dev.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/                         # Typed Axios API clients
│   │   ├── components/
│   │   │   ├── layout/                  # AppLayout · Sidebar · TopBar
│   │   │   ├── ui/                      # Button · Card · Badge · Input …
│   │   │   └── 3d/                      # Three.js landing page canvas
│   │   ├── i18n/
│   │   │   └── locales/en.json          # English + Hindi translation files
│   │   │                hi.json
│   │   ├── pages/                       # Route-level page components
│   │   ├── store/                       # Zustand auth store
│   │   ├── styles/                      # Design tokens + global CSS
│   │   └── types/index.ts               # All shared TypeScript interfaces
│   ├── public/
│   │   ├── manifest.json                # PWA manifest
│   │   └── sw.js                        # Cache-first service worker
│   ├── eslint.config.js                 # ESLint v9 flat config
│   └── Dockerfile / Dockerfile.prod
│
├── nginx/                               # Reverse proxy config (production)
├── .github/workflows/ci.yml            # CI pipeline
├── docker-compose.yml                  # Development
├── docker-compose.prod.yml             # Production
├── Makefile                             # Developer shortcut commands
└── .env.example                         # Environment variable template
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 24+
- [Git](https://git-scm.com)
- Make (Linux/macOS built-in; Windows: `winget install GnuWin32.Make`)

### 1. Clone & Configure

```bash
git clone https://github.com/Yuvraj-018/Crop-Disease-Detector.git
cd Crop-Disease-Detector

# Copy the environment template and fill in your values
cp .env.example .env
```

> **Important:** Open `.env` and at minimum set a strong `SECRET_KEY` (min 32 chars).

### 2. Start All Services

```bash
make dev
```

This builds and starts: **postgres · redis · backend · celery_worker · frontend** with full hot-reload.

### 3. Initialise the Database

```bash
make migrate   # Run Alembic migrations
make seed      # Populate crops, diseases, treatments & admin user
```

### 4. Open the App

| Service | URL |
| :--- | :--- |
| Web Application | http://localhost:5173 |
| API (JSON) | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Health Check | http://localhost:8000/health |

**Default admin credentials** (seeded):
```
Email:    admin@cropguard.app
Password: Admin@1234
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

### Backend

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | ✅ | `postgresql+asyncpg://cropguard:cropguard@postgres:5432/cropguard` | Async PostgreSQL DSN |
| `SECRET_KEY` | ✅ | — | JWT signing secret — **minimum 32 characters**, rotate in production |
| `REDIS_URL` | ✅ | `redis://redis:6379/0` | Redis DSN for Celery broker + rate limiter |
| `ALLOWED_ORIGINS` | ❌ | `["http://localhost:5173"]` | JSON array of permitted CORS origins |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | `10080` | JWT token lifetime in minutes (default: 7 days) |
| `MAX_UPLOAD_SIZE_MB` | ❌ | `10` | Maximum image upload size in MB |
| `UPLOAD_DIR` | ❌ | `uploads` | Server-side directory where leaf images are stored |
| `ENVIRONMENT` | ❌ | `development` | `development` or `production` — controls debug modes |

### Database (Docker Compose)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `POSTGRES_USER` | ✅ | `cropguard` | PostgreSQL superuser for the container |
| `POSTGRES_PASSWORD` | ✅ | `cropguard` | PostgreSQL password — change in production |
| `POSTGRES_DB` | ✅ | `cropguard` | Database name to create on first run |

### Frontend

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | ✅ | `http://localhost:8000` | Backend base URL used by Axios |
| `VITE_APP_NAME` | ❌ | `CropGuard` | Application display name |
| `VITE_WEATHER_API_KEY` | ❌ | — | [OpenWeatherMap](https://openweathermap.org/api) key for the weather widget |

---

## 📡 API Reference

Full interactive documentation is available at **http://localhost:8000/docs** (Swagger UI).

### Authentication — `/api/v1/auth`

| Method | Endpoint | Auth | Rate Limit | Description |
| :---: | :--- | :---: | :--- | :--- |
| `POST` | `/auth/register` | ❌ | 3 req/min per IP | Create a new user account |
| `POST` | `/auth/login` | ❌ | 5 req/min per IP | Authenticate and receive a JWT |
| `GET` | `/auth/me` | ✅ | — | Get current authenticated user profile |
| `PATCH` | `/auth/me` | ✅ | — | Update profile (name, region, language) |
| `POST` | `/auth/change-password` | ✅ | — | Change password |

### Predictions — `/api/v1/predictions`

| Method | Endpoint | Auth | Rate Limit | Description |
| :---: | :--- | :---: | :--- | :--- |
| `POST` | `/predictions` | ✅ | 10 req/min per user | Upload image → run inference → return diagnosis |
| `GET` | `/predictions` | ✅ | — | Paginated, filtered scan history |
| `GET` | `/predictions/{id}` | ✅ | — | Full prediction detail with nested disease & treatments |
| `PATCH` | `/predictions/{id}/feedback` | ✅ | — | Submit correctness feedback |
| `DELETE` | `/predictions/{id}` | ✅ | — | Delete prediction and remove image files |

### Library — `/api/v1`

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/crops` | ✅ | List all supported crops |
| `GET` | `/diseases` | ✅ | Disease catalogue with filter support |
| `GET` | `/diseases/{id}` | ✅ | Disease detail with treatments |
| `GET` | `/treatments` | ✅ | Filterable treatment library |
| `GET` | `/stats/overview` | ✅ | Dashboard aggregate statistics |

### Admin — `/api/v1/admin` *(role: admin)*

| Method | Endpoint | Description |
| :---: | :--- | :--- |
| `GET` | `/admin/users` | Paginated user list with search |
| `PATCH` | `/admin/users/{id}` | Update user role or status |
| `GET` | `/admin/predictions` | Global prediction audit log |

### Request / Response Format

All error responses follow a consistent envelope:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": null
  }
}
```

---

## 🧑‍💻 Development Guide

All commands are run from the **repository root**.

```bash
# ── Service Lifecycle ───────────────────────────────────────
make dev          # Build + start all services (hot-reload)
make down         # Stop and remove containers
make logs         # Tail all service logs

# ── Database ────────────────────────────────────────────────
make migrate      # Run pending Alembic migrations
make seed         # Seed crops, diseases, treatments, admin user
make shell-db     # Open psql inside the postgres container

# ── Testing & Quality ───────────────────────────────────────
make test         # Run pytest suite inside backend container
make lint         # Run ruff + black check on backend
make build        # Build production Docker images
```

### Frontend Commands
```bash
# Run inside cropguard/frontend/ or prefix with --prefix frontend
npm run dev           # Vite dev server (started automatically by make dev)
npm run typecheck     # TypeScript strict compile check (zero errors required)
npm run lint          # ESLint v9 flat config check
npm run build         # Production Vite bundle
```

### Running Backend Tests Locally (without Docker)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.dev.txt
pytest tests/ -v
```

### Code Quality Standards
- **Python**: PEP 8 enforced by `ruff`, formatting by `black`. Every function has a docstring.
- **TypeScript**: `strict: true` — zero `any` types, zero type errors.
- **No hardcoded config**: all URLs, secrets, and magic values come from `.env`.

---

## 🤖 Connecting a Real ML Model

The inference layer is fully decoupled. A mock engine ships by default and produces realistic dummy predictions drawn from the seeded disease database.

**You only need to edit one file:** `backend/app/services/inference.py`

### Step 1 — Disable Mock Mode

```python
# backend/app/services/inference.py
MOCK_MODE = False
```

### Step 2 — Add Your Model Weights

Place your weights file inside the container or mount it as a volume:
```
backend/app/models/your_model.onnx   # or .pt / .pth
```

### Step 3 — Load the Model

```python
import onnxruntime as ort

_session: ort.InferenceSession | None = None

def _get_session() -> ort.InferenceSession:
    global _session
    if _session is None:
        _session = ort.InferenceSession("app/models/crop_resnet50.onnx")
    return _session
```

### Step 4 — Implement `predict()`

Replace the mock body with your inference logic. The function signature and return type **must not change**:

```python
async def predict(image_bytes: bytes, db: AsyncSession) -> InferenceResult:
    # 1. Preprocess → (1, 3, 224, 224) float32 tensor normalised to ImageNet mean/std
    tensor = preprocess(image_bytes)

    # 2. Run ONNX session
    ort_inputs = {_get_session().get_inputs()[0].name: tensor}
    logits = _get_session().run(None, ort_inputs)[0]

    # 3. Softmax → top-5 class scores
    top5 = extract_top5(logits)   # list[ClassScore]

    return InferenceResult(
        top_prediction=top5[0],
        top_5=top5,
        is_healthy=(top5[0].class_label == "Healthy"),
        model_version="resnet50-v1.0",
        inference_time_ms=elapsed_ms,
    )
```

> **Zero other changes needed.** The API endpoints, database writes, frontend rendering, and treatment lookups all consume the `InferenceResult` contract — they are entirely unaware of whether the model is real or mocked.

### `class_label` Mapping

Your model's output class indices must map to the `class_label` column in the `diseases` table. The seeded labels follow **PlantVillage format**: `Tomato___Early_blight`, `Wheat___Leaf_rust`, etc. Update the seed data or your label map to keep them in sync.

---

## 🚢 Production Deployment

### Build Production Images

```bash
make build
# or
docker compose -f docker-compose.prod.yml build
```

### Start Production Stack

```bash
docker compose -f docker-compose.prod.yml up -d
```

The production stack adds:
- **Nginx** reverse proxy on port 80/443 (static files + API proxy)
- **Multi-stage Docker builds** — optimised image sizes
- No volume source mounts (immutable images)

### Pre-Launch Checklist

- [ ] `SECRET_KEY` is a cryptographically random 64-char string
- [ ] `POSTGRES_PASSWORD` is unique and not the default
- [ ] `ALLOWED_ORIGINS` lists only your production domain(s)
- [ ] `ENVIRONMENT=production`
- [ ] SSL/TLS termination configured in Nginx
- [ ] `make migrate && make seed` run against the production database
- [ ] Healthcheck endpoint `GET /health` returns `{"status": "ok"}`

---

## ⚙️ CI / CD

The GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:

| Job | Runs | What it checks |
| :--- | :--- | :--- |
| `backend-lint` | Ubuntu | `ruff check` + `black --check` |
| `backend-test` | Ubuntu + Postgres + Redis | `pytest tests/ -v` |
| `frontend-typecheck` | Ubuntu | `tsc --noEmit` (zero errors) |
| `frontend-lint` | Ubuntu | `eslint .` (zero errors) |
| `docker-build` | Ubuntu | `docker compose build` |

`docker-build` only runs after all other jobs pass.

To add repository secrets for future deployment steps:  
**GitHub → Settings → Secrets and variables → Actions**

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure all CI checks pass and code follows the project's quality standards.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

Built with ❤️ for farmers everywhere.

**[GitHub](https://github.com/Yuvraj-018/Crop-Disease-Detector)** · **[Report a Bug](https://github.com/Yuvraj-018/Crop-Disease-Detector/issues)** · **[Request a Feature](https://github.com/Yuvraj-018/Crop-Disease-Detector/issues)**

</div>
