import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Rectangle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Event } from '@/lib/mockData';
import { TileData, fetchTilesInViewport, getSeverityColor } from '@/lib/api';

interface DashboardMapProps {
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
  showHeatmap?: boolean;
  showTraffic?: boolean;
}

// Constants for tile size (1km grid)
const KM_TO_DEG_LAT = 0.009;

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13);
    // Force a resize calculation after mount to ensure tiles render
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [center, map]);

  return null;
}

interface HeatmapLayerProps {
  onBoundsChange: (bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }) => void;
  tiles: TileData[];
}

function HeatmapLayer({ tiles }: { tiles: TileData[] }) {
  return (
    <>
      {tiles.map((tile) => {
        // Parse tile ID to get indices
        const parts = tile.tile_id.split('_');
        const tileLatIdx = parseInt(parts[1]);
        const tileLonIdx = parseInt(parts[2]);
        
        // Calculate tile bounds
        const minLat = tileLatIdx * KM_TO_DEG_LAT;
        const maxLat = (tileLatIdx + 1) * KM_TO_DEG_LAT;
        
        // Adjust longitude conversion for latitude
        const centerLat = (minLat + maxLat) / 2;
        const kmToDegLon = KM_TO_DEG_LAT / Math.max(Math.cos(centerLat * Math.PI / 180), 0.01);
        const minLon = tileLonIdx * kmToDegLon;
        const maxLon = (tileLonIdx + 1) * kmToDegLon;

        const bounds: [[number, number], [number, number]] = [
          [minLat, minLon],
          [maxLat, maxLon]
        ];

        const severity = tile.max_severity || tile.avg_severity || 0;
        const fillColor = getSeverityColor(severity);
        const fillOpacity = Math.min(0.3 + (severity / 100) * 0.4, 0.7);

        return (
          <Rectangle
            key={tile.tile_id}
            bounds={bounds}
            pathOptions={{
              color: fillColor,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
              weight: 1,
              opacity: 0.7
            }}
          >
            <Popup>
              <div className="min-w-[180px] p-1">
                <div className="font-bold text-sm mb-2">Tile: {tile.tile_id}</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>🕳️ Potholes: <strong>{tile.pothole_count}</strong></div>
                  <div>🚗 Congestion: <strong>{tile.congestion_count}</strong></div>
                  <div className="col-span-2">📊 Avg Severity: <strong>{tile.avg_severity.toFixed(1)}</strong></div>
                  <div className="col-span-2">⚠️ Max Severity: <strong>{tile.max_severity.toFixed(1)}</strong></div>
                  <div className="col-span-2">📍 Total Events: <strong>{tile.total_events}</strong></div>
                </div>
              </div>
            </Popup>
          </Rectangle>
        );
      })}
    </>
  );
}

// Traffic layer showing congestion based on event density
function TrafficLayer({ events }: { events: Event[] }) {
  // Group events by rough location (0.008 degree ~= 0.8km grid)
  const trafficData = useMemo(() => {
    const grid: { [key: string]: { lat: number; lon: number; count: number; avgVehicles: number } } = {};
    
    events.forEach(event => {
      const gridLat = Math.floor(event.lat_center / 0.008) * 0.008;
      const gridLon = Math.floor(event.lon_center / 0.008) * 0.008;
      const key = `${gridLat}_${gridLon}`;
      
      if (!grid[key]) {
        grid[key] = { lat: gridLat + 0.004, lon: gridLon + 0.004, count: 0, avgVehicles: 0 };
      }
      grid[key].count++;
      grid[key].avgVehicles += event.avg_vehicles_per_frame || 0;
    });
    
    // Calculate average vehicles
    Object.values(grid).forEach(cell => {
      cell.avgVehicles = cell.avgVehicles / cell.count;
    });
    
    return Object.values(grid);
  }, [events]);

  const getTrafficColor = (avgVehicles: number) => {
    if (avgVehicles < 5) return '#22c55e'; // Green - light traffic
    if (avgVehicles < 10) return '#eab308'; // Yellow - moderate
    return '#ef4444'; // Red - heavy traffic
  };

  return (
    <>
      {trafficData.map((cell, idx) => {
        const bounds: [[number, number], [number, number]] = [
          [cell.lat - 0.004, cell.lon - 0.004],
          [cell.lat + 0.004, cell.lon + 0.004]
        ];
        
        const color = getTrafficColor(cell.avgVehicles);
        const opacity = Math.min(0.3 + (cell.avgVehicles / 20) * 0.4, 0.7);

        return (
          <Rectangle
            key={`traffic_${idx}`}
            bounds={bounds}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: opacity,
              weight: 1,
              opacity: 0.6
            }}
          >
            <Popup>
              <div className="min-w-[150px] p-1">
                <div className="font-bold text-sm mb-2">Traffic Zone</div>
                <div className="text-xs space-y-1">
                  <div>🚗 Avg Vehicles: <strong>{cell.avgVehicles.toFixed(1)}</strong></div>
                  <div>📍 Events: <strong>{cell.count}</strong></div>
                  <div>📊 Density: <strong>{cell.avgVehicles < 5 ? 'Light' : cell.avgVehicles < 10 ? 'Moderate' : 'Heavy'}</strong></div>
                </div>
              </div>
            </Popup>
          </Rectangle>
        );
      })}
    </>
  );
}

function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLon: bounds.getWest(),
        maxLon: bounds.getEast()
      });
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLon: bounds.getWest(),
        maxLon: bounds.getEast()
      });
    }
  });

  // Fire initial bounds
  useEffect(() => {
    const bounds = map.getBounds();
    onBoundsChange({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLon: bounds.getWest(),
      maxLon: bounds.getEast()
    });
  }, [map, onBoundsChange]);

  return null;
}

export function DashboardMap({ events, selectedEvent, onEventSelect, showHeatmap = false, showTraffic = false }: DashboardMapProps) {
  const defaultCenter: [number, number] = [30.7333, 76.7794]; // Chandigarh
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [loadingTiles, setLoadingTiles] = useState(false);
  
  const center = selectedEvent 
    ? [selectedEvent.lat_center, selectedEvent.lon_center] as [number, number]
    : defaultCenter;

  const handleBoundsChange = useCallback(async (bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }) => {
    if (!showHeatmap) return;
    
    setLoadingTiles(true);
    try {
      const fetchedTiles = await fetchTilesInViewport(bounds);
      setTiles(fetchedTiles);
    } catch (error) {
      console.error('Failed to fetch tiles:', error);
    } finally {
      setLoadingTiles(false);
    }
  }, [showHeatmap]);

  // Clear tiles when heatmap is turned off
  useEffect(() => {
    if (!showHeatmap) {
      setTiles([]);
    }
  }, [showHeatmap]);

  // Show events view by default (not heatmap, not traffic)
  const showEvents = !showHeatmap && !showTraffic;

  return (
    <div className="h-full w-full relative z-0">
      {loadingTiles && showHeatmap && (
        <div className="absolute top-2 left-2 z-[1000] bg-background/80 px-2 py-1 rounded text-xs flex items-center gap-1">
          <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
          Loading tiles...
        </div>
      )}
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%', minHeight: '100%', borderRadius: '0.75rem', background: '#e5e7eb' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />
        
        {/* Heatmap Layer */}
        {showHeatmap && (
          <>
            <BoundsWatcher onBoundsChange={handleBoundsChange} />
            <HeatmapLayer tiles={tiles} />
          </>
        )}

        {/* Traffic Layer */}
        {showTraffic && (
          <TrafficLayer events={events} />
        )}
        
        {/* Event Markers (show when in events mode) */}
        {showEvents && events.map((event) => (
          <CircleMarker
            key={event.id}
            center={[event.lat_center, event.lon_center]}
            radius={8}
            pathOptions={{
              color: event.needs_attention ? '#ef4444' : '#3b82f6',
              fillColor: event.needs_attention ? '#ef4444' : '#3b82f6',
              fillOpacity: 0.7,
              weight: 2
            }}
            eventHandlers={{
              click: () => onEventSelect(event),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{event.sector || "Unknown Location"}</h3>
                <p className="text-sm text-gray-600">{event.street_name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(event.event_timestamp).toLocaleString()}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
