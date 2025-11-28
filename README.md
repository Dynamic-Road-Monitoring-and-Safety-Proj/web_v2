# Road Drivability & City Monitoring (RDCM) - Web V2

A comprehensive web platform for monitoring road conditions, detecting potholes, and analyzing traffic data using computer vision and sensor telemetry.

## 🚀 Overview

This project consists of a modern React frontend and a FastAPI backend that processes video and sensor data to provide real-time insights into road safety and drivability.

### Key Features
- **Interactive Map**: Visualizes road events (potholes, traffic) with severity indicators.
- **Video Analysis**: Plays annotated videos showing detected potholes and bounding boxes.
- **Sensor Telemetry**: Displays accelerometer and gyroscope data synchronized with events.
- **Dashboard**: Aggregates metrics like roughness index, impact intensity, and traffic density.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: Shadcn/ui, Radix UI
- **Maps**: Leaflet / React-Leaflet
- **State Management**: TanStack Query

### Backend
- **Framework**: FastAPI (Python)
- **ML/CV**: PyTorch, Ultralytics (YOLO)
- **Data Processing**: Pandas, NumPy

## 📂 Project Structure

```
├── backend/                # FastAPI backend
│   ├── app/               # Application source code
│   │   ├── routers/       # API endpoints
│   │   ├── services/      # Business logic (metrics, pipeline)
│   │   └── core/          # Configuration
│   ├── output/            # Generated metrics and annotated videos (Ignored in Git)
│   ├── uploads/           # User uploads (Ignored in Git)
│   └── weights/           # ML Model weights (Ignored in Git)
├── src/                   # React frontend source code
│   ├── components/        # Reusable UI components
│   ├── pages/             # Application pages (Dashboard, Landing)
│   ├── lib/               # Utilities and API clients
│   └── hooks/             # Custom React hooks
└── public/                # Static assets
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Bun (optional, for lockfile)

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

Navigate to the root directory (if not already there):
```bash
cd ..
```

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`.

Deploy
```
vercel login
vercel --prod --yes
```

## 📝 Data & Large Files

This repository ignores large files to keep the repo size manageable.
- **Videos**: Place your input videos in `backend/uploads/video/`.
- **Output**: Processed data and annotated videos are generated in `backend/output/`.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
