"""
Seed script to populate dummy data for Chandigarh region.
Run this to test the heatmap visualization.
"""
import asyncio
import random
import uuid
from datetime import datetime, timedelta

# Chandigarh region bounds
CHANDIGARH_CENTER = (30.7333, 76.7794)
CHANDIGARH_BOUNDS = {
    'min_lat': 30.68,
    'max_lat': 30.78,
    'min_lon': 76.72,
    'max_lon': 76.85
}

# Sample locations in Chandigarh with names
CHANDIGARH_LOCATIONS = [
    (30.7333, 76.7794, "Sector 17"),
    (30.7410, 76.7680, "Sector 22"),
    (30.7275, 76.8010, "Sector 35"),
    (30.7500, 76.7850, "Sector 8"),
    (30.7180, 76.7720, "Sector 43"),
    (30.7050, 76.8000, "IT Park"),
    (30.7600, 76.7600, "Sector 1"),
    (30.7350, 76.7550, "Sector 26"),
    (30.7150, 76.7900, "Sector 44"),
    (30.7450, 76.8100, "Sector 21"),
    (30.7250, 76.7650, "Sector 34"),
    (30.7380, 76.7950, "Sector 19"),
    (30.7100, 76.7800, "Sector 48"),
    (30.7550, 76.7750, "Sector 7"),
    (30.7200, 76.8100, "Mani Majra"),
]

def generate_dummy_events(num_events: int = 200):
    """Generate dummy events for Chandigarh region."""
    events = []
    
    for i in range(num_events):
        # Pick a base location and add some randomness
        base_lat, base_lon, area = random.choice(CHANDIGARH_LOCATIONS)
        
        # Add small random offset (within ~500m)
        lat = base_lat + random.uniform(-0.004, 0.004)
        lon = base_lon + random.uniform(-0.004, 0.004)
        
        # Random event type with weights
        event_type = random.choices(
            ['pothole', 'congestion', 'crack'],
            weights=[0.5, 0.35, 0.15]
        )[0]
        
        # Random timestamp in last 7 days
        detected_at = datetime.now() - timedelta(
            days=random.uniform(0, 7),
            hours=random.uniform(0, 24)
        )
        
        # Severity based on event type
        if event_type == 'pothole':
            severity = random.uniform(40, 95)
            confidence = random.uniform(0.75, 0.98)
            model_outputs = {
                'potholes': random.randint(1, 3),
                'total_pothole_size': random.uniform(0.001, 0.02),
                'detections': [{'class': 'pothole', 'confidence': confidence}]
            }
        elif event_type == 'congestion':
            severity = random.uniform(30, 85)
            confidence = random.uniform(0.80, 0.95)
            vehicle_count = random.randint(5, 25)
            model_outputs = {
                'vehicle_count': vehicle_count,
                'total_vehicle_coverage': random.uniform(0.15, 0.60),
                'traffic_density_score': severity,
            }
        else:  # crack
            severity = random.uniform(20, 60)
            confidence = random.uniform(0.70, 0.90)
            model_outputs = {
                'road_cracks': random.randint(1, 5),
                'detections': [{'class': 'crack', 'confidence': confidence}]
            }
        
        event = {
            'event_id': str(uuid.uuid4()),
            'event_type': event_type,
            'detected_at': detected_at.isoformat(),
            'device_id': f'device_{random.randint(1, 10):03d}',
            'lat': lat,
            'lon': lon,
            'severity': round(severity, 2),
            'confidence': round(confidence, 4),
            'model_outputs': model_outputs
        }
        events.append(event)
    
    return events


def generate_tile_aggregates(events: list):
    """Generate tile aggregates from events."""
    from collections import defaultdict
    import math
    
    KM_TO_DEG_LAT = 0.009
    
    def lat_lon_to_tile_id(lat, lon):
        tile_lat_idx = math.floor(lat / KM_TO_DEG_LAT)
        km_to_deg_lon = KM_TO_DEG_LAT / max(math.cos(math.radians(lat)), 0.01)
        tile_lon_idx = math.floor(lon / km_to_deg_lon)
        return f"T_{tile_lat_idx}_{tile_lon_idx}"
    
    def tile_id_to_center(tile_id):
        parts = tile_id.split('_')
        tile_lat_idx = int(parts[1])
        tile_lon_idx = int(parts[2])
        center_lat = (tile_lat_idx + 0.5) * KM_TO_DEG_LAT
        km_to_deg_lon = KM_TO_DEG_LAT / max(math.cos(math.radians(center_lat)), 0.01)
        center_lon = (tile_lon_idx + 0.5) * km_to_deg_lon
        return center_lat, center_lon
    
    # Group events by tile
    tile_events = defaultdict(list)
    for event in events:
        tile_id = lat_lon_to_tile_id(event['lat'], event['lon'])
        tile_events[tile_id].append(event)
    
    # Generate aggregates
    aggregates = []
    for tile_id, tile_event_list in tile_events.items():
        # Take last 20 events
        recent_events = sorted(tile_event_list, key=lambda x: x['detected_at'], reverse=True)[:20]
        
        center_lat, center_lon = tile_id_to_center(tile_id)
        
        pothole_count = sum(1 for e in recent_events if e['event_type'] == 'pothole')
        congestion_count = sum(1 for e in recent_events if e['event_type'] == 'congestion')
        crack_count = sum(1 for e in recent_events if e['event_type'] == 'crack')
        
        severities = [e['severity'] for e in recent_events]
        
        aggregate = {
            'tile_id': tile_id,
            'center_lat': center_lat,
            'center_lon': center_lon,
            'total_events': len(recent_events),
            'pothole_count': pothole_count,
            'congestion_count': congestion_count,
            'crack_count': crack_count,
            'avg_severity': round(sum(severities) / len(severities), 2) if severities else 0,
            'max_severity': round(max(severities), 2) if severities else 0,
            'avg_confidence': round(sum(e['confidence'] for e in recent_events) / len(recent_events), 4),
            'last_event_at': max(e['detected_at'] for e in recent_events)
        }
        aggregates.append(aggregate)
    
    return aggregates


# Store generated data in memory for the mock API
_cached_events = None
_cached_tiles = None

def get_dummy_data():
    """Get or generate dummy data."""
    global _cached_events, _cached_tiles
    
    if _cached_events is None:
        _cached_events = generate_dummy_events(300)
        _cached_tiles = generate_tile_aggregates(_cached_events)
    
    return _cached_events, _cached_tiles


def get_tiles_in_viewport(min_lat, max_lat, min_lon, max_lon):
    """Filter tiles within viewport."""
    _, tiles = get_dummy_data()
    
    return [
        t for t in tiles
        if min_lat <= t['center_lat'] <= max_lat
        and min_lon <= t['center_lon'] <= max_lon
    ]


def get_events_for_tile(tile_id):
    """Get events for a specific tile."""
    import math
    
    KM_TO_DEG_LAT = 0.009
    
    def lat_lon_to_tile_id(lat, lon):
        tile_lat_idx = math.floor(lat / KM_TO_DEG_LAT)
        km_to_deg_lon = KM_TO_DEG_LAT / max(math.cos(math.radians(lat)), 0.01)
        tile_lon_idx = math.floor(lon / km_to_deg_lon)
        return f"T_{tile_lat_idx}_{tile_lon_idx}"
    
    events, _ = get_dummy_data()
    
    return [
        e for e in events
        if lat_lon_to_tile_id(e['lat'], e['lon']) == tile_id
    ][:20]


if __name__ == "__main__":
    # Test generation
    events, tiles = get_dummy_data()
    print(f"Generated {len(events)} events")
    print(f"Generated {len(tiles)} tile aggregates")
    print(f"\nSample tile: {tiles[0]}")
    print(f"\nSample event: {events[0]}")
