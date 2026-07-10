// Tablas GTO preset (rangos de open raise 6-max 100bb).
// Cada celda tiene 3 acciones posibles: raise / call / fold (en %).
// Para el ejercicio simple, las frecuencias se usan en el feedback post-decisión.

import type { HandStrategy, PokerRange, PositionKey } from './types';
import { emptyHands, getHandLabel } from './handGrid';

type StrategyMap = Record<string, [number, number?, number?]>; // [raise, call?, fold?]

function setStrategy(map: Record<string, HandStrategy>, label: string, raise: number, call = 0, fold = 0) {
  map[label] = { raise, call, fold };
}

function fromMap(map: Record<string, HandStrategy>): Record<string, HandStrategy> {
  const out = emptyHands();
  for (const k of Object.keys(map)) out[k] = map[k];
  return out;
}

function buildRange(name: string, description: string, position: PositionKey, strat: StrategyMap): PokerRange {
  const hands: Record<string, HandStrategy> = emptyHands();
  for (const k of Object.keys(strat)) {
    const [r, c = 0, f = 0] = strat[k];
    setStrategy(hands, k, r, c, f);
  }
  return {
    id: `preset_${position.toLowerCase()}_rfi`,
    name,
    description,
    position,
    hands: fromMap(hands),
    createdAt: '2026-01-01',
  };
}

// UTG ~15% (tight, raise puro)
const UTG: StrategyMap = {
  'AA': [100], 'KK': [100], 'QQ': [100], 'JJ': [100], 'TT': [100], '99': [100], '88': [100], '77': [100],
  'AKs': [100], 'AQs': [100], 'AJs': [100], 'ATs': [100], 'A5s': [100], 'A4s': [100],
  'KQs': [100], 'KJs': [100], 'KTs': [100],
  'QJs': [100], 'QTs': [100], 'JTs': [100], 'T9s': [100],
  'AKo': [100], 'AQo': [100], 'AJo': [100], 'KQo': [100],
};

// HJ ~19%
const HJ: StrategyMap = {
  ...UTG,
  'A9s': [100], 'A8s': [100], 'A3s': [100], 'A2s': [100],
  'K9s': [100],
  'Q9s': [100], 'J9s': [100], '98s': [100], '87s': [100],
  'KJo': [100],
};

// CO ~27%
const CO: StrategyMap = {
  ...HJ,
  'A7s': [100], 'A6s': [100],
  'K8s': [100],
  'Q8s': [100], 'J8s': [100], 'T8s': [100], '76s': [100],
  'ATo': [100], 'KTo': [100], 'QJo': [100], 'QTo': [100], 'JTo': [100],
};

// BTN ~48% (casi todo, raise puro)
const BTN: StrategyMap = {
  'AA': [100], 'KK': [100], 'QQ': [100], 'JJ': [100], 'TT': [100], '99': [100], '88': [100], '77': [100],
  '66': [100], '55': [100], '44': [100], '33': [100], '22': [100],
  'AKs': [100], 'AQs': [100], 'AJs': [100], 'ATs': [100], 'A9s': [100], 'A8s': [100], 'A7s': [100], 'A6s': [100], 'A5s': [100], 'A4s': [100], 'A3s': [100], 'A2s': [100],
  'KQs': [100], 'KJs': [100], 'KTs': [100], 'K9s': [100], 'K8s': [100], 'K7s': [100], 'K6s': [100], 'K5s': [100], 'K4s': [100], 'K3s': [100], 'K2s': [100],
  'QJs': [100], 'QTs': [100], 'Q9s': [100], 'Q8s': [100], 'Q7s': [100], 'Q6s': [100], 'Q5s': [100],
  'JTs': [100], 'J9s': [100], 'J8s': [100], 'J7s': [100],
  'T9s': [100], 'T8s': [100], 'T7s': [100],
  '98s': [100], '97s': [100],
  '87s': [100], '86s': [100],
  '76s': [100], '75s': [100],
  '65s': [100], '54s': [100],
  'AKo': [100], 'AQo': [100], 'AJo': [100], 'ATo': [100], 'A9o': [100], 'A8o': [100], 'A7o': [100],
  'KQo': [100], 'KJo': [100], 'KTo': [100], 'K9o': [100],
  'QJo': [100], 'QTo': [100], 'Q9o': [100],
  'JTo': [100], 'J9o': [100],
  'T9o': [100], '98o': [100],
};

// SB ~38%
const SB: StrategyMap = {
  ...CO,
  'A5s': [100], 'A4s': [100], 'A3s': [100], 'A2s': [100],
  'K7s': [100], 'K6s': [100],
  'Q7s': [100], 'J7s': [100],
  'T7s': [100], '97s': [100], '86s': [100], '75s': [100], '65s': [100], '54s': [100],
  'A9o': [100], 'A8o': [100],
  'KTo': [100], 'K9o': [100],
  'QTo': [100], 'Q9o': [100],
  'JTo': [100], 'J9o': [100],
};

// BB defend: estrategia mixta (raise 3bet / call / fold)
const BB: StrategyMap = (() => {
  const m: StrategyMap = {};
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const label = getHandLabel(r, c);
      if (r === c) {
        if (r <= 3) m[label] = [50, 40, 10];
        else if (r <= 7) m[label] = [10, 70, 20];
        else m[label] = [0, 40, 60];
      } else if (r < c) {
        if (r === 0) {
          if (c <= 2) m[label] = [60, 40, 0];
          else if (c <= 6) m[label] = [15, 70, 15];
          else m[label] = [25, 0, 75];
        } else if (r === 1 && c <= 4) m[label] = [10, 80, 10];
        else if (r === 2 && c <= 4) m[label] = [0, 70, 30];
        else if (c - r === 1 && r >= 3 && r <= 7) m[label] = [10, 60, 30];
      } else {
        if (c === 0 && r === 1) m[label] = [70, 30, 0];
        else if (c === 0 && r === 2) m[label] = [10, 60, 30];
        else if (c === 1 && r === 2) m[label] = [0, 50, 50];
      }
    }
  }
  return m;
})();

export const DEFAULT_RANGES: PokerRange[] = [
  buildRange('UTG Open RFI', 'Apertura desde posición temprana (UTG, 6-max, 100bb). Rango ~15%.', 'UTG', UTG),
  buildRange('HJ Open RFI', 'Apertura desde Hijack (HJ, 6-max, 100bb). Rango ~19%.', 'HJ', HJ),
  buildRange('CO Open RFI', 'Apertura desde Cutoff (CO, 6-max, 100bb). Rango ~27%.', 'CO', CO),
  buildRange('BTN Open RFI', 'Apertura desde Botón (BTN, 6-max, 100bb). Rango ~48%.', 'BTN', BTN),
  buildRange('SB Open RFI', 'Apertura desde Small Blind (SB, 6-max, 100bb). Rango ~38%.', 'SB', SB),
  buildRange('BB Defense vs Open', 'Defensa en BB contra un raise previo. Estrategia mixta raise/call/fold.', 'BB', BB),
];
