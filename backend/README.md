# Road Quality Monitoring Backend

This is a unified FastAPI backend system designed to process road quality data. It combines sensor data (CSV) with video analysis (Computer Vision) to detect and characterize road hazards like potholes and congestion.

## 🚀 System Architecture

The system is built using **FastAPI** and is organized into a modular structure:

*   **API Layer (`app/routers`)**: Handles file uploads and processing requests.
*   **Service Layer (`app/services`)**: Contains the core logic for video processing and data merging.
*   **Core (`app/core`)**: Manages configuration, file paths, and constants.

### Internal Workflow

1.  **Data Ingestion**:
    *   Users upload **Sensor Data (CSV)** containing accelerometer and gyroscope readings.
    *   Users upload **Dashcam Video (MP4/AVI)** corresponding to the sensor data.
    *   Files are stored in the `uploads/` directory.

2.  **Video Processing Pipeline (`app/services/pipeline.py`)**:
    *   Triggered via the `/api/process/` endpoint.
    *   **Frame Extraction**: The video is processed frame-by-frame at a defined FPS (default: 4).
    *   **Object Detection**: Two YOLOv8 models are used:
        *   `best_Congestion.pt`: Detects vehicles and calculates traffic congestion (screen coverage).
        *   `best_Pothole.pt`: Detects potholes, cracks, and barricades.
    *   **Output**: Generates frame-by-frame detection logs in JSON format (`output/congestion/` and `output/pothole/`) and optionally creates an annotated video.

3.  **Metrics Merging (`app/services/metrics.py`)**:
    *   Runs immediately after the video pipeline completes.
    *   **Synchronization**: Aligns sensor data timestamps with video frame timestamps.
    *   **Event Detection**: Identifies pothole events based on sensor triggers (e.g., `Pothole` flag 0->1).
    *   **Aggregation**: For each event, it creates a 5-second window to aggregate:
        *   **Sensor Metrics**: Max/Avg vertical vibration (`AccZ`).
        *   **Visual Metrics**: Number of potholes detected, estimated area/size.
    *   **Final Output**: Produces a consolidated `pothole_events_metrics.json` file.

## 📂 Project Structure

```
backend/
├── app/
│   ├── main.py              # Application entry point
│   ├── core/
│   │   └── config.py        # Configuration (paths, model settings)
│   ├── routers/             # API Endpoints
│   │   ├── upload.py        # File upload handlers
│   │   └── process.py       # Processing triggers
│   └── services/            # Business Logic
│       ├── pipeline.py      # CV Pipeline (YOLO + OpenCV)
│       └── metrics.py       # Data Merging Logic
├── uploads/                 # Raw uploaded files
├── output/                  # Generated results
│   ├── congestion/          # Congestion detection JSONs
│   ├── pothole/             # Pothole detection JSONs
│   ├── annotated_vids/      # Visualized output videos
│   └── pothole_events_metrics.json # Final merged report
├── weights/                 # YOLO Model weights
└── requirements.txt         # Python dependencies
```

## 🛠️ Setup & Installation

1.  **Prerequisites**:
    *   Python 3.9+
    *   Virtual Environment (recommended)

2.  **Install Dependencies**:
    ```bash
    # Create virtual environment
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate

    # Install packages
    pip install -r requirements.txt
    ```

3.  **Model Weights**:
    Ensure your YOLO model weights (`best_Congestion.pt` and `best_Pothole.pt`) are placed in the `weights/` directory.

## ⚡ Running the Server

Start the FastAPI server using Uvicorn:

```bash
uvicorn app.main:app --reload
```

The server will start at `http://127.0.0.1:8000`.

## 📖 API Usage

You can explore and test the API using the interactive Swagger UI at `http://127.0.0.1:8000/docs`.

### 1. Upload Data
*   **POST** `/api/upload/csv`: Upload sensor data CSV.
*   **POST** `/api/upload/video`: Upload dashcam video.

### 2. Process Data
*   **POST** `/api/process/{video_filename}`: Trigger the full pipeline.
    *   **Query Param**: `csv_filename` (The name of the uploaded CSV file).
    *   **Example**: `/api/process/trip_01.mp4?csv_filename=sensor_01.csv`

    *Note: This runs as a background task. The API will respond immediately, and processing will continue in the background.*

## 📊 Outputs

Results are saved in the `output/` directory:

*   **`pothole_events_metrics.json`**: The final structured data containing identified road hazards with severity scores.
*   **`annotated_vids/`**: Videos with bounding boxes drawn around detections.
