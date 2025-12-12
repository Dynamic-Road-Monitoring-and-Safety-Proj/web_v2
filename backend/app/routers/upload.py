from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
import csv
import io
from app.core.config import CSV_DIR, VIDEO_DIR

router = APIRouter()

@router.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        file_path = CSV_DIR / file.filename
        
        # Read the uploaded file content
        content = await file.read()
        new_data = content.decode('utf-8')
        
        # Parse the new CSV data
        new_reader = csv.reader(io.StringIO(new_data))
        new_rows = list(new_reader)
        
        if not new_rows:
            raise HTTPException(status_code=400, detail="Empty CSV file")
        
        new_header = new_rows[0]
        new_data_rows = new_rows[1:] if len(new_rows) > 1 else []
        
        # Check if file already exists
        if file_path.exists():
            # Read existing file
            with open(file_path, 'r', encoding='utf-8') as existing_file:
                existing_reader = csv.reader(existing_file)
                existing_rows = list(existing_reader)
            
            if existing_rows:
                existing_header = existing_rows[0]
                
                # Verify headers match (or are compatible)
                if existing_header != new_header:
                    # Headers don't match - log warning but still try to append
                    print(f"Warning: CSV headers don't match. Existing: {existing_header}, New: {new_header}")
                
                # Append new data rows to existing file
                with open(file_path, 'a', encoding='utf-8', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerows(new_data_rows)
                
                return {
                    "filename": file.filename, 
                    "path": str(file_path), 
                    "status": "appended",
                    "rows_added": len(new_data_rows),
                    "total_rows": len(existing_rows) + len(new_data_rows) - 1  # -1 for header
                }
        
        # File doesn't exist - create new file
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(new_rows)
        
        return {
            "filename": file.filename, 
            "path": str(file_path), 
            "status": "created",
            "rows_added": len(new_data_rows)
        }
        
    except HTTPException:
        raise
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
