import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Trophy, ChevronLeft, Zap, Brain, Target, Eye, Lock, Unlock } from 'lucide-react';
import { CURRICULUM, STAT_RANGES } from '../../data/curriculum';
import { Level, Concept, Strategy } from '../../types';
import { userService, strategyService } from '../../services/dbService';
import { cn } from '../../lib/utils';

const STAT_COLORS: Record<string, string> = {
  // Línea 1 - Perfil General
  vpip: 'text-slate-100', pfr: 'text-slate-100', '3bet': 'text-amber-400',
  f3bet: 'text-emerald-300', '4bet': 'text-red-500', f4bet: 'text-green-500',
  '5bet': 'text-red-500', f5bet: 'text-lime-400', wwsf: 'text-cyan-300',
  wsd: 'text-cyan-300', obturn: 'text-red-500', contob: 'text-orange-300',
  obriver: 'text-red-500', player: 'text-slate-500', hands: 'text-slate-500',

  // Línea 2 - Juego en Botón
  'l2-cc-btn-utg': 'text-purple-400',
  'l2-3b-btn-utg': 'text-amber-400',
  'l2-cc-btn-co': 'text-purple-400',
  'l2-3b-btn-co': 'text-amber-400',
  'l2-sqz-gen': 'text-amber-400',
  'l2-sqz-btn': 'text-amber-400',
  'l2-f-sqz': 'text-emerald-300',
  'l2-c-4bet': 'text-red-500',
  'l2-farha': 'text-purple-400',
  'l2-farha-pos': 'text-purple-400',

  // Línea 3 - Juego en Ciegas
  'l3-sb-3b-ep': 'text-amber-400',
  'l3-sb-3b-co': 'text-amber-400',
  'l3-sb-f-btn': 'text-emerald-300',
  'l3-sb-3b-btn': 'text-amber-400',
  'l3-bb-f-nosteal': 'text-emerald-300',
  'l3-bb-3b-ep': 'text-amber-400',
  'l3-bb-3b-co': 'text-amber-400',
  'l3-bb-f-btn-small': 'text-emerald-300',
  'l3-bb-f-btn-big': 'text-emerald-300',
  'l3-bb-3b-btn': 'text-amber-400',
  'l3-bb-f-sb': 'text-emerald-300',
  'l3-bb-3b-sb': 'text-amber-400',
  'l3-bb-raise-limp': 'text-red-500',
  'l3-bb-f-float-limp': 'text-yellow-400',
  'l3-bet-flop-mw': 'text-pink-300',
  'l3-wwsf-mw': 'text-cyan-300',

  // Línea 4 - Juego sin Iniciativa (IP / OOP / Turn)
  'l4-f-flop-ip': 'text-yellow-400',
  'l4-f-minbet-ip': 'text-yellow-400',
  'l4-float-flop': 'text-pink-300',
  'l4-f-delayed-ip': 'text-yellow-400',
  'l4-r-flop-ip': 'text-red-500',
  'l4-f-flop-oop': 'text-yellow-400',
  'l4-probe-turn': 'text-pink-300',
  'l4-f-delayed-oop': 'text-yellow-400',
  'l4-r-flop-oop': 'text-red-500',
  'l4-2bet-fold': 'text-yellow-400',
  'l4-cont-post-raise': 'text-red-500',
  'l4-f-turn-cbet': 'text-yellow-400',
  'l4-f-overbet-turn': 'text-yellow-400',
  'l4-steal-turn': 'text-pink-300',
  'l4-r-turn': 'text-red-500',

  // Línea 5 - Juego en River (Bet, Fold, WSD por tamaños)
  'l5-bet-river': 'text-red-500',
  'l5-f-r-bet': 'text-yellow-400',
  'l5-wsdwbr': 'text-cyan-300',
  'l5-wsdwrr': 'text-cyan-300',
  'l5-f-r-bet-min': 'text-yellow-400',
  'l5-f-r-minbet': 'text-yellow-400',
  'l5-f-r-twothird': 'text-yellow-400',
  'l5-f-r-over': 'text-yellow-400',
  'l5-f-raise': 'text-yellow-400',
  'l5-wsdwbr-min': 'text-cyan-300',
  'l5-wsdwbr-half': 'text-cyan-300',
  'l5-wsdwbr-twothird': 'text-cyan-300',
  'l5-wsdwbr-quarter': 'text-cyan-300',
  'l5-wsdwbr-over': 'text-cyan-300',
  'l5-bet-river-sm': 'text-red-500',
  'l5-wwrb-small': 'text-cyan-300',
  'l5-bet-river-big': 'text-red-500',
  'l5-wwrb-big': 'text-cyan-300',

  // Línea 6 - Juego con Iniciativa (CBets, Delayed, Probes, Floats)
  'l6-cbet-flop-ip': 'text-red-500',
  'l6-minbet-flop': 'text-red-500',
  'l6-f-t-probe': 'text-yellow-400',
  'l6-delayed-turn-ip': 'text-slate-100',
  'l6-cbet-flop-oop': 'text-red-500',
  'l6-f-f-float': 'text-yellow-400',
  'l6-cbet-flop-sb': 'text-red-500',
  'l6-f-f-float-sb': 'text-yellow-400',
  'l6-r-f-float': 'text-red-500',
  'l6-delayed-turn-oop': 'text-slate-100',
  'l6-f-raise-flop': 'text-yellow-400',
  'l6-3bet-flop-srp': 'text-red-500',
  'l6-f-after-cbet': 'text-yellow-400',
  'l6-cbet-turn': 'text-red-500',
  'l6-f-r-probe': 'text-yellow-400',
  'l6-f-t-float': 'text-yellow-400',
  'l6-f-raise-turn': 'text-yellow-400',

  // Línea 7 - Preflop por Posición (Open Raise, Fold to 3Bet, 4Bet) + Limp Pots
  'l7-rf-ep': 'text-red-500',
  'l7-f-3b-ep': 'text-emerald-300',
  'l7-4b-ep': 'text-red-500',
  'l7-rf-co': 'text-red-500',
  'l7-f-3b-co': 'text-emerald-300',
  'l7-4b-co': 'text-red-500',
  'l7-rf-btn': 'text-red-500',
  'l7-f-3b-btn': 'text-emerald-300',
  'l7-4b-btn': 'text-red-500',
  'l7-rf-sb': 'text-red-500',
  'l7-f-3b-sb': 'text-emerald-300',
  'l7-4b-sb': 'text-red-500',
  'l7-limp': 'text-purple-400',
  'l7-limp-fold': 'text-emerald-300',
  'l7-limp-call': 'text-amber-400',
  'l7-bet-flop-limp': 'text-red-500',
};

const MODES = [
  { id: 'memorize' as const, label: 'Memorizar', icon: Eye, color: 'text-accent-green', bg: 'bg-accent-green/10', border: 'border-accent-green/30' },
  { id: 'define' as const, label: 'Definir', icon: Brain, color: 'text-accent-gold', bg: 'bg-accent-gold/10', border: 'border-accent-gold/30' },
  { id: 'scanner' as const, label: 'Scanner', icon: Target, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
];

function getStatValue(conceptId: string) {
  const range = STAT_RANGES[conceptId];
  if (range) return Math.floor(range.low + Math.random() * (range.high - range.low));
  if (conceptId === 'player') return 0;
  if (conceptId === 'hands') return Math.floor(Math.random() * 20 + 1) + 'k';
  return Math.floor(Math.random() * 50 + 10);
}

function getPlayableConcepts(level: Level): Concept[] {
  return level.concepts.filter(c => !c.id.startsWith('separator') && c.id !== 'player' && c.id !== 'hands');
}

export function HUDMaster() {
  const [view, setView] = useState<'dashboard' | 'level'>('dashboard');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [gameMode, setGameMode] = useState<'menu' | 'memorize' | 'define' | 'scanner'>('menu');
  const [completedModes, setCompletedModes] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('poker-hud-modes');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);

  useEffect(() => {
    const loadStrategy = async () => {
      const profile = await userService.getProfile('local-user');
      if (profile?.activeStrategyId) {
        const strat = await strategyService.getStrategy(profile.activeStrategyId);
        setActiveStrategy(strat);
      }
    };
    loadStrategy();
  }, []);

  const totalCompleted = useMemo(() => {
    return Object.values(completedModes).reduce((sum, modes) => sum + modes.length, 0);
  }, [completedModes]);

  const totalModes = useMemo(() => {
    return CURRICULUM.filter(l => l.concepts.length > 0).length * 3;
  }, []);

  const pctCompleted = useMemo(() => {
    return totalModes > 0 ? Math.round((totalCompleted / totalModes) * 100) : 0;
  }, [totalCompleted, totalModes]);

  const currentLevel = CURRICULUM[currentLevelIdx];
  const levelKey = `level-${currentLevel.id}`;
  const completedForLevel = completedModes[levelKey] || [];

  const saveModeComplete = (mode: string) => {
    setCompletedModes(prev => {
      const updated = { ...prev, [levelKey]: [...new Set([...(prev[levelKey] || []), mode])] };
      localStorage.setItem('poker-hud-modes', JSON.stringify(updated));
      return updated;
    });
  };

  if (view === 'dashboard') {
    return (
      <div className="space-y-4 md:space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-gradient-green">HUD Master</h2>
        
        <div className="grid grid-cols-2 gap-2 md:hidden">
          {CURRICULUM.map((level, idx) => {
            const levelKey = `level-${level.id}`;
            const completed = completedModes[levelKey] || [];
            const isCompletedAll = completed.length === 3;
            const isEmpty = level.concepts.length === 0;

            const mobileShortName = {
              1: "General",
              2: "Botón",
              3: "Ciegas",
              4: "Sin Inic.",
              5: "River",
              6: "Con Inic.",
              7: "Preflop"
            }[level.id] || `L${level.id}`;

            if (isEmpty) {
              return (
                <div
                  key={level.id}
                  className="p-2.5 rounded-xl border border-dashed border-text-muted/20 opacity-40 cursor-not-allowed bg-black/10"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-text-muted font-medium">Línea {level.id}</span>
                    <span className="text-[9px] text-text-muted">Bloqueado</span>
                  </div>
                  <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                    <div className="h-full bg-bg-primary rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              );
            }

            return (
              <motion.div
                key={level.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCurrentLevelIdx(idx);
                  setView('level');
                  setGameMode('menu');
                }}
                className={cn(
                  "p-2.5 rounded-xl border transition-all cursor-pointer",
                  isCompletedAll 
                    ? "bg-accent-green/5 border-accent-green/50" 
                    : "bg-bg-card border-border hover:border-accent-green/30"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-text-primary font-bold">
                    {mobileShortName}
                  </span>
                  <span className={cn(
                    "text-[9px] font-bold",
                    isCompletedAll ? "text-accent-green" : "text-text-muted"
                  )}>
                    {completed.length}/3
                  </span>
                </div>
                <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                  <motion.div 
                    className={cn(
                      "h-full rounded-full",
                      isCompletedAll ? "bg-accent-green" : "bg-accent-green/60"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${(completed.length / 3) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress summary for mobile to fill empty space */}
        <div className="card p-3 md:hidden space-y-3 bg-bg-card border-border mt-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Progreso General</p>
              <h3 className="text-xs font-bold text-text-primary mt-0.5">{totalCompleted} / {totalModes} Modos Superados</h3>
            </div>
            <span className="text-[10px] font-bold text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full shrink-0">
              {pctCompleted}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent-green to-emerald-400 rounded-full" style={{ width: `${pctCompleted}%` }} />
          </div>
          
          {activeStrategy && (
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
              <span className="text-text-muted">Coach Activo:</span>
              <span className="font-bold text-accent-gold">{activeStrategy.name}</span>
            </div>
          )}
        </div>

        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CURRICULUM.map((level, idx) => {
            const levelKey = `level-${level.id}`;
            const completed = completedModes[levelKey] || [];
            const isLocked = false;
            if (level.concepts.length === 0) {
              return (
                <motion.div key={level.id} className="card p-5 opacity-40 cursor-not-allowed border-dashed border-text-muted/20">
                  <div className="flex justify-between items-start mb-3">
                    <Lock className="w-5 h-5 text-text-muted" />
                    <span className="text-[10px] font-mono text-text-muted">Nivel {level.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">{level.title}</h3>
                </motion.div>
              );
            }
            return (
              <motion.div
                key={level.id}
                whileHover={!isLocked ? { scale: 1.02 } : undefined}
                whileTap={!isLocked ? { scale: 0.98 } : undefined}
                onClick={() => { if (!isLocked) { setCurrentLevelIdx(idx); setView('level'); setGameMode('menu'); }}}
                className={`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isLocked ? 'bg-black/20 border-border opacity-50 cursor-not-allowed' : 'bg-bg-card border-border hover:border-accent-green/50'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-xl ${completed.length > 0 ? 'bg-accent-green/10 text-accent-green' : 'bg-bg-primary text-text-muted'}`}>
                    {completed.length === 3 ? <Unlock className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">Nivel {level.id}</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{level.title}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-text-muted">Progreso</span>
                    <span className="text-accent-green">{completed.length}/3</span>
                  </div>
                  <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(completed.length / 3) * 100}%` }} className="h-full bg-accent-green" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { setView('dashboard'); }} className="text-text-secondary hover:text-text-primary">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[10px] font-mono text-accent-green uppercase tracking-widest">Nivel {currentLevel.id}</span>
      </div>

      {gameMode === 'menu' && <LevelMenu level={currentLevel} completed={completedForLevel} onSelectMode={setGameMode} />}
      {gameMode === 'memorize' && <MemorizeGame level={currentLevel} onComplete={() => { saveModeComplete('memorize'); setGameMode('menu'); }} onBack={() => setGameMode('menu')} />}
      {gameMode === 'define' && <DefineGame level={currentLevel} onComplete={() => { saveModeComplete('define'); setGameMode('menu'); }} onBack={() => setGameMode('menu')} />}
      {gameMode === 'scanner' && <ScannerGame level={currentLevel} onComplete={() => { saveModeComplete('scanner'); setGameMode('menu'); }} onBack={() => setGameMode('menu')} />}
    </div>
  );
}

function LevelMenu({ level, completed, onSelectMode }: { level: Level; completed: string[]; onSelectMode: (mode: any) => void }) {
  const displayConceptsMenu = level.concepts.filter(c => c.id !== 'player' && c.id !== 'hands');
  const [hoveredConcept, setHoveredConcept] = useState<Concept | null>(null);

  return (
    <div className="space-y-4">
      <div className="min-h-[56px] py-1 flex items-center justify-center px-2">
        {hoveredConcept && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-0.5 px-4 py-2 rounded-lg bg-bg-card border border-border w-full max-w-2xl text-left"
          >
            <div className="flex items-center gap-2">
              <span className={cn("text-xs sm:text-sm font-bold whitespace-nowrap", STAT_COLORS[hoveredConcept.id] || 'text-slate-300')}>
                {hoveredConcept.shortName}
              </span>
              <span className="text-[10px] sm:text-xs text-text-muted font-medium font-sans">
                — {hoveredConcept.name}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-text-secondary leading-normal whitespace-normal break-words">
              {hoveredConcept.definition}
            </p>
          </motion.div>
        )}
      </div>
      <div className="card p-2 sm:p-5">
        <div className="w-full flex items-center justify-between flex-nowrap gap-[2px] min-[360px]:gap-1 sm:gap-2 md:gap-3 font-mono py-1">
          {displayConceptsMenu.map((concept) => {
            if (concept.id.startsWith('separator')) {
              return (
                <div key={concept.id} className={cn("w-[1px] sm:w-[2px] self-stretch my-1.5 sm:my-2.5 rounded-full opacity-60 flex-shrink-0 bg-cyan-400")} />
              );
            }
            const colorClass = STAT_COLORS[concept.id] || 'text-slate-300';
            return (
              <div
                key={concept.id}
                className={cn("flex-1 min-w-0 py-1.5 sm:py-2.5 text-center select-none cursor-pointer", colorClass)}
                onClick={() => setHoveredConcept(prev => prev?.id === concept.id ? null : concept)}
              >
                <span className="text-[9px] min-[360px]:text-[11px] min-[400px]:text-[13px] sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold block whitespace-nowrap">
                  {getStatValue(concept.id)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vista Móvil: Fila horizontal compacta para modos de juego */}
      <div className="grid grid-cols-3 gap-2.5 md:hidden">
        {MODES.map((mode) => {
          const locked = false;
          const done = completed.includes(mode.id);
          return (
            <button
              key={mode.id}
              disabled={locked}
              onClick={() => onSelectMode(mode.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer text-center",
                locked ? "bg-black/20 border-border opacity-50 cursor-not-allowed" :
                done ? `${mode.bg} ${mode.border} shadow-[0_0_10px_rgba(16,185,129,0.15)]` : "bg-bg-card border-border hover:border-text-muted"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-all",
                locked ? "bg-bg-primary text-text-muted" :
                done ? "bg-accent-green/20 text-accent-green font-bold" : mode.bg
              )}>
                <mode.icon className={cn("w-5 h-5", locked ? "text-text-muted" : mode.color)} />
              </div>
              <span className={cn("font-bold text-[11px]", locked ? "text-text-muted" : "text-text-primary")}>
                {mode.label}
              </span>
              {done ? (
                <span className="text-[8px] text-accent-green font-bold mt-0.5">
                  Listo
                </span>
              ) : (
                <span className="text-[8px] text-text-muted font-bold mt-0.5">
                  Practicar
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Vista Escritorio: Botones detallados originales */}
      <div className="hidden md:grid grid-cols-3 gap-3">
        {MODES.map((mode) => {
          const locked = false;
          const done = completed.includes(mode.id);
          return (
            <button
              key={mode.id}
              disabled={locked}
              onClick={() => onSelectMode(mode.id)}
              className={`relative p-4 rounded-xl border text-left transition-all ${
                locked ? 'bg-black/20 border-border opacity-50 cursor-not-allowed' :
                done ? `${mode.bg} ${mode.border} cursor-pointer hover:scale-[1.02]` :
                'bg-bg-card border-border hover:border-text-muted cursor-pointer hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${locked ? 'bg-bg-primary' : mode.bg}`}>
                  <mode.icon className={`w-4 h-4 ${locked ? 'text-text-muted' : mode.color}`} />
                </div>
                {done && <div className="text-accent-green text-[10px] font-bold">Completado</div>}
                {locked && <Lock className="w-3 h-3 text-text-muted" />}
              </div>
              <h3 className={`font-bold text-sm ${locked ? 'text-text-muted' : 'text-text-primary'}`}>{mode.label}</h3>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== MEMORIZE GAME ====================
interface MemorizeExercise {
  concept: Concept;
  options: Concept[];
  selectedOption: string | null;
  state: 'showing' | 'answered' | 'timeout';
  showResult: boolean;
  timeLeft: number;
  hudValues: Record<string, string | number>;
}

function MemorizeGame({ level, onComplete, onBack }: { level: Level; onComplete: () => void; onBack: () => void }) {
  const playableConcepts = useMemo(() => getPlayableConcepts(level), [level]);
  const displayConcepts = useMemo(() => level.concepts.filter(c => c.id !== 'player' && c.id !== 'hands'), [level]);

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3.0);
  const [exercises, setExercises] = useState<[MemorizeExercise, MemorizeExercise] | null>(null);
  const [activeIdx, setActiveIdx] = useState<0 | 1>(0);

  const TOTAL_ROUNDS = 5;

  const generateRound = useCallback(() => {
    if (playableConcepts.length < 2) return;

    // Pick two unique correct concepts
    const shuffledConcepts = [...playableConcepts].sort(() => Math.random() - 0.5);
    const correct1 = shuffledConcepts[0];
    const correct2 = shuffledConcepts[1];

    // For exercise 1: correct1 + 2 random distractors
    const others1 = playableConcepts.filter(c => c.id !== correct1.id);
    const options1 = [correct1, ...others1.sort(() => Math.random() - 0.5).slice(0, 2)].sort(() => Math.random() - 0.5);

    // For exercise 2: correct2 + 2 random distractors
    const others2 = playableConcepts.filter(c => c.id !== correct2.id);
    const options2 = [correct2, ...others2.sort(() => Math.random() - 0.5).slice(0, 2)].sort(() => Math.random() - 0.5);

    // Generate stable HUD values for both exercises
    const hudValues1: Record<string, string | number> = {};
    const hudValues2: Record<string, string | number> = {};
    displayConcepts.forEach(c => {
      if (!c.id.startsWith('separator')) {
        hudValues1[c.id] = getStatValue(c.id);
        hudValues2[c.id] = getStatValue(c.id);
      }
    });

    setExercises([
      {
        concept: correct1,
        options: options1,
        selectedOption: null,
        state: 'showing',
        showResult: false,
        timeLeft: 3.0,
        hudValues: hudValues1
      },
      {
        concept: correct2,
        options: options2,
        selectedOption: null,
        state: 'showing',
        showResult: false,
        timeLeft: 3.0,
        hudValues: hudValues2
      }
    ]);
    setActiveIdx(0);
    setTimeLeft(3.0);
  }, [playableConcepts, displayConcepts]);

  useEffect(() => {
    generateRound();
  }, [generateRound]);

  useEffect(() => {
    if (!exercises) return;
    const activeEx = exercises[activeIdx];
    if (activeEx.state !== 'showing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timer);
          
          // Update active exercise state to timeout
          setExercises(exs => {
            if (!exs) return null;
            const copy = [...exs] as [MemorizeExercise, MemorizeExercise];
            copy[activeIdx].state = 'timeout';
            copy[activeIdx].showResult = true;
            return copy;
          });
          setStreak(0);

          if (activeIdx === 0) {
            // Transition immediately to exercise 2
            setTimeout(() => {
              setActiveIdx(1);
              setTimeLeft(3.0);
            }, 500);
          } else {
            // End of round
            setTimeout(() => {
              if (round < TOTAL_ROUNDS) {
                setRound(r => r + 1);
                generateRound();
              } else {
                setRound(TOTAL_ROUNDS + 1);
              }
            }, 1200);
          }
          return 0;
        }

        // Scramble HUD values for the active exercise to make them spin!
        setExercises(exs => {
          if (!exs) return null;
          const copy = [...exs] as [MemorizeExercise, MemorizeExercise];
          const currentEx = copy[activeIdx];
          
          const newHudValues = { ...currentEx.hudValues };
          displayConcepts.forEach(c => {
            if (!c.id.startsWith('separator')) {
              newHudValues[c.id] = getStatValue(c.id);
            }
          });
          currentEx.hudValues = newHudValues;
          return copy;
        });

        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [exercises, activeIdx, round, generateRound, displayConcepts]);

  const handleAnswer = (conceptId: string) => {
    if (!exercises) return;
    const activeEx = exercises[activeIdx];
    if (activeEx.state !== 'showing') return;

    const isCorrect = activeEx.concept.id === conceptId;
    
    // Update active exercise state with selection and result
    setExercises(exs => {
      if (!exs) return null;
      const copy = [...exs] as [MemorizeExercise, MemorizeExercise];
      copy[activeIdx].selectedOption = conceptId;
      copy[activeIdx].state = 'answered';
      copy[activeIdx].showResult = true;
      return copy;
    });

    if (isCorrect) {
      setScore(s => s + (timeLeft > 1.5 ? 10 : timeLeft > 0.5 ? 5 : 2));
      setStreak(s => s + 1);
    } else {
      setScore(s => Math.max(0, s - 5));
      setStreak(0);
    }

    if (activeIdx === 0) {
      // Transition immediately to exercise 2
      setActiveIdx(1);
      setTimeLeft(3.0);
    } else {
      // Transition to next round after 1200ms
      setTimeout(() => {
        if (round < TOTAL_ROUNDS) {
          setRound(r => r + 1);
          generateRound();
        } else {
          setRound(TOTAL_ROUNDS + 1);
        }
      }, 1200);
    }
  };

  if (round > TOTAL_ROUNDS) {
    const maxScore = TOTAL_ROUNDS * 20;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 bg-accent-green/10 rounded-full flex items-center justify-center"><Trophy className="w-7 h-7 text-accent-green" /></div>
        <h3 className="text-2xl font-bold text-text-primary">¡Nivel Memorizado!</h3>
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
          <div className="card p-3 text-center"><p className="text-[10px] text-text-muted">Score</p><p className="text-2xl font-bold text-accent-green">{score}</p></div>
          <div className="card p-3 text-center"><p className="text-[10px] text-text-muted">Max</p><p className="text-2xl font-bold text-text-primary">{maxScore}</p></div>
          <div className="card p-3 text-center"><p className="text-[10px] text-text-muted">%</p><p className="text-2xl font-bold text-accent-gold">{Math.round((score / maxScore) * 100)}%</p></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onComplete} className="btn-primary flex items-center gap-2"><Zap className="w-4 h-4" />Continuar</button>
          <button onClick={() => { setRound(1); setScore(0); setStreak(0); generateRound(); }} className="btn-dark text-xs">Reintentar</button>
        </div>
      </motion.div>
    );
  }

  if (!exercises) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-text-secondary hover:text-text-primary"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-text-muted">{round}/{TOTAL_ROUNDS}</span>
          <span className="text-accent-green font-bold">{score}</span>
          <span className="text-accent-gold font-bold">{streak}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6 mt-2">
        {exercises.map((ex, idx) => {
          const isActive = activeIdx === idx;
          const isPlayable = isActive && ex.state === 'showing';
          
          return (
            <div
              key={idx}
              className={cn(
                "card p-4 sm:p-5 relative border transition-all duration-300",
                isActive ? "border-accent-green bg-bg-card/90" : "border-border/50 bg-bg-card/30"
              )}
            >
              {/* Header inside the exercise card */}
              <div className="flex items-center justify-between mb-2 text-[10px] sm:text-xs font-bold text-text-muted px-1">
                <span>EJERCICIO {idx + 1}</span>
                {isActive && (
                  <span className="text-accent-green animate-pulse">ACTIVO</span>
                )}
              </div>

              {/* HUD line */}
              <div className="w-full flex items-center justify-between flex-nowrap gap-[2px] min-[360px]:gap-1 sm:gap-2 md:gap-3 font-mono py-1.5 sm:py-2.5 border-b border-border/30 mb-3">
                {displayConcepts.map((concept) => {
                  if (concept.id.startsWith('separator')) {
                    return (
                      <div
                        key={concept.id}
                        className="w-[1px] sm:w-[2px] self-stretch my-1 rounded-full opacity-60 flex-shrink-0 bg-cyan-400"
                      />
                    );
                  }
                  const colorClass = STAT_COLORS[concept.id] || 'text-slate-300';
                  const isHighlighted = ex.concept.id === concept.id;
                  
                  // Use the stable or scrambling value from the exercise state
                  const val = ex.hudValues[concept.id] || '';
                  
                  return (
                    <div
                      key={concept.id}
                      className={cn(
                        "flex-1 min-w-0 py-1.5 sm:py-2.5 rounded transition-all text-center select-none",
                        isHighlighted
                          ? "bg-accent-green/20 border border-accent-green shadow-[0_0_12px_rgba(16,185,129,0.2)] scale-105"
                          : "border border-transparent",
                        colorClass
                      )}
                    >
                      <span className="text-[9px] min-[360px]:text-[11px] min-[400px]:text-[13px] sm:text-base md:text-lg font-bold block whitespace-nowrap">
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-bg-primary/50 rounded-full overflow-hidden mb-4">
                {isActive ? (
                  <motion.div
                    className="h-full bg-accent-green rounded-full"
                    style={{ width: `${(timeLeft / 3) * 100}%` }}
                    transition={{ duration: 0 }}
                  />
                ) : (
                  <div
                    className={cn(
                      "h-full rounded-full",
                      ex.state === 'showing' ? "w-full bg-bg-primary" : "w-0 bg-accent-green"
                    )}
                  />
                )}
              </div>

              {/* 3 Options buttons in a single horizontal row */}
              <div className="grid grid-cols-3 gap-3">
                {ex.options.map((concept) => {
                  const isSelected = ex.selectedOption === concept.id;
                  const isCorrect = ex.concept.id === concept.id;
                  const showCorrect = ex.showResult && isCorrect;
                  const showWrong = ex.showResult && isSelected && !isCorrect;
                  
                  return (
                    <motion.button
                      key={concept.id}
                      disabled={!isPlayable}
                      onClick={() => handleAnswer(concept.id)}
                      className={cn(
                        "py-3 sm:py-4 px-2 rounded-xl border text-center font-bold text-sm sm:text-base transition-all truncate",
                        !isPlayable ? "cursor-not-allowed" : "cursor-pointer",
                        showCorrect
                          ? "bg-accent-green/10 border-accent-green text-accent-green font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                          : showWrong
                          ? "bg-red-500/10 border-red-500 text-red-400 font-extrabold"
                          : isSelected
                          ? "bg-accent-green/10 border-accent-green text-accent-green font-extrabold"
                          : isPlayable
                          ? "bg-bg-card border-border hover:border-text-muted text-text-primary"
                          : "bg-bg-card/30 border-border/30 text-text-muted"
                      )}
                      whileTap={isPlayable ? { scale: 0.95 } : undefined}
                    >
                      {concept.shortName}
                    </motion.button>
                  );
                })}
              </div>

              {/* Result Feedback underneath the options */}
              <div className="min-h-[36px] mt-3">
                {ex.showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "py-2 px-3 rounded-xl text-center text-sm font-bold",
                      ex.state === 'timeout'
                        ? "bg-red-500/10 text-red-400"
                        : ex.selectedOption === ex.concept.id
                        ? "bg-accent-green/10 text-accent-green"
                        : "bg-red-500/10 text-red-400"
                    )}
                  >
                    {ex.state === 'timeout'
                      ? `⏱️ Era: ${ex.concept.shortName}`
                      : ex.selectedOption === ex.concept.id
                      ? "✅ Correcto"
                      : `❌ Era: ${ex.concept.shortName}`}
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== DEFINE GAME ====================
interface DefineQuestion {
  concept: Concept;
  options: { text: string; correct: boolean }[];
}

function generateDefineQuestions(level: Level): DefineQuestion[] {
  const concepts = getPlayableConcepts(level);
  const allDefs = concepts.map(c => ({ text: c.definition, id: c.id })).filter(d => d.text.length > 10);
  if (allDefs.length < 4) return [];

  const questions: DefineQuestion[] = [];
  const shuffled = [...concepts].sort(() => Math.random() - 0.5);
  const count = Math.min(10, shuffled.length);

  for (let i = 0; i < count; i++) {
    const c = shuffled[i];
    const wrong = allDefs.filter(d => d.id !== c.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [{ text: c.definition, correct: true }, ...wrong.map(w => ({ text: w.text, correct: false }))];
    questions.push({ concept: c, options: opts.sort(() => Math.random() - 0.5) });
  }
  return questions;
}

function DefineGame({ level, onComplete, onBack }: { level: Level; onComplete: () => void; onBack: () => void }) {
  const questions = useMemo(() => generateDefineQuestions(level), [level]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameState, setGameState] = useState<'showing' | 'answered'>('showing');

  const current = questions[round];
  const TOTAL = questions.length;

  const handleAnswer = (idx: number) => {
    if (gameState !== 'showing' || !current) return;
    setSelected(idx);
    setGameState('answered');
    setShowResult(true);
    if (current.options[idx].correct) {
      setScore(s => s + 10);
      setStreak(s => s + 1);
    } else {
      setScore(s => Math.max(0, s - 5));
      setStreak(0);
    }
    setTimeout(() => {
      if (round + 1 < TOTAL) { setRound(r => r + 1); setSelected(null); setShowResult(false); setGameState('showing'); }
    }, 1500);
  };

  if (TOTAL === 0) {
    return (
      <div className="card p-8 text-center">
        <Brain className="w-12 h-12 mx-auto text-accent-gold" />
        <h3 className="text-lg font-bold text-text-primary mt-4">No hay suficientes definiciones</h3>
        <p className="text-text-muted text-sm mt-2">Esta línea necesita más stats con definiciones para jugar.</p>
        <button onClick={onBack} className="btn-dark text-xs mt-4">Volver</button>
      </div>
    );
  }

  if (round >= TOTAL) {
    const maxScore = TOTAL * 10;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 bg-accent-gold/10 rounded-full flex items-center justify-center"><Trophy className="w-7 h-7 text-accent-gold" /></div>
        <h3 className="text-2xl font-bold text-text-primary">¡Definiciones Dominadas!</h3>
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
          <div className="card p-3 text-center"><p className="text-[10px] text-text-muted">Score</p><p className="text-2xl font-bold text-accent-gold">{score}</p></div>
          <div className="card p-3 text-center"><p className="text-[10px] text-text-muted">Max</p><p className="text-2xl font-bold text-text-primary">{maxScore}</p></div>
          <div className="card p-3 text-center"><p className="text-[10px] text-text-muted">%</p><p className="text-2xl font-bold text-accent-gold">{Math.round((score / maxScore) * 100)}%</p></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onComplete} className="btn-primary flex items-center gap-2 bg-accent-gold text-black"><Zap className="w-4 h-4" />Continuar</button>
          <button onClick={() => { setRound(0); setScore(0); setStreak(0); setSelected(null); setShowResult(false); setGameState('showing'); }} className="btn-dark text-xs">Reintentar</button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-text-secondary hover:text-text-primary"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-text-muted">{round + 1}/{TOTAL}</span>
          <span className="text-accent-gold font-bold">{score}</span>
          <span className="text-accent-green font-bold">{streak}</span>
        </div>
      </div>
      <div className="h-1 bg-bg-primary rounded-full overflow-hidden">
        <motion.div className="h-full bg-accent-gold rounded-full" initial={{ width: 0 }} animate={{ width: `${((round + 1) / TOTAL) * 100}%` }} />
      </div>
      <div className="card p-6 text-center space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">¿Qué significa?</p>
        <h3 className="text-xl md:text-2xl font-bold text-text-primary">{current?.concept.shortName}</h3>
        <p className="text-sm text-text-muted">{current?.concept.name}</p>
      </div>
      <div className="space-y-3">
        {current?.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect = opt.correct;
          const showCorrect = showResult && isCorrect;
          const showWrong = showResult && isSelected && !isCorrect;
          return (
            <motion.button
              key={idx}
              disabled={gameState !== 'showing'}
              onClick={() => handleAnswer(idx)}
              className={`w-full p-4 rounded-xl border text-left text-sm transition-all ${
                showCorrect ? 'bg-accent-green/10 border-accent-green text-accent-green' :
                showWrong ? 'bg-red-500/10 border-red-500 text-red-400' :
                isSelected ? 'bg-accent-green/10 border-accent-green text-accent-green' :
                'bg-bg-card border-border hover:border-text-muted text-text-primary'
              }`}
              whileTap={gameState === 'showing' ? { scale: 0.98 } : undefined}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
              {opt.text}
            </motion.button>
          );
        })}
      </div>
      {showResult && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg text-center text-sm font-bold ${
            selected !== null && current?.options[selected]?.correct ? 'bg-accent-green/10 text-accent-green' : 'bg-red-500/10 text-red-400'
          }`}
        >
          {selected !== null && current?.options[selected]?.correct ? '✅ Correcto' : `❌ La respuesta correcta era: ${current?.options.find(o => o.correct)?.text}`}
        </motion.div>
      )}
    </div>
  );
}

// ==================== SCANNER GAME (ESTRATEGIA) ====================
interface StrategyOption {
  label: string;
  correct: boolean;
}

interface StrategyQuestion {
  id: string;
  values: Record<string, number>;
  highlighted: string[];
  question: string;
  options: StrategyOption[];
  explanation: string;
  category: 'profile' | 'preflop' | 'postflop' | 'overbet' | 'sample';
}

const LINE1_STRATEGIES: StrategyQuestion[] = [
  {
    id: 's1-calling-station',
    values: { vpip: 65, pfr: 8, '3bet': 5, f3bet: 40, '4bet': 2, f4bet: 55, '5bet': 2, f5bet: 45, wwsf: 42, wsd: 48, obturn: 8, contob: 25, obriver: 10 },
    highlighted: ['vpip', 'pfr'],
    question: 'VPIP 65% + PFR 8%. Gap de 57 puntos. ¿Qué perfil es?',
    options: [
      { label: 'Calling Station', correct: true },
      { label: 'LAG', correct: false },
      { label: 'TAG', correct: false },
      { label: 'Nit', correct: false },
    ],
    explanation: 'Mucho VPIP, poco PFR = paga mucho, sube poco. Calling Station. Explota con value bets.',
    category: 'profile',
  },
  {
    id: 's1-nit',
    values: { vpip: 14, pfr: 12, '3bet': 4, f3bet: 80, '4bet': 3, f4bet: 70, '5bet': 2, f5bet: 30, wwsf: 55, wsd: 58, obturn: 6, contob: 50, obriver: 8 },
    highlighted: ['vpip', 'pfr'],
    question: 'VPIP 14% + PFR 12%. Gap mínimo, rango ultra-cerrado. ¿Cómo explotas?',
    options: [
      { label: 'Robar ciegas y foldear ante sus raises', correct: true },
      { label: 'Pagar más para ver flops', correct: false },
      { label: '4Bet bluff frecuente', correct: false },
      { label: 'Bluff catch en river', correct: false },
    ],
    explanation: 'Nit: solo juega premium. Roba ciegas, foldea ante sus raises. Su WWSF alto es fuerza de rango, no agresión.',
    category: 'profile',
  },
  {
    id: 's1-3bet-mal-construido',
    values: { vpip: 24, pfr: 20, '3bet': 14, f3bet: 75, '4bet': 4, f4bet: 60, '5bet': 3, f5bet: 45, wwsf: 48, wsd: 50, obturn: 12, contob: 50, obriver: 15 },
    highlighted: ['3bet', 'f3bet'],
    question: '3Bet 14% + F3B 75%. Mucho 3Bet pero folda al 4Bet. ¿Qué deduces?',
    options: [
      { label: 'Rango mal construido: muchos bluffs sin sustento', correct: true },
      { label: 'Jugador sólido y equilibrado', correct: false },
      { label: 'Solo 3Betea por valor', correct: false },
      { label: 'Pocos datos, no se puede concluir', correct: false },
    ],
    explanation: 'Mucho 3Bet pero fold al 4Bet alto = mete muchos bluffs que no aguantan presión. 4Bet bluff es rentable.',
    category: 'preflop',
  },
  {
    id: 's1-3bet-bajo-valor',
    values: { vpip: 22, pfr: 18, '3bet': 5, f3bet: 55, '4bet': 3, f4bet: 50, '5bet': 2, f5bet: 35, wwsf: 46, wsd: 54, obturn: 10, contob: 50, obriver: 12 },
    highlighted: ['3bet'],
    question: '3Bet solo 5%. ¿Cómo ajustas tu estrategia?',
    options: [
      { label: 'Cerrar call y NO hacer 4Bet bluff', correct: true },
      { label: 'Pagar más para ver flops', correct: false },
      { label: '4Bet bluff con cualquier mano', correct: false },
      { label: 'Ignorar el dato, jugar normal', correct: false },
    ],
    explanation: '3Bet < 10% = cargado de valor. Cierra tu rango de call y evita 4Bet bluffs: te estrellas contra la parte alta de su rango.',
    category: 'preflop',
  },
  {
    id: 's1-3bet-alto-polarizado',
    values: { vpip: 28, pfr: 24, '3bet': 15, f3bet: 45, '4bet': 6, f4bet: 55, '5bet': 4, f5bet: 40, wwsf: 50, wsd: 48, obturn: 14, contob: 48, obriver: 18 },
    highlighted: ['3bet'],
    question: '3Bet 15%. Sobre-polarizado. ¿Cómo ajustas?',
    options: [
      { label: '4Bet bluff con bloqueadores', correct: true },
      { label: 'Cerrar call y pagar de más', correct: false },
      { label: 'Nunca 4Betear', correct: false },
      { label: 'Solo pagar con premium', correct: false },
    ],
    explanation: '3Bet > 12% = sobre-polarizado. Habilita 4Bet bluffs con bloqueadores (Ax, Kx suited). Paga de menos para proteger equity.',
    category: 'preflop',
  },
  {
    id: 's1-agresivo-farolero',
    values: { vpip: 26, pfr: 22, '3bet': 9, f3bet: 55, '4bet': 5, f4bet: 50, '5bet': 3, f5bet: 40, wwsf: 54, wsd: 45, obturn: 14, contob: 41, obriver: 16 },
    highlighted: ['wwsf', 'wsd'],
    question: 'WWSF 54% + W$SD 45%. Gap de +9. ¿Qué perfil es?',
    options: [
      { label: 'Agresivo/Farolero', correct: true },
      { label: 'Pasivo/Selectivo', correct: false },
      { label: 'Equilibrado (REG)', correct: false },
      { label: 'Ballena', correct: false },
    ],
    explanation: 'WWSF >> W$SD (gap +9) = pelea muchos botes pero pierde en showdown. Farolea de más. Bluff catch con manos medias.',
    category: 'postflop',
  },
  {
    id: 's1-pasivo',
    values: { vpip: 20, pfr: 16, '3bet': 6, f3bet: 65, '4bet': 3, f4bet: 60, '5bet': 2, f5bet: 40, wwsf: 40, wsd: 55, obturn: 6, contob: 55, obriver: 8 },
    highlighted: ['wwsf', 'wsd'],
    question: 'WWSF 40% + W$SD 55%. Gap de -15. ¿Cómo explotas?',
    options: [
      { label: 'Fold obligatorio si apuesta fuerte', correct: true },
      { label: 'Bluff catch con manos medias', correct: false },
      { label: 'Pagar más en river', correct: false },
      { label: 'Ignorar, es un REG', correct: false },
    ],
    explanation: 'WWSF << W$SD (gap -15) = no pelea botes, solo gana con cartas. Si apuesta fuerte, tiene nuts. Fold.',
    category: 'postflop',
  },
  {
    id: 's1-equilibrado',
    values: { vpip: 22, pfr: 18, '3bet': 8, f3bet: 55, '4bet': 4, f4bet: 55, '5bet': 3, f5bet: 45, wwsf: 47, wsd: 53, obturn: 11, contob: 50, obriver: 14 },
    highlighted: ['wwsf', 'wsd'],
    question: 'WWSF 47% + W$SD 53%. Gap de -6. ¿Qué perfil es?',
    options: [
      { label: 'Equilibrado (REG)', correct: true },
      { label: 'Agresivo/Farolero', correct: false },
      { label: 'Pasivo', correct: false },
      { label: 'Ballena', correct: false },
    ],
    explanation: 'WWSF ≈ W$SD (gap -6) = sabe cuándo presionar y cuándo retirarse. Perfil equilibrado, difícil de explotar.',
    category: 'profile',
  },
  {
    id: 's1-vpip-bajo-wwsf-alto',
    values: { vpip: 14, pfr: 12, '3bet': 4, f3bet: 78, '4bet': 3, f4bet: 65, '5bet': 2, f5bet: 35, wwsf: 55, wsd: 58, obturn: 8, contob: 52, obriver: 10 },
    highlighted: ['vpip', 'wwsf'],
    question: 'VPIP 14% + WWSF 55%. ¿Es agresión real o fuerza de rango?',
    options: [
      { label: 'Fuerza de rango: solo juega el top 14%', correct: true },
      { label: 'Agresión pura, farolea mucho', correct: false },
      { label: 'Es un LAG encubierto', correct: false },
      { label: 'Datos contradictorios, ignorar', correct: false },
    ],
    explanation: 'VPIP ultra-tight (14%) infla el WWSF naturalmente. Al jugar solo premium, gana la mayoría. No es agresión, es fuerza de rango.',
    category: 'profile',
  },
  {
    id: 's1-ballena',
    values: { vpip: 55, pfr: 15, '3bet': 4, f3bet: 35, '4bet': 2, f4bet: 45, '5bet': 2, f5bet: 40, wwsf: 60, wsd: 38, obturn: 18, contob: 35, obriver: 22 },
    highlighted: ['wwsf', 'wsd'],
    question: 'WWSF 60% + W$SD 38%. Gap extremo de +22. ¿Qué perfil es?',
    options: [
      { label: 'Ballena: explota con valor marginal', correct: true },
      { label: 'REG equilibrado', correct: false },
      { label: 'Nit ultra-tight', correct: false },
      { label: 'TAG sólido', correct: false },
    ],
    explanation: 'Gap extremo (+22) = ballena. Desequilibrio absoluto. Paga con valor marginal, está "dementado" a faroles.',
    category: 'profile',
  },
  {
    id: 's1-obt-disparo',
    values: { vpip: 24, pfr: 20, '3bet': 9, f3bet: 55, '4bet': 5, f4bet: 50, '5bet': 3, f5bet: 42, wwsf: 49, wsd: 51, obturn: 18, contob: 30, obriver: 12 },
    highlighted: ['obturn', 'contob'],
    question: 'OB Turn 18% + Cont OB solo 30%. Overbet alta pero poca continuación. ¿Qué indica?',
    options: [
      { label: 'Disparo desesperado: pagar turn, ver check en river', correct: true },
      { label: 'Jugador sólido con overbet por valor', correct: false },
      { label: 'Solo overbet con nuts', correct: false },
      { label: 'Fold inmediato en turn', correct: false },
    ],
    explanation: 'OBT alto + ContOB bajo (30%) = usa overbet como último recurso y se rinde si le pagan. Paga turn con intención de ver check en river.',
    category: 'overbet',
  },
  {
    id: 's1-contob-alto-valor',
    values: { vpip: 22, pfr: 18, '3bet': 8, f3bet: 55, '4bet': 4, f4bet: 55, '5bet': 3, f5bet: 40, wwsf: 48, wsd: 54, obturn: 15, contob: 65, obriver: 18 },
    highlighted: ['obturn', 'contob'],
    question: 'OB Turn 15% + Cont OB 65%. Continuación alta tras overbet. ¿Qué indica?',
    options: [
      { label: 'Solo overbet por valor: fold sin remordimiento', correct: true },
      { label: 'Farolea mucho con overbets', correct: false },
      { label: 'Pagar siempre en river', correct: false },
      { label: 'Es un farolero desesperado', correct: false },
    ],
    explanation: 'ContOB 60%+ = solo hace overbet cuando planea ir hasta el final por valor. Realiza folds explotativos sin remordimiento.',
    category: 'overbet',
  },
  {
    id: 's1-4bet-f5b-nuts',
    values: { vpip: 20, pfr: 16, '3bet': 7, f3bet: 60, '4bet': 3, f4bet: 55, '5bet': 2, f5bet: 25, wwsf: 46, wsd: 55, obturn: 8, contob: 50, obriver: 10 },
    highlighted: ['4bet', 'f5bet'],
    question: '4Bet 3% + F5B 25%. 4Bet bajo y casi nunca foldea al 5Bet. ¿Qué deduces?',
    options: [
      { label: 'Solo nuts: nunca push de farol', correct: true },
      { label: '4Betea con rango amplio', correct: false },
      { label: 'Push bluff es rentable', correct: false },
      { label: 'Jugador equilibrado', correct: false },
    ],
    explanation: '4Bet bajo + F5B bajo = solo sube las nuts y nunca se retira. Push de farol aquí es negligencia profesional.',
    category: 'preflop',
  },
  {
    id: 's1-f3b-explota',
    values: { vpip: 22, pfr: 18, '3bet': 7, f3bet: 80, '4bet': 3, f4bet: 65, '5bet': 2, f5bet: 40, wwsf: 45, wsd: 54, obturn: 10, contob: 48, obriver: 12 },
    highlighted: ['f3bet'],
    question: 'F3B 80%. Se rinde mucho ante 3Bets. ¿Cómo explotas?',
    options: [
      { label: '3Bet de farol frecuente', correct: true },
      { label: 'Nunca 3Betear', correct: false },
      { label: 'Solo 3Bet con premium', correct: false },
      { label: 'Pagar y ver flop', correct: false },
    ],
    explanation: 'F3B 80% = se rinde demasiado. Explotable con 3Bets de farol. Genera beneficios automáticos.',
    category: 'preflop',
  },
  {
    id: 's1-pagar-menos',
    values: { vpip: 26, pfr: 22, '3bet': 14, f3bet: 40, '4bet': 6, f4bet: 50, '5bet': 4, f5bet: 38, wwsf: 52, wsd: 47, obturn: 15, contob: 52, obriver: 18 },
    highlighted: ['3bet', 'vpip'],
    question: '3Bet 14% vs ti. La intuición dice "pagar más". ¿Qué hace el Analista Maestro?',
    options: [
      { label: 'Paga de menos: cierra el rango de call', correct: true },
      { label: 'Paga de más para ver flops', correct: false },
      { label: 'Solo call con suited connectors', correct: false },
      { label: 'Ignora el 3Bet y juega normal', correct: false },
    ],
    explanation: 'Contra 3Bet alto, paga de menos. Al cerrar el rango de call, llegas al postflop con ventaja de equity real. Pagar con manos débiles = situaciones malas.',
    category: 'preflop',
  },
];

const SCANNER_STRATEGIES: Record<number, StrategyQuestion[]> = {
  1: LINE1_STRATEGIES,
};

function getStrategyQuestions(level: Level): StrategyQuestion[] {
  const strategies = SCANNER_STRATEGIES[level.id];
  if (strategies && strategies.length > 0) {
    return [...strategies].sort(() => Math.random() - 0.5).slice(0, 10);
  }
  return [];
}

interface FallbackQuestion {
  concept: Concept;
  value: number;
  correctLabel: 'Bajo' | 'Normal' | 'Alto';
}

function generateFallbackQuestions(level: Level): FallbackQuestion[] {
  const concepts = getPlayableConcepts(level).filter(c => STAT_RANGES[c.id]);
  const shuffled = [...concepts].sort(() => Math.random() - 0.5);
  const count = Math.min(10, shuffled.length);
  const questions: FallbackQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const c = shuffled[i];
    const r = STAT_RANGES[c.id];
    const val = Math.floor(r.low + Math.random() * (r.high - r.low));
    const third = (r.high - r.low) / 3;
    let label: 'Bajo' | 'Normal' | 'Alto';
    if (val < r.low + third) label = 'Bajo';
    else if (val < r.low + 2 * third) label = 'Normal';
    else label = 'Alto';
    questions.push({ concept: c, value: val, correctLabel: label });
  }
  return questions;
}

function ScannerGame({ level, onComplete, onBack }: { level: Level; onComplete: () => void; onBack: () => void }) {
  const strategyQuestions = useMemo(() => getStrategyQuestions(level), [level]);
  const fallbackQuestions = useMemo(() => generateFallbackQuestions(level), [level]);
  const useStrategy = strategyQuestions.length > 0;

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameState, setGameState] = useState<'showing' | 'answered'>('showing');

  const TOTAL = useStrategy ? strategyQuestions.length : fallbackQuestions.length;
  const displayConcepts = useMemo(() => level.concepts.filter(c => c.id !== 'player' && c.id !== 'hands'), [level]);

  const handleStrategyAnswer = (idx: number) => {
    if (gameState !== 'showing') return;
    const q = strategyQuestions[round];
    if (!q) return;
    setSelected(idx);
    setGameState('answered');
    setShowResult(true);
    if (q.options[idx].correct) {
      setScore(s => s + 25);
      setStreak(s => s + 1);
    } else {
      setScore(s => Math.max(0, s - 10));
      setStreak(0);
    }
    setTimeout(() => {
      if (round + 1 < TOTAL) { setRound(r => r + 1); setSelected(null); setShowResult(false); setGameState('showing'); }
    }, 3000);
  };

  const handleFallbackAnswer = (label: string) => {
    if (gameState !== 'showing') return;
    const q = fallbackQuestions[round];
    if (!q) return;
    const idx = ['Bajo', 'Normal', 'Alto'].indexOf(label);
    setSelected(idx);
    setGameState('answered');
    setShowResult(true);
    if (label === q.correctLabel) {
      setScore(s => s + 10);
      setStreak(s => s + 1);
    } else {
      setScore(s => Math.max(0, s - 5));
      setStreak(0);
    }
    setTimeout(() => {
      if (round + 1 < TOTAL) { setRound(r => r + 1); setSelected(null); setShowResult(false); setGameState('showing'); }
    }, 2000);
  };

  if (TOTAL === 0) {
    return (
      <div className="card p-8 text-center">
        <Target className="w-12 h-12 mx-auto text-red-400" />
        <h3 className="text-lg font-bold text-text-primary mt-4">No hay datos disponibles</h3>
        <p className="text-text-muted text-sm mt-2">Esta línea necesita rangos o estrategias para jugar.</p>
        <button onClick={onBack} className="btn-dark text-xs mt-4">Volver</button>
      </div>
    );
  }

  if (round >= TOTAL) {
    const maxScore = useStrategy ? TOTAL * 25 : TOTAL * 10;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 bg-red-400/10 rounded-full flex items-center justify-center"><Trophy className="w-7 h-7 text-red-400" /></div>
        <h3 className="text-2xl font-bold text-text-primary">¡Scanner Completo!</h3>
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
          <div className="card p-3 text-center"><p className="text-[10px] text-text-muted">Score</p><p className="text-2xl font-bold text-red-400">{score}</p></div>
          <div className="card p-3 text-center"><p className="text-[10px] text-text-muted">Max</p><p className="text-2xl font-bold text-text-primary">{maxScore}</p></div>
          <div className="card p-3 text-center"><p className="text-[10px] text-text-muted">%</p><p className="text-2xl font-bold text-accent-gold">{Math.round((score / maxScore) * 100)}%</p></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onComplete} className="btn-primary flex items-center gap-2 bg-red-500 text-white"><Zap className="w-4 h-4" />Continuar</button>
          <button onClick={() => { setRound(0); setScore(0); setStreak(0); setSelected(null); setShowResult(false); setGameState('showing'); }} className="btn-dark text-xs">Reintentar</button>
        </div>
      </motion.div>
    );
  }

  const currentStrategy = useStrategy ? strategyQuestions[round] : null;
  const currentFallback = !useStrategy ? fallbackQuestions[round] : null;

  const CATEGORY_LABELS: Record<string, string> = {
    profile: 'Perfil',
    preflop: 'Preflop',
    postflop: 'Postflop',
    overbet: 'Overbet',
    sample: 'Muestra',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-text-secondary hover:text-text-primary"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-4 text-xs font-mono">
          {useStrategy && currentStrategy && (
            <span className="px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 text-[10px] font-bold uppercase">{CATEGORY_LABELS[currentStrategy.category]}</span>
          )}
          <span className="text-text-muted">{round + 1}/{TOTAL}</span>
          <span className="text-red-400 font-bold">{score}</span>
          <span className="text-accent-gold font-bold">{streak}</span>
        </div>
      </div>
      <div className="h-1 bg-bg-primary rounded-full overflow-hidden">
        <motion.div className="h-full bg-red-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${((round + 1) / TOTAL) * 100}%` }} />
      </div>

      <div className="card p-2 sm:p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500/50 via-accent-gold/30 to-transparent" />
        <div className="w-full flex items-center justify-between flex-nowrap gap-[2px] min-[360px]:gap-1 sm:gap-2 md:gap-3 font-mono py-1">
          {displayConcepts.map((concept) => {
            if (concept.id.startsWith('separator')) {
              return <div key={concept.id} className={cn("w-[1px] sm:w-[2px] self-stretch my-1.5 sm:my-2.5 rounded-full opacity-60 flex-shrink-0 bg-cyan-400")} />;
            }
            const colorClass = STAT_COLORS[concept.id] || 'text-slate-300';
            const isHighlighted = useStrategy && currentStrategy?.highlighted.includes(concept.id);
            let displayVal: string | number = getStatValue(concept.id);
            if (useStrategy && currentStrategy?.values[concept.id] !== undefined) {
              displayVal = currentStrategy.values[concept.id];
            }
            return (
              <div
                key={concept.id}
                className={cn(
                  "flex-1 min-w-0 py-1.5 sm:py-2.5 rounded transition-all text-center select-none relative",
                  colorClass,
                  isHighlighted
                    ? "bg-red-500/15 border border-red-400 shadow-[0_0_16px_rgba(239,68,68,0.3)] scale-110 z-10"
                    : "border border-transparent"
                )}
              >
                <span className="text-[9px] min-[360px]:text-[11px] min-[400px]:text-[13px] sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold block whitespace-nowrap">
                  {displayVal}
                </span>
                {isHighlighted && (
                  <span className="hidden sm:block text-[8px] md:text-[9px] text-red-400/80 font-bold mt-0.5">{concept.shortName}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {useStrategy && currentStrategy && (
        <>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {currentStrategy.highlighted.map((statId) => {
              const concept = level.concepts.find(c => c.id === statId);
              if (!concept) return null;
              return (
                <span key={statId} className="px-2 py-1 rounded-md bg-red-400/10 text-red-400 text-[10px] font-bold font-mono">
                  {concept.shortName}: {currentStrategy.values[statId]}%
                </span>
              );
            })}
          </div>

          <div className="card p-4 sm:p-5 text-center space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold">Estrategia</p>
            <p className="text-sm sm:text-base font-bold text-text-primary leading-snug">{currentStrategy.question}</p>
          </div>

          <div className="space-y-2.5">
            {currentStrategy.options.map((opt, idx) => {
              const isSelected = selected === idx;
              const isCorrect = opt.correct;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;
              return (
                <motion.button
                  key={idx}
                  disabled={gameState !== 'showing'}
                  onClick={() => handleStrategyAnswer(idx)}
                  className={`w-full p-3.5 rounded-xl border text-left text-sm transition-all ${
                    showCorrect ? 'bg-accent-green/10 border-accent-green text-accent-green' :
                    showWrong ? 'bg-red-500/10 border-red-500 text-red-400' :
                    isSelected ? 'bg-accent-green/10 border-accent-green text-accent-green' :
                    'bg-bg-card border-border hover:border-text-muted text-text-primary'
                  }`}
                  whileTap={gameState === 'showing' ? { scale: 0.98 } : undefined}
                >
                  <span className="font-bold mr-2 text-text-muted">{String.fromCharCode(65 + idx)}.</span>
                  {opt.label}
                </motion.button>
              );
            })}
          </div>

          {showResult && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg text-sm space-y-1 ${
                selected !== null && currentStrategy.options[selected]?.correct ? 'bg-accent-green/10 border border-accent-green/30' : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              <p className={`font-bold ${selected !== null && currentStrategy.options[selected]?.correct ? 'text-accent-green' : 'text-red-400'}`}>
                {selected !== null && currentStrategy.options[selected]?.correct ? '✅ Correcto' : `❌ Respuesta: ${currentStrategy.options.find(o => o.correct)?.label}`}
              </p>
              <p className="text-text-secondary text-xs leading-relaxed">{currentStrategy.explanation}</p>
            </motion.div>
          )}
        </>
      )}

      {!useStrategy && currentFallback && (
        <>
          <div className="card p-6 text-center space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">¿Este valor es Bajo, Normal o Alto?</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-lg font-bold text-text-primary">{currentFallback.concept.shortName}</span>
              <span className="text-2xl md:text-3xl font-bold text-accent-gold">{currentFallback.value}</span>
            </div>
            <p className="text-xs text-text-muted">{currentFallback.concept.name}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['Bajo', 'Normal', 'Alto'].map((label) => {
              const idx = ['Bajo', 'Normal', 'Alto'].indexOf(label);
              const isSelected = selected === idx;
              const isCorrect = label === currentFallback.correctLabel;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;
              return (
                <motion.button
                  key={label}
                  disabled={gameState !== 'showing'}
                  onClick={() => handleFallbackAnswer(label)}
                  className={`p-4 rounded-xl border text-center font-bold text-sm transition-all ${
                    showCorrect ? 'bg-accent-green/10 border-accent-green text-accent-green' :
                    showWrong ? 'bg-red-500/10 border-red-500 text-red-400' :
                    isSelected ? 'bg-accent-green/10 border-accent-green text-accent-green' :
                    'bg-bg-card border-border hover:border-text-muted text-text-primary'
                  }`}
                  whileTap={gameState === 'showing' ? { scale: 0.95 } : undefined}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
          {showResult && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg text-center text-sm font-bold ${
                selected !== null && ['Bajo', 'Normal', 'Alto'][selected] === currentFallback.correctLabel ? 'bg-accent-green/10 text-accent-green' : 'bg-red-500/10 text-red-400'
              }`}
            >
              {selected !== null && ['Bajo', 'Normal', 'Alto'][selected] === currentFallback.correctLabel
                ? `✅ Correcto: ${currentFallback.value} es ${currentFallback.correctLabel}`
                : `❌ Era: ${currentFallback.correctLabel}`}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
