/**
 * @deprecated This file contains legacy API functions that called a backend server.
 * The application now reads directly from DynamoDB using @/lib/dynamodb.ts
 * These functions are kept for reference but should not be used.
 * 
 * New data source: AWS DynamoDB
 * - road_congestion_YYYYMMDD - Traffic congestion data
 * - road_damage_YYYYMMDD - Road quality/damage data
 * 
 * @see src/lib/dynamodb.ts for the new data fetching logic
 * @see src/lib/types.ts for TypeScript interfaces
 */

import { Event } from "./mockData";

// DEPRECATED: Legacy backend URL (no longer used)
const rawUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const API_BASE_URL = rawUrl.replace(/\/$/, "");

export const fetchDashboardEvents = async (): Promise<Event[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/events`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard events:", error);
    return [];
  }
};

export const fetchDashboardVideos = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/videos`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch videos");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard videos:", error);
    return [];
  }
};

export const processAllData = async (): Promise<{ message: string; total_pairs: number; pairs: { video: string; csv: string }[] }> => {
  const response = await fetch(`${API_BASE_URL}/process/all`, {
    method: "POST",
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to start processing");
  }

  return await response.json();
};

export const getProcessingStatus = async (): Promise<{ total_videos: number; processed: number; unprocessed: number; unprocessed_files: string[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/process/status`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch processing status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching processing status:", error);
    return { total_videos: 0, processed: 0, unprocessed: 0, unprocessed_files: [] };
  }
};

export interface AnnotatedVideo {
  filename: string;
  url: string;
  modified: number;
  size_mb: number;
}

export const getAnnotatedVideos = async (limit: number = 5): Promise<AnnotatedVideo[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/annotated-videos?limit=${limit}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch annotated videos");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching annotated videos:", error);
    return [];
  }
};

// ===========================================
// NEW: Tile-based Heatmap API
// ===========================================

export interface TileData {
  tile_id: string;
  center_lat: number;
  center_lon: number;
  total_events: number;
  avg_severity: number;
  max_severity: number;
  pothole_count: number;
  congestion_count: number;
  crack_count?: number;
  avg_congestion_score: number;
  avg_vehicle_count?: number;
  max_vehicle_count?: number;
  avg_pothole_size?: number;
  avg_confidence?: number;
  last_event_at?: string;
}

export interface TileEvent {
  event_id: string;
  event_type: string;
  detected_at: string | null;
  lat: number;
  lon: number;
  severity: number;
  confidence: number;
  model_outputs: Record<string, unknown>;
  device_id?: string;
  frame_refs?: string[];
}

export interface ViewportBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface SummaryStats {
  events: {
    total: number;
    potholes: number;
    congestion: number;
    cracks: number;
    avg_severity: number;
    max_severity: number;
    tiles_with_events: number;
    last_event_at: string | null;
  };
  uploads: {
    total: number;
    processed: number;
    pending: number;
    failed: number;
  };
}

/**
 * Fetch tiles within a map viewport for heatmap rendering.
 * Uses mock endpoint for demo data.
 */
export const fetchTilesInViewport = async (bounds: ViewportBounds): Promise<TileData[]> => {
  try {
    const { minLat, maxLat, minLon, maxLon } = bounds;
    const response = await fetch(
      `${API_BASE_URL}/tiles-mock?min_lat=${minLat}&max_lat=${maxLat}&min_lon=${minLon}&max_lon=${maxLon}`,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch tiles");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching tiles:", error);
    return [];
  }
};

/**
 * Fetch all tiles (for initial load or small areas).
 */
export const fetchAllTiles = async (limit: number = 1000): Promise<TileData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tiles-mock/all?limit=${limit}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch all tiles");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching all tiles:", error);
    return [];
  }
};

/**
 * Fetch tiles near a specific location.
 */
export const fetchNearbyTiles = async (
  lat: number,
  lon: number,
  radiusKm: number = 5
): Promise<TileData[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/tiles/nearby?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch nearby tiles");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching nearby tiles:", error);
    return [];
  }
};

/**
 * Fetch events for a specific tile (for detail view).
 * Uses mock endpoint for demo data.
 */
export const fetchTileEvents = async (
  tileId: string,
  limit: number = 20,
  eventType?: string
): Promise<TileEvent[]> => {
  try {
    let url = `${API_BASE_URL}/tiles-mock/${tileId}/events?limit=${limit}`;
    if (eventType) {
      url += `&event_type=${eventType}`;
    }

    const response = await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch tile events");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching tile events:", error);
    return [];
  }
};

/**
 * Fetch summary statistics for the dashboard.
 */
export const fetchSummaryStats = async (): Promise<SummaryStats | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tiles/stats/summary`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch summary stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching summary stats:", error);
    return null;
  }
};

/**
 * Fetch recent high-severity events for alerts.
 */
export const fetchHighSeverityEvents = async (
  minSeverity: number = 70,
  hours: number = 24
): Promise<TileEvent[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/events/recent/high-severity?min_severity=${minSeverity}&hours=${hours}`,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch high severity events");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching high severity events:", error);
    return [];
  }
};

/**
 * Fetch event statistics by type.
 */
export const fetchEventsByType = async (hours: number = 24) => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/stats/by-type?hours=${hours}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch events by type");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching events by type:", error);
    return [];
  }
};

/**
 * Convert coordinates to tile ID.
 */
export const coordsToTileId = async (lat: number, lon: number) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/tiles/convert/coords-to-tile?lat=${lat}&lon=${lon}`,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to convert coords to tile");
    }

    return await response.json();
  } catch (error) {
    console.error("Error converting coords to tile:", error);
    return null;
  }
};

/**
 * Get severity color based on value (0-100).
 */
export const getSeverityColor = (severity: number): string => {
  if (severity < 25) return "#22c55e"; // green
  if (severity < 50) return "#eab308"; // yellow
  if (severity < 75) return "#f97316"; // orange
  return "#ef4444"; // red
};

/**
 * Get severity color with opacity for heatmap.
 */
export const getSeverityColorWithOpacity = (severity: number, opacity: number = 0.6): string => {
  const r = severity < 50 ? Math.round((severity / 50) * 255) : 255;
  const g = severity < 50 ? 255 : Math.round(255 - ((severity - 50) / 50) * 255);
  return `rgba(${r}, ${g}, 0, ${opacity})`;
};
