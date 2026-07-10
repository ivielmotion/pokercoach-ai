// Tipos para el Coach Profile

export interface CoachProfile {
  id: string;
  name: string;
  description: string;
  style: string;
  rules: string[];
  coachAvatar: string;
  knowledge: KnowledgeEntry[];
  strategies: StrategyRule[];
  tables: PreflopTable[];
  hudConfig: HUDLineConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeEntry {
  id: string;
  term: string;
  definition: string;
  category: string;
}

export interface StrategyRule {
  id: string;
  condition: string;
  action: string;
  explanation: string;
  category: 'Preflop' | 'Flop' | 'Turn' | 'River';
}

export interface PreflopTable {
  id: string;
  position: string;
  openRaise: string[];
  openRaisePercentage: number;
  threeBet: string[];
  threeBetPercentage: number;
  call: string[];
  callPercentage: number;
}

export interface HUDLineConfig {
  id: number;
  name: string;
  stats: HUDStatConfig[];
}

export interface HUDStatConfig {
  shortName: string;
  fullName: string;
  color: string;
}
