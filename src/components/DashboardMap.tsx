import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Event } from '@/lib/mockData';

interface DashboardMapProps {
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
}

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

export function DashboardMap({ events, selectedEvent, onEventSelect }: DashboardMapProps) {
  const defaultCenter: [number, number] = [30.7333, 76.7794]; // Chandigarh
  
  const center = selectedEvent 
    ? [selectedEvent.lat_center, selectedEvent.lon_center] as [number, number]
    : defaultCenter;

  return (
    <div className="h-full w-full relative z-0">
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
        {events.map((event) => (
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
