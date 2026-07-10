// Rangos de open raise preflop 6-max (estilo GTO estándar).
// Las manos están en notación corta: pares (AA, KK), suited (AKs, KQs) y offsuit (AKo, KQo).
// El ejercicio evalúa si la mano está en el rango de la posición asignada.

export type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

export const POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

// Pares
const pairs = (ranks: string[]) => ranks.map(r => `${r}${r}`);

// Suited: notación "AKs", "KQs"
const suited = (high: string[], low: string[]) => {
  const result: string[] = [];
  for (const h of high) {
    for (const l of low) {
      if (h === l) continue;
      result.push(`${h}${l}s`);
    }
  }
  return result;
};

// Offsuit
const offsuit = (high: string[], low: string[]) => {
  const result: string[] = [];
  for (const h of high) {
    for (const l of low) {
      if (h === l) continue;
      result.push(`${h}${l}o`);
    }
  }
  return result;
};

const ALL_RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

function buildRange(rankCutoff: number, includeSuitedAces: boolean, includeLowerSuited: string[] = []): string[] {
  const big = ALL_RANKS.slice(0, rankCutoff);
  const small = ALL_RANKS.slice(rankCutoff);
  const list: string[] = [
    ...pairs(ALL_RANKS),
    ...suited(big, ALL_RANKS),
    ...offsuit(big, small),
  ];
  if (includeSuitedAces) list.push(...suited(['A'], ALL_RANKS.slice(1)));
  for (const combo of includeLowerSuited) list.push(combo);
  return list;
}

export const OPEN_RANGES: Record<Position, string[]> = {
  // UTG: tight, ~15% del rango
  UTG: [
    ...pairs(ALL_RANKS),
    'AKs', 'AQs', 'AJs', 'ATs', 'A5s', 'A4s',
    'KQs', 'KJs', 'KTs', 'K9s',
    'QJs', 'QTs', 'JTs', 'T9s',
    'AKo', 'AQo', 'AJo', 'KQo',
  ],

  // HJ: ~19%
  HJ: [
    ...pairs(ALL_RANKS),
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A5s', 'A4s', 'A3s', 'A2s',
    'KQs', 'KJs', 'KTs', 'K9s',
    'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', '98s', '87s',
    'AKo', 'AQo', 'AJo', 'KQo', 'KJo',
  ],

  // CO: ~27%
  CO: [
    ...pairs(ALL_RANKS),
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A5s', 'A4s', 'A3s', 'A2s',
    'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
    'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '87s', '76s',
    'AKo', 'AQo', 'AJo', 'ATo', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
  ],

  // BTN: ~48% (casi todo)
  BTN: [
    ...pairs(ALL_RANKS),
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
    'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
    'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s',
    'JTs', 'J9s', 'J8s', 'J7s', 'T9s', 'T8s', 'T7s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '54s',
    'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o',
    'KQo', 'KJo', 'KTo', 'K9o',
    'QJo', 'QTo', 'Q9o', 'JTo', 'J9o', 'T9o', '98o',
  ],

  // SB: ~38% (limp o raise, aquí se evalúa raise)
  SB: [
    ...pairs(ALL_RANKS),
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A5s', 'A4s', 'A3s', 'A2s',
    'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
    'QJs', 'QTs', 'Q9s', 'Q8s', 'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '87s', '76s', '65s',
    'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
    'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
  ],

  // BB: no abre primero, pero como ejercicio se permite cualquier mano (defend).
  // Para mantener la mecánica simple, BB se trata como "cualquier mano" (siempre abrir).
  BB: ALL_RANKS.flatMap(r => ALL_RANKS.map(r2 => {
    if (r === r2) return `${r}${r}`;
    const suitedFlag = Math.random() > 0.5 ? 's' : 'o';
    return `${r}${r2}${suitedFlag}`;
  })),
};

// Helper: convierte una mano del tipo ['Ah','Kd'] a notación corta 'AKo' / 'AKs' / 'QQ'.
export function handToNotation(cards: string[]): string {
  if (cards.length !== 2) return '';
  const rankOrder = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const r1 = cards[0][0];
  const r2 = cards[1][0];
  const s1 = cards[0][1];
  const s2 = cards[1][1];
  const i1 = rankOrder.indexOf(r1);
  const i2 = rankOrder.indexOf(r2);
  if (i1 === i2) return `${r1}${r2}`;
  const high = i1 < i2 ? r1 : r2;
  const low = i2 < i1 ? r2 : r1;
  const suited = s1 === s2;
  return `${high}${low}${suited ? 's' : 'o'}`;
}

export function isInRange(position: Position, notation: string): boolean {
  if (position === 'BB') return true;
  return OPEN_RANGES[position].includes(notation);
}
