"""
Mock Tiles API Router - Uses in-memory dummy data for testing without PostgreSQL.
"""
from fastapi import APIRouter, Query
from typing import List, Optional
from pydantic import BaseModel

from app.services.dummy_data import get_dummy_data, get_tiles_in_viewport as get_mock_tiles, get_events_for_tile


router = APIRouter(prefix="/tiles-mock", tags=["Tiles Mock"])


class TileData(BaseModel):
    tile_id: str
    center_lat: float
    center_lon: float
    total_events: int
    avg_severity: float
    max_severity: float
    pothole_count: int
    congestion_count: int
    crack_count: int = 0
    avg_confidence: float = 0
    last_event_at: Optional[str] = None


class TileEvent(BaseModel):
    event_id: str
    event_type: str
    detected_at: Optional[str]
    lat: float
    lon: float
    severity: float
    confidence: float
    model_outputs: dict
    device_id: Optional[str] = None


@router.get("", response_model=List[TileData])
async def get_tiles_viewport(
    min_lat: float = Query(..., description="Minimum latitude of viewport"),
    max_lat: float = Query(..., description="Maximum latitude of viewport"),
    min_lon: float = Query(..., description="Minimum longitude of viewport"),
    max_lon: float = Query(..., description="Maximum longitude of viewport"),
):
    """
    Get aggregated tile data for a map viewport (mock data).
    """
    tiles = get_mock_tiles(min_lat, max_lat, min_lon, max_lon)
    return tiles


@router.get("/all", response_model=List[TileData])
async def get_all_tiles():
    """Get all tiles with mock data."""
    _, tiles = get_dummy_data()
    return tiles


@router.get("/{tile_id}/events", response_model=List[TileEvent])
async def get_tile_events_endpoint(
    tile_id: str,
    limit: int = Query(20, le=100),
):
    """Get events for a specific tile (mock data)."""
    events = get_events_for_tile(tile_id)
    return events[:limit]


@router.get("/summary")
async def get_summary():
    """Get summary stats."""
    events, tiles = get_dummy_data()
    
    pothole_count = sum(1 for e in events if e['event_type'] == 'pothole')
    congestion_count = sum(1 for e in events if e['event_type'] == 'congestion')
    crack_count = sum(1 for e in events if e['event_type'] == 'crack')
    
    return {
        'total_events': len(events),
        'total_tiles': len(tiles),
        'pothole_count': pothole_count,
        'congestion_count': congestion_count,
        'crack_count': crack_count,
        'avg_severity': round(sum(e['severity'] for e in events) / len(events), 2) if events else 0
    }
