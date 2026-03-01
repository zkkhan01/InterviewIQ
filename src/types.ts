import { EvaluationResult, InterviewQuestion, QuizQuestion } from './services/gemini';

export interface UserStats {
  totalTimeSpent: number; // in seconds
  questionsMastered: number;
  totalAccuracy: number; // average overall_score
  sessionsCompleted: number;
  dailyStreak: number;
  lastActiveDate: string; // ISO string
  challengeDay: number; // 1-30
  history: {
    date: string;
    score: number;
    type: 'interview' | 'quiz';
  }[];
}

export const INITIAL_STATS: UserStats = {
  totalTimeSpent: 0,
  questionsMastered: 0,
  totalAccuracy: 0,
  sessionsCompleted: 0,
  dailyStreak: 0,
  lastActiveDate: new Date().toISOString(),
  challengeDay: 1,
  history: []
};
