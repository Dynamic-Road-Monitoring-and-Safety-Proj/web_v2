// Mock data for testing based on new architecture
// Table structure: road_{city}_damage, road_{city}_congestion

import {
  CongestionItem,
  DamageItem,
  CityInfo,
  DashboardStats,
  FetchDataResponse,
} from './types';

// ============================================
// Mock Cities
// ============================================
export const mockCities: CityInfo[] = [
  { name: 'mumbai', displayName: 'Mumbai', state: 'Maharashtra' },
  { name: 'delhi', displayName: 'Delhi', state: 'Delhi' },
  { name: 'bangalore', displayName: 'Bangalore', state: 'Karnataka' },
  { name: 'chandigarh', displayName: 'Chandigarh', state: 'Chandigarh' },
];

// ============================================
// Mock Congestion Data
// ============================================
export const mockCongestionData: CongestionItem[] = [
  {
    hex_id: '8c2badb1d7f5cff',
    velocity_avg: 15.2,
    vehicle_count_avg: 22.5,
    vehicle_composition: { light: 50, medium: 30, heavy: 20 },
    vehicle_detailed: {
      car: 45,
      motorcycle: 30,
      bicycle: 5,
      cycle_rickshaw: 2,
      auto_rickshaw: 18,
      e_rickshaw: 8,
      bus: 6,
      truck: 10,
      tractor: 2,
    },
    traffic_density: 8.5,
    peak_vehicle_count: 25,
    road_name: 'Marine Drive',
    peak_hour_flag: true,
    congestion_level: 'high',
    event_count: 12,
    last_5_videos: ['s3://bucket/videos/vid1.mp4', 's3://bucket/videos/vid2.mp4'],
    last_updated: '2025-12-25T11:00:00',
    location: { lat: 19.0762, lon: 72.8780, city: 'mumbai', state: 'Maharashtra' },
  },
  {
    hex_id: '8c2badb1d7f6aaa',
    velocity_avg: 35.8,
    vehicle_count_avg: 8.2,
    vehicle_composition: { light: 70, medium: 20, heavy: 10 },
    vehicle_detailed: {
      car: 25,
      motorcycle: 15,
      bicycle: 3,
      cycle_rickshaw: 1,
      auto_rickshaw: 8,
      e_rickshaw: 4,
      bus: 2,
      truck: 3,
      tractor: 1,
    },
    traffic_density: 3.5,
    peak_vehicle_count: 12,
    road_name: 'Bandra Link Road',
    peak_hour_flag: false,
    congestion_level: 'low',
    event_count: 5,
    last_5_videos: ['s3://bucket/videos/vid3.mp4'],
    last_updated: '2025-12-25T09:30:00',
    location: { lat: 19.0595, lon: 72.8295, city: 'mumbai', state: 'Maharashtra' },
  },
  {
    hex_id: '8c2badb1d7f7bbb',
    velocity_avg: 22.5,
    vehicle_count_avg: 15.0,
    vehicle_composition: { light: 55, medium: 30, heavy: 15 },
    vehicle_detailed: {
      car: 35,
      motorcycle: 20,
      bicycle: 4,
      cycle_rickshaw: 2,
      auto_rickshaw: 12,
      e_rickshaw: 6,
      bus: 4,
      truck: 5,
      tractor: 2,
    },
    traffic_density: 5.5,
    peak_vehicle_count: 18,
    road_name: 'Western Express Highway',
    peak_hour_flag: true,
    congestion_level: 'medium',
    event_count: 8,
    last_5_videos: ['s3://bucket/videos/vid4.mp4', 's3://bucket/videos/vid5.mp4'],
    last_updated: '2025-12-25T10:15:00',
    location: { lat: 19.1136, lon: 72.8697, city: 'mumbai', state: 'Maharashtra' },
  },
];

// ============================================
// Mock Damage Data
// ============================================
export const mockDamageData: DamageItem[] = [
  {
    hex_id: '8a2badb0c6e7fff',
    sensor_metrics: {
      acc_x_avg: 0.12,
      acc_y_avg: 0.05,
      acc_z_avg: 9.81,
      gyro_x_avg: 0.02,
      gyro_y_avg: 0.01,
      gyro_z_avg: 0.03,
    },
    derived_metrics: {
      roughness_index: 2.5,
      spike_index: 1.2,
      vertical_displacement: 0.05,
      jerk_magnitude: 3.2,
      ride_comfort_score: 6.5,
    },
    road_damage_area_avg: 15.5,
    damage_severity_score: 62.0,
    damage_frequency: 25.0,
    total_potholes: 8,
    total_cracks: 3,
    pothole_events_count: 5,
    prophet_classification: 'moderate',
    event_count: 5,
    last_5_videos: ['s3://bucket/videos/damage1.mp4', 's3://bucket/videos/damage2.mp4'],
    last_corporation_visit: null,
    last_updated: '2025-12-25T10:30:00',
    location: { lat: 19.0760, lon: 72.8777, city: 'mumbai', state: 'Maharashtra' },
  },
  {
    hex_id: '8a2badb0c6e8fff',
    sensor_metrics: {
      acc_x_avg: 0.25,
      acc_y_avg: 0.12,
      acc_z_avg: 10.2,
      gyro_x_avg: 0.08,
      gyro_y_avg: 0.05,
      gyro_z_avg: 0.12,
    },
    derived_metrics: {
      roughness_index: 4.2,
      spike_index: 3.5,
      vertical_displacement: 0.15,
      jerk_magnitude: 8.5,
      ride_comfort_score: 3.2,
    },
    road_damage_area_avg: 35.0,
    damage_severity_score: 85.0,
    damage_frequency: 60.0,
    total_potholes: 15,
    total_cracks: 8,
    pothole_events_count: 12,
    prophet_classification: 'severe',
    event_count: 10,
    last_5_videos: ['s3://bucket/videos/damage3.mp4'],
    last_corporation_visit: '2025-12-20T14:00:00',
    last_updated: '2025-12-25T08:45:00',
    location: { lat: 19.0850, lon: 72.8890, city: 'mumbai', state: 'Maharashtra' },
  },
  {
    hex_id: '8a2badb0c6e9fff',
    sensor_metrics: {
      acc_x_avg: 0.05,
      acc_y_avg: 0.02,
      acc_z_avg: 9.78,
      gyro_x_avg: 0.01,
      gyro_y_avg: 0.005,
      gyro_z_avg: 0.01,
    },
    derived_metrics: {
      roughness_index: 0.8,
      spike_index: 0.3,
      vertical_displacement: 0.01,
      jerk_magnitude: 1.0,
      ride_comfort_score: 9.2,
    },
    road_damage_area_avg: 2.0,
    damage_severity_score: 12.0,
    damage_frequency: 5.0,
    total_potholes: 1,
    total_cracks: 0,
    pothole_events_count: 1,
    prophet_classification: 'good',
    event_count: 3,
    last_5_videos: ['s3://bucket/videos/damage4.mp4'],
    last_corporation_visit: '2025-12-15T10:00:00',
    last_updated: '2025-12-25T11:00:00',
    location: { lat: 19.0650, lon: 72.8650, city: 'mumbai', state: 'Maharashtra' },
  },
];

// ============================================
// Calculate Mock Stats
// ============================================
export const calculateMockStats = (
  congestion: CongestionItem[],
  damage: DamageItem[]
): DashboardStats => {
  const highCongestionCount = congestion.filter(c => c.congestion_level === 'high').length;
  const severeDamageCount = damage.filter(d => d.prophet_classification === 'severe').length;
  
  const avgVelocity = congestion.length > 0
    ? congestion.reduce((sum, c) => sum + c.velocity_avg, 0) / congestion.length
    : 0;
  
  const avgRideComfort = damage.length > 0
    ? damage.reduce((sum, d) => sum + (d.derived_metrics?.ride_comfort_score || 5), 0) / damage.length
    : 10;
  
  const peakHourCells = congestion.filter(c => c.peak_hour_flag).length;
  
  const totalEvents = congestion.reduce((sum, c) => sum + c.event_count, 0)
    + damage.reduce((sum, d) => sum + d.event_count, 0);

  const totalPotholes = damage.reduce((sum, d) => sum + d.total_potholes, 0);
  const totalCracks = damage.reduce((sum, d) => sum + d.total_cracks, 0);
  
  return {
    totalCongestionCells: congestion.length,
    totalDamageCells: damage.length,
    highCongestionCount,
    severeDamageCount,
    avgVelocity,
    avgRideComfort,
    peakHourCells,
    totalEvents,
    totalPotholes,
    totalCracks,
  };
};

// ============================================
// Get Mock Data Response
// ============================================
export const getMockDataResponse = (): FetchDataResponse => {
  return {
    congestion: mockCongestionData,
    damage: mockDamageData,
    stats: calculateMockStats(mockCongestionData, mockDamageData),
  };
};

// ============================================
// Use Mock Data Flag (for development)
// ============================================
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
