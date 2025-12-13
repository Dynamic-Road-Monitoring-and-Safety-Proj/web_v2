"""
Video processing pipeline with S3 integration and event extraction.
Processes videos from S3, runs ML models, stores events in PostgreSQL,
updates tile aggregates, and deletes processed videos from S3.
"""
import cv2
import json
import tempfile
import traceback
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import uuid
import csv
import asyncio
from functools import partial

import torch
from ultralytics import YOLO
from shapely.geometry import Polygon
from shapely.ops import unary_union

from app.core.config import (
    CONGESTION_MODEL_PATH, POTHOLE_MODEL_PATH,
    FRAMES_PER_SECOND, CONGESTION_CONFIDENCE, POTHOLE_CONFIDENCE,
    ANNOTATED_VIDEOS_DIR, FRAMES_FOLDER
)
from app.utils.tiles import lat_lon_to_tile_id, tile_id_to_center
from app.services.s3_service import s3_service, S3_BUCKET_RAW


# Load models globally
print("Loading ML models...")
device = 0 if torch.cuda.is_available() else 'cpu'
congestion_model = YOLO(str(CONGESTION_MODEL_PATH))
pothole_model = YOLO(str(POTHOLE_MODEL_PATH))
print(f"Models loaded on device: {device}")


def calculate_severity(detection: Dict) -> float:
    """
    Calculate severity score (0-100) from detection metrics.
    
    Args:
        detection: Detection dictionary with severity_components or metrics
        
    Returns:
        Severity score between 0-100
    """
    # Check for explicit severity_components
    components = detection.get('severity_components', {})
    if components:
        severity = (
            components.get('c', 0) * 0.30 +  # criticality
            components.get('s', 0) * 0.25 +  # size
            components.get('p', 0) * 0.20 +  # persistence
            components.get('i', 0) * 0.15 +  # impact
            components.get('v', 0) * 0.10    # visual quality
        )
        return min(max(severity, 0), 100)
    
    # Calculate from available metrics
    confidence = detection.get('confidence', 0)
    pothole_size = detection.get('total_pothole_size', 0)
    
    # Base severity on confidence and size
    base_severity = confidence * 50  # Confidence contributes up to 50
    
    # Size factor (pothole size as fraction of image)
    size_factor = min(pothole_size * 5000, 30)  # Up to 30 points for size
    
    # Detection type factor
    det_type = detection.get('type', '').lower()
    type_factor = 20 if 'pothole' in det_type else 10 if 'crack' in det_type else 5
    
    severity = base_severity + size_factor + type_factor
    return min(max(severity, 0), 100)


def calculate_congestion_severity(detection: Dict) -> float:
    """
    Calculate severity for congestion events.
    
    Args:
        detection: Congestion detection dictionary
        
    Returns:
        Severity score between 0-100
    """
    vehicle_coverage = detection.get('total_vehicle_coverage', 0)
    vehicle_count = detection.get('vehicle_count', 0)
    
    # Coverage-based severity (0-50)
    coverage_severity = vehicle_coverage * 100 * 50  # Coverage is 0-1 fraction
    
    # Vehicle count severity (0-50)
    count_severity = min(vehicle_count * 2, 50)  # Cap at 25 vehicles = 50 severity
    
    return min(coverage_severity + count_severity, 100)


def parse_csv_for_gps(csv_path: str) -> List[Dict]:
    """
    Parse CSV file to extract GPS coordinates and sensor data.
    
    Expected CSV format:
    timestamp,lat,lon,velocity,gyro_x,gyro_y,gyro_z,...
    
    Args:
        csv_path: Path to CSV file
        
    Returns:
        List of dictionaries with GPS and sensor data
    """
    data_points = []
    
    try:
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    data_point = {
                        'timestamp': row.get('timestamp') or row.get('time'),
                        'lat': float(row.get('lat') or row.get('latitude', 0)),
                        'lon': float(row.get('lon') or row.get('longitude', 0)),
                        'velocity': float(row.get('velocity') or row.get('speed', 0)),
                        'gyro_x': float(row.get('gyro_x', 0)),
                        'gyro_y': float(row.get('gyro_y', 0)),
                        'gyro_z': float(row.get('gyro_z', 0)),
                    }
                    
                    # Calculate gyro magnitude
                    data_point['gyro_magnitude'] = (
                        data_point['gyro_x']**2 + 
                        data_point['gyro_y']**2 + 
                        data_point['gyro_z']**2
                    ) ** 0.5
                    
                    if data_point['lat'] != 0 and data_point['lon'] != 0:
                        data_points.append(data_point)
                        
                except (ValueError, KeyError) as e:
                    continue
                    
    except Exception as e:
        print(f"Error parsing CSV: {e}")
    
    return data_points


def interpolate_gps_for_frame(
    frame_idx: int,
    total_frames: int,
    gps_data: List[Dict]
) -> Dict:
    """
    Interpolate GPS coordinates for a specific frame.
    
    Args:
        frame_idx: Frame index
        total_frames: Total number of frames
        gps_data: List of GPS data points
        
    Returns:
        Interpolated GPS data for the frame
    """
    if not gps_data:
        # Default to Chandigarh coordinates if no GPS data
        return {
            'lat': 30.7333,
            'lon': 76.7794,
            'velocity': 0,
            'gyro_magnitude': 0
        }
    
    # Calculate position in GPS data based on frame position
    position = (frame_idx / max(total_frames - 1, 1)) * (len(gps_data) - 1)
    idx_low = int(position)
    idx_high = min(idx_low + 1, len(gps_data) - 1)
    
    if idx_low == idx_high:
        return gps_data[idx_low]
    
    # Interpolation factor
    t = position - idx_low
    
    # Linear interpolation
    interpolated = {
        'lat': gps_data[idx_low]['lat'] * (1 - t) + gps_data[idx_high]['lat'] * t,
        'lon': gps_data[idx_low]['lon'] * (1 - t) + gps_data[idx_high]['lon'] * t,
        'velocity': gps_data[idx_low]['velocity'] * (1 - t) + gps_data[idx_high]['velocity'] * t,
        'gyro_magnitude': gps_data[idx_low]['gyro_magnitude'] * (1 - t) + gps_data[idx_high]['gyro_magnitude'] * t
    }
    
    return interpolated


def run_congestion_detection_on_frame(frame_path: str) -> Dict:
    """
    Run congestion model on a single frame.
    
    Args:
        frame_path: Path to frame image
        
    Returns:
        Detection results dictionary
    """
    results = congestion_model(str(frame_path), device=device, conf=CONGESTION_CONFIDENCE, verbose=False)
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
            confidence = box.conf[0].item()
            x1, y1, x2, y2 = map(float, box.xyxy[0])
            poly = Polygon([(x1, y1), (x2, y1), (x2, y2), (x1, y2)])
            
            detections[class_name] = detections.get(class_name, 0) + 1
            
            if class_name not in vehicle_polys:
                vehicle_polys[class_name] = []
            vehicle_polys[class_name].append(poly)
            all_vehicle_polys.append(poly)
    
    # Calculate coverage per class
    for class_name, polys in vehicle_polys.items():
        if polys:
            union = unary_union(polys)
            detections[f"{class_name}_coverage"] = round(union.area / img_area, 6)
    
    # Calculate total vehicle coverage
    if all_vehicle_polys:
        total_union = unary_union(all_vehicle_polys)
        detections["total_vehicle_coverage"] = round(total_union.area / img_area, 6)
    else:
        detections["total_vehicle_coverage"] = 0.0
    
    # Count total vehicles
    vehicle_classes = ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'auto', 'rickshaw']
    vehicle_count = sum(detections.get(cls, 0) for cls in vehicle_classes)
    detections["vehicle_count"] = vehicle_count
    
    return detections


def run_pothole_detection_on_frame(frame_path: str) -> Dict:
    """
    Run pothole/road damage model on a single frame.
    
    Args:
        frame_path: Path to frame image
        
    Returns:
        Detection results dictionary
    """
    results = pothole_model(str(frame_path), device=device, conf=POTHOLE_CONFIDENCE, verbose=False)
    img = cv2.imread(str(frame_path))
    h, w, _ = img.shape
    img_area = h * w
    
    output = {
        "potholes": 0,
        "road_cracks": 0,
        "barricades": 0,
        "bad_road": 0,
        "total_pothole_size": 0.0,
        "detections": []
    }
    
    pothole_polys = []
    
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0].item())
            class_name = result.names[class_id]
            confidence = box.conf[0].item()
            x1, y1, x2, y2 = map(float, box.xyxy[0])
            
            detection_info = {
                'class': class_name,
                'confidence': confidence,
                'bbox': [x1, y1, x2, y2]
            }
            output["detections"].append(detection_info)
            
            if class_name.lower() in ['pothole', 'potholes']:
                output["potholes"] += 1
                poly = Polygon([(x1, y1), (x2, y1), (x2, y2), (x1, y2)])
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


def extract_frames(video_path: str, output_dir: Path, fps: int = 4) -> Tuple[List[Path], int]:
    """
    Extract frames from video at specified FPS.
    
    Args:
        video_path: Path to video file
        output_dir: Directory to save frames
        fps: Target frames per second
        
    Returns:
        Tuple of (list of frame paths, total frame count)
    """
    cap = cv2.VideoCapture(str(video_path))
    video_fps = cap.get(cv2.CAP_PROP_FPS)
    total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if video_fps == 0:
        cap.release()
        return [], 0
    
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
            frame_filename = f"{video_name}_frame_{saved_count:05d}.jpg"
            frame_path = output_dir / frame_filename
            cv2.imwrite(str(frame_path), frame)
            frames.append(frame_path)
            saved_count += 1
        
        frame_count += 1
    
    cap.release()
    return frames, total_video_frames


def parse_model_outputs_to_events(
    upload_id: str,
    device_id: str,
    congestion_results: List[Dict],
    pothole_results: List[Dict],
    gps_data: List[Dict],
    video_timestamp: datetime
) -> List[Dict]:
    """
    Convert model outputs into standardized event dictionaries.
    
    Args:
        upload_id: UUID of the upload
        device_id: Device identifier
        congestion_results: List of congestion detections per frame
        pothole_results: List of pothole detections per frame
        gps_data: List of GPS data points
        video_timestamp: Base timestamp for the video
        
    Returns:
        List of event dictionaries ready for database insertion
    """
    events = []
    total_frames = max(len(congestion_results), len(pothole_results))
    
    # Process pothole/road damage events
    for frame_idx, result in enumerate(pothole_results):
        if result.get('potholes', 0) > 0 or result.get('road_cracks', 0) > 0:
            gps = interpolate_gps_for_frame(frame_idx, total_frames, gps_data)
            
            # Skip if no valid GPS
            if gps['lat'] == 0 and gps['lon'] == 0:
                continue
            
            tile_id = lat_lon_to_tile_id(gps['lat'], gps['lon'])
            
            # Determine event type
            if result.get('potholes', 0) > 0:
                event_type = 'pothole'
            else:
                event_type = 'crack'
            
            # Calculate timestamp for this frame
            frame_time_offset = frame_idx / max(FRAMES_PER_SECOND, 1)
            detected_at = datetime.fromtimestamp(
                video_timestamp.timestamp() + frame_time_offset
            )
            
            # Get confidence from detections
            confidence = 0.0
            for det in result.get('detections', []):
                if event_type.lower() in det.get('class', '').lower():
                    confidence = max(confidence, det.get('confidence', 0))
            
            event = {
                'event_id': str(uuid.uuid4()),
                'upload_id': upload_id,
                'event_type': event_type,
                'detected_at': detected_at,
                'device_id': device_id,
                'lat': gps['lat'],
                'lon': gps['lon'],
                'tile_id': tile_id,
                'model_outputs': {
                    'potholes': result.get('potholes', 0),
                    'road_cracks': result.get('road_cracks', 0),
                    'total_pothole_size': result.get('total_pothole_size', 0),
                    'detections': result.get('detections', []),
                    'frame_idx': frame_idx,
                    'velocity': gps['velocity'],
                    'gyro_magnitude': gps['gyro_magnitude']
                },
                'severity': calculate_severity({
                    'confidence': confidence,
                    'total_pothole_size': result.get('total_pothole_size', 0),
                    'type': event_type
                }),
                'confidence': confidence,
                'frame_refs': [f"frame_{frame_idx:05d}"]
            }
            events.append(event)
    
    # Process congestion events
    for frame_idx, result in enumerate(congestion_results):
        vehicle_count = result.get('vehicle_count', 0)
        coverage = result.get('total_vehicle_coverage', 0)
        
        # Only create event if significant congestion
        if vehicle_count >= 3 or coverage >= 0.15:
            gps = interpolate_gps_for_frame(frame_idx, total_frames, gps_data)
            
            if gps['lat'] == 0 and gps['lon'] == 0:
                continue
            
            tile_id = lat_lon_to_tile_id(gps['lat'], gps['lon'])
            
            frame_time_offset = frame_idx / max(FRAMES_PER_SECOND, 1)
            detected_at = datetime.fromtimestamp(
                video_timestamp.timestamp() + frame_time_offset
            )
            
            event = {
                'event_id': str(uuid.uuid4()),
                'upload_id': upload_id,
                'event_type': 'congestion',
                'detected_at': detected_at,
                'device_id': device_id,
                'lat': gps['lat'],
                'lon': gps['lon'],
                'tile_id': tile_id,
                'model_outputs': {
                    'vehicle_count': vehicle_count,
                    'total_vehicle_coverage': coverage,
                    'traffic_density_score': coverage * 100,
                    'frame_idx': frame_idx,
                    'velocity': gps['velocity'],
                    'class_counts': {
                        k: v for k, v in result.items() 
                        if k not in ['total_vehicle_coverage', 'vehicle_count'] 
                        and not k.endswith('_coverage')
                    }
                },
                'severity': calculate_congestion_severity(result),
                'confidence': 0.85,  # Model confidence for detection
                'frame_refs': [f"frame_{frame_idx:05d}"]
            }
            events.append(event)
    
    return events


async def process_video_from_s3(
    upload_id: str,
    s3_key_video: str,
    s3_key_csv: Optional[str],
    device_id: str,
    db_session
) -> List[Dict]:
    """
    Main processing function: download from S3, process, store events, delete from S3.
    
    Args:
        upload_id: UUID of the raw_uploads record
        s3_key_video: S3 key for video file
        s3_key_csv: S3 key for CSV file (optional)
        device_id: Device identifier
        db_session: Database session
        
    Returns:
        List of created events
    """
    from app.services.event_service import store_events_and_update_tiles, mark_upload_processed
    
    local_video_path = None
    local_csv_path = None
    
    try:
        print(f"[Pipeline] Starting processing for upload {upload_id}")
        
        # Download video from S3
        print(f"[Pipeline] Downloading video: {s3_key_video}")
        local_video_path = await s3_service.download_video(s3_key_video)
        
        # Download CSV if available
        gps_data = []
        if s3_key_csv:
            print(f"[Pipeline] Downloading CSV: {s3_key_csv}")
            local_csv_path = await s3_service.download_csv(s3_key_csv)
            gps_data = parse_csv_for_gps(local_csv_path)
            print(f"[Pipeline] Parsed {len(gps_data)} GPS data points")
        
        # Extract timestamp from filename (format: YYYY-MM-DD_HH-MM-SS.mp4)
        video_stem = Path(s3_key_video).stem
        try:
            date_part = video_stem.replace('-', '_').split('_')[:6]
            video_timestamp = datetime(
                int(date_part[0]), int(date_part[1]), int(date_part[2]),
                int(date_part[3]) if len(date_part) > 3 else 0,
                int(date_part[4]) if len(date_part) > 4 else 0,
                int(date_part[5]) if len(date_part) > 5 else 0
            )
        except:
            video_timestamp = datetime.now()
        
        # Create temporary directory for frames
        FRAMES_FOLDER.mkdir(parents=True, exist_ok=True)
        
        # Extract frames
        print(f"[Pipeline] Extracting frames at {FRAMES_PER_SECOND} FPS")
        frames, total_video_frames = extract_frames(
            local_video_path, 
            FRAMES_FOLDER, 
            fps=FRAMES_PER_SECOND
        )
        
        if not frames:
            print(f"[Pipeline] No frames extracted from video")
            return []
        
        print(f"[Pipeline] Extracted {len(frames)} frames")
        
        # Run detection models on each frame
        congestion_results = []
        pothole_results = []
        
        for idx, frame_path in enumerate(frames):
            if idx % 10 == 0:
                print(f"[Pipeline] Processing frame {idx + 1}/{len(frames)}")
            
            # Run congestion detection
            cong_result = run_congestion_detection_on_frame(str(frame_path))
            congestion_results.append(cong_result)
            
            # Run pothole detection
            pot_result = run_pothole_detection_on_frame(str(frame_path))
            pothole_results.append(pot_result)
            
            # Delete frame after processing
            try:
                frame_path.unlink()
            except:
                pass
        
        # Parse model outputs into events
        print(f"[Pipeline] Parsing model outputs to events")
        events = parse_model_outputs_to_events(
            upload_id=upload_id,
            device_id=device_id,
            congestion_results=congestion_results,
            pothole_results=pothole_results,
            gps_data=gps_data,
            video_timestamp=video_timestamp
        )
        
        print(f"[Pipeline] Generated {len(events)} events")
        
        # Store events and update tiles
        if events:
            print(f"[Pipeline] Storing events and updating tiles")
            await store_events_and_update_tiles(events, db_session)
        
        # Mark upload as processed
        await mark_upload_processed(upload_id, db_session)
        
        # Delete from S3
        print(f"[Pipeline] Deleting video from S3")
        await s3_service.delete_object(s3_key_video)
        
        if s3_key_csv:
            await s3_service.delete_object(s3_key_csv)
        
        print(f"[Pipeline] Processing complete for upload {upload_id}")
        return events
        
    except Exception as e:
        print(f"[Pipeline] Error processing upload {upload_id}: {e}")
        traceback.print_exc()
        raise
        
    finally:
        # Cleanup local files
        if local_video_path and Path(local_video_path).exists():
            try:
                Path(local_video_path).unlink()
            except:
                pass
        
        if local_csv_path and Path(local_csv_path).exists():
            try:
                Path(local_csv_path).unlink()
            except:
                pass


# For backward compatibility with local file processing
async def process_local_video_to_events(
    video_path: Path,
    csv_path: Optional[Path],
    device_id: str,
    db_session
) -> List[Dict]:
    """
    Process a local video file and store events.
    For use when videos are uploaded directly to server.
    """
    from app.services.event_service import store_events_and_update_tiles
    
    upload_id = str(uuid.uuid4())
    
    # Parse GPS data from CSV
    gps_data = []
    if csv_path and csv_path.exists():
        gps_data = parse_csv_for_gps(str(csv_path))
    
    # Extract timestamp from filename
    video_stem = video_path.stem
    try:
        date_part = video_stem.replace('-', '_').split('_')[:6]
        video_timestamp = datetime(
            int(date_part[0]), int(date_part[1]), int(date_part[2]),
            int(date_part[3]) if len(date_part) > 3 else 0,
            int(date_part[4]) if len(date_part) > 4 else 0,
            int(date_part[5]) if len(date_part) > 5 else 0
        )
    except:
        video_timestamp = datetime.now()
    
    # Create temporary directory for frames
    FRAMES_FOLDER.mkdir(parents=True, exist_ok=True)
    
    # Extract frames
    frames, total_video_frames = extract_frames(
        str(video_path),
        FRAMES_FOLDER,
        fps=FRAMES_PER_SECOND
    )
    
    if not frames:
        return []
    
    # Run detection models
    congestion_results = []
    pothole_results = []
    
    for frame_path in frames:
        cong_result = run_congestion_detection_on_frame(str(frame_path))
        congestion_results.append(cong_result)
        
        pot_result = run_pothole_detection_on_frame(str(frame_path))
        pothole_results.append(pot_result)
        
        try:
            frame_path.unlink()
        except:
            pass
    
    # Parse to events
    events = parse_model_outputs_to_events(
        upload_id=upload_id,
        device_id=device_id,
        congestion_results=congestion_results,
        pothole_results=pothole_results,
        gps_data=gps_data,
        video_timestamp=video_timestamp
    )
    
    # Store events
    if events:
        await store_events_and_update_tiles(events, db_session)
    
    return events
