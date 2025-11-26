import { Event } from "./mockData";
import.meta.env.VITE

const API_BASE_URL = import.meta.env.VITE
export const fetchDashboardEvents = async (): Promise<Event[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/events`);
    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard events:", error);
    return [];
  }
};

export const fetchDashboardVideos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/videos`);
    if (!response.ok) {
      throw new Error("Failed to fetch videos");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard videos:", error);
    return [];
  }
};
