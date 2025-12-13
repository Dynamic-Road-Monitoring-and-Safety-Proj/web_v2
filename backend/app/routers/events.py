"""
Events API Router - Endpoints for individual event data.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.db.database import get_db
from app.services.event_service import get_event_by_id, get_tile_events


router = APIRouter(prefix="/events", tags=["Events"])


class EventDetail(BaseModel):
    event_id: str
    upload_id: Optional[str] = None
    event_type: str
    detected_at: Optional[str]
    device_id: Optional[str]
    lat: float
    lon: float
    tile_id: str
    severity: float
    confidence: float
    model_outputs: dict
    frame_refs: Optional[List[str]] = None
    annotated_video_s3: Optional[str] = None
    created_at: Optional[str] = None


class EventSummary(BaseModel):
    event_id: str
    event_type: str
    detected_at: Optional[str]
    lat: float
    lon: float
    severity: float
    tile_id: str


@router.get("/{event_id}", response_model=EventDetail)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific event.
    """
    event = await get_event_by_id(event_id, db)
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return event


@router.get("", response_model=List[EventSummary])
async def get_events(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    min_severity: Optional[float] = Query(None, ge=0, le=100, description="Minimum severity"),
    hours: int = Query(24, ge=1, le=720, description="Events from last N hours"),
    limit: int = Query(100, le=1000, description="Maximum events to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent events with optional filters.
    """
    query = """
        SELECT 
            event_id, event_type, detected_at,
            lat, lon, severity, tile_id
        FROM events
        WHERE detected_at >= :since
    """
    params = {
        'since': datetime.utcnow() - timedelta(hours=hours),
        'limit': limit
    }
    
    if event_type:
        query += " AND event_type = :event_type"
        params['event_type'] = event_type
    
    if min_severity is not None:
        query += " AND severity >= :min_severity"
        params['min_severity'] = min_severity
    
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
            'tile_id': row.tile_id
        })
    
    return events


@router.get("/recent/high-severity", response_model=List[EventDetail])
async def get_high_severity_events(
    min_severity: float = Query(70, ge=0, le=100, description="Minimum severity threshold"),
    hours: int = Query(24, ge=1, le=168, description="Events from last N hours"),
    limit: int = Query(50, le=200, description="Maximum events to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent high-severity events for alerts.
    """
    result = await db.execute(
        text("""
            SELECT 
                event_id, upload_id, event_type, detected_at, device_id,
                lat, lon, tile_id, severity, confidence, model_outputs,
                frame_refs, annotated_video_s3, created_at
            FROM events
            WHERE detected_at >= :since
              AND severity >= :min_severity
            ORDER BY severity DESC, detected_at DESC
            LIMIT :limit
        """),
        {
            'since': datetime.utcnow() - timedelta(hours=hours),
            'min_severity': min_severity,
            'limit': limit
        }
    )
    
    events = []
    for row in result.fetchall():
        events.append({
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
        })
    
    return events


@router.get("/stats/by-type")
async def get_events_by_type(
    hours: int = Query(24, ge=1, le=720, description="Events from last N hours"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get event counts grouped by type.
    """
    result = await db.execute(
        text("""
            SELECT 
                event_type,
                COUNT(*) as count,
                AVG(severity) as avg_severity,
                MAX(severity) as max_severity
            FROM events
            WHERE detected_at >= :since
            GROUP BY event_type
            ORDER BY count DESC
        """),
        {'since': datetime.utcnow() - timedelta(hours=hours)}
    )
    
    stats = []
    for row in result.fetchall():
        stats.append({
            'event_type': row.event_type,
            'count': row.count,
            'avg_severity': float(row.avg_severity or 0),
            'max_severity': float(row.max_severity or 0)
        })
    
    return stats


@router.get("/stats/timeline")
async def get_events_timeline(
    hours: int = Query(24, ge=1, le=168, description="Events from last N hours"),
    interval_minutes: int = Query(60, ge=15, le=360, description="Grouping interval in minutes"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get event counts over time for charts.
    """
    result = await db.execute(
        text("""
            SELECT 
                date_trunc('hour', detected_at) + 
                    (EXTRACT(minute FROM detected_at)::integer / :interval * :interval) * INTERVAL '1 minute' as time_bucket,
                event_type,
                COUNT(*) as count,
                AVG(severity) as avg_severity
            FROM events
            WHERE detected_at >= :since
            GROUP BY time_bucket, event_type
            ORDER BY time_bucket
        """),
        {
            'since': datetime.utcnow() - timedelta(hours=hours),
            'interval': interval_minutes
        }
    )
    
    timeline = []
    for row in result.fetchall():
        timeline.append({
            'time': row.time_bucket.isoformat() if row.time_bucket else None,
            'event_type': row.event_type,
            'count': row.count,
            'avg_severity': float(row.avg_severity or 0)
        })
    
    return timeline
