import { Event } from "./mockData";

const API_BASE_URL = "http://localhost:8000/api"; // Adjust if your backend runs on a different port

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
