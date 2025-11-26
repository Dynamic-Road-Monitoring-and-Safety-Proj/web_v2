from pathlib import Path

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

# Ensure directories exist
for path in [CSV_DIR, VIDEO_DIR, CONGESTION_OUTPUT_DIR, POTHOLE_OUTPUT_DIR, ANNOTATED_VIDEOS_DIR, FRAMES_FOLDER]:
    path.mkdir(parents=True, exist_ok=True)
