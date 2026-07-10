const LS_MAP_PRACTICE_SESSION = 'pokercoach_map_practice_session';

const MAP_PRACTICE_GAME_IDS = [
  'multiple-choice',
  'true-false',
  'quick-sort',
  'unscramble',
  'correct-path',
  'adventure-path',
  'memory-match',
  'connect-ideas',
];

export interface MapPracticeSession {
  packId: string;
  title: string;
  conceptIds: string[];
  lastGameId?: string;
  createdAt: string;
}

export function startMapPracticeSession(packId: string, title: string, conceptIds: string[]): void {
  localStorage.setItem(LS_MAP_PRACTICE_SESSION, JSON.stringify({
    packId,
    title,
    conceptIds,
    createdAt: new Date().toISOString(),
  }));
  window.dispatchEvent(new CustomEvent('map-practice-session-changed'));
}

export function getMapPracticeSession(packId: string): MapPracticeSession | null {
  try {
    const raw = localStorage.getItem(LS_MAP_PRACTICE_SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw) as MapPracticeSession;
    if (session.packId !== packId || !session.conceptIds?.length) return null;
    return session;
  } catch {
    return null;
  }
}

export function clearMapPracticeSession(): void {
  localStorage.removeItem(LS_MAP_PRACTICE_SESSION);
  window.dispatchEvent(new CustomEvent('map-practice-session-changed'));
}

export function getNextMapPracticeGame(lastGameId?: string): string {
  const options = MAP_PRACTICE_GAME_IDS.filter(id => id !== lastGameId);
  return options[Math.floor(Math.random() * options.length)] || MAP_PRACTICE_GAME_IDS[0];
}

export function markMapPracticeGameStarted(packId: string, gameId: string): void {
  const session = getMapPracticeSession(packId);
  if (!session) return;
  localStorage.setItem(LS_MAP_PRACTICE_SESSION, JSON.stringify({ ...session, lastGameId: gameId }));
}
