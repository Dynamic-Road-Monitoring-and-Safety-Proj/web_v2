from fastapi import APIRouter, HTTPException, BackgroundTasks
from pathlib import Path
import json
from app.services.pipeline import process_video_pipeline
from app.services.metrics import merge_metrics
from app.core.config import VIDEO_DIR, CSV_DIR, PROCESSED_VIDEOS_FILE

router = APIRouter()


@router.get("/process/status")
async def get_processing_status():
    """Get the count of processed and unprocessed videos."""
    # Get all video files
    video_files = list(VIDEO_DIR.glob("*.mp4")) + list(VIDEO_DIR.glob("*.avi")) + list(VIDEO_DIR.glob("*.mov"))
    
    # Get processed videos list
    processed_videos = []
    if PROCESSED_VIDEOS_FILE.exists():
        try:
            with open(PROCESSED_VIDEOS_FILE, 'r') as f:
                processed_list = json.load(f)
                processed_videos = [item['filename'] for item in processed_list if item.get('status') == 'completed']
        except:
            pass
    
    # Count unprocessed
    unprocessed = [v.name for v in video_files if v.name not in processed_videos]
    
    return {
        "total_videos": len(video_files),
        "processed": len(processed_videos),
        "unprocessed": len(unprocessed),
        "unprocessed_files": unprocessed
    }


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


@router.post("/process-all")
async def process_all_endpoint(background_tasks: BackgroundTasks):
    """Process all unprocessed videos with their matching CSVs."""
    # Get all video files
    video_files = list(VIDEO_DIR.glob("*.mp4")) + list(VIDEO_DIR.glob("*.avi")) + list(VIDEO_DIR.glob("*.mov"))
    csv_files = list(CSV_DIR.glob("*.csv"))
    
    if not video_files:
        raise HTTPException(status_code=404, detail="No video files found")
    if not csv_files:
        raise HTTPException(status_code=404, detail="No CSV files found")
    
    # Match videos with CSVs by date
    pairs_to_process = []
    for video_path in video_files:
        video_date = video_path.stem.split('_')[0]  # Extract date from filename like 2025-11-28_HH-MM-SS
        
        # Find matching CSV
        matching_csv = None
        for csv_path in csv_files:
            if video_date in csv_path.stem:
                matching_csv = csv_path
                break
        
        if matching_csv:
            pairs_to_process.append((video_path, matching_csv))
        else:
            print(f"Warning: No matching CSV found for video {video_path.name}")
    
    if not pairs_to_process:
        raise HTTPException(status_code=404, detail="No matching video-CSV pairs found")
    
    # Run all in background
    background_tasks.add_task(run_batch_pipeline, pairs_to_process)
    
    return {
        "message": "Batch processing started",
        "total_pairs": len(pairs_to_process),
        "pairs": [{"video": v.name, "csv": c.name} for v, c in pairs_to_process]
    }


def run_batch_pipeline(pairs: list):
    """Process multiple video-CSV pairs."""
    print(f"Starting batch pipeline for {len(pairs)} pairs", flush=True)
    for video_path, csv_path in pairs:
        try:
            run_full_pipeline(video_path, csv_path)
        except Exception as e:
            print(f"Error processing {video_path.name}: {e}")
    print("Batch pipeline complete!", flush=True)


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
