# CropGuard — Crop Disease Detector

## Overview
CropGuard is an AI-powered crop disease detection platform for farmers. Upload a photo of a crop leaf and get instant disease identification, severity assessment, and ranked treatment recommendations (organic and chemical). Built as a full-stack web application with FastAPI backend and React frontend.

## Screenshots
_(coming soon)_

## Quick Start
To get started with development, run the following commands:
```bash
cp .env.example .env          # configure environment variables
make dev                      # start all services in Docker (development mode)
make migrate                  # run database migrations
make seed                     # populate seed data
```
- **Web App**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Interactive Documentation**: http://localhost:8000/docs (Swagger UI) / http://localhost:8000/redoc (ReDoc)

## Environment Variables Dictionary

| Variable | Scope | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Backend | ✅ | `postgresql+asyncpg://cropguard:cropguard@postgres:5432/cropguard` | Async PostgreSQL connection DSN string |
| `SECRET_KEY` | Backend | ✅ | `your-secret-key-here-min-32-chars-change-in-production` | Secret key used for signing JWT tokens. Must be at least 32 characters long in production. |
| `REDIS_URL` | Backend | ✅ | `redis://redis:6379/0` | Redis connection URL for background jobs and task queuing |
| `ALLOWED_ORIGINS` | Backend | ❌ | `["http://localhost:5173"]` | JSON array of CORS origin strings |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | ❌ | `10080` | JWT access token validity duration in minutes (defaults to 7 days) |
| `MAX_UPLOAD_SIZE_MB` | Backend | ❌ | `10` | Maximum permissible size of uploaded leaf images in MB |
| `UPLOAD_DIR` | Backend | ❌ | `uploads` | Directory folder where leaf photos are saved |
| `ENVIRONMENT` | Backend | ❌ | `development` | Target running mode: `development` or `production` |
| `POSTGRES_USER` | DB | ✅ | `cropguard` | Username credential for the PostgreSQL container |
| `POSTGRES_PASSWORD` | DB | ✅ | `cropguard` | Password credential for the PostgreSQL container |
| `POSTGRES_DB` | DB | ✅ | `cropguard` | Database name for database initialization |
| `VITE_API_URL` | Frontend | ✅ | `http://localhost:8000` | Target endpoint base for frontend client requests |
| `VITE_APP_NAME` | Frontend | ❌ | `CropGuard` | Display title of the application |
| `VITE_WEATHER_API_KEY` | Frontend | ❌ | — | OpenWeatherMap API key used for tracking outbreak maps |

## Core API Endpoints Reference

### 🔐 Authentication (`/api/v1/auth`)
* `POST /auth/register` - Create a new user profile. (Rate limit: `3/minute` per IP)
* `POST /auth/login` - Authenticate email and password to retrieve JWT tokens. (Rate limit: `5/minute` per IP)
* `GET /auth/me` - Fetch authenticated user details.
* `PATCH /auth/me` - Update profile fields (e.g. name, phone, language preference).
* `POST /auth/change-password` - Change the current user password.

### 🍃 Predictions (`/api/v1/predictions`)
* `POST /predictions` - Upload crop leaf image, run inference, and get treatment recommendation. (Rate limit: `10/minute` per user/IP)
* `GET /predictions` - Retrieve paginated and filtered historical scan records.
* `GET /predictions/{id}` - Fetch nested details of a single scan result.
* `PATCH /predictions/{id}/feedback` - Update user feedback correctness rating.
* `DELETE /predictions/{id}` - Delete prediction entry and remove image from disk.

### 🧪 Static Resources
* `GET /api/v1/crops` - Get list of supported agricultural crops.
* `GET /api/v1/diseases` - Retrieve dictionary of diagnostic plant diseases.

---

## Model Swap Guide

The machine learning inference layer is fully modularized and resides within `cropguard/backend/app/services/inference.py`. Follow these steps to swap the mock inference engine with a real model:

1. **Disable Mock Mode**:
   Set `MOCK_MODE = False` in `cropguard/backend/app/services/inference.py` (or load it from your environment config setting).
2. **Add Model Asset**:
   Copy your model weights file (e.g., PyTorch `.pt`/`.pth` or ONNX `.onnx`) to the `backend/app/models/` folder.
3. **Initialize the Model**:
   Load your model session or class at the module level or inside a `_load_model` function:
   ```python
   import onnxruntime as ort
   
   _session = None
   
   def get_session():
       global _session
       if _session is None:
           _session = ort.InferenceSession("app/models/crop_resnet50.onnx")
       return _session
   ```
4. **Implement Real Predict Logic**:
   Update `predict(image_bytes: bytes, db: AsyncSession)` to decode the raw bytes, preprocess the image into the required model tensor dimensions (e.g. `224x224` normalized float tensor), perform feedforward inference, extract the top classes and probabilities, and return an `InferenceResult` object.
   ```python
   # Example integration:
   async def predict(image_bytes: bytes, db: AsyncSession) -> InferenceResult:
       # Preprocess image
       input_tensor = preprocess_image(image_bytes) # shape (1, 3, 224, 224)
       
       # Run inference session
       ort_inputs = {get_session().get_inputs()[0].name: input_tensor}
       ort_outs = get_session().run(None, ort_inputs)
       
       # Process logits to softmax scores and map class indices to database class labels
       top5_scores = process_output(ort_outs)
       
       # Map database labels to build and return InferenceResult:
       return InferenceResult(
           top_prediction=top5_scores[0],
           top_5=top5_scores,
           is_healthy=top5_scores[0].class_label == "Healthy",
           model_version="resnet50-v1.0",
           inference_time_ms=elapsed_time_ms
       )
   ```

No other files in the codebase (controllers, models, schemas, or frontend views) need to change, as the prediction service fully adheres to the `InferenceResult` interface contracts.

---

## Development & Ops Reference

Execute these commands from the repository root:
```bash
make dev          # Start all containers in hot-reload mode
make down         # Spin down and clean up docker resources
make logs         # Tail consolidated container logs
make migrate      # Run pending database migrations
make seed         # Populates DB with crop, disease and admin users
make test         # Run pytest suite inside backend container
make lint         # Run backend code checks (ruff + black)
```

For frontend testing:
```bash
npm run typecheck --prefix frontend  # Run TypeScript verification
npm run lint --prefix frontend       # Run ESLint validation
npm run build --prefix frontend      # Compile production build
```

## Tech Stack
* **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 15 + PostGIS, Redis, Alembic, Pydantic v2
* **Frontend**: React 18, TypeScript, Vite, Zustand, TanStack Query, Vanilla CSS (harmonious dark-themed design system, glassmorphism), Leaflet, Recharts

## License
MIT
