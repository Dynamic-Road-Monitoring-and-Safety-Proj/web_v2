// DynamoDB Service Layer - Direct AWS SDK integration
// No backend server required - reads directly from DynamoDB tables

import { DynamoDBClient, ScanCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
  CongestionItem,
  DamageItem,
  Location,
  VehicleComposition,
  SensorMetrics,
  DerivedMetrics,
  DashboardStats,
  FetchDataResponse,
} from './types';

// ============================================
// AWS Configuration
// ============================================

// Get AWS credentials from environment variables
// In production, use Cognito Identity Pool for secure browser-based access
const getAwsConfig = () => {
  return {
    region: import.meta.env.VITE_AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
    },
  };
};

// Create DynamoDB client (lazy initialization)
let dynamoClient: DynamoDBClient | null = null;

const getDynamoClient = (): DynamoDBClient => {
  if (!dynamoClient) {
    dynamoClient = new DynamoDBClient(getAwsConfig());
  }
  return dynamoClient;
};

// ============================================
// Table Name Utilities
// ============================================

/**
 * Generate table name with date suffix
 * @param tableType 'congestion' or 'damage'
 * @param date Date in YYYYMMDD format
 */
export const getTableName = (tableType: 'congestion' | 'damage', date: string): string => {
  const prefix = tableType === 'congestion' ? 'road_congestion_' : 'road_damage_';
  return `${prefix}${date}`;
};

/**
 * Format date to YYYYMMDD
 */
export const formatDateForTable = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Get today's date in YYYYMMDD format
 */
export const getTodayDateString = (): string => {
  return formatDateForTable(new Date());
};

/**
 * Get available date options (last 7 days)
 */
export const getAvailableDates = (): { value: string; label: string }[] => {
  const dates: { value: string; label: string }[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const value = formatDateForTable(date);
    const label = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    dates.push({ value, label: i === 0 ? `Today (${label})` : label });
  }
  
  return dates;
};

// ============================================
// DynamoDB Response Parsers
// ============================================

/**
 * Parse location from DynamoDB format
 */
const parseLocation = (locationData: any): Location => {
  if (!locationData) return { lat: 0, lon: 0 };
  
  // Handle DynamoDB map format: {lat: {N: "30.632646"}, lon: {N: "76.725591"}}
  if (locationData.lat?.N && locationData.lon?.N) {
    return {
      lat: parseFloat(locationData.lat.N),
      lon: parseFloat(locationData.lon.N),
    };
  }
  
  // Handle already parsed format
  if (typeof locationData.lat === 'number' && typeof locationData.lon === 'number') {
    return locationData;
  }
  
  return { lat: 0, lon: 0 };
};

/**
 * Parse vehicle composition from DynamoDB format
 */
const parseVehicleComposition = (data: any): VehicleComposition => {
  if (!data) return { light: 0, medium: 0, heavy: 0 };
  
  // Handle DynamoDB map format
  if (data.light?.N !== undefined) {
    return {
      light: parseFloat(data.light.N) || 0,
      medium: parseFloat(data.medium.N) || 0,
      heavy: parseFloat(data.heavy.N) || 0,
    };
  }
  
  return {
    light: data.light || 0,
    medium: data.medium || 0,
    heavy: data.heavy || 0,
  };
};

/**
 * Parse sensor metrics from DynamoDB format
 */
const parseSensorMetrics = (data: any): SensorMetrics => {
  if (!data) {
    return {
      acc_x_avg: 0, acc_y_avg: 0, acc_z_avg: 0,
      gyro_x_avg: 0, gyro_y_avg: 0, gyro_z_avg: 0,
    };
  }
  
  // Handle DynamoDB map format
  return {
    acc_x_avg: parseFloat(data.acc_x_avg?.N) || data.acc_x_avg || 0,
    acc_y_avg: parseFloat(data.acc_y_avg?.N) || data.acc_y_avg || 0,
    acc_z_avg: parseFloat(data.acc_z_avg?.N) || data.acc_z_avg || 0,
    gyro_x_avg: parseFloat(data.gyro_x_avg?.N) || data.gyro_x_avg || 0,
    gyro_y_avg: parseFloat(data.gyro_y_avg?.N) || data.gyro_y_avg || 0,
    gyro_z_avg: parseFloat(data.gyro_z_avg?.N) || data.gyro_z_avg || 0,
  };
};

/**
 * Parse derived metrics from DynamoDB format
 */
const parseDerivedMetrics = (data: any): DerivedMetrics => {
  if (!data) {
    return {
      roughness_index: 0, spike_index: 0, vertical_displacement: 0,
      jerk_magnitude: 0, ride_comfort_score: 100,
    };
  }
  
  return {
    roughness_index: parseFloat(data.roughness_index?.N) || data.roughness_index || 0,
    spike_index: parseFloat(data.spike_index?.N) || data.spike_index || 0,
    vertical_displacement: parseFloat(data.vertical_displacement?.N) || data.vertical_displacement || 0,
    jerk_magnitude: parseFloat(data.jerk_magnitude?.N) || data.jerk_magnitude || 0,
    ride_comfort_score: parseFloat(data.ride_comfort_score?.N) || data.ride_comfort_score || 100,
  };
};

/**
 * Parse last_5_videos from DynamoDB format
 */
const parseVideoList = (data: any): string[] => {
  if (!data) return [];
  
  // Handle DynamoDB list format: [{S: "s3://..."}, {S: "s3://..."}]
  if (Array.isArray(data)) {
    return data.map((item: any) => item.S || item).filter(Boolean);
  }
  
  return [];
};

/**
 * Parse a congestion item from DynamoDB format
 */
const parseCongestionItem = (item: any): CongestionItem => {
  const unmarshalled = unmarshall(item);
  
  return {
    hex_id: unmarshalled.hex_id || '',
    congestion_level: (unmarshalled.congestion_level || 'low') as any,
    event_count: parseInt(unmarshalled.event_count) || 0,
    last_5_videos: parseVideoList(item.last_5_videos?.L || unmarshalled.last_5_videos),
    last_updated: unmarshalled.last_updated || '',
    location: parseLocation(item.location?.M || unmarshalled.location),
    peak_hour_flag: unmarshalled.peak_hour_flag === 'true' || unmarshalled.peak_hour_flag === true,
    road_name: unmarshalled.road_name || 'Unknown',
    vehicle_composition: parseVehicleComposition(item.vehicle_composition?.M || unmarshalled.vehicle_composition),
    vehicle_count_avg: parseFloat(unmarshalled.vehicle_count_avg) || 0,
    velocity_avg: parseFloat(unmarshalled.velocity_avg) || 0,
  };
};

/**
 * Parse a damage item from DynamoDB format
 */
const parseDamageItem = (item: any): DamageItem => {
  const unmarshalled = unmarshall(item);
  
  return {
    hex_id: unmarshalled.hex_id || '',
    sensor_metrics: parseSensorMetrics(item.sensor_metrics?.M || unmarshalled.sensor_metrics),
    derived_metrics: parseDerivedMetrics(item.derived_metrics?.M || unmarshalled.derived_metrics),
    road_damage_area_avg: parseFloat(unmarshalled.road_damage_area_avg) || 0,
    prophet_classification: (unmarshalled.prophet_classification || 'good') as any,
    event_count: parseInt(unmarshalled.event_count) || 0,
    last_5_videos: parseVideoList(item.last_5_videos?.L || unmarshalled.last_5_videos),
    location: parseLocation(item.location?.M || unmarshalled.location),
    last_updated: unmarshalled.last_updated || '',
    last_corporation_visit: unmarshalled.last_corporation_visit === 'null' ? null : unmarshalled.last_corporation_visit,
  };
};

// ============================================
// Data Fetching Functions
// ============================================

/**
 * Fetch all congestion data for a specific date
 */
export const fetchCongestionData = async (date: string): Promise<CongestionItem[]> => {
  const client = getDynamoClient();
  const tableName = getTableName('congestion', date);
  
  try {
    const command = new ScanCommand({
      TableName: tableName,
    });
    
    const response = await client.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      console.log(`No congestion data found for ${date}`);
      return [];
    }
    
    return response.Items.map(parseCongestionItem);
  } catch (error: any) {
    // For missing tables, return empty quietly; otherwise bubble up
    if (error.name === 'ResourceNotFoundException') {
      console.warn(`DynamoDB table not found: ${tableName}`);
      return [];
    }
    console.error(`Error fetching congestion data for ${date}:`, error);
    throw error;
  }
};

/**
 * Fetch all damage data for a specific date
 */
export const fetchDamageData = async (date: string): Promise<DamageItem[]> => {
  const client = getDynamoClient();
  const tableName = getTableName('damage', date);
  
  try {
    const command = new ScanCommand({
      TableName: tableName,
    });
    
    const response = await client.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      console.log(`No damage data found for ${date}`);
      return [];
    }
    
    return response.Items.map(parseDamageItem);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.warn(`DynamoDB table not found: ${tableName}`);
      return [];
    }
    console.error(`Error fetching damage data for ${date}:`, error);
    throw error;
  }
};

/**
 * Fetch both congestion and damage data for a date
 */
export const fetchAllData = async (date: string): Promise<FetchDataResponse> => {
  const [congestion, damage] = await Promise.all([
    fetchCongestionData(date),
    fetchDamageData(date),
  ]);
  
  const stats = calculateStats(congestion, damage);
  
  return { congestion, damage, stats };
};

/**
 * Calculate dashboard statistics from data
 */
export const calculateStats = (
  congestion: CongestionItem[],
  damage: DamageItem[]
): DashboardStats => {
  const highCongestionCount = congestion.filter(
    c => c.congestion_level === 'high' || c.congestion_level === 'critical'
  ).length;
  
  const criticalDamageCount = damage.filter(
    d => d.prophet_classification === 'poor' || d.prophet_classification === 'critical'
  ).length;
  
  const avgVelocity = congestion.length > 0
    ? congestion.reduce((sum, c) => sum + c.velocity_avg, 0) / congestion.length
    : 0;
  
  const avgRideComfort = damage.length > 0
    ? damage.reduce((sum, d) => sum + d.derived_metrics.ride_comfort_score, 0) / damage.length
    : 100;
  
  const peakHourCells = congestion.filter(c => c.peak_hour_flag).length;
  
  const totalEvents = congestion.reduce((sum, c) => sum + c.event_count, 0)
    + damage.reduce((sum, d) => sum + d.event_count, 0);
  
  return {
    totalCongestionCells: congestion.length,
    totalDamageCells: damage.length,
    highCongestionCount,
    criticalDamageCount,
    avgVelocity,
    avgRideComfort,
    peakHourCells,
    totalEvents,
  };
};

// ============================================
// Filtering Functions
// ============================================

/**
 * Filter congestion data by level
 */
export const filterCongestionByLevel = (
  data: CongestionItem[],
  level: string
): CongestionItem[] => {
  if (level === 'all') return data;
  return data.filter(item => item.congestion_level === level);
};

/**
 * Filter damage data by classification
 */
export const filterDamageByClassification = (
  data: DamageItem[],
  classification: string
): DamageItem[] => {
  if (classification === 'all') return data;
  return data.filter(item => item.prophet_classification === classification);
};

// ============================================
// H3 Utilities
// ============================================

/**
 * Get center coordinates for an H3 hex cell
 * Uses h3-js library
 */
export const getHexCenter = async (hexId: string): Promise<Location> => {
  try {
    const h3 = await import('h3-js');
    const [lat, lon] = h3.cellToLatLng(hexId);
    return { lat, lon };
  } catch (error) {
    console.error('Error getting hex center:', error);
    return { lat: 0, lon: 0 };
  }
};

/**
 * Get hex boundary for visualization
 */
export const getHexBoundary = async (hexId: string): Promise<[number, number][]> => {
  try {
    const h3 = await import('h3-js');
    return h3.cellToBoundary(hexId);
  } catch (error) {
    console.error('Error getting hex boundary:', error);
    return [];
  }
};

/**
 * Check if H3 hex ID is valid
 */
export const isValidHexId = async (hexId: string): Promise<boolean> => {
  try {
    const h3 = await import('h3-js');
    return h3.isValidCell(hexId);
  } catch (error) {
    return false;
  }
};

// ============================================
// Color Utilities
// ============================================

/**
 * Get color for congestion level
 */
export const getCongestionColor = (level: string): string => {
  switch (level) {
    case 'low': return '#22c55e';
    case 'medium': return '#eab308';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#6b7280';
  }
};

/**
 * Get color for prophet classification
 */
export const getDamageColor = (classification: string): string => {
  switch (classification) {
    case 'good': return '#22c55e';
    case 'moderate': return '#eab308';
    case 'poor': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#6b7280';
  }
};

/**
 * Get severity value (0-100) from congestion level
 */
export const getCongestionSeverity = (level: string): number => {
  switch (level) {
    case 'low': return 25;
    case 'medium': return 50;
    case 'high': return 75;
    case 'critical': return 100;
    default: return 0;
  }
};

/**
 * Get severity value (0-100) from prophet classification
 */
export const getDamageSeverity = (classification: string): number => {
  switch (classification) {
    case 'good': return 25;
    case 'moderate': return 50;
    case 'poor': return 75;
    case 'critical': return 100;
    default: return 0;
  }
};
