// DynamoDB Service Layer - Direct AWS SDK integration
// City-based table structure: road_{city}_damage, road_{city}_congestion

import { DynamoDBClient, ScanCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
  CongestionItem,
  DamageItem,
  Location,
  VehicleComposition,
  VehicleDetailed,
  SensorMetrics,
  DerivedMetrics,
  DashboardStats,
  FetchDataResponse,
  CityInfo,
} from './types';

// ============================================
// AWS Configuration
// ============================================

const getAwsConfig = () => {
  const config = {
    region: import.meta.env.VITE_AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
    },
  };
  
  // Debug: Log credential status (not the actual values for security)
  console.log('AWS Config Debug:', {
    region: config.region,
    hasAccessKey: !!config.credentials.accessKeyId,
    accessKeyPrefix: config.credentials.accessKeyId?.substring(0, 8) + '...',
    hasSecretKey: !!config.credentials.secretAccessKey,
    secretKeyLength: config.credentials.secretAccessKey?.length,
  });
  
  return config;
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
 * Generate table name for a city
 * Pattern: road_{city}_{type}
 */
export const getTableName = (city: string, tableType: 'congestion' | 'damage'): string => {
  return `road_${city.toLowerCase()}_${tableType}`;
};

/**
 * Extract city name from table name
 */
export const extractCityFromTable = (tableName: string): string | null => {
  const match = tableName.match(/^road_(.+)_(damage|congestion)$/);
  return match ? match[1] : null;
};

/**
 * Capitalize city name for display
 */
export const formatCityName = (city: string): string => {
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
};

// ============================================
// City Discovery
// ============================================

/**
 * Fetch list of cities with data from DynamoDB tables
 */
export const fetchAvailableCities = async (): Promise<CityInfo[]> => {
  const client = getDynamoClient();
  const cities = new Map<string, CityInfo>();

  try {
    let exclusiveStartTableName: string | undefined;
    
    do {
      const command = new ListTablesCommand({
        ExclusiveStartTableName: exclusiveStartTableName,
        Limit: 100,
      });
      
      const response = await client.send(command);
      const tableNames = response.TableNames || [];
      
      // Filter tables with "road_" prefix and extract cities
      for (const tableName of tableNames) {
        if (tableName.startsWith('road_')) {
          const city = extractCityFromTable(tableName);
          if (city && !cities.has(city)) {
            cities.set(city, {
              name: city,
              displayName: formatCityName(city),
              state: '', // We'll get this from the data
            });
          }
        }
      }
      
      exclusiveStartTableName = response.LastEvaluatedTableName;
    } while (exclusiveStartTableName);

    return Array.from(cities.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  } catch (error) {
    console.error('Error fetching available cities:', error);
    return [];
  }
};

// ============================================
// DynamoDB Response Parsers
// ============================================

const parseLocation = (locationData: any): Location => {
  if (!locationData) return { lat: 0, lon: 0 };
  
  // Handle DynamoDB map format
  if (locationData.lat?.N && locationData.lon?.N) {
    return {
      lat: parseFloat(locationData.lat.N),
      lon: parseFloat(locationData.lon.N),
      city: locationData.city?.S || undefined,
      state: locationData.state?.S || undefined,
    };
  }
  
  // Handle already parsed format
  if (typeof locationData.lat === 'number') {
    return {
      lat: locationData.lat,
      lon: locationData.lon,
      city: locationData.city,
      state: locationData.state,
    };
  }
  
  return { lat: 0, lon: 0 };
};

const parseVehicleComposition = (data: any): VehicleComposition => {
  if (!data) return { light: 0, medium: 0, heavy: 0 };
  
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

const parseVehicleDetailed = (data: any): VehicleDetailed | undefined => {
  if (!data) return undefined;
  
  const parseNum = (val: any) => {
    if (val?.N) return parseInt(val.N) || 0;
    return typeof val === 'number' ? val : 0;
  };
  
  return {
    car: parseNum(data.car),
    motorcycle: parseNum(data.motorcycle),
    bicycle: parseNum(data.bicycle),
    cycle_rickshaw: parseNum(data.cycle_rickshaw),
    auto_rickshaw: parseNum(data.auto_rickshaw),
    e_rickshaw: parseNum(data.e_rickshaw),
    bus: parseNum(data.bus),
    truck: parseNum(data.truck),
    tractor: parseNum(data.tractor),
  };
};

const parseSensorMetrics = (data: any): SensorMetrics | undefined => {
  if (!data) return undefined;
  
  const parseNum = (val: any) => {
    if (val?.N) return parseFloat(val.N) || 0;
    return typeof val === 'number' ? val : 0;
  };
  
  return {
    acc_x_avg: parseNum(data.acc_x_avg),
    acc_y_avg: parseNum(data.acc_y_avg),
    acc_z_avg: parseNum(data.acc_z_avg),
    gyro_x_avg: parseNum(data.gyro_x_avg),
    gyro_y_avg: parseNum(data.gyro_y_avg),
    gyro_z_avg: parseNum(data.gyro_z_avg),
  };
};

const parseDerivedMetrics = (data: any): DerivedMetrics | undefined => {
  if (!data) return undefined;
  
  const parseNum = (val: any) => {
    if (val?.N) return parseFloat(val.N) || 0;
    return typeof val === 'number' ? val : 0;
  };
  
  return {
    roughness_index: parseNum(data.roughness_index),
    spike_index: parseNum(data.spike_index),
    vertical_displacement: parseNum(data.vertical_displacement),
    jerk_magnitude: parseNum(data.jerk_magnitude),
    ride_comfort_score: parseNum(data.ride_comfort_score),
  };
};

const parseVideoList = (data: any): string[] => {
  if (!data) return [];
  
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
    velocity_avg: parseFloat(unmarshalled.velocity_avg) || 0,
    vehicle_count_avg: parseFloat(unmarshalled.vehicle_count_avg) || 0,
    vehicle_composition: parseVehicleComposition(item.vehicle_composition?.M || unmarshalled.vehicle_composition),
    vehicle_detailed: parseVehicleDetailed(item.vehicle_detailed?.M || unmarshalled.vehicle_detailed),
    traffic_density: parseFloat(unmarshalled.traffic_density) || 0,
    peak_vehicle_count: parseInt(unmarshalled.peak_vehicle_count) || 0,
    road_name: unmarshalled.road_name || 'Unknown',
    peak_hour_flag: unmarshalled.peak_hour_flag === true || unmarshalled.peak_hour_flag === 'true',
    congestion_level: (unmarshalled.congestion_level || 'low') as 'low' | 'medium' | 'high',
    event_count: parseInt(unmarshalled.event_count) || 0,
    last_5_videos: parseVideoList(item.last_5_videos?.L || unmarshalled.last_5_videos),
    last_updated: unmarshalled.last_updated || '',
    location: parseLocation(item.location?.M || unmarshalled.location),
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
    damage_severity_score: parseFloat(unmarshalled.damage_severity_score) || 0,
    damage_frequency: parseFloat(unmarshalled.damage_frequency) || 0,
    total_potholes: parseInt(unmarshalled.total_potholes) || 0,
    total_cracks: parseInt(unmarshalled.total_cracks) || 0,
    pothole_events_count: parseInt(unmarshalled.pothole_events_count) || 0,
    prophet_classification: (unmarshalled.prophet_classification || 'good') as 'severe' | 'moderate' | 'good',
    event_count: parseInt(unmarshalled.event_count) || 0,
    last_5_videos: parseVideoList(item.last_5_videos?.L || unmarshalled.last_5_videos),
    last_corporation_visit: unmarshalled.last_corporation_visit === 'null' ? null : unmarshalled.last_corporation_visit,
    last_updated: unmarshalled.last_updated || '',
    location: parseLocation(item.location?.M || unmarshalled.location),
  };
};

// ============================================
// Data Fetching Functions
// ============================================

/**
 * Fetch all congestion data for a city
 */
export const fetchCongestionData = async (city: string): Promise<CongestionItem[]> => {
  const client = getDynamoClient();
  const tableName = getTableName(city, 'congestion');
  
  try {
    const command = new ScanCommand({
      TableName: tableName,
    });
    
    const response = await client.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      console.log(`No congestion data found for city: ${city}`);
      return [];
    }
    
    return response.Items.map(parseCongestionItem);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.warn(`DynamoDB table not found: ${tableName}`);
      return [];
    }
    console.error(`Error fetching congestion data for ${city}:`, error);
    throw error;
  }
};

/**
 * Fetch all damage data for a city
 */
export const fetchDamageData = async (city: string): Promise<DamageItem[]> => {
  const client = getDynamoClient();
  const tableName = getTableName(city, 'damage');
  
  try {
    const command = new ScanCommand({
      TableName: tableName,
    });
    
    const response = await client.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      console.log(`No damage data found for city: ${city}`);
      return [];
    }
    
    return response.Items.map(parseDamageItem);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.warn(`DynamoDB table not found: ${tableName}`);
      return [];
    }
    console.error(`Error fetching damage data for ${city}:`, error);
    throw error;
  }
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
// H3 Utilities
// ============================================

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

export const getHexBoundary = async (hexId: string): Promise<[number, number][]> => {
  try {
    const h3 = await import('h3-js');
    return h3.cellToBoundary(hexId);
  } catch (error) {
    console.error('Error getting hex boundary:', error);
    return [];
  }
};

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

/**
 * Get severity color based on value (0-100)
 */
export const getSeverityColor = (severity: number): string => {
  if (severity < 33) return '#00FF00';  // Green
  if (severity < 66) return '#FFA500';  // Orange
  return '#FF0000';                      // Red
};
