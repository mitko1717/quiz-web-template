export enum AchievementScope {
  GLOBAL = 'global',
  TOPIC = 'topic'
}
export interface AchievementProgressResponse {
  achievementId: string;
  key: string;
  scope: AchievementScope;
  topicId: string | null;
  name: string;
  description: string;
  threshold: number;
  currentValue: number;
  unlockedAt: string | null;
}

export interface UnlockedAchievement {
  achievementId: string;
  key: string;
  name: string;
}