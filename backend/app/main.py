from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import time
import os

from app.routers import upload, process, dashboard
from app.routers.tiles_mock import router as tiles_mock_router
from app.core.config import OUTPUT_DIR

USE_POSTGRES = os.getenv("USE_POSTGRES", "false").lower() == "true"


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting API...")
    if USE_POSTGRES:
        try:
            from app.db.database import init_db, check_db_connection
            if await check_db_connection():
                await init_db()
        except Exception as e:
            print(f"Database initialization failed: {e}")
    yield
    print("Shutting down...")


app = FastAPI(
    title="Road Quality Monitoring Backend",
    description="API for processing road monitoring videos and serving heatmap tile data",
    version="2.0.0",
    lifespan=lifespan
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    print(f"[REQUEST] {request.method} {request.url.path}", flush=True)
    response = await call_next(request)
    duration = time.time() - start_time
    print(f"[RESPONSE] {request.method} {request.url.path} - {response.status_code} ({duration:.2f}s)", flush=True)
    return response

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(process.router, prefix="/api", tags=["Process"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(tiles_mock_router, prefix="/api", tags=["Tiles Mock"])

# PostgreSQL-based routers
if USE_POSTGRES:
    from app.routers import tiles, events, uploads_s3
    app.include_router(tiles.router, prefix="/api", tags=["Tiles"])
    app.include_router(events.router, prefix="/api", tags=["Events"])
    app.include_router(uploads_s3.router, prefix="/api", tags=["Uploads S3"])

# Also mount without /api prefix for backwards compatibility
app.include_router(upload.router, tags=["Upload (no prefix)"])
app.include_router(process.router, tags=["Process (no prefix)"])
app.include_router(dashboard.router, tags=["Dashboard (no prefix)"])

# Serve static files (outputs)
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

@app.get("/")
def root():
    return {"message": "Road Quality Monitoring API is running"}
