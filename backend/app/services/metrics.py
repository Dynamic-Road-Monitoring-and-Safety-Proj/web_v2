import csv
import json
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict
import statistics
from app.core.config import FINAL_METRICS_FILE

WINDOW_SECONDS = 5

def parse_csv_timestamp(time_str, date_str):
    """Parse CSV timestamp format: HH:MM:SS.mmm with provided date"""
    full_str = f"{date_str} {time_str}"
    # Handle potential format variations if needed
    try:
        return datetime.strptime(full_str, "%Y-%m-%d %H:%M:%S.%f")
    except ValueError:
        # Fallback for timestamps without milliseconds
        return datetime.strptime(full_str, "%Y-%m-%d %H:%M:%S")

def parse_json_timestamp(filename):
    """Parse JSON filename: YYYY-MM-DD_HH-MM-SS_frame_X.jpg"""
    parts = filename.split('_')
    date_part = parts[0]
    time_part = parts[1]
    dt_str = f"{date_part} {time_part.replace('-', ':')}"
    return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")

def merge_metrics(csv_path: Path, congestion_json_path: Path, pothole_json_path: Path):
    """
    Merges sensor data (CSV) with CV model detections (JSONs).
    """
    print(f"Merging metrics from {csv_path.name}...")
    
    # 1. Load Sensor Data
    sensor_data = []
    csv_date = csv_path.stem.split('_')[-1] # Assuming filename ends with date like sensor_data_2025-08-29.csv
    # If format is just YYYY-MM-DD.csv, handle that too
    if len(csv_date.split('-')) != 3:
         csv_date = csv_path.stem # Try the whole stem
    
    # Fallback if date parsing fails from filename, maybe get from first row or today
    try:
        datetime.strptime(csv_date, "%Y-%m-%d")
    except ValueError:
        csv_date = datetime.now().strftime("%Y-%m-%d")

    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                dt = parse_csv_timestamp(row['Time'], csv_date)
                
                # Handle different CSV formats
                if 'SensorType' in row:
                    # Format: Time,SensorType,Value1,Value2,Value3,Latitude,Longitude,Pothole
                    sensor_type = row['SensorType']
                    val1 = float(row['Value1'])
                    val2 = float(row['Value2'])
                    val3 = float(row['Value3'])
                    
                    sensor_data.append({
                        'timestamp': dt,
                        'type': sensor_type,
                        'x': val1,
                        'y': val2,
                        'z': val3,
                        'pothole_flag': int(row.get('Pothole', 0)),
                        'latitude': float(row.get('Latitude', 0)),
                        'longitude': float(row.get('Longitude', 0))
                    })
                else:
                    # Old Format: Time,AccX,AccY,AccZ,GyroX,GyroY,GyroZ,Latitude,Longitude,Pothole
                    # We split this into two readings for consistency or handle it differently.
                    # For simplicity, let's assume we can just add two entries or handle it in aggregation.
                    # But to keep aggregation logic simple, let's add two entries if both exist.
                    
                    common = {
                        'timestamp': dt,
                        'pothole_flag': int(row.get('Pothole', 0)),
                        'latitude': float(row.get('Latitude', 0)),
                        'longitude': float(row.get('Longitude', 0))
                    }
                    
                    if 'AccX' in row:
                        sensor_data.append({
                            **common,
                            'type': 'Accelerometer',
                            'x': float(row.get('AccX', 0)),
                            'y': float(row.get('AccY', 0)),
                            'z': float(row.get('AccZ', 0))
                        })
                    
                    if 'GyroX' in row:
                        sensor_data.append({
                            **common,
                            'type': 'Gyroscope',
                            'x': float(row.get('GyroX', 0)),
                            'y': float(row.get('GyroY', 0)),
                            'z': float(row.get('GyroZ', 0))
                        })

            except Exception as e:
                continue # Skip bad rows

    # 2. Load CV Data
    with open(pothole_json_path, 'r') as f:
        pothole_data = json.load(f)
    with open(congestion_json_path, 'r') as f:
        congestion_data = json.load(f)

    # Flatten CV data by timestamp
    cv_events = []
    
    # Process pothole data
    for date_key, frames in pothole_data.items():
        for frame_name, dets in frames.items():
            try:
                ts = parse_json_timestamp(frame_name)
                cv_events.append({
                    'timestamp': ts,
                    'type': 'pothole_cv',
                    'data': dets
                })
            except: continue

    # Process congestion data
    for date_key, frames in congestion_data.items():
        for frame_name, dets in frames.items():
            try:
                ts = parse_json_timestamp(frame_name)
                cv_events.append({
                    'timestamp': ts,
                    'type': 'congestion_cv',
                    'data': dets
                })
            except: continue
            
    # Sort all by timestamp
    sensor_data.sort(key=lambda x: x['timestamp'])
    cv_events.sort(key=lambda x: x['timestamp'])

    # 3. Detect Events and Aggregate
    events = []
    prev_flag = 0
    
    for i, reading in enumerate(sensor_data):
        curr_flag = reading['pothole_flag']
        
        # Trigger on 0 -> 1 transition
        if prev_flag == 0 and curr_flag == 1:
            start_time = reading['timestamp']
            end_time = start_time + timedelta(seconds=WINDOW_SECONDS)
            
            # Aggregate Sensor Data in Window
            window_readings = [
                r for r in sensor_data 
                if start_time <= r['timestamp'] <= end_time
            ]
            
            if not window_readings:
                continue
                
            # Aggregate CV Data in Window (look for nearest frames)
            # We look for frames within the window, but allow a small buffer for start time mismatch
            # especially since video frames might be tagged with start time only
            window_cv_pothole = [
                e['data'] for e in cv_events 
                if e['type'] == 'pothole_cv' and (start_time - timedelta(seconds=1)) <= e['timestamp'] <= end_time
            ]
            window_cv_congestion = [
                e['data'] for e in cv_events 
                if e['type'] == 'congestion_cv' and (start_time - timedelta(seconds=1)) <= e['timestamp'] <= end_time
            ]

            # --- Calculate Detailed Metrics ---

            # Helper functions
            def safe_mean(data): return statistics.mean(data) if data else 0.0
            def safe_stdev(data): return statistics.stdev(data) if len(data) > 1 else 0.0

            # Filter readings by type
            acc_readings = [r for r in window_readings if r.get('type') == 'Accelerometer']
            gyro_readings = [r for r in window_readings if r.get('type') == 'Gyroscope']

            # Sensor Stats
            acc_x_vals = [r['x'] for r in acc_readings]
            acc_y_vals = [r['y'] for r in acc_readings]
            acc_z_vals = [r['z'] for r in acc_readings]
            
            gyro_x_vals = [r['x'] for r in gyro_readings]
            gyro_y_vals = [r['y'] for r in gyro_readings]
            gyro_z_vals = [r['z'] for r in gyro_readings]
            
            lats = [r['latitude'] for r in window_readings]
            longs = [r['longitude'] for r in window_readings]

            ax_avg = safe_mean(acc_x_vals)
            ay_avg = safe_mean(acc_y_vals)
            az_avg = safe_mean(acc_z_vals)
            
            ax_std = safe_stdev(acc_x_vals)
            ay_std = safe_stdev(acc_y_vals)
            az_std = safe_stdev(acc_z_vals)
            
            az_spike = (max(acc_z_vals) - min(acc_z_vals)) if acc_z_vals else 0.0
            
            gx_avg = safe_mean(gyro_x_vals)
            gy_avg = safe_mean(gyro_y_vals)
            gz_avg = safe_mean(gyro_z_vals)
            
            # Gyro intensity: mean of magnitude of gyro vector
            gyro_mags = [(r['x']**2 + r['y']**2 + r['z']**2)**0.5 for r in gyro_readings]
            gyro_intensity = safe_mean(gyro_mags)

            # CV Stats - Pothole
            pothole_counts = [d.get('potholes', 0) for d in window_cv_pothole]
            pothole_sizes = [d.get('total_pothole_size', 0) for d in window_cv_pothole]
            
            frames_with_pothole = sum(1 for c in pothole_counts if c > 0)
            # Estimate total frames from congestion data (which is per-frame)
            total_frames_est = len(window_cv_congestion) if window_cv_congestion else (len(window_cv_pothole) if window_cv_pothole else 1)
            
            pothole_persistence = frames_with_pothole / total_frames_est if total_frames_est > 0 else 0.0
            avg_pothole_size = safe_mean(pothole_sizes)
            max_pothole_size = max(pothole_sizes) if pothole_sizes else 0.0

            # CV Stats - Congestion
            def get_vehicle_count(d):
                count = 0
                for k, v in d.items():
                    if not k.endswith('_coverage') and k != 'total_vehicle_coverage':
                        count += v
                return count

            vehicle_counts = [get_vehicle_count(d) for d in window_cv_congestion]
            vehicle_coverages = [d.get('total_vehicle_coverage', 0) for d in window_cv_congestion]
            
            avg_vehicles_per_frame = safe_mean(vehicle_counts)
            peak_vehicle_count = max(vehicle_counts) if vehicle_counts else 0
            avg_vehicle_coverage = safe_mean(vehicle_coverages)
            peak_vehicle_coverage = max(vehicle_coverages) if vehicle_coverages else 0.0

            # Derived Scores
            roughness_index = az_std * 10  # Heuristic
            impact_intensity = max([abs(x) for x in acc_z_vals]) if acc_z_vals else 0.0
            
            traffic_density_score = avg_vehicle_coverage * 20  # Heuristic
            
            traffic_level = "light"
            if traffic_density_score > 5: traffic_level = "moderate"
            if traffic_density_score > 10: traffic_level = "heavy"
            
            # Validation score heuristic
            validation_score = min(100, (pothole_persistence * 50) + (roughness_index * 5))
            
            event = {
                "event_timestamp": start_time.strftime("%Y-%m-%d %H:%M:%S"),
                "lat_center": safe_mean(lats),
                "lon_center": safe_mean(longs),
                "lat_min": min(lats) if lats else 0.0,
                "lat_max": max(lats) if lats else 0.0,
                "lon_min": min(longs) if longs else 0.0,
                "lon_max": max(longs) if longs else 0.0,
                "window_duration_sec": WINDOW_SECONDS,
                "validation_score": round(validation_score, 2),
                "roughness_index": round(roughness_index, 2),
                "impact_intensity": round(impact_intensity, 2),
                "traffic_level": traffic_level,
                "needs_attention": validation_score > 50,
                "ax_avg": ax_avg,
                "ay_avg": ay_avg,
                "az_avg": az_avg,
                "ax_std": ax_std,
                "ay_std": ay_std,
                "az_std": az_std,
                "az_spike": round(az_spike, 6),
                "gx_avg": gx_avg,
                "gy_avg": gy_avg,
                "gz_avg": gz_avg,
                "gyro_intensity": gyro_intensity,
                "pothole_confidence": 100.0 if frames_with_pothole > 0 else 0.0,
                "frames_with_pothole": frames_with_pothole,
                "total_frames": total_frames_est,
                "pothole_persistence": round(pothole_persistence, 3),
                "avg_pothole_size": avg_pothole_size,
                "max_pothole_size": max_pothole_size,
                "avg_vehicles_per_frame": avg_vehicles_per_frame,
                "peak_vehicle_count": peak_vehicle_count,
                "avg_vehicle_coverage": avg_vehicle_coverage,
                "peak_vehicle_coverage": peak_vehicle_coverage,
                "traffic_density_score": round(traffic_density_score, 2)
            }
            events.append(event)
            
        prev_flag = curr_flag

    # Save merged results
    final_output = {
        "metadata": {
            "total_events": len(events),
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "window_duration_sec": WINDOW_SECONDS
        },
        "events": events
    }

    with open(FINAL_METRICS_FILE, 'w') as f:
        json.dump(final_output, f, indent=2)
    
    return FINAL_METRICS_FILE

def calculate_severity(impact, size):
    # Simple heuristic
    score = (impact * 0.5) + (size * 100 * 0.5)
    return min(10.0, round(score, 2))
