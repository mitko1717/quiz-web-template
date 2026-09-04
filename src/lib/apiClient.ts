export { ApiError } from "./http";
import { authApi } from "./api/auth";
import { quizApi } from "./api/quiz";
import { progressApi } from "./api/progress";
import { adminApi } from "./api/admin";
import { profileApi } from "./api/profile";
import { dailyChallengeApi } from "./api/daily-challenge";
import { gamesApi } from "./api/games";
import { adminGamesApi } from "./api/admin-games";
import { achievementsApi } from "./api/achievements";

export const apiClient = {
  // auth
  guestLogin: authApi.guestLogin.bind(authApi),
  googleLogin: authApi.googleLogin.bind(authApi),
  appleLogin: authApi.appleLogin.bind(authApi),
  telegramLogin: authApi.telegramLogin.bind(authApi),
  refresh: authApi.refresh.bind(authApi),
  localLogin: authApi.localLogin.bind(authApi),

  // quiz
  getQuestion: quizApi.getQuestion.bind(quizApi),
  submitAnswer: quizApi.submitAnswer.bind(quizApi),
  skipQuestion: quizApi.skipQuestion.bind(quizApi),
  useHint: quizApi.useHint.bind(quizApi),

  // daily challenge
  getDailyChallenge: dailyChallengeApi.getToday.bind(dailyChallengeApi),
  submitDailyChallengeAnswer: dailyChallengeApi.submitAnswer.bind(dailyChallengeApi),

  // progress
  getAllProgress: progressApi.getAllProgress.bind(progressApi),
  getProgressForLevel: progressApi.getProgressForLevel.bind(progressApi),
  getAnswerStats: progressApi.getAnswerStats.bind(progressApi),
  getProfile: profileApi.getProfile.bind(profileApi),
  getGlobalStats: profileApi.getGlobalStats.bind(profileApi),
  updateProfileLanguage: profileApi.updateLanguage.bind(profileApi),
  updateProfileDifficulty: profileApi.updateDifficulty.bind(profileApi),
  resetProfile: profileApi.resetProfile.bind(profileApi),

  // achievements
  getAchievements: achievementsApi.getMine.bind(achievementsApi),

  // admin
  getAdminUsersStats: adminApi.getUsersStats.bind(adminApi),
  getAdminUserStats: adminApi.getUserStats.bind(adminApi),
  getAdminGameplayConfig: adminApi.getGameplayConfig.bind(adminApi),
  getAdminGameplayConfigSchema: adminApi.getGameplayConfigSchema.bind(adminApi),
  updateAdminGameplayConfig: adminApi.updateGameplayConfig.bind(adminApi),
  resetAdminGameplayConfig: adminApi.resetGameplayConfig.bind(adminApi),

  // games
  getOtherGames: gamesApi.listOthers.bind(gamesApi),

  // admin games
  getAdminGames: adminGamesApi.list.bind(adminGamesApi),
  createAdminGame: adminGamesApi.create.bind(adminGamesApi),
  updateAdminGame: adminGamesApi.update.bind(adminGamesApi),
  removeAdminGame: adminGamesApi.remove.bind(adminGamesApi),
};