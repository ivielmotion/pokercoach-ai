// Servicio para manejar coaches en localStorage
import { CoachProfile, KnowledgeEntry, StrategyRule, PreflopTable, HUDLineConfig } from '../types/coach';

const LS_COACHES_KEY = 'pokercoach_coaches';
const LS_ACTIVE_COACH_KEY = 'pokercoach_active_coach_id';

// Datos iniciales de coaches
function getDefaultCoaches(): CoachProfile[] {
  return [
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
      coachAvatar: '',
      knowledge: [],
      strategies: [],
      tables: [],
      hudConfig: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      coachAvatar: '',
      knowledge: [],
      strategies: [],
      tables: [],
      hudConfig: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function loadCoaches(): CoachProfile[] {
  try {
    const raw = localStorage.getItem(LS_COACHES_KEY);
    if (!raw) {
      const defaults = getDefaultCoaches();
      saveCoaches(defaults);
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    const defaults = getDefaultCoaches();
    saveCoaches(defaults);
    return defaults;
  }
}

function saveCoaches(coaches: CoachProfile[]): void {
  localStorage.setItem(LS_COACHES_KEY, JSON.stringify(coaches));
}

export const coachService = {
  getAll(): CoachProfile[] {
    return loadCoaches();
  },

  getById(id: string): CoachProfile | null {
    const coaches = loadCoaches();
    return coaches.find(c => c.id === id) || null;
  },

  create(coach: Omit<CoachProfile, 'id' | 'createdAt' | 'updatedAt'>): CoachProfile {
    const coaches = loadCoaches();
    const newCoach: CoachProfile = {
      ...coach,
      id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    coaches.push(newCoach);
    saveCoaches(coaches);
    return newCoach;
  },

  update(id: string, updates: Partial<CoachProfile>): CoachProfile | null {
    const coaches = loadCoaches();
    const idx = coaches.findIndex(c => c.id === id);
    if (idx === -1) return null;
    
    coaches[idx] = {
      ...coaches[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveCoaches(coaches);
    return coaches[idx];
  },

  delete(id: string): boolean {
    const coaches = loadCoaches();
    const filtered = coaches.filter(c => c.id !== id);
    if (filtered.length === coaches.length) return false;
    
    saveCoaches(filtered);
    
    // Si era el activo, desactivar
    const activeId = localStorage.getItem(LS_ACTIVE_COACH_KEY);
    if (activeId === id) {
      localStorage.removeItem(LS_ACTIVE_COACH_KEY);
    }
    
    return true;
  },

  // Gestión del coach activo
  getActiveId(): string | null {
    return localStorage.getItem(LS_ACTIVE_COACH_KEY);
  },

  setActive(id: string): void {
    localStorage.setItem(LS_ACTIVE_COACH_KEY, id);
    window.dispatchEvent(new CustomEvent('active-coach-changed', { detail: { id } }));
  },

  getActive(): CoachProfile | null {
    const activeId = this.getActiveId();
    if (!activeId) return null;
    return this.getById(activeId);
  },

  // Actualizar secciones específicas
  updateKnowledge(id: string, knowledge: KnowledgeEntry[]): CoachProfile | null {
    return this.update(id, { knowledge });
  },

  updateStrategies(id: string, strategies: StrategyRule[]): CoachProfile | null {
    return this.update(id, { strategies });
  },

  updateTables(id: string, tables: PreflopTable[]): CoachProfile | null {
    return this.update(id, { tables });
  },

  updateHUD(id: string, hudConfig: HUDLineConfig[]): CoachProfile | null {
    return this.update(id, { hudConfig });
  }
};
