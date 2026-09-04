export interface TopicStatsResponse {
  topicId: string;
  name: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
}

export interface GlobalStatsResponse {
  userId: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  totalInsightPoints: number;
  bestStreakOverall: number;
  byTopic: TopicStatsResponse[];
}