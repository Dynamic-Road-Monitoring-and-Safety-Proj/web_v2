import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CongestionItem, DamageItem } from '@/lib/types';
import { getCongestionColor, getDamageColor } from '@/lib/dynamodb';

interface DashboardMapProps {
  congestionData: CongestionItem[];
  damageData: DamageItem[];
  selectedCongestion: CongestionItem | null;
  selectedDamage: DamageItem | null;
  onCongestionSelect: (item: CongestionItem) => void;
  onDamageSelect: (item: DamageItem) => void;
}

// Default center: Chandigarh, Punjab
const DEFAULT_CENTER: [number, number] = [30.7333, 76.7794];

// H3 Hex boundary cache for performance
const hexBoundaryCache = new Map<string, [number, number][]>();

/**
 * Get H3 hex boundary coordinates
 * Falls back to approximate circle if h3-js fails
 */
const getHexBoundary = async (hexId: string, centerLat: number, centerLon: number): Promise<[number, number][]> => {
  // Check cache first
  if (hexBoundaryCache.has(hexId)) {
    return hexBoundaryCache.get(hexId)!;
  }

  try {
    const h3 = await import('h3-js');
    if (h3.isValidCell(hexId)) {
      const boundary = h3.cellToBoundary(hexId);
      hexBoundaryCache.set(hexId, boundary);
      return boundary;
    }
  } catch (error) {
    console.warn('H3 boundary lookup failed for', hexId, error);
  }

  // Fallback: Create approximate hexagon around center point
  // H3 res 9 edge length is ~174m, use ~0.002 degrees
  const radius = 0.002;
  const boundary: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    boundary.push([
      centerLat + radius * Math.cos(angle),
      centerLon + radius * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180),
    ]);
  }
  hexBoundaryCache.set(hexId, boundary);
  return boundary;
};

/**
 * Map updater component to handle center changes
 */
function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [center, zoom, map]);

  return null;
}

/**
 * Congestion Hex Layer Component
 */
function CongestionHexLayer({
  data,
  selected,
  onSelect,
}: {
  data: CongestionItem[];
  selected: CongestionItem | null;
  onSelect: (item: CongestionItem) => void;
}) {
  const [boundaries, setBoundaries] = useState<Map<string, [number, number][]>>(new Map());

  useEffect(() => {
    const loadBoundaries = async () => {
      const newBoundaries = new Map<string, [number, number][]>();
      for (const item of data) {
        const boundary = await getHexBoundary(item.hex_id, item.location.lat, item.location.lon);
        newBoundaries.set(item.hex_id, boundary);
      }
      setBoundaries(newBoundaries);
    };
    loadBoundaries();
  }, [data]);

  return (
    <>
      {data.map((item) => {
        const boundary = boundaries.get(item.hex_id);
        if (!boundary || boundary.length === 0) return null;

        const color = getCongestionColor(item.congestion_level);
        const isSelected = selected?.hex_id === item.hex_id;

        return (
          <Polygon
            key={`congestion-${item.hex_id}`}
            positions={boundary}
            pathOptions={{
              color: isSelected ? '#ffffff' : color,
              fillColor: color,
              fillOpacity: isSelected ? 0.8 : 0.5,
              weight: isSelected ? 3 : 1,
            }}
            eventHandlers={{
              click: () => onSelect(item),
            }}
          >
            <Popup>
              <div className="min-w-[200px] p-2">
                <div className="font-bold text-sm mb-2 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  Traffic: {item.congestion_level.toUpperCase()}
                </div>
                <div className="text-xs space-y-1">
                  <div>🛣️ Road: <strong>{item.road_name}</strong></div>
                  <div>🚗 Velocity: <strong>{item.velocity_avg.toFixed(1)} km/h</strong></div>
                  <div>📊 Vehicles: <strong>{item.vehicle_count_avg.toFixed(1)}</strong></div>
                  <div>⏰ Peak Hour: <strong>{item.peak_hour_flag ? 'Yes' : 'No'}</strong></div>
                  <div>📍 Events: <strong>{item.event_count}</strong></div>
                </div>
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                  Hex: {item.hex_id.slice(0, 12)}...
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}

/**
 * Damage Hex Layer Component
 */
function DamageHexLayer({
  data,
  selected,
  onSelect,
}: {
  data: DamageItem[];
  selected: DamageItem | null;
  onSelect: (item: DamageItem) => void;
}) {
  const [boundaries, setBoundaries] = useState<Map<string, [number, number][]>>(new Map());

  useEffect(() => {
    const loadBoundaries = async () => {
      const newBoundaries = new Map<string, [number, number][]>();
      for (const item of data) {
        const boundary = await getHexBoundary(item.hex_id, item.location.lat, item.location.lon);
        newBoundaries.set(item.hex_id, boundary);
      }
      setBoundaries(newBoundaries);
    };
    loadBoundaries();
  }, [data]);

  return (
    <>
      {data.map((item) => {
        const boundary = boundaries.get(item.hex_id);
        if (!boundary || boundary.length === 0) return null;

        const color = getDamageColor(item.prophet_classification);
        const isSelected = selected?.hex_id === item.hex_id;

        return (
          <Polygon
            key={`damage-${item.hex_id}`}
            positions={boundary}
            pathOptions={{
              color: isSelected ? '#ffffff' : color,
              fillColor: color,
              fillOpacity: isSelected ? 0.8 : 0.5,
              weight: isSelected ? 3 : 1,
              dashArray: '5, 5', // Dashed to distinguish from congestion
            }}
            eventHandlers={{
              click: () => onSelect(item),
            }}
          >
            <Popup>
              <div className="min-w-[200px] p-2">
                <div className="font-bold text-sm mb-2 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  Quality: {item.prophet_classification.toUpperCase()}
                </div>
                <div className="text-xs space-y-1">
                  <div>📏 Roughness: <strong>{item.derived_metrics.roughness_index.toFixed(3)}</strong></div>
                  <div>⚡ Spike: <strong>{item.derived_metrics.spike_index.toFixed(3)}</strong></div>
                  <div>💺 Comfort: <strong>{item.derived_metrics.ride_comfort_score.toFixed(0)}/100</strong></div>
                  <div>📐 Damage Area: <strong>{item.road_damage_area_avg.toFixed(2)}</strong></div>
                  <div>📍 Events: <strong>{item.event_count}</strong></div>
                </div>
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                  Hex: {item.hex_id.slice(0, 12)}...
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}

/**
 * Center markers for hex cells (fallback visualization)
 */
function CenterMarkers({
  congestionData,
  damageData,
  onCongestionSelect,
  onDamageSelect,
}: {
  congestionData: CongestionItem[];
  damageData: DamageItem[];
  onCongestionSelect: (item: CongestionItem) => void;
  onDamageSelect: (item: DamageItem) => void;
}) {
  // Create a set of hex IDs that have damage data
  const damageHexIds = useMemo(
    () => new Set(damageData.map((d) => d.hex_id)),
    [damageData]
  );

  return (
    <>
      {/* Congestion markers (outer ring) */}
      {congestionData.map((item) => (
        <CircleMarker
          key={`marker-congestion-${item.hex_id}`}
          center={[item.location.lat, item.location.lon]}
          radius={damageHexIds.has(item.hex_id) ? 12 : 8}
          pathOptions={{
            color: getCongestionColor(item.congestion_level),
            fillColor: getCongestionColor(item.congestion_level),
            fillOpacity: 0.6,
            weight: 2,
          }}
          eventHandlers={{
            click: () => onCongestionSelect(item),
          }}
        />
      ))}

      {/* Damage markers (inner dot) */}
      {damageData.map((item) => (
        <CircleMarker
          key={`marker-damage-${item.hex_id}`}
          center={[item.location.lat, item.location.lon]}
          radius={5}
          pathOptions={{
            color: getDamageColor(item.prophet_classification),
            fillColor: getDamageColor(item.prophet_classification),
            fillOpacity: 0.9,
            weight: 1,
          }}
          eventHandlers={{
            click: () => onDamageSelect(item),
          }}
        />
      ))}
    </>
  );
}

/**
 * Main Dashboard Map Component
 */
export function DashboardMap({
  congestionData,
  damageData,
  selectedCongestion,
  selectedDamage,
  onCongestionSelect,
  onDamageSelect,
}: DashboardMapProps) {
  // Calculate map center based on data or selection
  const center = useMemo<[number, number]>(() => {
    // Priority: selected items > first data item > default
    if (selectedCongestion) {
      return [selectedCongestion.location.lat, selectedCongestion.location.lon];
    }
    if (selectedDamage) {
      return [selectedDamage.location.lat, selectedDamage.location.lon];
    }
    if (congestionData.length > 0) {
      return [congestionData[0].location.lat, congestionData[0].location.lon];
    }
    if (damageData.length > 0) {
      return [damageData[0].location.lat, damageData[0].location.lon];
    }
    return DEFAULT_CENTER;
  }, [selectedCongestion, selectedDamage, congestionData, damageData]);

  const hasData = congestionData.length > 0 || damageData.length > 0;

  return (
    <div className="h-full w-full relative z-0">
      {/* Loading/Empty state overlay */}
      {!hasData && (
        <div className="absolute inset-0 z-[1000] bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-muted-foreground">No data for selected filters</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try changing the date or filter settings
            </p>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={14}
        style={{
          height: '100%',
          width: '100%',
          minHeight: '100%',
          borderRadius: '0.75rem',
          background: '#e5e7eb',
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />

        {/* Hex polygons */}
        <CongestionHexLayer
          data={congestionData}
          selected={selectedCongestion}
          onSelect={onCongestionSelect}
        />
        <DamageHexLayer
          data={damageData}
          selected={selectedDamage}
          onSelect={onDamageSelect}
        />

        {/* Fallback center markers (always visible for click targets) */}
        <CenterMarkers
          congestionData={congestionData}
          damageData={damageData}
          onCongestionSelect={onCongestionSelect}
          onDamageSelect={onDamageSelect}
        />
      </MapContainer>
    </div>
  );
}
