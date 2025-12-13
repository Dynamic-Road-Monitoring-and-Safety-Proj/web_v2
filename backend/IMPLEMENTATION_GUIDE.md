# Road Monitoring Backend - Implementation Guide

## System Architecture

This backend implements a complete video processing pipeline for road monitoring with:

1. **Video Processing Pipeline** - Processes uploaded videos with ML models (congestion + pothole detection)
2. **Event Storage** - Stores detected events with geospatial data in PostgreSQL/PostGIS
3. **Tile Aggregation** - Aggregates events into 1km×1km grid tiles for efficient heatmap rendering
4. **Dashboard API** - Provides tile-based data for frontend heatmap visualization

## New Features (v2.0)

### Database Schema (PostgreSQL + PostGIS)

Three core tables:
- `raw_uploads` - Tracks video uploads from S3
- `events` - Stores all detected events (potholes, congestion, cracks)
- `tile_aggregates` - Pre-computed 1km×1km tile statistics

### Tile System

Events are aggregated into a global grid of 1km×1km tiles:
- Tile ID format: `T_{lat_idx}_{lon_idx}`
- Uses "last 20 events" strategy for aggregation
- Updates incrementally when new events arrive

### New API Endpoints

#### Tile Endpoints (`/api/tiles`)
- `GET /api/tiles` - Get tiles in viewport (for heatmap)
- `GET /api/tiles/all` - Get all tiles
- `GET /api/tiles/nearby` - Get tiles near a location
- `GET /api/tiles/{tile_id}` - Get single tile data
- `GET /api/tiles/{tile_id}/events` - Get events for a tile
- `GET /api/tiles/stats/summary` - Get summary statistics

#### Event Endpoints (`/api/events`)
- `GET /api/events` - List recent events
- `GET /api/events/{event_id}` - Get event details
- `GET /api/events/recent/high-severity` - Get high-severity alerts
- `GET /api/events/stats/by-type` - Event counts by type
- `GET /api/events/stats/timeline` - Events over time

#### S3 Upload Endpoints (`/api/uploads`)
- `POST /api/uploads` - Register new upload from S3
- `POST /api/uploads/{id}/process` - Trigger processing
- `GET /api/uploads/{id}/status` - Get processing status
- `GET /api/uploads/stats/overview` - Upload statistics

## Setup

### 1. PostgreSQL with PostGIS

```bash
# Install PostgreSQL and PostGIS
# On Ubuntu:
sudo apt install postgresql postgresql-contrib postgis

# Create database
sudo -u postgres psql
CREATE DATABASE road_monitoring;
\c road_monitoring
CREATE EXTENSION postgis;
```

Or use the provided schema file:
```bash
psql -U postgres -d road_monitoring -f schema.sql
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/road_monitoring
USE_POSTGRES=true
S3_BUCKET_RAW=your-bucket-name
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Server

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Processing Flow

### From Android App:

1. App uploads video + CSV to S3
2. App calls `POST /api/uploads` with S3 keys
3. App calls `POST /api/uploads/{id}/process` to trigger processing
4. Backend downloads from S3, runs ML models, stores events
5. Backend updates tile aggregates
6. Backend deletes video from S3

### From Frontend:

1. Map loads and determines viewport bounds
2. Frontend calls `GET /api/tiles?min_lat=...&max_lat=...&min_lon=...&max_lon=...`
3. Frontend renders tiles as colored rectangles (heatmap)
4. User clicks tile → Frontend calls `GET /api/tiles/{tile_id}/events`
5. Frontend shows event details in sidebar

## File Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── core/
│   │   └── config.py        # Configuration settings
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py      # Database connection
│   │   └── models.py        # SQLAlchemy models
│   ├── routers/
│   │   ├── tiles.py         # NEW: Tile endpoints
│   │   ├── events.py        # NEW: Event endpoints
│   │   ├── uploads_s3.py    # NEW: S3 upload endpoints
│   │   └── ...              # Existing routers
│   ├── services/
│   │   ├── s3_service.py    # NEW: S3 operations
│   │   ├── event_service.py # NEW: Event DB operations
│   │   ├── video_pipeline.py# NEW: S3 processing pipeline
│   │   └── ...              # Existing services
│   └── utils/
│       ├── __init__.py
│       └── tiles.py         # NEW: Tile utilities
├── schema.sql               # Database schema
├── .env.example             # Environment template
└── requirements.txt         # Dependencies
```

## Frontend Integration

### Install leaflet for heatmap:
```bash
npm install react-leaflet leaflet
npm install -D @types/leaflet
```

### Use the new HeatmapDashboard component:
```tsx
import { HeatmapDashboard } from '@/components/HeatmapDashboard';

function Dashboard() {
  return (
    <div className="h-screen">
      <HeatmapDashboard 
        defaultCenter={[30.7333, 76.7794]} 
        defaultZoom={13} 
      />
    </div>
  );
}
```

### Use the API functions:
```typescript
import { 
  fetchTilesInViewport, 
  fetchTileEvents,
  fetchSummaryStats,
  getSeverityColor 
} from '@/lib/api';

// Fetch tiles for current map view
const tiles = await fetchTilesInViewport({
  minLat: 30.7,
  maxLat: 30.8,
  minLon: 76.7,
  maxLon: 76.9
});

// Render heatmap
tiles.forEach(tile => {
  const color = getSeverityColor(tile.max_severity);
  // Draw rectangle at tile.center_lat, tile.center_lon
});
```

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection string |
| `USE_POSTGRES` | `false` | Enable PostgreSQL (vs local files) |
| `S3_BUCKET_RAW` | `road-monitoring-raw` | S3 bucket for uploads |
| `S3_BUCKET_PROCESSED` | `road-monitoring-processed` | S3 bucket for processed |
| `AWS_REGION` | `ap-south-1` | AWS region |
| `DELETE_AFTER_PROCESSING` | `true` | Delete video from S3 after processing |
| `TILE_SIZE_KM` | `1.0` | Tile size in kilometers |
| `TILE_LAST_N_EVENTS` | `20` | Events per tile for aggregation |

## Notes

- The system maintains backward compatibility with existing local file processing
- Set `USE_POSTGRES=true` to enable the new PostgreSQL-based pipeline
- PostGIS is required for spatial queries and indexes
- Tile aggregates use a "last 20 events" strategy for efficient updates
