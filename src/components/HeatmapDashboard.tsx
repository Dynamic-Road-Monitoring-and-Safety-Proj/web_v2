import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, Rectangle, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { TileData, fetchTilesInViewport, getSeverityColor, fetchTileEvents, TileEvent } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Car, Construction } from 'lucide-react';

interface HeatmapTileLayerProps {
  tiles: TileData[];
  onTileClick: (tile: TileData) => void;
  selectedTileId: string | null;
}

// Constants for tile size
const KM_TO_DEG_LAT = 0.009;

function HeatmapTileLayer({ tiles, onTileClick, selectedTileId }: HeatmapTileLayerProps) {
  const map = useMap();

  return (
    <>
      {tiles.map((tile) => {
        // Calculate tile bounds
        const tileLatIdx = parseInt(tile.tile_id.split('_')[1]);
        const tileLonIdx = parseInt(tile.tile_id.split('_')[2]);
        
        const minLat = tileLatIdx * KM_TO_DEG_LAT;
        const maxLat = (tileLatIdx + 1) * KM_TO_DEG_LAT;
        
        const kmToDegLon = KM_TO_DEG_LAT / Math.max(Math.cos((minLat + maxLat) / 2 * Math.PI / 180), 0.01);
        const minLon = tileLonIdx * kmToDegLon;
        const maxLon = (tileLonIdx + 1) * kmToDegLon;

        const bounds: [[number, number], [number, number]] = [
          [minLat, minLon],
          [maxLat, maxLon]
        ];

        const severity = tile.max_severity || tile.avg_severity || 0;
        const fillColor = getSeverityColor(severity);
        const isSelected = tile.tile_id === selectedTileId;

        return (
          <Rectangle
            key={tile.tile_id}
            bounds={bounds}
            pathOptions={{
              color: isSelected ? '#3b82f6' : fillColor,
              fillColor: fillColor,
              fillOpacity: Math.min(0.3 + (severity / 100) * 0.4, 0.7),
              weight: isSelected ? 3 : 1,
              opacity: isSelected ? 1 : 0.7
            }}
            eventHandlers={{
              click: () => onTileClick(tile)
            }}
          >
            <Popup>
              <TilePopup tile={tile} />
            </Popup>
          </Rectangle>
        );
      })}
    </>
  );
}

function TilePopup({ tile }: { tile: TileData }) {
  return (
    <div className="min-w-[200px]">
      <div className="font-bold mb-2">Tile: {tile.tile_id}</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span>Potholes: {tile.pothole_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <Car className="h-3 w-3 text-orange-500" />
          <span>Congestion: {tile.congestion_count}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Avg Severity: </span>
          <span className="font-medium">{tile.avg_severity.toFixed(1)}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Max Severity: </span>
          <span className="font-medium">{tile.max_severity.toFixed(1)}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Total Events: </span>
          <span className="font-medium">{tile.total_events}</span>
        </div>
      </div>
    </div>
  );
}

interface MapEventsHandlerProps {
  onBoundsChange: (bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }) => void;
}

function MapEventsHandler({ onBoundsChange }: MapEventsHandlerProps) {
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

  // Initial bounds on mount
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

function MapInitializer({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [center, map]);

  return null;
}

interface TileDetailPanelProps {
  tile: TileData | null;
  events: TileEvent[];
  loading: boolean;
  onClose: () => void;
}

function TileDetailPanel({ tile, events, loading, onClose }: TileDetailPanelProps) {
  if (!tile) return null;

  return (
    <Card className="absolute right-4 top-4 w-80 max-h-[calc(100%-2rem)] overflow-hidden z-[1000] shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">
            Tile Details
          </CardTitle>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
        <div className="text-xs text-muted-foreground">{tile.tile_id}</div>
      </CardHeader>
      <CardContent className="space-y-3 overflow-auto max-h-[400px]">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-50 dark:bg-red-950 p-2 rounded">
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Potholes</span>
            </div>
            <div className="text-lg font-bold">{tile.pothole_count}</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950 p-2 rounded">
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <Car className="h-3 w-3" />
              <span className="text-xs">Congestion</span>
            </div>
            <div className="text-lg font-bold">{tile.congestion_count}</div>
          </div>
        </div>

        {/* Severity Meter */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Max Severity</span>
            <span className="font-medium">{tile.max_severity.toFixed(1)}/100</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${tile.max_severity}%`,
                backgroundColor: getSeverityColor(tile.max_severity)
              }}
            />
          </div>
        </div>

        {/* Recent Events */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Recent Events</div>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              No events found
            </div>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 5).map((event) => (
                <div 
                  key={event.event_id}
                  className="bg-muted/50 p-2 rounded text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <Badge 
                      variant={event.event_type === 'pothole' ? 'destructive' : 'secondary'}
                      className="text-[10px]"
                    >
                      {event.event_type}
                    </Badge>
                    <span className="text-muted-foreground">
                      {event.detected_at ? new Date(event.detected_at).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Severity</span>
                    <span className="font-medium" style={{ color: getSeverityColor(event.severity) }}>
                      {event.severity.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface HeatmapDashboardProps {
  className?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export function HeatmapDashboard({ 
  className = '',
  defaultCenter = [30.7333, 76.7794], // Chandigarh
  defaultZoom = 13
}: HeatmapDashboardProps) {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null);
  const [tileEvents, setTileEvents] = useState<TileEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [bounds, setBounds] = useState<{ minLat: number; maxLat: number; minLon: number; maxLon: number } | null>(null);

  // Fetch tiles when bounds change
  const fetchTiles = useCallback(async (viewBounds: typeof bounds) => {
    if (!viewBounds) return;
    
    setLoading(true);
    try {
      const data = await fetchTilesInViewport(viewBounds);
      setTiles(data);
    } catch (error) {
      console.error('Error fetching tiles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced bounds change handler
  const handleBoundsChange = useCallback((newBounds: typeof bounds) => {
    setBounds(newBounds);
  }, []);

  // Fetch tiles when bounds change (with debounce)
  useEffect(() => {
    if (!bounds) return;
    
    const timer = setTimeout(() => {
      fetchTiles(bounds);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [bounds, fetchTiles]);

  // Handle tile click
  const handleTileClick = useCallback(async (tile: TileData) => {
    setSelectedTile(tile);
    setEventsLoading(true);
    
    try {
      const events = await fetchTileEvents(tile.tile_id, 20);
      setTileEvents(events);
    } catch (error) {
      console.error('Error fetching tile events:', error);
      setTileEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedTile(null);
    setTileEvents([]);
  }, []);

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 left-4 z-[1000] bg-background/90 rounded-md px-3 py-2 flex items-center gap-2 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading tiles...</span>
        </div>
      )}

      {/* Tile count indicator */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 rounded-md px-3 py-2 shadow-sm">
        <span className="text-sm text-muted-foreground">
          {tiles.length} tiles in view
        </span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-background/90 rounded-md px-3 py-2 shadow-sm">
        <div className="text-xs font-medium mb-1">Severity</div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-xs">Low</span>
          <div className="w-4 h-3 rounded ml-2" style={{ backgroundColor: '#eab308' }} />
          <span className="text-xs">Med</span>
          <div className="w-4 h-3 rounded ml-2" style={{ backgroundColor: '#f97316' }} />
          <span className="text-xs">High</span>
          <div className="w-4 h-3 rounded ml-2" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-xs">Critical</span>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '0.75rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInitializer center={defaultCenter} />
        <MapEventsHandler onBoundsChange={handleBoundsChange} />
        <HeatmapTileLayer 
          tiles={tiles} 
          onTileClick={handleTileClick}
          selectedTileId={selectedTile?.tile_id || null}
        />
      </MapContainer>

      {/* Detail Panel */}
      <TileDetailPanel 
        tile={selectedTile}
        events={tileEvents}
        loading={eventsLoading}
        onClose={handleCloseDetail}
      />
    </div>
  );
}

export default HeatmapDashboard;
