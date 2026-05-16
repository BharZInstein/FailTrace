import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  timeout: 10000,
});

export const api = {
  getEvents: () => apiClient.get("/events"),
  getEvent: (id: string) => apiClient.get(`/event/${id}`),
  getHealth: () => apiClient.get("/health"),
  getEndpoints: () => apiClient.get("/endpoints"),
  getFingerprints: () => apiClient.get("/fingerprints"),
  getReplayAnalysis: () => apiClient.get("/replay-analysis"),
  getRecommendations: () => apiClient.get("/recommendations"),
  getRetryOptimizer: () => apiClient.get("/retry-optimizer"),
};

export default apiClient;
