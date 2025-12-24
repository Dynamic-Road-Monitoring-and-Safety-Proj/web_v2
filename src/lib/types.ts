// TypeScript types for DynamoDB road monitoring data

// ============================================
// Location Types
// ============================================
export interface Location {
  lat: number;
  lon: number;
}

// ============================================
// Congestion Table Types (road_congestion_YYYYMMDD)
// ============================================
export interface VehicleComposition {
  light: number;
  medium: number;
  heavy: number;
}

export interface CongestionItem {
  hex_id: string;
  congestion_level: 'low' | 'medium' | 'high' | 'critical';
  event_count: number;
  last_5_videos: string[];
  last_updated: string;
  location: Location;
  peak_hour_flag: boolean;
  road_name: string;
  vehicle_composition: VehicleComposition;
  vehicle_count_avg: number;
  velocity_avg: number;
}

// ============================================
// Damage Table Types (road_damage_YYYYMMDD)
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
  roughness_index: number;
  spike_index: number;
  vertical_displacement: number;
  jerk_magnitude: number;
  ride_comfort_score: number; // 0-100
}

export interface DamageItem {
  hex_id: string;
  sensor_metrics: SensorMetrics;
  derived_metrics: DerivedMetrics;
  road_damage_area_avg: number;
  prophet_classification: 'good' | 'moderate' | 'poor' | 'critical';
  event_count: number;
  last_5_videos: string[];
  location: Location;
  last_updated: string;
  last_corporation_visit: string | null;
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
  date: string; // YYYYMMDD format
  congestionLevel?: 'low' | 'medium' | 'high' | 'critical' | 'all';
  prophetClassification?: 'good' | 'moderate' | 'poor' | 'critical' | 'all';
  showCongestion: boolean;
  showDamage: boolean;
}

export interface DashboardStats {
  totalCongestionCells: number;
  totalDamageCells: number;
  highCongestionCount: number;
  criticalDamageCount: number;
  avgVelocity: number;
  avgRideComfort: number;
  peakHourCells: number;
  totalEvents: number;
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
export type CongestionLevelType = 'low' | 'medium' | 'high' | 'critical';
export type ProphetClassificationType = 'good' | 'moderate' | 'poor' | 'critical';

export const CONGESTION_LEVELS: CongestionLevelType[] = ['low', 'medium', 'high', 'critical'];
export const PROPHET_CLASSIFICATIONS: ProphetClassificationType[] = ['good', 'moderate', 'poor', 'critical'];

// Severity mappings for visualization
export const CONGESTION_SEVERITY_MAP: Record<CongestionLevelType, number> = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 100,
};

export const PROPHET_SEVERITY_MAP: Record<ProphetClassificationType, number> = {
  good: 25,
  moderate: 50,
  poor: 75,
  critical: 100,
};
