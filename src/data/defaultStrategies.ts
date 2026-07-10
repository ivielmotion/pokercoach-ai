import { Strategy } from '../types';

export const DEFAULT_STRATEGIES: Strategy[] = [
  {
    id: 'angel',
    name: 'Coach Angel',
    description: 'Especialista en GTO y teoría avanzada. Su enfoque es matemático y equilibrado, ideal para jugadores que buscan una base sólida e inexplorable.',
    style: 'GTO / Teórico',
    rules: [
      'Mantener rangos equilibrados en todas las calles.',
      'Utilizar tamaños de apuesta polarizados en el river.',
      'Check-raise agresivo en boards dinámicos.'
    ],
    coachAvatar: ''
  },
  {
    id: 'zeros',
    name: 'Coach Zeros',
    description: 'Maestro del juego explotativo y lectura de rangos. Se enfoca en maximizar el valor contra debilidades específicas de los oponentes.',
    style: 'Explotativo / Agresivo',
    rules: [
      'Atacar debilidades post-flop con overbets.',
      'Ajustar rangos de 3-bet según el perfil del rival.',
      'Maximizar fold equity en botes multi-way.'
    ],
    coachAvatar: ''
  }
];
