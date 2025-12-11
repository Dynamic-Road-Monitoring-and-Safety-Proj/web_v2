from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import httpx
from typing import Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Google Sheets API configuration
GOOGLE_SHEETS_API_KEY = "AIzaSyABfFZFkY8fQlLQPpHzThk4n2x28PArB1A"
SPREADSHEET_ID = "1ZlVrz7iyYq49FW3HxK0lgHsuxpbRP8Eq_9X2FqRVlaI"
RANGE = "Sheet1!A:Z"  # Fetch all columns

async def fetch_google_sheets_data() -> Dict[str, Any]:
    """Fetch data from Google Sheets API"""
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{RANGE}"
    params = {"key": GOOGLE_SHEETS_API_KEY}
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return data
        except httpx.HTTPError as e:
            logger.error(f"Error fetching Google Sheets data: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")

@router.get("/air-quality/columns")
async def get_columns():
    """Get all column names from the Google Sheet"""
    try:
        data = await fetch_google_sheets_data()
        
        if "values" not in data or len(data["values"]) < 1:
            raise HTTPException(status_code=404, detail="No data found in spreadsheet")
        
        headers = data["values"][0]
        return JSONResponse(content={"columns": headers})
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/air-quality/latest")
async def get_latest_air_quality():
    """Get the latest air quality data from Google Sheets"""
    try:
        data = await fetch_google_sheets_data()
        
        if "values" not in data or len(data["values"]) < 2:
            raise HTTPException(status_code=404, detail="No data found in spreadsheet")
        
        # Get headers (first row) and last row of data
        headers = data["values"][0]
        last_row = data["values"][-1]
        
        # Create a dictionary mapping headers to values
        result = {}
        for i, header in enumerate(headers):
            if i < len(last_row):
                value = last_row[i]
                # Try to convert to float if it's a numeric column
                try:
                    result[header] = float(value)
                except (ValueError, TypeError):
                    result[header] = value
            else:
                result[header] = None
        
        # Add CH2O and NO2 if not present (default to 0)
        if "CH2O(mg/m³)" not in result:
            result["CH2O(mg/m³)"] = 0.0
        if "NO2(ppm)" not in result:
            result["NO2(ppm)"] = 0.0
        
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/air-quality/all")
async def get_all_air_quality():
    """Get all air quality data from Google Sheets"""
    try:
        data = await fetch_google_sheets_data()
        
        if "values" not in data or len(data["values"]) < 2:
            raise HTTPException(status_code=404, detail="No data found in spreadsheet")
        
        headers = data["values"][0]
        rows = data["values"][1:]
        
        # Convert to list of dictionaries
        result = []
        for row in rows:
            entry = {}
            for i, header in enumerate(headers):
                if i < len(row):
                    value = row[i]
                    try:
                        entry[header] = float(value)
                    except (ValueError, TypeError):
                        entry[header] = value
                else:
                    entry[header] = None
            result.append(entry)
        
        return JSONResponse(content={"data": result, "count": len(result)})
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
