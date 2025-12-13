from pathlib import Path
import os

# Base Directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Folders
UPLOADS_DIR = BASE_DIR / "uploads"
CSV_DIR = UPLOADS_DIR / "csv"
VIDEO_DIR = UPLOADS_DIR / "video"

OUTPUT_DIR = BASE_DIR / "output"
CONGESTION_OUTPUT_DIR = OUTPUT_DIR / "congestion"
POTHOLE_OUTPUT_DIR = OUTPUT_DIR / "pothole"
ANNOTATED_VIDEOS_DIR = OUTPUT_DIR / "annotated_vids"
FRAMES_FOLDER = OUTPUT_DIR / "temp_frames"
PROCESSED_VIDEOS_FILE = OUTPUT_DIR / "processed_videos.json"
FINAL_METRICS_FILE = OUTPUT_DIR / "pothole_events_metrics.json"

# Weights
WEIGHTS_DIR = BASE_DIR / "weights"
CONGESTION_MODEL_PATH = WEIGHTS_DIR / "best_Congestion.pt"
POTHOLE_MODEL_PATH = WEIGHTS_DIR / "best_Pothole.pt"

# Pipeline Settings
FRAMES_PER_SECOND = 4
CONGESTION_CONFIDENCE = 0.40
POTHOLE_CONFIDENCE = 0.35
SAVE_ANNOTATED_VIDEOS = True

# ===========================================
# NEW: PostgreSQL & S3 Configuration
# ===========================================

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/road_monitoring"
)
USE_POSTGRES = os.getenv("USE_POSTGRES", "false").lower() == "true"

# S3 Configuration
S3_BUCKET_RAW = os.getenv("S3_BUCKET_RAW", "road-monitoring-raw")
S3_BUCKET_PROCESSED = os.getenv("S3_BUCKET_PROCESSED", "road-monitoring-processed")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# Tile Configuration
TILE_SIZE_KM = 1.0
KM_TO_DEG_LAT = 0.009  # ~1 km in degrees latitude

# Aggregation Configuration
TILE_LAST_N_EVENTS = 20  # Use last N events per tile for aggregation

# Processing Configuration
DELETE_AFTER_PROCESSING = os.getenv("DELETE_AFTER_PROCESSING", "true").lower() == "true"

# ===========================================
# End of new configuration
# ===========================================

# Ensure directories exist
for path in [CSV_DIR, VIDEO_DIR, CONGESTION_OUTPUT_DIR, POTHOLE_OUTPUT_DIR, ANNOTATED_VIDEOS_DIR, FRAMES_FOLDER]:
    path.mkdir(parents=True, exist_ok=True)
