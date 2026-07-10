// Vista de práctica minimalista.
// - Cartas DEL USUARIO en su posición (no en el centro de la mesa).
// - PC: layout horizontal. Móvil: vertical.
// - 3 acciones: Retirarse / Callear / Abrir.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, X, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAllRanges, getActiveRangeId, setActiveRangeId } from './store';
import type { HandStrategy, HandAction, PokerRange } from './types';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = [
  { char: '♠', red: false },
  { char: '♥', red: true },
  { char: '♦', red: true },
  { char: '♣', red: false },
];

interface Card { rank: string; suit: string; }

function randomCard(): Card {
  return {
    rank: RANKS[Math.floor(Math.random() * RANKS.length)],
    suit: SUITS[Math.floor(Math.random() * SUITS.length)].char,
  };
}

function handToLabel(c1: Card, c2: Card): string {
  const i1 = RANKS.indexOf(c1.rank);
  const i2 = RANKS.indexOf(c2.rank);
  if (i1 === i2) return c1.rank + c2.rank;
  const first = i1 < i2 ? c1 : c2;
  const second = i1 < i2 ? c2 : c1;
  return `${first.rank}${second.rank}${c1.suit === c2.suit ? 's' : 'o'}`;
}

function dealHand(): [Card, Card] {
  let a = randomCard();
  let b = randomCard();
  while (a.rank === b.rank && a.suit === b.suit) b = randomCard();
  return [a, b];
}

function bestLabel(s: HandStrategy): { label: string; freq: number } {
  if (s.raise >= s.call && s.raise >= s.fold) return { label: 'Abrir', freq: s.raise };
  if (s.call >= s.raise && s.call >= s.fold) return { label: 'Callear', freq: s.call };
  return { label: 'Retirarse', freq: s.fold };
}

function PlayingCard({ card, size = 'md' }: { card: Card; size?: 'sm' | 'md' | 'lg' }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  const sizes = {
    sm: 'w-9 h-12 p-0.5 text-[10px]',
    md: 'w-12 h-16 sm:w-14 sm:h-20 p-1 text-sm sm:text-base',
    lg: 'w-16 h-24 sm:w-20 sm:h-28 p-1.5 text-base sm:text-lg',
  };
  return (
    <div className={cn('bg-white rounded border border-slate-300 flex flex-col justify-between shadow-md select-none', sizes[size])}>
      <span className={cn('font-black font-mono leading-none', isRed ? 'text-rose-500' : 'text-slate-800')}>
        {card.rank}
      </span>
      <span className={cn('self-center font-bold leading-none', isRed ? 'text-rose-500' : 'text-slate-800')}>
        {card.suit}
      </span>
      <span className={cn('font-black font-mono leading-none self-end rotate-180', isRed ? 'text-rose-500' : 'text-slate-800')}>
        {card.rank}
      </span>
    </div>
  );
}

// Posiciones de los asientos (óvalo).
// En PC el óvalo es horizontal-ancho; en móvil se ve más vertical-alto naturalmente.
const SEAT_POS = {
  UTG: { x: 6, y: 50 },
  HJ:  { x: 28, y: 14 },
  CO:  { x: 72, y: 14 },
  BTN: { x: 94, y: 50 },
  SB:  { x: 72, y: 86 },
  BB:  { x: 28, y: 86 },
} as const;

export function TrainerView() {
  const [ranges] = useState<PokerRange[]>(() => getAllRanges());
  const [activeId, setActiveId] = useState<string>(() => {
    const all = getAllRanges();
    const stored = getActiveRangeId();
    return all.find(r => r.id === stored) ? stored : (all[0]?.id ?? '');
  });
  const active = useMemo(() => ranges.find(r => r.id === activeId) || ranges[0], [ranges, activeId]);

  const [card1, setCard1] = useState<Card | null>(null);
  const [card2, setCard2] = useState<Card | null>(null);
  const [handLabel, setHandLabel] = useState('');
  const [strategy, setStrategy] = useState<HandStrategy>({ raise: 0, call: 0, fold: 100 });

  const [userGuess, setUserGuess] = useState<HandAction | null>(null);
  const [isEvaluated, setIsEvaluated] = useState(false);

  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);

  const dealNew = useCallback(() => {
    if (!active) return;
    const [a, b] = dealHand();
    setCard1(a); setCard2(b);
    const label = handToLabel(a, b);
    setHandLabel(label);
    setStrategy(active.hands[label] || { raise: 0, call: 0, fold: 100 });
    setUserGuess(null);
    setIsEvaluated(false);
  }, [active?.id]);

  useEffect(() => { dealNew(); }, [dealNew]);

  const handleGuess = (action: HandAction) => {
    if (isEvaluated || !active) return;
    setUserGuess(action);
    const ok = strategy[action] > 0;
    setIsEvaluated(true);
    setTotal(t => t + 1);
    if (ok) {
      setCorrect(c => c + 1);
      setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns; });
    } else {
      setStreak(0);
    }
  };

  if (!active) {
    return <div className="text-text-secondary text-sm p-6">No hay tablas. Crea una en el editor.</div>;
  }

  const bestAct = bestLabel(strategy);
  const userPos = active.position as keyof typeof SEAT_POS;
  const userSeat = SEAT_POS[userPos];

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Mesa (PC: izquierda grande, móvil: arriba) */}
      <div className="flex-1 card p-4 sm:p-6 min-h-[460px] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted font-bold">
            Mesa
            <span className="px-1.5 py-0.5 rounded bg-accent-gold/20 text-accent-gold text-[10px] font-bold">
              {active.position}
            </span>
          </div>
          <button
            onClick={dealNew}
            className="px-2.5 py-1 rounded bg-bg-primary border border-border text-[10px] font-bold text-text-secondary hover:text-text-primary flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Repartir
          </button>
        </div>

        {/* Mesa ovalada */}
        <div className="relative w-full" style={{ paddingBottom: '60%' }}>
          <div className="absolute inset-0 rounded-[50%] border-2 border-slate-700 bg-gradient-to-br from-slate-900/40 to-slate-800/20">
            {/* Asientos inactivos */}
            {(Object.keys(SEAT_POS) as Array<keyof typeof SEAT_POS>).map(pos => {
              if (pos === userPos) return null;
              const p = SEAT_POS[pos];
              return (
                <div
                  key={pos}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  <div className="relative">
                    {pos === 'BTN' && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-yellow-400 text-black text-[8px] font-bold flex items-center justify-center border border-bg-secondary z-20">D</div>
                    )}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 bg-bg-tertiary border-border text-text-muted">
                      {pos}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Asiento del usuario + sus cartas JUSTO ENCIMA */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ left: `${userSeat.x}%`, top: `${userSeat.y}%` }}
            >
              <div className="relative flex flex-col items-center">
                {userPos === 'BTN' && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-yellow-400 text-black text-[8px] font-bold flex items-center justify-center border border-bg-secondary z-30">D</div>
                )}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 bg-accent-gold/20 border-accent-gold text-accent-gold">
                  {userPos}
                </div>
                {card1 && card2 && (
                  <div className="absolute top-full mt-1.5 flex flex-col items-center gap-0.5">
                    <div className="flex gap-0.5">
                      <PlayingCard card={card1} size="sm" />
                      <PlayingCard card={card2} size="sm" />
                    </div>
                    <div className="text-[9px] font-mono font-bold text-text-primary bg-bg-card/90 px-1 rounded">
                      {handLabel}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-4 space-y-2">
          {!isEvaluated ? (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleGuess('fold')}
                className="py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition"
              >
                Retirarse
              </button>
              <button
                onClick={() => handleGuess('call')}
                className="py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition"
              >
                Callear
              </button>
              <button
                onClick={() => handleGuess('raise')}
                className="py-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition"
              >
                Abrir
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                {strategy[userGuess!] > 0 ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    <Check className="w-3.5 h-3.5" /> Correcto
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                    <X className="w-3.5 h-3.5" /> Mejor: {bestAct.label} ({bestAct.freq}%)
                  </div>
                )}
                <button
                  onClick={dealNew}
                  className="px-3 py-1.5 rounded bg-accent-gold text-black text-xs font-bold hover:bg-accent-gold/90"
                >
                  Siguiente
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                <div className={cn('py-1 rounded border', userGuess === 'fold' ? 'bg-slate-600 border-slate-400 text-white' : 'border-border text-text-muted')}>
                  F {strategy.fold}%
                </div>
                <div className={cn('py-1 rounded border', userGuess === 'call' ? 'bg-emerald-500/30 border-emerald-500 text-white' : 'border-emerald-500/20 text-emerald-400')}>
                  C {strategy.call}%
                </div>
                <div className={cn('py-1 rounded border', userGuess === 'raise' ? 'bg-rose-500/30 border-rose-500 text-white' : 'border-rose-500/20 text-rose-400')}>
                  R {strategy.raise}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel lateral (PC: derecha, móvil: abajo) */}
      <div className="lg:w-72 space-y-3">
        <div className="card p-3">
          <div className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-2">Tabla</div>
          <select
            value={activeId}
            onChange={e => { setActiveId(e.target.value); setActiveRangeId(e.target.value); }}
            className="w-full px-2 py-1.5 bg-bg-primary border border-border rounded text-sm text-text-primary focus:border-accent-gold focus:outline-none"
          >
            {ranges.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="card p-3 grid grid-cols-2 gap-2 text-center">
          <div>
            <div className="text-[9px] uppercase text-text-muted font-bold">Aciertos</div>
            <div className="text-lg font-bold font-mono text-text-primary">{correct}/{total}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-text-muted font-bold">%</div>
            <div className="text-lg font-bold font-mono text-emerald-400">{total ? Math.round((correct / total) * 100) : 0}%</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-text-muted font-bold">Racha</div>
            <div className="text-lg font-bold font-mono text-accent-gold">{streak}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-text-muted font-bold">Mejor</div>
            <div className="text-lg font-bold font-mono text-text-primary">{bestStreak}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
