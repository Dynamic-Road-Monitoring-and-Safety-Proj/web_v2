// TypeScript types for DynamoDB road monitoring data
// Based on new city-based table structure: road_{city}_damage, road_{city}_congestion

// ============================================
// Location Types
// ============================================
export interface Location {
  lat: number;
  lon: number;
  city?: string;
  state?: string;
}

// ============================================
// Vehicle Types
// ============================================
export interface VehicleComposition {
  light: number;   // Cars, motorcycles, bicycles, cycle_rickshaws
  medium: number;  // Auto-rickshaws, e-rickshaws, buses
  heavy: number;   // Trucks, tractors
}

export interface VehicleDetailed {
  car: number;
  motorcycle: number;
  bicycle: number;
  cycle_rickshaw: number;
  auto_rickshaw: number;
  e_rickshaw: number;
  bus: number;
  truck: number;
  tractor: number;
}

// ============================================
// Congestion Table Types (road_{city}_congestion)
// H3 Resolution 12 (~10 meter radius)
// ============================================
export interface CongestionItem {
  hex_id: string;
  velocity_avg: number;           // km/h average speed
  vehicle_count_avg: number;      // Average vehicles per frame
  vehicle_composition: VehicleComposition;
  vehicle_detailed?: VehicleDetailed;
  traffic_density: number;        // Vehicles per frame
  peak_vehicle_count: number;     // Max vehicles in single frame
  road_name: string;              // From geocoding
  peak_hour_flag: boolean;        // Video captured during peak hours
  congestion_level: 'low' | 'medium' | 'high';
  event_count: number;            // Number of videos for this hex
  last_5_videos: string[];
  last_updated: string;           // ISO timestamp
  location: Location;
}

// ============================================
// Damage Table Types (road_{city}_damage)
// H3 Resolution 10 (~50 meter radius)
// ============================================
export interface SensorMetrics {
  acc_x_avg: number;
  acc_y_avg: number;
  acc_z_avg: number;
  gyro_x_avg: number;
  gyro_y_avg: number;
  gyro_z_avg: number;
}

export interface DerivedMetrics {
  roughness_index: number;        // Higher = rougher road
  spike_index: number;            // Sudden bumps detected
  vertical_displacement: number;  // Meters
  jerk_magnitude: number;
  ride_comfort_score: number;     // 0-10 scale, 10 = smooth
}

export interface DamageItem {
  hex_id: string;
  sensor_metrics?: SensorMetrics;
  derived_metrics?: DerivedMetrics;
  road_damage_area_avg: number;           // Percentage of frame with damage
  damage_severity_score: number;          // 0-100 scale
  damage_frequency: number;               // Percentage of frames with damage
  total_potholes: number;                 // Count
  total_cracks: number;                   // Count
  pothole_events_count: number;           // Events merged from sensor data
  prophet_classification: 'severe' | 'moderate' | 'good';
  event_count: number;                    // Number of videos contributing to this hex
  last_5_videos: string[];
  last_corporation_visit: string | null;  // ISO timestamp or null
  last_updated: string;                   // ISO timestamp
  location: Location;
}

// ============================================
// City Types
// ============================================
export interface CityInfo {
  name: string;       // e.g., "mumbai"
  displayName: string; // e.g., "Mumbai"
  state: string;      // e.g., "Maharashtra"
}

// ============================================
// Combined/UI Types
// ============================================
export interface HexCell {
  hex_id: string;
  location: Location;
  congestion?: CongestionItem;
  damage?: DamageItem;
}

export interface DashboardFilters {
  city: string;                   // City name (lowercase)
  congestionLevel?: 'low' | 'medium' | 'high' | 'all';
  prophetClassification?: 'severe' | 'moderate' | 'good' | 'all';
  showCongestion: boolean;
  showDamage: boolean;
}

export interface DashboardStats {
  totalCongestionCells: number;
  totalDamageCells: number;
  highCongestionCount: number;
  severeDamageCount: number;
  avgVelocity: number;
  avgRideComfort: number;
  peakHourCells: number;
  totalEvents: number;
  totalPotholes: number;
  totalCracks: number;
}

// ============================================
// Map Display Types
// ============================================
export interface MapMarker {
  hex_id: string;
  lat: number;
  lon: number;
  type: 'congestion' | 'damage' | 'both';
  severity: number; // 0-100 normalized severity
  congestionLevel?: string;
  prophetClassification?: string;
}

// ============================================
// Video Reference Types
// ============================================
export interface VideoReference {
  s3_uri: string;
  timestamp?: string;
}

// ============================================
// API Response Types
// ============================================
export interface FetchDataResponse {
  congestion: CongestionItem[];
  damage: DamageItem[];
  stats: DashboardStats;
}

// ============================================
// Utility function types
// ============================================
export type CongestionLevelType = 'low' | 'medium' | 'high';
export type ProphetClassificationType = 'severe' | 'moderate' | 'good';

export const CONGESTION_LEVELS: CongestionLevelType[] = ['low', 'medium', 'high'];
export const PROPHET_CLASSIFICATIONS: ProphetClassificationType[] = ['good', 'moderate', 'severe'];

// Severity mappings for visualization
export const CONGESTION_SEVERITY_MAP: Record<CongestionLevelType, number> = {
  low: 25,
  medium: 50,
  high: 100,
};

export const PROPHET_SEVERITY_MAP: Record<ProphetClassificationType, number> = {
  good: 25,
  moderate: 50,
  severe: 100,
};

// ============================================
// Color Schemes (from architecture.txt)
// ============================================
export const DAMAGE_COLORS = {
  severe: '#FF0000',   // Red
  moderate: '#FFA500', // Orange
  good: '#00FF00',     // Green
} as const;

export const CONGESTION_COLORS = {
  high: '#FF0000',     // Red
  medium: '#FFFF00',   // Yellow
  low: '#00FF00',      // Green
} as const;

export const VEHICLE_CATEGORY_COLORS = {
  light: '#3498db',    // Blue
  medium: '#f39c12',   // Orange
  heavy: '#e74c3c',    // Red
} as const;

// ============================================
// Indian States List
// ============================================
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Chandigarh',
] as const;
