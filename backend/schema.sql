-- =====================================================
-- Road Monitoring Database Schema
-- PostgreSQL with PostGIS Extension
-- =====================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- Table 1: raw_uploads
-- Stores metadata about uploaded videos from S3
-- =====================================================
CREATE TABLE IF NOT EXISTS raw_uploads (
    upload_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) NOT NULL,
    s3_key_video TEXT NOT NULL,
    s3_key_csv TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    processing_status VARCHAR(50) DEFAULT 'pending',
    avg_lat DOUBLE PRECISION,
    avg_lon DOUBLE PRECISION,
    avg_velocity DOUBLE PRECISION,
    gyro_max DOUBLE PRECISION,
    gyro_avg DOUBLE PRECISION,
    video_duration_seconds INTEGER,
    extra_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_raw_uploads_status ON raw_uploads(processing_status);
CREATE INDEX IF NOT EXISTS idx_raw_uploads_device ON raw_uploads(device_id);
CREATE INDEX IF NOT EXISTS idx_raw_uploads_uploaded ON raw_uploads(uploaded_at);

-- =====================================================
-- Table 2: events
-- Stores every detected event (potholes, congestion, etc.)
-- This is an append-only table
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES raw_uploads(upload_id),
    event_type VARCHAR(50) NOT NULL,
    detected_at TIMESTAMP NOT NULL,
    device_id VARCHAR(255),
    
    -- Geospatial data
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    geom GEOGRAPHY(POINT, 4326),
    tile_id VARCHAR(50) NOT NULL,
    
    -- Model outputs stored as JSON
    model_outputs JSONB NOT NULL,
    
    -- Severity metrics (0-100 scale)
    severity NUMERIC(5,2) DEFAULT 0,
    confidence NUMERIC(5,4) DEFAULT 0,
    
    -- References to frames/media
    frame_refs TEXT[],
    annotated_video_s3 TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_tile ON events(tile_id);
CREATE INDEX IF NOT EXISTS idx_events_detected_at ON events(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_geom ON events USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_events_upload ON events(upload_id);
CREATE INDEX IF NOT EXISTS idx_events_tile_type ON events(tile_id, event_type);

-- =====================================================
-- Table 3: tile_aggregates
-- Pre-computed aggregates for 1km×1km tiles
-- Updated incrementally when new events are added
-- =====================================================
CREATE TABLE IF NOT EXISTS tile_aggregates (
    tile_id VARCHAR(50) NOT NULL,
    window_type VARCHAR(20) NOT NULL DEFAULT 'last_20',
    
    -- Event counts
    total_events INTEGER DEFAULT 0,
    pothole_count INTEGER DEFAULT 0,
    congestion_count INTEGER DEFAULT 0,
    crack_count INTEGER DEFAULT 0,
    
    -- Severity metrics
    avg_severity NUMERIC(5,2) DEFAULT 0,
    max_severity NUMERIC(5,2) DEFAULT 0,
    avg_confidence NUMERIC(5,4) DEFAULT 0,
    
    -- Congestion-specific metrics
    avg_congestion_score NUMERIC(5,2) DEFAULT 0,
    avg_vehicle_count NUMERIC(5,2) DEFAULT 0,
    max_vehicle_count INTEGER DEFAULT 0,
    
    -- Road damage metrics
    avg_pothole_size NUMERIC(8,6) DEFAULT 0,
    max_pothole_size NUMERIC(8,6) DEFAULT 0,
    
    -- Tile center coordinates (for display)
    center_lat DOUBLE PRECISION,
    center_lon DOUBLE PRECISION,
    
    -- Timestamps
    last_updated TIMESTAMP DEFAULT NOW(),
    last_event_at TIMESTAMP,
    
    PRIMARY KEY (tile_id, window_type)
);

CREATE INDEX IF NOT EXISTS idx_tile_agg_updated ON tile_aggregates(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_tile_agg_center ON tile_aggregates(center_lat, center_lon);

-- =====================================================
-- Useful queries for debugging/analysis
-- =====================================================

-- Get total events by type
-- SELECT event_type, COUNT(*) FROM events GROUP BY event_type;

-- Get top 10 highest severity tiles
-- SELECT tile_id, max_severity, total_events 
-- FROM tile_aggregates 
-- WHERE window_type = 'last_20' 
-- ORDER BY max_severity DESC 
-- LIMIT 10;

-- Get recent events
-- SELECT * FROM events ORDER BY detected_at DESC LIMIT 20;

-- Get tiles in viewport (example for Chandigarh area)
-- SELECT * FROM tile_aggregates 
-- WHERE center_lat BETWEEN 30.7 AND 30.8 
--   AND center_lon BETWEEN 76.7 AND 76.9;
