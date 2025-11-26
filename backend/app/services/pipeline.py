import cv2
import json
import shutil
import torch
from pathlib import Path
from ultralytics import YOLO
from shapely.geometry import Polygon
from shapely.ops import unary_union
from datetime import datetime
from app.core.config import (
    CONGESTION_MODEL_PATH, POTHOLE_MODEL_PATH, 
    CONGESTION_OUTPUT_DIR, POTHOLE_OUTPUT_DIR, 
    ANNOTATED_VIDEOS_DIR, FRAMES_FOLDER, 
    FRAMES_PER_SECOND, CONGESTION_CONFIDENCE, POTHOLE_CONFIDENCE,
    SAVE_ANNOTATED_VIDEOS, PROCESSED_VIDEOS_FILE
)

# Load models globally to avoid reloading
print("Loading models...")
device = 0 if torch.cuda.is_available() else 'cpu'
congestion_model = YOLO(str(CONGESTION_MODEL_PATH))
pothole_model = YOLO(str(POTHOLE_MODEL_PATH))
print(f"Models loaded on {device}")

def extract_date_from_filename(filename):
    """Extract date from video filename in format: YYYY-MM-DD_HH-MM-SS.mp4"""
    try:
        date_part = filename.split('_')[0]
        return date_part
    except:
        return datetime.now().strftime("%Y-%m-%d")

def cleanup_temp_frames():
    """Clean up temporary frames folder."""
    if FRAMES_FOLDER.exists():
        for item in FRAMES_FOLDER.iterdir():
            try:
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
            except Exception as e:
                print(f"Warning: Could not delete {item}: {e}")

def extract_frames_at_fps(video_path, output_dir, fps=10):
    """Extract frames from video at specified FPS."""
    cap = cv2.VideoCapture(str(video_path))
    video_fps = cap.get(cv2.CAP_PROP_FPS)
    
    if video_fps == 0:
        print(f"Warning: Could not read FPS for {video_path}")
        cap.release()
        return []
    
    frame_interval = max(1, round(video_fps / fps))
    frames = []
    frame_count = 0
    saved_count = 0
    video_name = Path(video_path).stem
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_count % frame_interval == 0:
            frame_filename = f"{video_name}_frame_{saved_count}.jpg"
            frame_path = output_dir / frame_filename
            cv2.imwrite(str(frame_path), frame)
            frames.append(frame_path)
            saved_count += 1
        
        frame_count += 1
    
    cap.release()
    return frames

def run_congestion_detection(frame_path, model, device):
    results = model(str(frame_path), device=device, conf=CONGESTION_CONFIDENCE, verbose=False)
    img = cv2.imread(str(frame_path))
    h, w, _ = img.shape
    img_area = h * w
    
    detections = {}
    vehicle_polys = {}
    all_vehicle_polys = []
    
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0].item())
            class_name = result.names[class_id]
            x1, y1, x2, y2 = map(float, box.xyxy[0])
            poly = Polygon([(x1,y1),(x2,y1),(x2,y2),(x1,y2)])
            
            detections[class_name] = detections.get(class_name, 0) + 1
            
            if class_name not in vehicle_polys:
                vehicle_polys[class_name] = []
            vehicle_polys[class_name].append(poly)
            all_vehicle_polys.append(poly)
    
    for class_name, polys in vehicle_polys.items():
        if polys:
            union = unary_union(polys)
            detections[f"{class_name}_coverage"] = round(union.area / img_area, 6)
    
    if all_vehicle_polys:
        total_union = unary_union(all_vehicle_polys)
        detections["total_vehicle_coverage"] = round(total_union.area / img_area, 6)
    else:
        detections["total_vehicle_coverage"] = 0.0
    
    return detections

def run_pothole_detection(frame_path, model, device):
    results = model(str(frame_path), device=device, conf=POTHOLE_CONFIDENCE, verbose=False)
    img = cv2.imread(str(frame_path))
    h, w, _ = img.shape
    img_area = h * w
    
    output = {
        "potholes": 0,
        "road_cracks": 0,
        "barricades": 0,
        "bad_road": 0,
        "total_pothole_size": 0.0
    }
    
    pothole_polys = []
    
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0].item())
            class_name = result.names[class_id]
            x1, y1, x2, y2 = map(float, box.xyxy[0])
            
            if class_name.lower() in ['pothole', 'potholes']:
                output["potholes"] += 1
                poly = Polygon([(x1,y1),(x2,y1),(x2,y2),(x1,y2)])
                pothole_polys.append(poly)
            elif class_name.lower() in ['road_crack', 'road_cracks', 'crack', 'cracks']:
                output["road_cracks"] += 1
            elif class_name.lower() in ['barricade', 'barricades']:
                output["barricades"] += 1
            elif class_name.lower() in ['bad_road', 'bad road']:
                output["bad_road"] += 1
    
    if pothole_polys:
        union = unary_union(pothole_polys)
        output["total_pothole_size"] = round(union.area / img_area, 6)
    
    return output

def load_existing_results(json_path):
    if json_path.exists():
        with open(json_path, 'r') as f:
            return json.load(f)
    return {}

def save_results(results, json_path):
    with open(json_path, 'w') as f:
        json.dump(results, f, indent=2)

def update_processed_list(video_filename):
    """Update the list of processed videos."""
    processed_list = []
    if PROCESSED_VIDEOS_FILE.exists():
        try:
            with open(PROCESSED_VIDEOS_FILE, 'r') as f:
                processed_list = json.load(f)
        except:
            processed_list = []
    
    # Check if already exists
    for item in processed_list:
        if item['filename'] == video_filename:
            item['processed_at'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            item['status'] = 'completed'
            break
    else:
        processed_list.append({
            "filename": video_filename,
            "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "status": "completed"
        })
    
    with open(PROCESSED_VIDEOS_FILE, 'w') as f:
        json.dump(processed_list, f, indent=2)

def process_video_pipeline(video_path: Path):
    """
    Process a single video through both models.
    Returns paths to the generated JSON files.
    """
    video_name = video_path.name
    video_stem = video_path.stem
    video_date = extract_date_from_filename(video_stem)
    
    print(f"Processing video: {video_name}")
    
    # Extract frames
    frames = extract_frames_at_fps(video_path, FRAMES_FOLDER, fps=FRAMES_PER_SECOND)
    if not frames:
        print(f"No frames extracted from {video_name}")
        return None, None

    # Load existing results to append/update
    congestion_json_path = CONGESTION_OUTPUT_DIR / "detections.json"
    pothole_json_path = POTHOLE_OUTPUT_DIR / "detections.json"
    
    congestion_results = load_existing_results(congestion_json_path)
    pothole_results = load_existing_results(pothole_json_path)
    
    if video_date not in congestion_results:
        congestion_results[video_date] = {}
    if video_date not in pothole_results:
        pothole_results[video_date] = {}
    
    video_writer = None
    try:
        if SAVE_ANNOTATED_VIDEOS:
            first_frame = cv2.imread(str(frames[0]))
            if first_frame is None:
                print(f"Error: Could not read first frame {frames[0]}")
                return None, None
                
            height, width = first_frame.shape[:2]
            output_video_path = ANNOTATED_VIDEOS_DIR / f"{video_stem}_annotated.mp4"
            
            # Try avc1 codec for macOS compatibility, fallback to mp4v
            fourcc = cv2.VideoWriter_fourcc(*'avc1')
            video_writer = cv2.VideoWriter(str(output_video_path), fourcc, FRAMES_PER_SECOND, (width, height))
            
            if not video_writer.isOpened():
                print("Warning: Could not open video writer with avc1, trying mp4v")
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                video_writer = cv2.VideoWriter(str(output_video_path), fourcc, FRAMES_PER_SECOND, (width, height))
            
            print(f"Saving annotated video to: {output_video_path}")
    
        for idx, frame_path in enumerate(frames):
            frame_name = frame_path.name
            frame = cv2.imread(str(frame_path))
            
            if frame is None:
                print(f"Warning: Could not read frame {frame_path}")
                continue

            # Congestion
            congestion_det = run_congestion_detection(frame_path, congestion_model, device)
            if congestion_det:
                congestion_results[video_date][frame_name] = congestion_det
                
                if SAVE_ANNOTATED_VIDEOS:
                    results = congestion_model(str(frame_path), device=device, conf=CONGESTION_CONFIDENCE, verbose=False)
                    for result in results:
                        for box in result.boxes:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            class_name = result.names[int(box.cls[0].item())]
                            conf = box.conf[0].item()
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                            cv2.putText(frame, f"{class_name}: {conf:.2f}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Pothole
            pothole_det = run_pothole_detection(frame_path, pothole_model, device)
            filtered_pothole_det = {k: v for k, v in pothole_det.items() if v > 0}
            if filtered_pothole_det:
                pothole_results[video_date][frame_name] = filtered_pothole_det
            
            if SAVE_ANNOTATED_VIDEOS:
                results = pothole_model(str(frame_path), device=device, conf=POTHOLE_CONFIDENCE, verbose=False)
                for result in results:
                    for box in result.boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        class_name = result.names[int(box.cls[0].item())]
                        conf = box.conf[0].item()
                        
                        if 'pothole' in class_name.lower(): color = (0, 0, 255)
                        elif 'bad' in class_name.lower(): color = (255, 0, 0)
                        elif 'barricade' in class_name.lower(): color = (0, 255, 255)
                        else: color = (255, 0, 255)
                        
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        cv2.putText(frame, f"{class_name}: {conf:.2f}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            if SAVE_ANNOTATED_VIDEOS and video_writer:
                video_writer.write(frame)
            
            frame_path.unlink() # Delete temp frame

    except Exception as e:
        print(f"Error in processing loop: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if SAVE_ANNOTATED_VIDEOS and video_writer:
            video_writer.release()
            print("Video writer released")
    
    save_results(congestion_results, congestion_json_path)
    save_results(pothole_results, pothole_json_path)
    
    update_processed_list(video_name)
    
    return congestion_json_path, pothole_json_path
