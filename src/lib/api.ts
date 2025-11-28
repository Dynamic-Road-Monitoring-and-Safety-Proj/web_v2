import { Event } from "./mockData";

// Remove trailing slash if present
const rawUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const API_BASE_URL = rawUrl.replace(/\/$/, "");
// Example: VITE_API_URL="https://your-ngrok-url"

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
