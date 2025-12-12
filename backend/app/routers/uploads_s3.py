"""
Uploads API Router - Endpoints for handling S3 video uploads and processing.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.db.database import get_db
from app.services.video_pipeline import process_video_from_s3


router = APIRouter(prefix="/uploads", tags=["Uploads"])


class UploadCreate(BaseModel):
    device_id: str
    s3_key_video: str
    s3_key_csv: Optional[str] = None
    avg_lat: Optional[float] = None
    avg_lon: Optional[float] = None
    avg_velocity: Optional[float] = None
    video_duration_seconds: Optional[int] = None
    metadata: Optional[dict] = None


class UploadResponse(BaseModel):
    upload_id: str
    device_id: str
    s3_key_video: str
    processing_status: str
    uploaded_at: str


class UploadStatus(BaseModel):
    upload_id: str
    processing_status: str
    uploaded_at: str
    processed_at: Optional[str] = None


@router.post("", response_model=UploadResponse)
async def register_upload(
    upload: UploadCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new upload from S3.
    
    Called by the Android app after successfully uploading video to S3.
    Returns an upload_id that can be used to trigger processing.
    """
    upload_id = str(uuid.uuid4())
    
    await db.execute(
        text("""
            INSERT INTO raw_uploads (
                upload_id, device_id, s3_key_video, s3_key_csv,
                avg_lat, avg_lon, avg_velocity, video_duration_seconds,
                metadata, processing_status, uploaded_at
            ) VALUES (
                :upload_id, :device_id, :s3_key_video, :s3_key_csv,
                :avg_lat, :avg_lon, :avg_velocity, :video_duration_seconds,
                :metadata, 'pending', NOW()
            )
        """),
        {
            'upload_id': upload_id,
            'device_id': upload.device_id,
            's3_key_video': upload.s3_key_video,
            's3_key_csv': upload.s3_key_csv,
            'avg_lat': upload.avg_lat,
            'avg_lon': upload.avg_lon,
            'avg_velocity': upload.avg_velocity,
            'video_duration_seconds': upload.video_duration_seconds,
            'metadata': upload.metadata
        }
    )
    await db.commit()
    
    return {
        'upload_id': upload_id,
        'device_id': upload.device_id,
        's3_key_video': upload.s3_key_video,
        'processing_status': 'pending',
        'uploaded_at': datetime.utcnow().isoformat()
    }


@router.post("/{upload_id}/process")
async def trigger_processing(
    upload_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger video processing for an uploaded video.
    
    Called after Android app successfully uploads to S3.
    Processing runs in background and updates status when complete.
    """
    # Verify upload exists
    result = await db.execute(
        text("""
            SELECT upload_id, s3_key_video, s3_key_csv, device_id, processing_status
            FROM raw_uploads 
            WHERE upload_id = :id
        """),
        {'id': upload_id}
    )
    upload = result.fetchone()
    
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    if upload.processing_status == 'processing':
        return {"status": "already_processing", "upload_id": upload_id}
    
    if upload.processing_status == 'completed':
        return {"status": "already_completed", "upload_id": upload_id}
    
    # Mark as processing
    await db.execute(
        text("""
            UPDATE raw_uploads 
            SET processing_status = 'processing' 
            WHERE upload_id = :id
        """),
        {'id': upload_id}
    )
    await db.commit()
    
    # Queue processing job
    background_tasks.add_task(
        process_video_task,
        upload_id,
        upload.s3_key_video,
        upload.s3_key_csv,
        upload.device_id
    )
    
    return {"status": "processing_started", "upload_id": upload_id}


async def process_video_task(
    upload_id: str,
    s3_key_video: str,
    s3_key_csv: Optional[str],
    device_id: str
):
    """Background task for video processing."""
    from app.db.database import AsyncSessionLocal
    from app.services.event_service import mark_upload_failed
    
    async with AsyncSessionLocal() as db:
        try:
            await process_video_from_s3(
                upload_id=upload_id,
                s3_key_video=s3_key_video,
                s3_key_csv=s3_key_csv,
                device_id=device_id,
                db_session=db
            )
        except Exception as e:
            print(f"Error processing upload {upload_id}: {e}")
            await mark_upload_failed(upload_id, str(e), db)


@router.get("/{upload_id}/status", response_model=UploadStatus)
async def get_upload_status(
    upload_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get processing status for an upload.
    """
    result = await db.execute(
        text("""
            SELECT upload_id, processing_status, uploaded_at, processed_at
            FROM raw_uploads 
            WHERE upload_id = :id
        """),
        {'id': upload_id}
    )
    upload = result.fetchone()
    
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    return {
        'upload_id': str(upload.upload_id),
        'processing_status': upload.processing_status,
        'uploaded_at': upload.uploaded_at.isoformat() if upload.uploaded_at else None,
        'processed_at': upload.processed_at.isoformat() if upload.processed_at else None
    }


@router.get("", response_model=List[UploadStatus])
async def list_uploads(
    status: Optional[str] = Query(None, description="Filter by status"),
    device_id: Optional[str] = Query(None, description="Filter by device"),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db)
):
    """
    List uploads with optional filters.
    """
    query = "SELECT upload_id, processing_status, uploaded_at, processed_at FROM raw_uploads WHERE 1=1"
    params = {'limit': limit}
    
    if status:
        query += " AND processing_status = :status"
        params['status'] = status
    
    if device_id:
        query += " AND device_id = :device_id"
        params['device_id'] = device_id
    
    query += " ORDER BY uploaded_at DESC LIMIT :limit"
    
    result = await db.execute(text(query), params)
    
    uploads = []
    for row in result.fetchall():
        uploads.append({
            'upload_id': str(row.upload_id),
            'processing_status': row.processing_status,
            'uploaded_at': row.uploaded_at.isoformat() if row.uploaded_at else None,
            'processed_at': row.processed_at.isoformat() if row.processed_at else None
        })
    
    return uploads


@router.get("/stats/overview")
async def get_upload_stats(db: AsyncSession = Depends(get_db)):
    """
    Get upload processing statistics.
    """
    result = await db.execute(
        text("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE processing_status = 'pending') as pending,
                COUNT(*) FILTER (WHERE processing_status = 'processing') as processing,
                COUNT(*) FILTER (WHERE processing_status = 'completed') as completed,
                COUNT(*) FILTER (WHERE processing_status = 'failed') as failed
            FROM raw_uploads
        """)
    )
    
    stats = result.fetchone()
    
    return {
        'total': stats.total,
        'pending': stats.pending,
        'processing': stats.processing,
        'completed': stats.completed,
        'failed': stats.failed
    }
