// Hook para usar el coach activo
import { useState, useEffect } from 'react';
import { coachService } from '../services/coachService';
import { CoachProfile } from '../types/coach';

export function useActiveCoach() {
  const [coach, setCoach] = useState<CoachProfile | null>(() => coachService.getActive());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleCoachChange = () => {
      setCoach(coachService.getActive());
    };

    window.addEventListener('active-coach-changed', handleCoachChange);
    return () => window.removeEventListener('active-coach-changed', handleCoachChange);
  }, []);

  const setActiveCoach = (id: string) => {
    setLoading(true);
    coachService.setActive(id);
    setCoach(coachService.getById(id));
    setLoading(false);
  };

  const clearActiveCoach = () => {
    localStorage.removeItem('pokercoach_active_coach_id');
    setCoach(null);
  };

  return {
    coach,
    loading,
    setActiveCoach,
    clearActiveCoach,
    refresh: () => setCoach(coachService.getActive())
  };
}
