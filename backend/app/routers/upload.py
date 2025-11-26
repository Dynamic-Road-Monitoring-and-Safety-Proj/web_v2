from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
from app.core.config import CSV_DIR, VIDEO_DIR

router = APIRouter()

@router.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        file_path = CSV_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"filename": file.filename, "path": str(file_path), "status": "uploaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload/video")
async def upload_video(file: UploadFile = File(...)):
    try:
        file_path = VIDEO_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"filename": file.filename, "path": str(file_path), "status": "uploaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
