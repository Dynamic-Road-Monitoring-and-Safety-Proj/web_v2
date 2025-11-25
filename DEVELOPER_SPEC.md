# RDCM Developer Specification

## Overview
This document provides technical specifications for backend teams to integrate with the RDCM (Road Drivability & City Monitoring) platform. The frontend is built with React, TypeScript, and Tailwind CSS, designed to consume RESTful APIs.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **UI Components**: Shadcn/ui, Radix UI
- **Routing**: React Router v6
- **Expected Backend**: RESTful API (JSON responses)

## Design System Tokens

### Colors (HSL format)
```css
/* Light Mode */
--primary: 186 75% 45% (Teal)
--secondary: 220 70% 50% (Blue)
--urgent: 35 90% 55% (Amber)

/* Dark Mode */
--primary: 186 75% 55%
--secondary: 220 70% 60%
--urgent: 35 90% 60%
```

### Gradients
- `gradient-primary`: Linear gradient from teal to blue
- `gradient-urgent`: Linear gradient for critical alerts

### Animations
- Spring-based transitions (0.3s ease-out)
- Pulse animations for live data (2s infinite)
- Float animations for floating elements (6s ease-in-out)

## API Endpoints (Expected)

### 1. Get Events
```
GET /api/events
```

**Query Parameters:**
- `city` (required): City identifier (e.g., "chandigarh")
- `from` (optional): ISO 8601 timestamp for start date
- `to` (optional): ISO 8601 timestamp for end date
- `severity` (optional): Filter by severity level
- `needs_attention` (optional): Boolean filter for urgent events

**Response:**
```json
{
  "events": [
    {
      "id": "evt_001",
      "lat_center": 30.7465,
      "lon_center": 76.7886,
      "event_timestamp": "2025-11-24T08:23:15Z",
      "pothole_confidence": 0.92,
      "roughness_index": 8.4,
      "impact_intensity": 7.2,
      "frames_with_pothole": 12,
      "avg_vehicles_per_frame": 4.5,
      "peak_vehicle_count": 8,
      "needs_attention": true,
      "validation_score": 0.88,
      "sector": "Sector 17",
      "street_name": "Jan Marg",
      "accel": {
        "ax": 0.12,
        "ay": -0.05,
        "az": 9.82
      },
      "gyro_intensity": 1.5,
      "az_spike": 12.3
    }
  ],
  "total": 247,
  "page": 1,
  "per_page": 50
}
```

### 2. Get Videos
```
GET /api/videos
```

**Query Parameters:**
- `city` (required): City identifier
- `event_id` (optional): Filter by event ID
- `from` (optional): ISO 8601 timestamp
- `to` (optional): ISO 8601 timestamp

**Response:**
```json
{
  "videos": [
    {
      "id": "vid_001",
      "video_url": "https://cdn.example.com/videos/vid_001.mp4",
      "title": "Sector 17 - Jan Marg - High Severity",
      "event_id": "evt_001",
      "timestamp": "2025-11-24T08:23:15Z",
      "duration": 45,
      "thumbnail_url": "https://cdn.example.com/thumbnails/vid_001.jpg"
    }
  ]
}
```

### 3. Get Video Annotations
```
GET /api/videos/{video_id}/annotations
```

**Response:**
```json
{
  "video_id": "vid_001",
  "frames": [
    {
      "frame_number": 1,
      "timestamp": 0.033,
      "detections": [
        {
          "type": "pothole",
          "confidence": 0.92,
          "bbox": [120, 450, 180, 520],
          "roughness": 8.4
        },
        {
          "type": "vehicle",
          "confidence": 0.95,
          "bbox": [300, 200, 450, 350]
        }
      ]
    }
  ]
}
```

### 4. Create Report
```
POST /api/reports
```

**Request Body:**
```json
{
  "event_ids": ["evt_001", "evt_002"],
  "format": "pdf",
  "include_videos": true,
  "include_annotations": true
}
```

**Response:**
```json
{
  "report_id": "rpt_001",
  "download_url": "https://cdn.example.com/reports/rpt_001.pdf",
  "expires_at": "2025-11-25T08:23:15Z"
}
```

### 5. Assign to Crew
```
POST /api/crew-assignments
```

**Request Body:**
```json
{
  "event_id": "evt_001",
  "crew_id": "crew_003",
  "priority": "high",
  "due_date": "2025-11-26T12:00:00Z",
  "notes": "Critical pothole on main road"
}
```

### 6. Get Metrics
```
GET /api/metrics
```

**Query Parameters:**
- `city` (required): City identifier
- `from` (optional): ISO 8601 timestamp
- `to` (optional): ISO 8601 timestamp

**Response:**
```json
{
  "total_events": 247,
  "needs_attention": 23,
  "avg_roughness": 6.8,
  "avg_impact_intensity": 5.9,
  "avg_traffic_density": 4.5,
  "avg_aqi": 68
}
```

## Field Mapping Reference

| Frontend Display | Backend Field | Type | Description |
|-----------------|---------------|------|-------------|
| Location | `lat_center`, `lon_center` | Float | Event coordinates |
| Timestamp | `event_timestamp` | ISO 8601 | Detection time |
| Confidence | `pothole_confidence` | Float (0-1) | Detection confidence |
| Roughness | `roughness_index` | Float (0-10) | Road quality index |
| Impact | `impact_intensity` | Float (0-10) | Severity metric |
| Frames | `frames_with_pothole` | Integer | Detection frame count |
| Traffic Avg | `avg_vehicles_per_frame` | Float | Average vehicles |
| Traffic Peak | `peak_vehicle_count` | Integer | Max vehicles observed |
| Urgent | `needs_attention` | Boolean | Priority flag |
| Validation | `validation_score` | Float (0-1) | Manual review score |
| Location Info | `sector`, `street_name` | String | Human-readable location |
| Sensor Data | `accel` (ax, ay, az) | Object | Accelerometer readings |
| Gyro | `gyro_intensity` | Float | Gyroscope reading |
| Spike | `az_spike` | Float | Vertical acceleration spike |

## Authentication
Expected authentication method: **Bearer token** in Authorization header

```
Authorization: Bearer {token}
```

## Error Responses
Standard error format:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required parameter: city",
    "details": {
      "field": "city",
      "reason": "required"
    }
  }
}
```

## Rate Limiting
Expected rate limits:
- 100 requests per minute for GET endpoints
- 20 requests per minute for POST endpoints

## CORS Configuration
Frontend will be served from:
- Development: `http://localhost:8080`
- Production: `https://rdcm.example.com`

## WebSocket Support (Optional)
For real-time updates:
```
ws://api.example.com/ws/events?city=chandigarh
```

**Message Format:**
```json
{
  "type": "new_event",
  "data": {
    // Event object
  }
}
```

## Mock Data Source
The frontend currently uses mock data located in `src/lib/mockData.ts`. This file demonstrates the expected data structure and can be used as a reference for API responses.

## Deployment Considerations

### Frontend Build
```bash
npm install
npm run build
```

Output: `dist/` directory (static files)

### Environment Variables
```env
VITE_API_BASE_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
VITE_MAPBOX_TOKEN=pk.xxx (if using Mapbox)
```

## Security Requirements
- HTTPS required for production
- CORS properly configured
- Authentication tokens with expiry
- Rate limiting per IP/user
- Input validation on all endpoints
- SQL injection prevention
- XSS protection headers

## Performance Recommendations
- Event list: paginate with max 50 items per page
- Video streaming: HLS or DASH protocol
- Annotations: compress JSON responses
- Images: CDN with WebP format
- Response time: < 200ms for GET requests
- Caching: ETags for unchanging data

## Accessibility
The frontend implements WCAG 2.1 AA standards:
- Keyboard navigation support
- ARIA labels on interactive elements
- Color contrast ratios > 4.5:1
- Screen reader compatible

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Monitoring & Analytics
Expected tracking events:
- Page views (landing, dashboard)
- Event selection
- Video playback
- Report generation
- Crew assignment
- Export actions

## Contact
For technical questions or API integration support:
- Email: dev@rdcm.tech
- Slack: #rdcm-integration
- Docs: https://docs.rdcm.tech

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: Ready for backend integration
