export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  activeStrategyId?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  stats?: {
    handsAnalyzed: number;
    trainingSessions: number;
    averageScore: number;
  };
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  style: string;
  rules: string[];
  coachAvatar: string;
}

export interface HandAnalysis {
  error?: string;
  ev: string;
  adjustment: string;
  explanation: string;
}

export interface PokerHand {
  id: string;
  userId: string;
  history: string;
  analysis?: HandAnalysis;
  strategyId: string;
  timestamp: string;
}

export interface TrainingScenario {
  id: string;
  context: string;
  options: {
    text: string;
    type: 'GTO' | 'Exploitative' | 'Error';
    feedback: string;
  }[];
  correctOptionIndex: number;
}

export interface TrainingSession {
  id: string;
  userId: string;
  strategyId: string;
  scenarios: TrainingScenario[];
  score: number;
  timestamp: string;
}

export enum StatColor {
  Orange = 'text-orange-500',
  Green = 'text-emerald-400',
  Red = 'text-red-500',
  Purple = 'text-purple-400',
  Yellow = 'text-yellow-400',
  Pink = 'text-pink-300',
  Cyan = 'text-cyan-300',
  Default = 'text-slate-300'
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Concept {
  id: string;
  name: string;
  shortName: string;
  definition: string;
  color: StatColor;
  row: number;
  column: number;
  quizzes?: QuizQuestion[];
}

export interface Level {
  id: number;
  title: string;
  description: string;
  concepts: Concept[];
}

export interface UserProgress {
  completedConcepts: string[];
  completedLevels: number[];
}

// HUD Types
export interface HUDStat {
  id: string;
  shortName: string;
  fullName: string;
  definition: string;
  color: string;
  exampleValue?: string;
}

export interface HUDLine {
  id: number;
  name: string;
  stats: HUDStat[];
}

export interface HUDProfile {
  id: string;
  name: string;
  description: string;
  lines: HUDLine[];
}
