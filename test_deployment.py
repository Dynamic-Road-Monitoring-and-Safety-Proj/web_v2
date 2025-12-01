import requests
import os

# Configuration
BASE_URL = "https://marcus-locate-contributions-marco.trycloudflare.com"
CSV_ENDPOINT = f"{BASE_URL}/api/upload/csv"
VIDEO_ENDPOINT = f"{BASE_URL}/api/upload/video"

# Headers (not needed for Cloudflare, but keeping variable for compatibility)
HEADERS = {}

# Create dummy files
csv_filename = "test_deployment.csv"
video_filename = "test_deployment.mp4"

with open(csv_filename, "w") as f:
    f.write("timestamp,latitude,longitude,acc_x,acc_y,acc_z\n")
    f.write("2025-11-26 10:00:00,12.34,56.78,0.1,0.2,9.8\n")

with open(video_filename, "wb") as f:
    # Write some random bytes to simulate a video file
    f.write(os.urandom(1024 * 100)) # 100KB dummy file

def test_upload_csv():
    print(f"Testing CSV upload to {CSV_ENDPOINT}...")
    try:
        with open(csv_filename, "rb") as f:
            files = {"file": (csv_filename, f, "text/csv")}
            response = requests.post(CSV_ENDPOINT, files=files, headers=HEADERS, verify=False)
        
        if response.status_code == 200:
            print("✅ CSV Upload Successful!")
            print("Response:", response.json())
        else:
            print(f"❌ CSV Upload Failed with status {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f"❌ CSV Upload Error: {e}")

def test_upload_video():
    print(f"\nTesting Video upload to {VIDEO_ENDPOINT}...")
    try:
        with open(video_filename, "rb") as f:
            files = {"file": (video_filename, f, "video/mp4")}
            response = requests.post(VIDEO_ENDPOINT, files=files, headers=HEADERS, verify=False)
        
        if response.status_code == 200:
            print("✅ Video Upload Successful!")
            print("Response:", response.json())
        else:
            print(f"❌ Video Upload Failed with status {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f"❌ Video Upload Error: {e}")

if __name__ == "__main__":
    print(f"Checking deployment at {BASE_URL}\n")
    test_upload_csv()
    test_upload_video()
    
    # Cleanup
    if os.path.exists(csv_filename):
        os.remove(csv_filename)
    if os.path.exists(video_filename):
        os.remove(video_filename)
