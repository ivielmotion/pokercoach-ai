// Games Registry
// Aquí se registran todos los juegos de entrenamiento.
// Para agregar un nuevo juego:
// 1. Crea el componente en esta carpeta: MiJuego.tsx
// 2. Impórtalo aquí y agrégalo al array GAMES_REGISTRY

import { ReactNode } from 'react';
import { Target, Brain, Dices } from 'lucide-react';

export interface GameConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  component: ReactNode | null;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  coachStrategy?: string[]; // IDs de estrategias compatibles
}

// Placeholder: cuando se agregue un juego real, se importa su componente aquí
export const GAMES_REGISTRY: GameConfig[] = [
  {
    id: 'position-trainer',
    name: 'Entrenador de Posiciones',
    description: 'Aprende rangos GTO desde cada posición',
    icon: Target,
    component: null, // Se reemplaza por el componente real
    tags: ['preflop', 'rangos', 'GTO'],
    difficulty: 'beginner',
  },
  {
    id: 'equity-calc',
    name: 'Equity Trainer',
    description: 'Calcula equity mentalmente bajo presión',
    icon: Brain,
    component: null,
    tags: ['equity', 'matemáticas'],
    difficulty: 'intermediate',
  },
  {
    id: 'bluff-spotter',
    name: 'Detector de Faroles',
    description: 'Identifica spots óptimos para bluffear',
    icon: Dices,
    component: null,
    tags: ['farol', 'explotativo', 'lectura'],
    difficulty: 'advanced',
  },
];

export function getGameById(id: string): GameConfig | undefined {
  return GAMES_REGISTRY.find(g => g.id === id);
}

export function getGamesByDifficulty(diff: GameConfig['difficulty']): GameConfig[] {
  return GAMES_REGISTRY.filter(g => g.difficulty === diff);
}

export function getGamesByTag(tag: string): GameConfig[] {
  return GAMES_REGISTRY.filter(g => g.tags.includes(tag));
}
