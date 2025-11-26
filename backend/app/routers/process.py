from fastapi import APIRouter, HTTPException, BackgroundTasks
from pathlib import Path
from app.services.pipeline import process_video_pipeline
from app.services.metrics import merge_metrics
from app.core.config import VIDEO_DIR, CSV_DIR

router = APIRouter()

@router.post("/process/{video_filename}")
async def process_video_endpoint(video_filename: str, csv_filename: str, background_tasks: BackgroundTasks):
    video_path = VIDEO_DIR / video_filename
    csv_path = CSV_DIR / csv_filename
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="CSV file not found")

    # Run in background to avoid blocking
    background_tasks.add_task(run_full_pipeline, video_path, csv_path)
    
    return {"message": "Processing started", "video": video_filename, "csv": csv_filename}

def run_full_pipeline(video_path: Path, csv_path: Path):
    try:
        print(f"Starting pipeline for {video_path.name}", flush=True)
        # 1. Run CV Pipeline
        congestion_json, pothole_json = process_video_pipeline(video_path)
        
        if not congestion_json or not pothole_json:
            print("Pipeline failed to generate JSONs")
            return

        # 2. Merge Metrics
        final_output = merge_metrics(csv_path, congestion_json, pothole_json)
        print(f"Pipeline complete. Metrics saved to {final_output}")
        
    except Exception as e:
        print(f"Error in pipeline: {e}")
        import traceback
        traceback.print_exc()
