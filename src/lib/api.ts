// API Service Layer - Lambda Function URLs
// Secure backend calls without exposing AWS credentials

import {
  CongestionItem,
  DamageItem,
  CityInfo,
} from './types';

// ============================================
// Lambda Function URLs (from environment)
// ============================================

const DATA_LAMBDA_URL = import.meta.env.VITE_LAMBDA_DATA_URL;
const VIDEO_LAMBDA_URL = import.meta.env.VITE_LAMBDA_VIDEO_URL;
const UPLOAD_LAMBDA_URL = import.meta.env.VITE_LAMBDA_UPLOAD_URL;

// Debug: Log configuration status
console.log('Lambda API Config:', {
  hasDataUrl: !!DATA_LAMBDA_URL,
  hasVideoUrl: !!VIDEO_LAMBDA_URL,
  hasUploadUrl: !!UPLOAD_LAMBDA_URL,
});

// ============================================
// Data Fetching Functions
// ============================================

/**
 * Fetch congestion data for a city
 */
export const fetchCongestionData = async (city: string): Promise<CongestionItem[]> => {
  if (!DATA_LAMBDA_URL) {
    throw new Error('VITE_LAMBDA_DATA_URL not configured');
  }
  
  try {
    const response = await fetch(`${DATA_LAMBDA_URL}/?city=${encodeURIComponent(city)}&type=congestion`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Lambda returns items directly as array
    if (Array.isArray(data)) {
      return data.map(normalizeCongestionItem);
    }
    
    return [];
  } catch (error: any) {
    console.error(`Error fetching congestion data for ${city}:`, error);
    throw error;
  }
};

/**
 * Fetch damage data for a city
 */
export const fetchDamageData = async (city: string): Promise<DamageItem[]> => {
  if (!DATA_LAMBDA_URL) {
    throw new Error('VITE_LAMBDA_DATA_URL not configured');
  }
  
  try {
    const response = await fetch(`${DATA_LAMBDA_URL}/?city=${encodeURIComponent(city)}&type=damage`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map(normalizeDamageItem);
    }
    
    return [];
  } catch (error: any) {
    console.error(`Error fetching damage data for ${city}:`, error);
    throw error;
  }
};

/**
 * Fetch list of available cities
 * For now, returns hardcoded list. In future, can add a Lambda for this.
 */
export const fetchAvailableCities = async (): Promise<CityInfo[]> => {
  // Currently only patna has data
  // Add more cities as they become available
  return [
    { name: 'patna', displayName: 'Patna', state: 'Bihar' },
    // { name: 'mumbai', displayName: 'Mumbai', state: 'Maharashtra' },
    // { name: 'delhi', displayName: 'Delhi', state: 'Delhi' },
  ];
};

// ============================================
// Video URL Functions
// ============================================

/**
 * Get a pre-signed URL for downloading/viewing a video
 */
export const getPresignedVideoUrl = async (s3Uri: string): Promise<string> => {
  if (!VIDEO_LAMBDA_URL) {
    throw new Error('VITE_LAMBDA_VIDEO_URL not configured');
  }
  
  try {
    const response = await fetch(`${VIDEO_LAMBDA_URL}/?uri=${encodeURIComponent(s3Uri)}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.url;
  } catch (error: any) {
    console.error('Error getting video URL:', error);
    throw error;
  }
};

// ============================================
// Photo Upload Functions (for Pothole Reports)
// ============================================

/**
 * Upload a pothole report photo
 * 1. Gets a pre-signed upload URL from Lambda
 * 2. Uploads the file directly to S3
 */
export const uploadPotholeReport = async (
  file: File,
  hexId: string,
  username: string
): Promise<{ success: boolean; key?: string; error?: string }> => {
  if (!UPLOAD_LAMBDA_URL) {
    return { success: false, error: 'VITE_LAMBDA_UPLOAD_URL not configured' };
  }
  
  try {
    // Get the file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const sanitizedHexId = hexId.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Step 1: Get pre-signed upload URL from Lambda
    const uploadUrlResponse = await fetch(
      `${UPLOAD_LAMBDA_URL}/?hex_id=${encodeURIComponent(sanitizedHexId)}&username=${encodeURIComponent(sanitizedUsername)}&ext=${encodeURIComponent(ext)}`
    );
    
    if (!uploadUrlResponse.ok) {
      const errorData = await uploadUrlResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get upload URL: HTTP ${uploadUrlResponse.status}`);
    }
    
    const { uploadUrl, key } = await uploadUrlResponse.json();
    
    // Step 2: Upload file directly to S3 using pre-signed URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to S3: HTTP ${uploadResponse.status}`);
    }
    
    console.log('Uploaded pothole report:', key);
    return { success: true, key };
  } catch (error: any) {
    console.error('Failed to upload pothole report:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// Data Normalization Helpers
// ============================================

/**
 * Normalize congestion item from Lambda response
 * Lambda returns data already parsed, but we ensure consistent types
 */
const normalizeCongestionItem = (item: any): CongestionItem => {
  return {
    hex_id: item.hex_id || '',
    velocity_avg: parseFloat(item.velocity_avg) || 0,
    vehicle_count_avg: parseFloat(item.vehicle_count_avg) || 0,
    vehicle_composition: {
      light: parseFloat(item.vehicle_composition?.light) || 0,
      medium: parseFloat(item.vehicle_composition?.medium) || 0,
      heavy: parseFloat(item.vehicle_composition?.heavy) || 0,
    },
    vehicle_detailed: item.vehicle_detailed ? {
      car: parseInt(item.vehicle_detailed.car || item.vehicle_detailed.Car) || 0,
      motorcycle: parseInt(item.vehicle_detailed.motorcycle) || 0,
      bicycle: parseInt(item.vehicle_detailed.bicycle) || 0,
      cycle_rickshaw: parseInt(item.vehicle_detailed.cycle_rickshaw) || 0,
      auto_rickshaw: parseInt(item.vehicle_detailed.auto_rickshaw || item.vehicle_detailed['Auto-Rickshaw']) || 0,
      e_rickshaw: parseInt(item.vehicle_detailed.e_rickshaw) || 0,
      bus: parseInt(item.vehicle_detailed.bus || item.vehicle_detailed.Bus) || 0,
      truck: parseInt(item.vehicle_detailed.truck) || 0,
      tractor: parseInt(item.vehicle_detailed.tractor) || 0,
    } : undefined,
    traffic_density: parseFloat(item.traffic_density) || 0,
    peak_vehicle_count: parseInt(item.peak_vehicle_count) || 0,
    road_name: item.road_name || 'Unknown',
    peak_hour_flag: item.peak_hour_flag === true || item.peak_hour_flag === 'true',
    congestion_level: (item.congestion_level || 'low') as 'low' | 'medium' | 'high',
    event_count: parseInt(item.event_count) || 0,
    last_5_videos: Array.isArray(item.last_5_videos) ? item.last_5_videos : [],
    last_updated: item.last_updated || '',
    location: {
      lat: parseFloat(item.location?.lat) || 0,
      lon: parseFloat(item.location?.lon) || 0,
      city: item.location?.city,
      state: item.location?.state,
    },
  };
};

/**
 * Normalize damage item from Lambda response
 */
const normalizeDamageItem = (item: any): DamageItem => {
  return {
    hex_id: item.hex_id || '',
    sensor_metrics: item.sensor_metrics ? {
      acc_x_avg: parseFloat(item.sensor_metrics.acc_x_avg) || 0,
      acc_y_avg: parseFloat(item.sensor_metrics.acc_y_avg) || 0,
      acc_z_avg: parseFloat(item.sensor_metrics.acc_z_avg) || 0,
      gyro_x_avg: parseFloat(item.sensor_metrics.gyro_x_avg) || 0,
      gyro_y_avg: parseFloat(item.sensor_metrics.gyro_y_avg) || 0,
      gyro_z_avg: parseFloat(item.sensor_metrics.gyro_z_avg) || 0,
    } : undefined,
    derived_metrics: item.derived_metrics ? {
      roughness_index: parseFloat(item.derived_metrics.roughness_index) || 0,
      spike_index: parseFloat(item.derived_metrics.spike_index) || 0,
      vertical_displacement: parseFloat(item.derived_metrics.vertical_displacement) || 0,
      jerk_magnitude: parseFloat(item.derived_metrics.jerk_magnitude) || 0,
      ride_comfort_score: parseFloat(item.derived_metrics.ride_comfort_score) || 0,
    } : undefined,
    road_damage_area_avg: parseFloat(item.road_damage_area_avg) || 0,
    damage_severity_score: parseFloat(item.damage_severity_score) || 0,
    damage_frequency: parseFloat(item.damage_frequency) || 0,
    total_potholes: parseInt(item.total_potholes) || 0,
    total_cracks: parseInt(item.total_cracks) || 0,
    pothole_events_count: parseInt(item.pothole_events_count) || 0,
    prophet_classification: (item.prophet_classification || 'good') as 'severe' | 'moderate' | 'good',
    event_count: parseInt(item.event_count) || 0,
    last_5_videos: Array.isArray(item.last_5_videos) ? item.last_5_videos : [],
    last_corporation_visit: item.last_corporation_visit === 'null' ? null : item.last_corporation_visit,
    last_updated: item.last_updated || '',
    location: {
      lat: parseFloat(item.location?.lat) || 0,
      lon: parseFloat(item.location?.lon) || 0,
      city: item.location?.city,
      state: item.location?.state,
    },
  };
};

// ============================================
// Utility Functions (kept for compatibility)
// ============================================

export const getTableName = (city: string, tableType: 'congestion' | 'damage'): string => {
  return `road_${city.toLowerCase()}_${tableType}`;
};

export const formatCityName = (city: string): string => {
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
};

// ============================================
// Statistics Calculation
// ============================================

import { DashboardStats, FetchDataResponse } from './types';

/**
 * Calculate dashboard statistics from data
 */
export const calculateStats = (
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

/**
 * Fetch both congestion and damage data for a city
 */
export const fetchAllData = async (city: string): Promise<FetchDataResponse> => {
  const [congestion, damage] = await Promise.all([
    fetchCongestionData(city),
    fetchDamageData(city),
  ]);
  
  const stats = calculateStats(congestion, damage);
  
  return { congestion, damage, stats };
};

// ============================================
// Filtering Functions
// ============================================

export const filterCongestionByLevel = (
  data: CongestionItem[],
  level: string
): CongestionItem[] => {
  if (level === 'all') return data;
  return data.filter(item => item.congestion_level === level);
};

export const filterDamageByClassification = (
  data: DamageItem[],
  classification: string
): DamageItem[] => {
  if (classification === 'all') return data;
  return data.filter(item => item.prophet_classification === classification);
};

// ============================================
// Color Utilities
// ============================================

export const getCongestionColor = (level: string): string => {
  switch (level) {
    case 'low': return '#00FF00';    // Green
    case 'medium': return '#FFFF00'; // Yellow
    case 'high': return '#FF0000';   // Red
    default: return '#6b7280';
  }
};

export const getDamageColor = (classification: string): string => {
  switch (classification) {
    case 'good': return '#00FF00';     // Green
    case 'moderate': return '#FFA500'; // Orange
    case 'severe': return '#FF0000';   // Red
    default: return '#6b7280';
  }
};

export const getCongestionSeverity = (level: string): number => {
  switch (level) {
    case 'low': return 25;
    case 'medium': return 50;
    case 'high': return 100;
    default: return 0;
  }
};

export const getDamageSeverity = (classification: string): number => {
  switch (classification) {
    case 'good': return 25;
    case 'moderate': return 50;
    case 'severe': return 100;
    default: return 0;
  }
};

export const getSeverityColor = (severity: number): string => {
  if (severity < 33) return '#00FF00';  // Green
  if (severity < 66) return '#FFA500';  // Orange
  return '#FF0000';                      // Red
};
