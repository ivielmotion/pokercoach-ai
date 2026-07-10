import { UserProfile, Strategy, PokerHand } from '../types';
import { getItem, setItem, addToArray, getArray } from '../lib/store';
import { DEFAULT_STRATEGIES } from '../data/defaultStrategies';

function ensureStrategies() {
  const existing = getArray<Strategy>('strategies');
  if (existing.length === 0) {
    setItem('strategies', DEFAULT_STRATEGIES);
  }
}

export function testConnection() {
  return Promise.resolve();
}

export const userService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    return getItem<UserProfile>(`profile_${uid}`);
  },

  async updateProfile(uid: string, data: Partial<UserProfile>) {
    const existing = getItem<UserProfile>(`profile_${uid}`) || {} as UserProfile;
    setItem(`profile_${uid}`, { ...existing, ...data, uid });
  }
};

export const strategyService = {
  async seedStrategies() {
    setItem('strategies', DEFAULT_STRATEGIES);
  },

  async getStrategies(): Promise<Strategy[]> {
    ensureStrategies();
    return getArray<Strategy>('strategies');
  },

  async getStrategy(id: string): Promise<Strategy | null> {
    ensureStrategies();
    const strategies = getArray<Strategy>('strategies');
    return strategies.find(s => s.id === id) || null;
  },

  async deleteStrategy(id: string) {
    const arr = getArray<Strategy>('strategies');
    setItem('strategies', arr.filter(s => s.id !== id));
  }
};

export const handService = {
  async saveHand(hand: PokerHand) {
    addToArray('hands', hand);
  },

  getUserHands(userId: string, callback: (hands: PokerHand[]) => void) {
    const hands = getArray<PokerHand>('hands').filter(h => h.userId === userId);
    callback(hands);
    return () => {};
  }
};