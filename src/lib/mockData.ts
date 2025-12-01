// Mock data based on pothole_events_metrics.json structure
export interface Event {
  id: string;
  lat_center: number;
  lon_center: number;
  event_timestamp: string;
  pothole_confidence: number;
  roughness_index: number;
  impact_intensity: number;
  frames_with_pothole: number;
  avg_vehicles_per_frame: number;
  peak_vehicle_count: number;
  needs_attention: boolean;
  validation_score: number;
  sector: string;
  street_name: string;
  accel: {
    ax: number;
    ay: number;
    az: number;
  };
  gyro_intensity: number;
  az_spike: number;
  video_url?: string;
  thumbnail_url?: string;
}

// Chandigarh coordinates: approximately 30.7333° N, 76.7794° E
export const mockEvents: Event[] = [
  {
    id: "evt_001",
    lat_center: 30.7465,
    lon_center: 76.7886,
    event_timestamp: "2025-11-24T08:23:15Z",
    pothole_confidence: 0.92,
    roughness_index: 8.4,
    impact_intensity: 7.2,
    frames_with_pothole: 12,
    avg_vehicles_per_frame: 4.5,
    peak_vehicle_count: 8,
    needs_attention: true,
    validation_score: 0.88,
    sector: "Sector 17",
    street_name: "Jan Marg",
    accel: { ax: 0.12, ay: -0.05, az: 9.82 },
    gyro_intensity: 1.5,
    az_spike: 12.3,
  },
  {
    id: "evt_002",
    lat_center: 30.7223,
    lon_center: 76.7645,
    event_timestamp: "2025-11-24T09:45:32Z",
    pothole_confidence: 0.85,
    roughness_index: 6.8,
    impact_intensity: 5.9,
    frames_with_pothole: 8,
    avg_vehicles_per_frame: 6.2,
    peak_vehicle_count: 12,
    needs_attention: true,
    validation_score: 0.82,
    sector: "Sector 35",
    street_name: "Dakshin Marg",
    accel: { ax: 0.08, ay: -0.03, az: 9.79 },
    gyro_intensity: 1.2,
    az_spike: 10.1,
  },
  {
    id: "evt_003",
    lat_center: 30.7611,
    lon_center: 76.7755,
    event_timestamp: "2025-11-24T11:12:48Z",
    pothole_confidence: 0.78,
    roughness_index: 5.2,
    impact_intensity: 4.5,
    frames_with_pothole: 6,
    avg_vehicles_per_frame: 3.8,
    peak_vehicle_count: 7,
    needs_attention: false,
    validation_score: 0.75,
    sector: "Sector 9",
    street_name: "Madhya Marg",
    accel: { ax: 0.05, ay: -0.02, az: 9.80 },
    gyro_intensity: 0.9,
    az_spike: 8.5,
  },
  {
    id: "evt_004",
    lat_center: 30.7389,
    lon_center: 76.7912,
    event_timestamp: "2025-11-24T13:27:05Z",
    pothole_confidence: 0.95,
    roughness_index: 9.1,
    impact_intensity: 8.3,
    frames_with_pothole: 15,
    avg_vehicles_per_frame: 5.1,
    peak_vehicle_count: 10,
    needs_attention: true,
    validation_score: 0.91,
    sector: "Sector 22",
    street_name: "Purva Marg",
    accel: { ax: 0.15, ay: -0.07, az: 9.85 },
    gyro_intensity: 1.8,
    az_spike: 13.7,
  },
  {
    id: "evt_005",
    lat_center: 30.7145,
    lon_center: 76.7534,
    event_timestamp: "2025-11-24T14:53:22Z",
    pothole_confidence: 0.71,
    roughness_index: 4.6,
    impact_intensity: 3.8,
    frames_with_pothole: 5,
    avg_vehicles_per_frame: 2.9,
    peak_vehicle_count: 5,
    needs_attention: false,
    validation_score: 0.68,
    sector: "Sector 43",
    street_name: "Himalaya Marg",
    accel: { ax: 0.03, ay: -0.01, az: 9.78 },
    gyro_intensity: 0.7,
    az_spike: 7.2,
  },
  {
    id: "evt_006",
    lat_center: 30.7528,
    lon_center: 76.7823,
    event_timestamp: "2025-11-24T16:18:40Z",
    pothole_confidence: 0.88,
    roughness_index: 7.5,
    impact_intensity: 6.7,
    frames_with_pothole: 10,
    avg_vehicles_per_frame: 4.8,
    peak_vehicle_count: 9,
    needs_attention: true,
    validation_score: 0.85,
    sector: "Sector 11",
    street_name: "Udyog Path",
    accel: { ax: 0.11, ay: -0.04, az: 9.81 },
    gyro_intensity: 1.4,
    az_spike: 11.2,
  },
];

export interface VideoAnnotation {
  id: string;
  video_url: string;
  title: string;
  event_id: string;
  timestamp: string;
  duration: number;
  frames: Array<{
    frame_number: number;
    timestamp: number;
    detections: Array<{
      type: string;
      confidence: number;
      bbox: [number, number, number, number];
      roughness?: number;
    }>;
  }>;
}

export const mockVideos: VideoAnnotation[] = [
  {
    id: "vid_001",
    video_url: "https://example.com/video1.mp4",
    title: "Sector 17 - Jan Marg - High Severity",
    event_id: "evt_001",
    timestamp: "2025-11-24T08:23:15Z",
    duration: 45,
    frames: [],
  },
  {
    id: "vid_002",
    video_url: "https://example.com/video2.mp4",
    title: "Sector 22 - Purva Marg - Critical",
    event_id: "evt_004",
    timestamp: "2025-11-24T13:27:05Z",
    duration: 52,
    frames: [],
  },
];

export interface KPIMetrics {
  totalEvents: number;
  needsAttention: number;
  avgRoughness: number;
  avgImpactIntensity: number;
  avgTrafficDensity: number;
  avgAQI: number;
}

export const calculateMetrics = (events: Event[]): KPIMetrics => {
  const totalEvents = events.length;
  if (totalEvents === 0) {
    return {
      totalEvents: 0,
      needsAttention: 0,
      avgRoughness: 0,
      avgImpactIntensity: 0,
      avgTrafficDensity: 0,
      avgAQI: 68,
    };
  }
  const needsAttention = events.filter(e => e.needs_attention).length;
  const avgRoughness = events.reduce((sum, e) => sum + e.roughness_index, 0) / totalEvents;
  const avgImpactIntensity = events.reduce((sum, e) => sum + e.impact_intensity, 0) / totalEvents;
  const avgTrafficDensity = events.reduce((sum, e) => sum + e.avg_vehicles_per_frame, 0) / totalEvents;
  
  return {
    totalEvents,
    needsAttention,
    avgRoughness: Math.round(avgRoughness * 10) / 10,
    avgImpactIntensity: Math.round(avgImpactIntensity * 10) / 10,
    avgTrafficDensity: Math.round(avgTrafficDensity * 10) / 10,
    avgAQI: 68, // Mock AQI value
  };
};

// Developer spec for backend teams
export const API_SPEC = {
  endpoints: {
    getEvents: "GET /api/events?city=chandigarh&from=&to=",
    getVideos: "GET /api/videos?city=chandigarh",
    getVideoAnnotations: "GET /api/videos/{id}/annotations",
    createReport: "POST /api/reports",
  },
  fieldMapping: {
    location: ["lat_center", "lon_center"],
    timestamp: "event_timestamp",
    severity: ["pothole_confidence", "roughness_index", "impact_intensity"],
    traffic: ["avg_vehicles_per_frame", "peak_vehicle_count"],
    sensor: ["accel (ax, ay, az)", "gyro_intensity", "az_spike"],
    metadata: ["sector", "street_name", "needs_attention", "validation_score"],
  },
};
