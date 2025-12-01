import os
import time
import subprocess
import requests
import sys
from pathlib import Path

# Configuration
BASE_URL = "http://127.0.0.1:8000"

import argparse
parser = argparse.ArgumentParser()
parser.add_argument("--video", help="Path to video file")
parser.add_argument("--csv", help="Path to CSV file")
args = parser.parse_args()

# Default paths relative to project root if not provided
PROJECT_ROOT = Path(__file__).parent.parent
DEFAULT_VIDEO = PROJECT_ROOT / "testing_data" / "2025-11-12_10-37-18.mp4"
DEFAULT_CSV = PROJECT_ROOT / "testing_data" / "2025-11-12.csv"

VIDEO_PATH = Path(args.video) if args.video else Path(os.getenv("TEST_VIDEO_PATH", DEFAULT_VIDEO))
CSV_PATH = Path(args.csv) if args.csv else Path(os.getenv("TEST_CSV_PATH", DEFAULT_CSV))

def is_server_running():
    try:
        requests.get(f"{BASE_URL}/")
        return True
    except requests.exceptions.ConnectionError:
        return False

def start_server():
    print("Starting server...")
    # Use the venv python executable
    venv_python = Path("venv/bin/python")
    if not venv_python.exists():
        venv_python = Path(sys.executable)
        
    uvicorn_cmd = [str(venv_python), "-m", "uvicorn", "app.main:app", "--port", "8000"]
    
    # Start in background, redirecting output to log file
    with open("server_run.log", "w") as log_file:
        process = subprocess.Popen(uvicorn_cmd, stdout=log_file, stderr=log_file)
    
    # Wait for startup
    retries = 0
    while not is_server_running():
        time.sleep(1)
        retries += 1
        if retries > 20:
            raise Exception("Server failed to start. Check server_run.log")
    print("Server started.")
    return process

def upload_file(endpoint, file_path, file_type):
    print(f"Uploading {file_type}: {file_path.name}...")
    url = f"{BASE_URL}/api/upload/{endpoint}"
    try:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(url, files=files)
        
        if response.status_code == 200:
            print(f"Success: {response.json()}")
        else:
            print(f"Error uploading {file_type}: {response.text}")
            sys.exit(1)
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        sys.exit(1)

def trigger_processing(video_filename, csv_filename):
    print(f"Triggering processing for {video_filename}...")
    url = f"{BASE_URL}/api/process/{video_filename}"
    params = {'csv_filename': csv_filename}
    response = requests.post(url, params=params)
    
    if response.status_code == 200:
        print(f"Processing started: {response.json()}")
    else:
        print(f"Error triggering processing: {response.text}")
        sys.exit(1)

def main():
    if not VIDEO_PATH.exists():
        print(f"Error: Video file not found at {VIDEO_PATH}")
        sys.exit(1)
    if not CSV_PATH.exists():
        print(f"Error: CSV file not found at {CSV_PATH}")
        sys.exit(1)

    server_process = None
    if not is_server_running():
        server_process = start_server()
    else:
        print("Server is already running.")

    try:
        upload_file("csv", CSV_PATH, "CSV")
        upload_file("video", VIDEO_PATH, "Video")
        
        trigger_processing(VIDEO_PATH.name, CSV_PATH.name)
        
        print("\nPipeline is running in the background.")
        print("You can monitor progress by checking 'output/annotated_vids/'")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
