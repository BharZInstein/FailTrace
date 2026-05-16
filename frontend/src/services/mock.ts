import {
  mockEndpointsResponse,
  mockEventsResponse,
  mockFingerprintsResponse,
  mockOverviewResponse,
  mockRecommendationsResponse,
  mockReplayAnalysisResponse,
  mockRetryOptimizationResponse,
} from "@/lib/mock-data";

export const mockApi = {
  getOverview: async () => mockOverviewResponse,
  getEvents: async () => mockEventsResponse,
  getEvent: async (id: string) =>
    mockEventsResponse.find((event) => event.id === id) ?? mockEventsResponse[0],
  getHealth: async () => mockEndpointsResponse,
  getFingerprints: async () => mockFingerprintsResponse,
  getReplayAnalysis: async () => mockReplayAnalysisResponse,
  getRecommendations: async () => mockRecommendationsResponse,
  getRetryOptimizer: async () => mockRetryOptimizationResponse,
};
