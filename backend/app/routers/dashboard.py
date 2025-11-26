from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from typing import List, Dict, Any
from app.core.config import OUTPUT_DIR

router = APIRouter()

@router.get("/dashboard/events")
async def get_dashboard_events():
    metrics_file = OUTPUT_DIR / "pothole_events_metrics.json"
    if not metrics_file.exists():
        return {"events": [], "metadata": {}}
    
    try:
        with open(metrics_file, "r") as f:
            data = json.load(f)
            
        # Transform data to match frontend Event interface if needed
        events = []
        for i, event in enumerate(data.get("events", [])):
            # Construct video URL from timestamp
            # Timestamp: "2025-11-12 10:37:18" -> Filename: "2025-11-12_10-37-18_annotated.mp4"
            timestamp = event.get("event_timestamp", "")
            base_filename = timestamp.replace(" ", "_").replace(":", "-")
            video_filename = f"{base_filename}_annotated.mp4"
            
            # Check if video exists (optional, but good for correctness)
            # video_path = OUTPUT_DIR / "annotated_vids" / video_filename
            # video_url = f"http://localhost:8000/output/annotated_vids/{video_filename}" if video_path.exists() else None
            
            # For now, just construct the URL assuming it exists or will exist
            video_url = f"http://localhost:8000/output/annotated_vids/{video_filename}"

            transformed_event = {
                "id": f"evt_{i+1:03d}",
                "lat_center": event.get("lat_center"),
                "lon_center": event.get("lon_center"),
                "event_timestamp": event.get("event_timestamp"),
                "pothole_confidence": event.get("pothole_confidence", 0) / 100.0, # Convert to 0-1 scale if needed, or keep as is. Mock data has 0.92
                "roughness_index": event.get("roughness_index"),
                "impact_intensity": event.get("impact_intensity"),
                "frames_with_pothole": event.get("frames_with_pothole"),
                "avg_vehicles_per_frame": event.get("avg_vehicles_per_frame"),
                "peak_vehicle_count": event.get("peak_vehicle_count"),
                "needs_attention": event.get("needs_attention"),
                "validation_score": event.get("validation_score", 0) / 100.0 if event.get("validation_score") > 1 else event.get("validation_score"),
                "sector": "Unknown Sector", # Placeholder as it's not in the JSON
                "street_name": "Unknown Street", # Placeholder
                "accel": {
                    "ax": event.get("ax_avg"),
                    "ay": event.get("ay_avg"),
                    "az": event.get("az_avg")
                },
                "gyro_intensity": event.get("gyro_intensity"),
                "az_spike": event.get("az_spike"),
                "video_url": video_url
            }
            events.append(transformed_event)
            
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading metrics file: {str(e)}")

@router.get("/dashboard/videos")
async def get_dashboard_videos():
    videos_file = OUTPUT_DIR / "processed_videos.json"
    if not videos_file.exists():
        return []
        
    try:
        with open(videos_file, "r") as f:
            videos = json.load(f)
            
        # Add URL to videos
        for video in videos:
            filename = video.get("filename")
            if filename:
                # Handle filename mismatch if needed (e.g. if json has .mp4 but file is _annotated.mp4)
                if not filename.endswith("_annotated.mp4") and filename.endswith(".mp4"):
                    filename = filename.replace(".mp4", "_annotated.mp4")
                
                video["url"] = f"http://localhost:8000/output/annotated_vids/{filename}"
                
        return videos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading videos file: {str(e)}")
