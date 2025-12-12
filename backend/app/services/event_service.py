"""
Event service for database operations.
Handles inserting events and updating tile aggregates.
"""
import json
from datetime import datetime
from typing import List, Dict, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import uuid

from app.utils.tiles import lat_lon_to_tile_id, tile_id_to_center


# Configuration
TILE_LAST_N_EVENTS = 20  # Number of recent events to use for tile aggregation


async def store_events_and_update_tiles(events: List[Dict], db: AsyncSession):
    """
    Insert all events into events table and update affected tile aggregates.
    
    Args:
        events: List of event dictionaries
        db: Database session
    """
    affected_tiles: Set[str] = set()
    
    # Insert events
    for event in events:
        await db.execute(
            text("""
                INSERT INTO events (
                    event_id, upload_id, event_type, detected_at, device_id,
                    lat, lon, geom, tile_id, model_outputs,
                    severity, confidence, frame_refs, created_at
                ) VALUES (
                    :event_id, :upload_id, :event_type, :detected_at, :device_id,
                    :lat, :lon, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                    :tile_id, :model_outputs, :severity, :confidence, :frame_refs, NOW()
                )
                ON CONFLICT (event_id) DO NOTHING
            """),
            {
                'event_id': event.get('event_id') or str(uuid.uuid4()),
                'upload_id': event.get('upload_id'),
                'event_type': event['event_type'],
                'detected_at': event['detected_at'],
                'device_id': event.get('device_id'),
                'lat': event['lat'],
                'lon': event['lon'],
                'tile_id': event['tile_id'],
                'model_outputs': json.dumps(event['model_outputs']),
                'severity': float(event.get('severity', 0)),
                'confidence': float(event.get('confidence', 0)),
                'frame_refs': event.get('frame_refs', [])
            }
        )
        affected_tiles.add(event['tile_id'])
    
    await db.commit()
    
    # Update aggregates for each affected tile
    for tile_id in affected_tiles:
        await update_tile_aggregate(tile_id, db)


async def update_tile_aggregate(tile_id: str, db: AsyncSession):
    """
    Recompute tile aggregate using last-N events strategy.
    
    Args:
        tile_id: Tile identifier
        db: Database session
    """
    # Get stats from last N events for this tile
    result = await db.execute(
        text("""
            WITH last_n AS (
                SELECT 
                    event_type,
                    severity,
                    confidence,
                    model_outputs,
                    detected_at
                FROM events
                WHERE tile_id = :tile_id
                ORDER BY detected_at DESC
                LIMIT :limit
            )
            SELECT 
                COUNT(*) as total_events,
                COUNT(*) FILTER (WHERE event_type IN ('pothole')) as pothole_count,
                COUNT(*) FILTER (WHERE event_type = 'congestion') as congestion_count,
                COUNT(*) FILTER (WHERE event_type = 'crack') as crack_count,
                COALESCE(AVG(severity), 0) as avg_severity,
                COALESCE(MAX(severity), 0) as max_severity,
                COALESCE(AVG(confidence), 0) as avg_confidence,
                COALESCE(
                    AVG((model_outputs->>'traffic_density_score')::numeric) 
                    FILTER (WHERE event_type = 'congestion'), 
                    0
                ) as avg_congestion_score,
                COALESCE(
                    AVG((model_outputs->>'vehicle_count')::numeric)
                    FILTER (WHERE event_type = 'congestion'),
                    0
                ) as avg_vehicle_count,
                COALESCE(
                    MAX((model_outputs->>'vehicle_count')::integer)
                    FILTER (WHERE event_type = 'congestion'),
                    0
                ) as max_vehicle_count,
                COALESCE(
                    AVG((model_outputs->>'total_pothole_size')::numeric)
                    FILTER (WHERE event_type = 'pothole'),
                    0
                ) as avg_pothole_size,
                COALESCE(
                    MAX((model_outputs->>'total_pothole_size')::numeric)
                    FILTER (WHERE event_type = 'pothole'),
                    0
                ) as max_pothole_size,
                MAX(detected_at) as last_event_at
            FROM last_n
        """),
        {'tile_id': tile_id, 'limit': TILE_LAST_N_EVENTS}
    )
    
    stats = result.fetchone()
    
    if not stats or stats.total_events == 0:
        return
    
    # Calculate tile center
    center_lat, center_lon = tile_id_to_center(tile_id)
    
    # Upsert into tile_aggregates
    await db.execute(
        text("""
            INSERT INTO tile_aggregates (
                tile_id, window_type, total_events, pothole_count, congestion_count, crack_count,
                avg_severity, max_severity, avg_confidence,
                avg_congestion_score, avg_vehicle_count, max_vehicle_count,
                avg_pothole_size, max_pothole_size,
                center_lat, center_lon, last_updated, last_event_at
            ) VALUES (
                :tile_id, 'last_20', :total_events, :pothole_count, :congestion_count, :crack_count,
                :avg_severity, :max_severity, :avg_confidence,
                :avg_congestion_score, :avg_vehicle_count, :max_vehicle_count,
                :avg_pothole_size, :max_pothole_size,
                :center_lat, :center_lon, NOW(), :last_event_at
            )
            ON CONFLICT (tile_id, window_type) 
            DO UPDATE SET
                total_events = EXCLUDED.total_events,
                pothole_count = EXCLUDED.pothole_count,
                congestion_count = EXCLUDED.congestion_count,
                crack_count = EXCLUDED.crack_count,
                avg_severity = EXCLUDED.avg_severity,
                max_severity = EXCLUDED.max_severity,
                avg_confidence = EXCLUDED.avg_confidence,
                avg_congestion_score = EXCLUDED.avg_congestion_score,
                avg_vehicle_count = EXCLUDED.avg_vehicle_count,
                max_vehicle_count = EXCLUDED.max_vehicle_count,
                avg_pothole_size = EXCLUDED.avg_pothole_size,
                max_pothole_size = EXCLUDED.max_pothole_size,
                last_updated = NOW(),
                last_event_at = EXCLUDED.last_event_at
        """),
        {
            'tile_id': tile_id,
            'total_events': stats.total_events,
            'pothole_count': stats.pothole_count,
            'congestion_count': stats.congestion_count,
            'crack_count': stats.crack_count,
            'avg_severity': float(stats.avg_severity or 0),
            'max_severity': float(stats.max_severity or 0),
            'avg_confidence': float(stats.avg_confidence or 0),
            'avg_congestion_score': float(stats.avg_congestion_score or 0),
            'avg_vehicle_count': float(stats.avg_vehicle_count or 0),
            'max_vehicle_count': int(stats.max_vehicle_count or 0),
            'avg_pothole_size': float(stats.avg_pothole_size or 0),
            'max_pothole_size': float(stats.max_pothole_size or 0),
            'center_lat': center_lat,
            'center_lon': center_lon,
            'last_event_at': stats.last_event_at
        }
    )
    
    await db.commit()


async def mark_upload_processed(upload_id: str, db: AsyncSession):
    """
    Mark an upload as processed.
    
    Args:
        upload_id: Upload UUID
        db: Database session
    """
    await db.execute(
        text("""
            UPDATE raw_uploads 
            SET processing_status = 'completed', processed_at = NOW()
            WHERE upload_id = :upload_id
        """),
        {'upload_id': upload_id}
    )
    await db.commit()


async def mark_upload_failed(upload_id: str, error_message: str, db: AsyncSession):
    """
    Mark an upload as failed.
    
    Args:
        upload_id: Upload UUID
        error_message: Error description
        db: Database session
    """
    await db.execute(
        text("""
            UPDATE raw_uploads 
            SET processing_status = 'failed', 
                metadata = COALESCE(metadata, '{}') || jsonb_build_object('error', :error)
            WHERE upload_id = :upload_id
        """),
        {'upload_id': upload_id, 'error': error_message}
    )
    await db.commit()


async def get_tiles_in_viewport(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    db: AsyncSession,
    min_events: int = 1
) -> List[Dict]:
    """
    Get aggregated tile data for a map viewport.
    
    Args:
        min_lat: Minimum latitude
        max_lat: Maximum latitude
        min_lon: Minimum longitude
        max_lon: Maximum longitude
        db: Database session
        min_events: Minimum event count to include tile
        
    Returns:
        List of tile data dictionaries
    """
    result = await db.execute(
        text("""
            SELECT 
                tile_id, center_lat, center_lon,
                total_events, avg_severity, max_severity,
                pothole_count, congestion_count, crack_count,
                avg_congestion_score, avg_vehicle_count, max_vehicle_count,
                avg_pothole_size, avg_confidence,
                last_event_at
            FROM tile_aggregates
            WHERE window_type = 'last_20'
              AND center_lat BETWEEN :min_lat AND :max_lat
              AND center_lon BETWEEN :min_lon AND :max_lon
              AND total_events >= :min_events
            ORDER BY max_severity DESC
        """),
        {
            'min_lat': min_lat,
            'max_lat': max_lat,
            'min_lon': min_lon,
            'max_lon': max_lon,
            'min_events': min_events
        }
    )
    
    tiles = []
    for row in result.fetchall():
        tiles.append({
            'tile_id': row.tile_id,
            'center_lat': row.center_lat,
            'center_lon': row.center_lon,
            'total_events': row.total_events,
            'avg_severity': float(row.avg_severity or 0),
            'max_severity': float(row.max_severity or 0),
            'pothole_count': row.pothole_count,
            'congestion_count': row.congestion_count,
            'crack_count': row.crack_count,
            'avg_congestion_score': float(row.avg_congestion_score or 0),
            'avg_vehicle_count': float(row.avg_vehicle_count or 0),
            'max_vehicle_count': row.max_vehicle_count,
            'avg_pothole_size': float(row.avg_pothole_size or 0),
            'avg_confidence': float(row.avg_confidence or 0),
            'last_event_at': row.last_event_at.isoformat() if row.last_event_at else None
        })
    
    return tiles


async def get_tile_events(
    tile_id: str,
    db: AsyncSession,
    limit: int = 20,
    event_type: str = None
) -> List[Dict]:
    """
    Get recent events for a specific tile.
    
    Args:
        tile_id: Tile identifier
        db: Database session
        limit: Maximum events to return
        event_type: Optional filter by event type
        
    Returns:
        List of event dictionaries
    """
    query = """
        SELECT 
            event_id, event_type, detected_at,
            lat, lon, severity, confidence, model_outputs,
            device_id, frame_refs
        FROM events
        WHERE tile_id = :tile_id
    """
    params = {'tile_id': tile_id, 'limit': limit}
    
    if event_type:
        query += " AND event_type = :event_type"
        params['event_type'] = event_type
    
    query += " ORDER BY detected_at DESC LIMIT :limit"
    
    result = await db.execute(text(query), params)
    
    events = []
    for row in result.fetchall():
        events.append({
            'event_id': str(row.event_id),
            'event_type': row.event_type,
            'detected_at': row.detected_at.isoformat() if row.detected_at else None,
            'lat': row.lat,
            'lon': row.lon,
            'severity': float(row.severity or 0),
            'confidence': float(row.confidence or 0),
            'model_outputs': row.model_outputs,
            'device_id': row.device_id,
            'frame_refs': row.frame_refs
        })
    
    return events


async def get_event_by_id(event_id: str, db: AsyncSession) -> Dict:
    """
    Get a single event by ID.
    
    Args:
        event_id: Event UUID
        db: Database session
        
    Returns:
        Event dictionary or None
    """
    result = await db.execute(
        text("""
            SELECT 
                event_id, upload_id, event_type, detected_at, device_id,
                lat, lon, tile_id, severity, confidence, model_outputs,
                frame_refs, annotated_video_s3, created_at
            FROM events
            WHERE event_id = :event_id
        """),
        {'event_id': event_id}
    )
    
    row = result.fetchone()
    if not row:
        return None
    
    return {
        'event_id': str(row.event_id),
        'upload_id': str(row.upload_id) if row.upload_id else None,
        'event_type': row.event_type,
        'detected_at': row.detected_at.isoformat() if row.detected_at else None,
        'device_id': row.device_id,
        'lat': row.lat,
        'lon': row.lon,
        'tile_id': row.tile_id,
        'severity': float(row.severity or 0),
        'confidence': float(row.confidence or 0),
        'model_outputs': row.model_outputs,
        'frame_refs': row.frame_refs,
        'annotated_video_s3': row.annotated_video_s3,
        'created_at': row.created_at.isoformat() if row.created_at else None
    }


async def get_all_tiles(db: AsyncSession, limit: int = 1000) -> List[Dict]:
    """
    Get all tiles with aggregated data.
    
    Args:
        db: Database session
        limit: Maximum tiles to return
        
    Returns:
        List of tile data dictionaries
    """
    result = await db.execute(
        text("""
            SELECT 
                tile_id, center_lat, center_lon,
                total_events, avg_severity, max_severity,
                pothole_count, congestion_count, crack_count,
                avg_congestion_score, avg_vehicle_count,
                last_event_at
            FROM tile_aggregates
            WHERE window_type = 'last_20'
              AND total_events > 0
            ORDER BY last_event_at DESC NULLS LAST
            LIMIT :limit
        """),
        {'limit': limit}
    )
    
    tiles = []
    for row in result.fetchall():
        tiles.append({
            'tile_id': row.tile_id,
            'center_lat': row.center_lat,
            'center_lon': row.center_lon,
            'total_events': row.total_events,
            'avg_severity': float(row.avg_severity or 0),
            'max_severity': float(row.max_severity or 0),
            'pothole_count': row.pothole_count,
            'congestion_count': row.congestion_count,
            'crack_count': row.crack_count,
            'avg_congestion_score': float(row.avg_congestion_score or 0),
            'avg_vehicle_count': float(row.avg_vehicle_count or 0),
            'last_event_at': row.last_event_at.isoformat() if row.last_event_at else None
        })
    
    return tiles


async def get_summary_stats(db: AsyncSession) -> Dict:
    """
    Get overall summary statistics.
    
    Args:
        db: Database session
        
    Returns:
        Summary statistics dictionary
    """
    # Get event stats
    event_result = await db.execute(
        text("""
            SELECT 
                COUNT(*) as total_events,
                COUNT(*) FILTER (WHERE event_type = 'pothole') as pothole_count,
                COUNT(*) FILTER (WHERE event_type = 'congestion') as congestion_count,
                COUNT(*) FILTER (WHERE event_type = 'crack') as crack_count,
                AVG(severity) as avg_severity,
                MAX(severity) as max_severity,
                COUNT(DISTINCT tile_id) as tiles_with_events,
                MAX(detected_at) as last_event_at
            FROM events
        """)
    )
    event_stats = event_result.fetchone()
    
    # Get upload stats
    upload_result = await db.execute(
        text("""
            SELECT 
                COUNT(*) as total_uploads,
                COUNT(*) FILTER (WHERE processing_status = 'completed') as processed,
                COUNT(*) FILTER (WHERE processing_status = 'pending') as pending,
                COUNT(*) FILTER (WHERE processing_status = 'failed') as failed
            FROM raw_uploads
        """)
    )
    upload_stats = upload_result.fetchone()
    
    return {
        'events': {
            'total': event_stats.total_events or 0,
            'potholes': event_stats.pothole_count or 0,
            'congestion': event_stats.congestion_count or 0,
            'cracks': event_stats.crack_count or 0,
            'avg_severity': float(event_stats.avg_severity or 0),
            'max_severity': float(event_stats.max_severity or 0),
            'tiles_with_events': event_stats.tiles_with_events or 0,
            'last_event_at': event_stats.last_event_at.isoformat() if event_stats.last_event_at else None
        },
        'uploads': {
            'total': upload_stats.total_uploads or 0,
            'processed': upload_stats.processed or 0,
            'pending': upload_stats.pending or 0,
            'failed': upload_stats.failed or 0
        }
    }
