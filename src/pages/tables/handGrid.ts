// Lógica de la matriz 13x13 de manos de poker + parser/stringifier de notación estándar
// (estilo GTO Wizard: "22+, A2s+, KJo, ATo+")

import type { HandStrategy } from './types';

export const RANKS: string[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

/** Genera la etiqueta de una celda a partir de su fila/columna.
 *  r === c           -> par (AA, KK...)
 *  r < c             -> suited (AKs, KQs...)
 *  r > c             -> offsuit (AKo, KQo...)
 */
export function getHandLabel(row: number, col: number): string {
  const r1 = RANKS[row];
  const r2 = RANKS[col];
  if (row === col) return r1 + r2;
  if (row < col) return r1 + r2 + 's';
  return r2 + r1 + 'o';
}

/** Devuelve las 169 etiquetas de la matriz 13x13. */
export function getAllHandLabels(): string[] {
  const labels: string[] = [];
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      labels.push(getHandLabel(r, c));
    }
  }
  return labels;
}

/** Construye un record con las 169 manos inicializadas (100% fold). */
export function emptyHands(): Record<string, HandStrategy> {
  const out: Record<string, HandStrategy> = {};
  for (const label of getAllHandLabels()) {
    out[label] = { raise: 0, call: 0, fold: 100 };
  }
  return out;
}

const getRankValue = (char: string) => RANKS.indexOf(char);

/** Parsea notación estándar ("22+, A2s+, KJo, ATo+, KTs") en un record de estrategias. */
export function parseRangeNotation(notation: string): Record<string, HandStrategy> {
  const result = emptyHands();
  if (!notation || !notation.trim()) return result;

  const tokens = notation
    .replace(/;/g, ',')
    .split(/[\s,]+/)
    .map(t => t.trim())
    .filter(Boolean);

  for (const raw of tokens) {
    const token = raw.trim();
    if (!token) continue;

    // Pares: "22+", "77-TT", "JJ"
    const pairPlus = token.match(/^([2-9TJQKA])\1(\+)?$/i);
    const pairRange = token.match(/^([2-9TJQKA])\1-([2-9TJQKA])\2$/i);

    if (pairPlus) {
      const rank = pairPlus[1].toUpperCase();
      const isPlus = !!pairPlus[2];
      const idx = getRankValue(rank);
      if (isPlus) {
        for (let i = 0; i <= idx; i++) {
          result[RANKS[i] + RANKS[i]] = { raise: 100, call: 0, fold: 0 };
        }
      } else {
        result[rank + rank] = { raise: 100, call: 0, fold: 0 };
      }
      continue;
    }
    if (pairRange) {
      const start = getRankValue(pairRange[1].toUpperCase());
      const end = getRankValue(pairRange[2].toUpperCase());
      const lo = Math.min(start, end);
      const hi = Math.max(start, end);
      for (let i = lo; i <= hi; i++) {
        result[RANKS[i] + RANKS[i]] = { raise: 100, call: 0, fold: 0 };
      }
      continue;
    }

    // Suited / offsuit: "A2s+", "K5s+", "ATo+", "QJo"
    const m = token.match(/^([2-9TJQKA])([2-9TJQKA])([so])(\+)?$/i);
    if (m) {
      const high = m[1].toUpperCase();
      const low = m[2].toUpperCase();
      const type = m[3].toLowerCase();
      const isPlus = !!m[4];
      const idxHigh = getRankValue(high);
      const idxLow = getRankValue(low);
      const hi = Math.min(idxHigh, idxLow);
      const lo = Math.max(idxHigh, idxLow);
      const r1 = RANKS[hi];
      if (isPlus) {
        for (let i = hi + 1; i <= lo; i++) {
          const r2 = RANKS[i];
          const label = type === 's' ? r1 + r2 + 's' : r1 + r2 + 'o';
          result[label] = { raise: 100, call: 0, fold: 0 };
        }
      } else {
        const r2 = RANKS[lo];
        const label = type === 's' ? r1 + r2 + 's' : r1 + r2 + 'o';
        result[label] = { raise: 100, call: 0, fold: 0 };
      }
    }
  }
  return result;
}

/** A partir del mapa de manos, devuelve una cadena de notación consolidada. */
export function stringifyRange(hands: Record<string, HandStrategy>): string {
  const activePairs: string[] = [];
  const activeSuited: Record<string, string[]> = {};
  const activeOffsuited: Record<string, string[]> = {};

  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const label = getHandLabel(r, c);
      const strat = hands[label] || { raise: 0, call: 0, fold: 100 };
      const isActive = strat.raise + strat.call >= 50;
      if (!isActive) continue;

      const c1 = RANKS[r];
      const c2 = RANKS[c];
      if (r === c) {
        activePairs.push(c1);
      } else if (r < c) {
        (activeSuited[c1] = activeSuited[c1] || []).push(c2);
      } else {
        (activeOffsuited[c2] = activeOffsuited[c2] || []).push(c1);
      }
    }
  }

  const chunks: string[] = [];

  // Pares
  if (activePairs.length) {
    activePairs.sort((a, b) => getRankValue(a) - getRankValue(b));
    let s = 0;
    while (s < activePairs.length) {
      let e = s;
      while (
        e + 1 < activePairs.length &&
        getRankValue(activePairs[e + 1]) === getRankValue(activePairs[e]) + 1
      ) {
        e++;
      }
      const pStart = activePairs[s];
      const pEnd = activePairs[e];
      if (s === e) chunks.push(pStart + pStart);
      else if (getRankValue(pStart) === 0) chunks.push(pEnd + pEnd + '+');
      else chunks.push(`${pStart}${pStart}-${pEnd}${pEnd}`);
      s = e + 1;
    }
  }

  // Suited
  RANKS.forEach(high => {
    const list = activeSuited[high];
    if (!list || !list.length) return;
    list.sort((a, b) => getRankValue(a) - getRankValue(b));
    let s = 0;
    while (s < list.length) {
      let e = s;
      while (
        e + 1 < list.length &&
        getRankValue(list[e + 1]) === getRankValue(list[e]) + 1
      ) {
        e++;
      }
      const lowStart = list[s];
      const lowEnd = list[e];
      const highIdx = getRankValue(high);
      const firstLowIdx = highIdx + 1;
      if (getRankValue(lowStart) === firstLowIdx) chunks.push(`${high}${lowEnd}s+`);
      else if (s === e) chunks.push(`${high}${lowStart}s`);
      else chunks.push(`${high}${lowStart}s-${high}${lowEnd}s`);
      s = e + 1;
    }
  });

  // Offsuit
  RANKS.forEach(high => {
    const list = activeOffsuited[high];
    if (!list || !list.length) return;
    list.sort((a, b) => getRankValue(a) - getRankValue(b));
    let s = 0;
    while (s < list.length) {
      let e = s;
      while (
        e + 1 < list.length &&
        getRankValue(list[e + 1]) === getRankValue(list[e]) + 1
      ) {
        e++;
      }
      const lowStart = list[s];
      const lowEnd = list[e];
      const highIdx = getRankValue(high);
      const firstLowIdx = highIdx + 1;
      if (getRankValue(lowStart) === firstLowIdx) chunks.push(`${high}${lowEnd}o+`);
      else if (s === e) chunks.push(`${high}${lowStart}o`);
      else chunks.push(`${high}${lowStart}o-${high}${lowEnd}o`);
      s = e + 1;
    }
  });

  return chunks.join(', ');
}

/** Porcentajes globales de raise/call/fold de un rango. */
export function getFrequencies(hands: Record<string, HandStrategy>) {
  let raise = 0;
  let call = 0;
  const total = 169;
  for (const key of Object.keys(hands)) {
    raise += hands[key].raise / 100;
    call += hands[key].call / 100;
  }
  const raisePct = ((raise / total) * 100).toFixed(1);
  const callPct = ((call / total) * 100).toFixed(1);
  const foldPct = (100 - parseFloat(raisePct) - parseFloat(callPct)).toFixed(1);
  return { raisePct, callPct, foldPct };
}
