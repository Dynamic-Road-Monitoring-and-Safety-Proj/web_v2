from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import upload, process, dashboard
from app.core.config import OUTPUT_DIR
import time

app = FastAPI(title="Road Quality Monitoring Backend")

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

# Routers
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(process.router, prefix="/api", tags=["Process"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])

# Also mount without /api prefix for backwards compatibility
app.include_router(upload.router, tags=["Upload (no prefix)"])
app.include_router(process.router, tags=["Process (no prefix)"])
app.include_router(dashboard.router, tags=["Dashboard (no prefix)"])

# Serve static files (outputs)
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

@app.get("/")
def root():
    return {"message": "Road Quality Monitoring API is running"}
