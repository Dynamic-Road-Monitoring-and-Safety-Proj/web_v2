import { Event } from "./mockData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 
// Example: VITE_API_BASE_URL="https://your-ngrok-url/..."

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
