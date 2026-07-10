// Persistencia local de las tablas preflop del usuario.

import type { PokerRange } from './types';
import { DEFAULT_RANGES } from './defaultRanges';
import { emptyHands } from './handGrid';

const LS_KEY = 'pokercoach_tables_ranges';
const LS_ACTIVE = 'pokercoach_tables_active_range';

function load(): PokerRange[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PokerRange[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function save(ranges: PokerRange[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(ranges));
}

function ensureBuiltIns(): PokerRange[] {
  const ranges = load();
  if (ranges.length > 0) return ranges;
  save(DEFAULT_RANGES);
  return DEFAULT_RANGES;
}

export function getAllRanges(): PokerRange[] {
  return ensureBuiltIns();
}

export function getActiveRangeId(): string {
  const id = localStorage.getItem(LS_ACTIVE);
  if (id) return id;
  const ranges = ensureBuiltIns();
  const utg = ranges.find(r => r.position === 'UTG') ?? ranges[0];
  if (utg) {
    localStorage.setItem(LS_ACTIVE, utg.id);
    return utg.id;
  }
  return '';
}

export function setActiveRangeId(id: string): void {
  localStorage.setItem(LS_ACTIVE, id);
}

export function createRange(name: string, description: string, position: PokerRange['position']): PokerRange {
  const ranges = ensureBuiltIns();
  const newRange: PokerRange = {
    id: `range_${Date.now().toString(36)}`,
    name: name.trim() || 'Nueva tabla',
    description: description.trim() || 'Tabla de estrategia preflop.',
    position,
    hands: emptyHands(),
    createdAt: new Date().toISOString().split('T')[0],
  };
  ranges.push(newRange);
  save(ranges);
  return newRange;
}

export function updateRange(updated: PokerRange): void {
  const ranges = ensureBuiltIns();
  const idx = ranges.findIndex(r => r.id === updated.id);
  if (idx === -1) return;
  ranges[idx] = updated;
  save(ranges);
}

export function deleteRange(id: string): void {
  const ranges = ensureBuiltIns().filter(r => r.id !== id);
  save(ranges);
  if (getActiveRangeId() === id) {
    const next = ranges[0];
    if (next) setActiveRangeId(next.id);
  }
}

export function resetAllRanges(): void {
  save(DEFAULT_RANGES);
}
