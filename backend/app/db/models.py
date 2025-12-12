"""
SQLAlchemy models for the road monitoring system.
Uses PostgreSQL with PostGIS for geospatial data.
"""
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean, 
    ForeignKey, Text, Index, Numeric, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from geoalchemy2 import Geography
from datetime import datetime
import uuid

from .database import Base


class RawUpload(Base):
    """
    Stores metadata about uploaded videos.
    Videos are stored in S3, this table tracks processing state.
    """
    __tablename__ = "raw_uploads"
    
    upload_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(String(255), nullable=False, index=True)
    
    # S3 references
    s3_key_video = Column(Text, nullable=False)
    s3_key_csv = Column(Text, nullable=True)
    
    # Timestamps
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    # Processing status: pending, processing, completed, failed
    processing_status = Column(String(50), default="pending", index=True)
    
    # Aggregated GPS/sensor data from CSV
    avg_lat = Column(Float, nullable=True)
    avg_lon = Column(Float, nullable=True)
    avg_velocity = Column(Float, nullable=True)
    gyro_max = Column(Float, nullable=True)
    gyro_avg = Column(Float, nullable=True)
    
    # Video metadata
    video_duration_seconds = Column(Integer, nullable=True)
    
    # Additional metadata (flexible JSON storage)
    # Note: 'metadata' is reserved in SQLAlchemy, using 'extra_data' instead
    extra_data = Column(JSONB, nullable=True)
    
    # Relationship to events
    events = relationship("Event", back_populates="upload", lazy="dynamic")
    
    __table_args__ = (
        Index("idx_raw_uploads_status", "processing_status"),
        Index("idx_raw_uploads_device", "device_id"),
        Index("idx_raw_uploads_uploaded", "uploaded_at"),
    )


class Event(Base):
    """
    Stores every detected event (potholes, congestion, etc.)
    This is an append-only table for raw detection events.
    """
    __tablename__ = "events"
    
    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upload_id = Column(UUID(as_uuid=True), ForeignKey("raw_uploads.upload_id"), nullable=True)
    
    # Event classification
    event_type = Column(String(50), nullable=False, index=True)  # pothole, crack, congestion, etc.
    detected_at = Column(DateTime, nullable=False, index=True)
    device_id = Column(String(255), nullable=True)
    
    # Geospatial data
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    geom = Column(Geography(geometry_type="POINT", srid=4326), nullable=True)
    tile_id = Column(String(50), nullable=False, index=True)
    
    # Model outputs stored as JSON (flexible for different model types)
    model_outputs = Column(JSONB, nullable=False)
    
    # Severity and confidence metrics (0-100 scale for severity, 0-1 for confidence)
    severity = Column(Numeric(5, 2), default=0)
    confidence = Column(Numeric(5, 4), default=0)
    
    # References to frames/media
    frame_refs = Column(ARRAY(Text), nullable=True)
    annotated_video_s3 = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    upload = relationship("RawUpload", back_populates="events")
    
    __table_args__ = (
        Index("idx_events_tile", "tile_id"),
        Index("idx_events_detected_at", "detected_at"),
        Index("idx_events_type", "event_type"),
        Index("idx_events_geom", "geom", postgresql_using="gist"),
        Index("idx_events_upload", "upload_id"),
        Index("idx_events_tile_type", "tile_id", "event_type"),
    )


class TileAggregate(Base):
    """
    Pre-computed aggregates for 1km×1km tiles.
    Updated incrementally when new events are added.
    Uses "last N events" strategy for aggregation.
    """
    __tablename__ = "tile_aggregates"
    
    tile_id = Column(String(50), primary_key=True)
    window_type = Column(String(20), primary_key=True, default="last_20")
    
    # Event counts
    total_events = Column(Integer, default=0)
    pothole_count = Column(Integer, default=0)
    congestion_count = Column(Integer, default=0)
    crack_count = Column(Integer, default=0)
    
    # Severity metrics
    avg_severity = Column(Numeric(5, 2), default=0)
    max_severity = Column(Numeric(5, 2), default=0)
    avg_confidence = Column(Numeric(5, 4), default=0)
    
    # Congestion-specific metrics
    avg_congestion_score = Column(Numeric(5, 2), default=0)
    avg_vehicle_count = Column(Numeric(5, 2), default=0)
    max_vehicle_count = Column(Integer, default=0)
    
    # Road damage metrics
    avg_pothole_size = Column(Numeric(8, 6), default=0)
    max_pothole_size = Column(Numeric(8, 6), default=0)
    
    # Tile center coordinates (for display on map)
    center_lat = Column(Float, nullable=True)
    center_lon = Column(Float, nullable=True)
    
    # Timestamps
    last_updated = Column(DateTime, default=datetime.utcnow)
    last_event_at = Column(DateTime, nullable=True)
    
    __table_args__ = (
        Index("idx_tile_agg_updated", "last_updated"),
        Index("idx_tile_agg_center", "center_lat", "center_lon"),
    )


# SQL for creating tables with raw SQL (alternative to SQLAlchemy migrations)
CREATE_TABLES_SQL = """
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Raw uploads table
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

-- Events table
CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES raw_uploads(upload_id),
    event_type VARCHAR(50) NOT NULL,
    detected_at TIMESTAMP NOT NULL,
    device_id VARCHAR(255),
    
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    geom GEOGRAPHY(POINT, 4326),
    tile_id VARCHAR(50) NOT NULL,
    
    model_outputs JSONB NOT NULL,
    
    severity NUMERIC(5,2) DEFAULT 0,
    confidence NUMERIC(5,4) DEFAULT 0,
    
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

-- Tile aggregates table
CREATE TABLE IF NOT EXISTS tile_aggregates (
    tile_id VARCHAR(50) NOT NULL,
    window_type VARCHAR(20) NOT NULL DEFAULT 'last_20',
    
    total_events INTEGER DEFAULT 0,
    pothole_count INTEGER DEFAULT 0,
    congestion_count INTEGER DEFAULT 0,
    crack_count INTEGER DEFAULT 0,
    
    avg_severity NUMERIC(5,2) DEFAULT 0,
    max_severity NUMERIC(5,2) DEFAULT 0,
    avg_confidence NUMERIC(5,4) DEFAULT 0,
    
    avg_congestion_score NUMERIC(5,2) DEFAULT 0,
    avg_vehicle_count NUMERIC(5,2) DEFAULT 0,
    max_vehicle_count INTEGER DEFAULT 0,
    
    avg_pothole_size NUMERIC(8,6) DEFAULT 0,
    max_pothole_size NUMERIC(8,6) DEFAULT 0,
    
    center_lat DOUBLE PRECISION,
    center_lon DOUBLE PRECISION,
    
    last_updated TIMESTAMP DEFAULT NOW(),
    last_event_at TIMESTAMP,
    
    PRIMARY KEY (tile_id, window_type)
);

CREATE INDEX IF NOT EXISTS idx_tile_agg_updated ON tile_aggregates(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_tile_agg_center ON tile_aggregates(center_lat, center_lon);
"""
