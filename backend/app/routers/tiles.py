"""
Tiles API Router - Endpoints for tile-based heatmap data.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.services.event_service import (
    get_tiles_in_viewport,
    get_tile_events,
    get_all_tiles,
    get_summary_stats
)
from app.utils.tiles import (
    lat_lon_to_tile_id,
    tile_id_to_center,
    get_tile_bounds,
    get_nearby_tiles
)


router = APIRouter(prefix="/tiles", tags=["Tiles"])


# Response Models
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
    avg_congestion_score: float
    avg_vehicle_count: float = 0
    max_vehicle_count: int = 0
    avg_pothole_size: float = 0
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
    frame_refs: Optional[List[str]] = None


class TileBoundsResponse(BaseModel):
    tile_id: str
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float
    center_lat: float
    center_lon: float


class SummaryStats(BaseModel):
    events: dict
    uploads: dict


@router.get("", response_model=List[TileData])
async def get_tiles_viewport(
    min_lat: float = Query(..., description="Minimum latitude of viewport"),
    max_lat: float = Query(..., description="Maximum latitude of viewport"),
    min_lon: float = Query(..., description="Minimum longitude of viewport"),
    max_lon: float = Query(..., description="Maximum longitude of viewport"),
    min_events: int = Query(1, description="Minimum events to include tile"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregated tile data for a map viewport.
    
    Frontend uses this to render heatmap overlays on the map.
    Each tile represents a 1km×1km area with aggregated event metrics.
    """
    # Validate bounds
    if min_lat > max_lat:
        raise HTTPException(status_code=400, detail="min_lat must be less than max_lat")
    if min_lon > max_lon:
        raise HTTPException(status_code=400, detail="min_lon must be less than max_lon")
    
    tiles = await get_tiles_in_viewport(
        min_lat=min_lat,
        max_lat=max_lat,
        min_lon=min_lon,
        max_lon=max_lon,
        db=db,
        min_events=min_events
    )
    
    return tiles


@router.get("/all", response_model=List[TileData])
async def get_all_tiles_endpoint(
    limit: int = Query(1000, le=5000, description="Maximum tiles to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all tiles with aggregated data.
    
    Useful for overview or when viewport bounds are not available.
    """
    return await get_all_tiles(db, limit=limit)


@router.get("/nearby", response_model=List[TileData])
async def get_nearby_tiles_endpoint(
    lat: float = Query(..., description="Center latitude"),
    lon: float = Query(..., description="Center longitude"),
    radius_km: float = Query(5.0, le=50.0, description="Search radius in km"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get tiles within a radius of a point.
    
    Useful for location-based queries.
    """
    # Get tile IDs in the radius
    tile_ids = get_nearby_tiles(lat, lon, radius_km)
    
    # Calculate viewport from tiles
    if not tile_ids:
        return []
    
    # Use a viewport query that covers the area
    from app.utils.tiles import KM_TO_DEG_LAT
    import math
    
    km_to_deg_lon = KM_TO_DEG_LAT / max(math.cos(math.radians(lat)), 0.01)
    
    tiles = await get_tiles_in_viewport(
        min_lat=lat - radius_km * KM_TO_DEG_LAT,
        max_lat=lat + radius_km * KM_TO_DEG_LAT,
        min_lon=lon - radius_km * km_to_deg_lon,
        max_lon=lon + radius_km * km_to_deg_lon,
        db=db
    )
    
    return tiles


@router.get("/{tile_id}", response_model=TileData)
async def get_single_tile(
    tile_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregated data for a single tile.
    """
    try:
        center_lat, center_lon = tile_id_to_center(tile_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Query tile data
    tiles = await get_tiles_in_viewport(
        min_lat=center_lat - 0.001,
        max_lat=center_lat + 0.001,
        min_lon=center_lon - 0.001,
        max_lon=center_lon + 0.001,
        db=db
    )
    
    # Find exact tile
    for tile in tiles:
        if tile['tile_id'] == tile_id:
            return tile
    
    raise HTTPException(status_code=404, detail=f"Tile {tile_id} not found")


@router.get("/{tile_id}/events", response_model=List[TileEvent])
async def get_tile_events_endpoint(
    tile_id: str,
    limit: int = Query(20, le=100, description="Maximum events to return"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent events for a specific tile.
    
    Use this to show detailed event list when user clicks on a tile.
    """
    events = await get_tile_events(
        tile_id=tile_id,
        db=db,
        limit=limit,
        event_type=event_type
    )
    
    return events


@router.get("/{tile_id}/bounds", response_model=TileBoundsResponse)
async def get_tile_bounds_endpoint(tile_id: str):
    """
    Get geographic bounds of a tile.
    
    Useful for drawing tile boundaries on the map.
    """
    try:
        bounds = get_tile_bounds(tile_id)
        return {
            'tile_id': bounds.tile_id,
            'min_lat': bounds.min_lat,
            'max_lat': bounds.max_lat,
            'min_lon': bounds.min_lon,
            'max_lon': bounds.max_lon,
            'center_lat': bounds.center_lat,
            'center_lon': bounds.center_lon
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/convert/coords-to-tile")
async def convert_coords_to_tile(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Convert lat/lon coordinates to a tile ID.
    """
    tile_id = lat_lon_to_tile_id(lat, lon)
    center_lat, center_lon = tile_id_to_center(tile_id)
    
    return {
        'tile_id': tile_id,
        'center_lat': center_lat,
        'center_lon': center_lon
    }


@router.get("/stats/summary", response_model=SummaryStats)
async def get_stats_summary(db: AsyncSession = Depends(get_db)):
    """
    Get overall summary statistics for the dashboard.
    """
    return await get_summary_stats(db)
