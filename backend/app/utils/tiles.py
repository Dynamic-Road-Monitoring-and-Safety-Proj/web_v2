"""
Tile utility functions for converting lat/lon to 1km grid tiles.
Uses a simple grid division where ~1km = 0.009 degrees at equator.
"""
import math
from typing import Tuple, List, Dict
from dataclasses import dataclass


# Configuration
KM_TO_DEG_LAT = 0.009  # ~1 km in degrees latitude (constant)
TILE_SIZE_KM = 1.0


@dataclass
class TileBounds:
    """Represents the geographic bounds of a tile."""
    tile_id: str
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float
    center_lat: float
    center_lon: float


def lat_lon_to_tile_id(lat: float, lon: float) -> str:
    """
    Convert lat/lon to 1km grid tile ID.
    
    Uses simple grid division:
    - 1 km ≈ 0.009 degrees latitude (constant)
    - 1 km ≈ 0.009 / cos(lat) degrees longitude (varies by latitude)
    
    Returns tile_id like 'T_2345_6789' where numbers are grid indices.
    
    Args:
        lat: Latitude in degrees
        lon: Longitude in degrees
        
    Returns:
        Tile ID string in format 'T_{lat_idx}_{lon_idx}'
    """
    # Calculate grid index for latitude
    tile_lat_idx = math.floor(lat / KM_TO_DEG_LAT)
    
    # Adjust longitude grid size for latitude compression
    # At higher latitudes, longitude degrees cover less distance
    km_to_deg_lon = KM_TO_DEG_LAT / max(math.cos(math.radians(lat)), 0.01)
    tile_lon_idx = math.floor(lon / km_to_deg_lon)
    
    return f"T_{tile_lat_idx}_{tile_lon_idx}"


def tile_id_to_center(tile_id: str) -> Tuple[float, float]:
    """
    Convert tile_id back to center lat/lon coordinates.
    
    Args:
        tile_id: Tile ID in format 'T_{lat_idx}_{lon_idx}'
        
    Returns:
        Tuple of (center_lat, center_lon)
    """
    parts = tile_id.split('_')
    if len(parts) != 3 or parts[0] != 'T':
        raise ValueError(f"Invalid tile_id format: {tile_id}")
    
    tile_lat_idx = int(parts[1])
    tile_lon_idx = int(parts[2])
    
    # Calculate center latitude
    center_lat = (tile_lat_idx + 0.5) * KM_TO_DEG_LAT
    
    # Calculate center longitude (accounting for latitude compression)
    km_to_deg_lon = KM_TO_DEG_LAT / max(math.cos(math.radians(center_lat)), 0.01)
    center_lon = (tile_lon_idx + 0.5) * km_to_deg_lon
    
    return center_lat, center_lon


def get_tile_bounds(tile_id: str) -> TileBounds:
    """
    Get the geographic bounds of a tile.
    
    Args:
        tile_id: Tile ID in format 'T_{lat_idx}_{lon_idx}'
        
    Returns:
        TileBounds object with min/max lat/lon and center coordinates
    """
    parts = tile_id.split('_')
    if len(parts) != 3 or parts[0] != 'T':
        raise ValueError(f"Invalid tile_id format: {tile_id}")
    
    tile_lat_idx = int(parts[1])
    tile_lon_idx = int(parts[2])
    
    # Calculate latitude bounds
    min_lat = tile_lat_idx * KM_TO_DEG_LAT
    max_lat = (tile_lat_idx + 1) * KM_TO_DEG_LAT
    center_lat = (min_lat + max_lat) / 2
    
    # Calculate longitude bounds (accounting for latitude compression)
    km_to_deg_lon = KM_TO_DEG_LAT / max(math.cos(math.radians(center_lat)), 0.01)
    min_lon = tile_lon_idx * km_to_deg_lon
    max_lon = (tile_lon_idx + 1) * km_to_deg_lon
    center_lon = (min_lon + max_lon) / 2
    
    return TileBounds(
        tile_id=tile_id,
        min_lat=min_lat,
        max_lat=max_lat,
        min_lon=min_lon,
        max_lon=max_lon,
        center_lat=center_lat,
        center_lon=center_lon
    )


def get_tiles_in_viewport(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float
) -> List[str]:
    """
    Get all tile IDs that intersect with a viewport.
    
    Args:
        min_lat: Minimum latitude of viewport
        max_lat: Maximum latitude of viewport
        min_lon: Minimum longitude of viewport
        max_lon: Maximum longitude of viewport
        
    Returns:
        List of tile IDs that intersect with the viewport
    """
    tiles = []
    
    # Calculate lat grid indices
    min_lat_idx = math.floor(min_lat / KM_TO_DEG_LAT)
    max_lat_idx = math.ceil(max_lat / KM_TO_DEG_LAT)
    
    # Use center latitude for longitude calculation
    center_lat = (min_lat + max_lat) / 2
    km_to_deg_lon = KM_TO_DEG_LAT / max(math.cos(math.radians(center_lat)), 0.01)
    
    min_lon_idx = math.floor(min_lon / km_to_deg_lon)
    max_lon_idx = math.ceil(max_lon / km_to_deg_lon)
    
    # Generate all tiles in the viewport
    for lat_idx in range(min_lat_idx, max_lat_idx + 1):
        for lon_idx in range(min_lon_idx, max_lon_idx + 1):
            tiles.append(f"T_{lat_idx}_{lon_idx}")
    
    return tiles


def get_nearby_tiles(lat: float, lon: float, radius_km: float = 5.0) -> List[str]:
    """
    Get all tiles within a radius of a point.
    
    Args:
        lat: Center latitude
        lon: Center longitude
        radius_km: Radius in kilometers
        
    Returns:
        List of tile IDs within the radius
    """
    # Convert radius to degrees
    radius_deg_lat = radius_km * KM_TO_DEG_LAT
    km_to_deg_lon = KM_TO_DEG_LAT / max(math.cos(math.radians(lat)), 0.01)
    radius_deg_lon = radius_km * km_to_deg_lon
    
    return get_tiles_in_viewport(
        min_lat=lat - radius_deg_lat,
        max_lat=lat + radius_deg_lat,
        min_lon=lon - radius_deg_lon,
        max_lon=lon + radius_deg_lon
    )


def calculate_tile_distance(tile_id1: str, tile_id2: str) -> float:
    """
    Calculate approximate distance between two tile centers in kilometers.
    
    Args:
        tile_id1: First tile ID
        tile_id2: Second tile ID
        
    Returns:
        Distance in kilometers (approximate)
    """
    lat1, lon1 = tile_id_to_center(tile_id1)
    lat2, lon2 = tile_id_to_center(tile_id2)
    
    # Haversine formula for distance
    R = 6371  # Earth radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def parse_tile_id(tile_id: str) -> Tuple[int, int]:
    """
    Parse tile ID into its component indices.
    
    Args:
        tile_id: Tile ID in format 'T_{lat_idx}_{lon_idx}'
        
    Returns:
        Tuple of (lat_idx, lon_idx)
    """
    parts = tile_id.split('_')
    if len(parts) != 3 or parts[0] != 'T':
        raise ValueError(f"Invalid tile_id format: {tile_id}")
    
    return int(parts[1]), int(parts[2])


# Example usage for testing
if __name__ == "__main__":
    # Test with Chandigarh coordinates
    lat, lon = 30.7333, 76.7794
    
    tile_id = lat_lon_to_tile_id(lat, lon)
    print(f"Coordinates ({lat}, {lon}) -> Tile: {tile_id}")
    
    center = tile_id_to_center(tile_id)
    print(f"Tile {tile_id} center: {center}")
    
    bounds = get_tile_bounds(tile_id)
    print(f"Tile bounds: {bounds}")
    
    nearby = get_nearby_tiles(lat, lon, radius_km=2.0)
    print(f"Nearby tiles (2km radius): {len(nearby)} tiles")
