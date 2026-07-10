// Tipos del módulo Tables (Entrenamiento de tablas preflop)

export interface HandStrategy {
  raise: number; // 0-100
  call: number;  // 0-100
  fold: number;  // 0-100
}

export type HandAction = 'raise' | 'call' | 'fold';

export interface PokerRange {
  id: string;
  name: string;
  description: string;
  position: PositionKey;
  hands: Record<string, HandStrategy>; // 169 manos: AA, AKs, AKo...
  createdAt: string;
}

export type PositionKey = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

export const POSITION_KEYS: PositionKey[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
