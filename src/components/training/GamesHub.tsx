import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Gamepad2, ArrowLeft, Zap, Trophy, List, CheckSquare, Layers, Puzzle, Route, Map, Copy, Link as LinkIcon, Database } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGameEngine } from './useGameEngine';
import { clearMapPracticeSession, getMapPracticeSession, getNextMapPracticeGame, markMapPracticeGameStarted } from '../../data/mapPracticeActions';
import './poker-games.css';

const GAME_ICONS: Record<string, React.ComponentType<any>> = {
  'multiple-choice': List,
  'true-false': CheckSquare,
  'quick-sort': Layers,
  'unscramble': Puzzle,
  'correct-path': Route,
  'adventure-path': Map,
  'memory-match': Copy,
  'connect-ideas': LinkIcon,
};

const DIFFICULTIES = [
  { id: 'normal', label: 'Normal' },
  { id: 'smart', label: 'Inteligente' },
  { id: 'hard', label: 'Difícil' },
] as const;

export function GamesHub() {
  const engine = useGameEngine();
  const [mapSession, setMapSession] = useState(() => engine.activePack ? getMapPracticeSession(engine.activePack.id) : null);
  const [showQuickPodium, setShowQuickPodium] = useState(false);
  const autoStartLockRef = useRef(false);
  const totalConcepts = engine.activePack?.concepts.length || 0;
  const masteredConcepts = Object.values(engine.conceptMastery).filter(m => m.score >= 80).length;
  const pendingConcepts = Math.max(0, totalConcepts - masteredConcepts);

  useEffect(() => {
    const refresh = () => setMapSession(engine.activePack ? getMapPracticeSession(engine.activePack.id) : null);
    refresh();
    window.addEventListener('map-practice-session-changed', refresh);
    return () => window.removeEventListener('map-practice-session-changed', refresh);
  }, [engine.activePack?.id]);

  useEffect(() => {
    if (!engine.activePack || !mapSession || engine.activeGame || autoStartLockRef.current) return;
    autoStartLockRef.current = true;
    const timeout = window.setTimeout(() => {
      const gameId = getNextMapPracticeGame(mapSession.lastGameId);
      markMapPracticeGameStarted(engine.activePack!.id, gameId);
      setMapSession(getMapPracticeSession(engine.activePack!.id));
      engine.startGame(gameId);
      autoStartLockRef.current = false;
    }, 450);
    return () => {
      window.clearTimeout(timeout);
      autoStartLockRef.current = false;
    };
  }, [engine.activePack, engine.activeGame, engine.startGame, mapSession]);

  const stopMapPractice = () => {
    clearMapPracticeSession();
    setMapSession(null);
    engine.clearStudyFocus();
  };

  const bestQuickScore = engine.quickLeaderboard[0];

  const formatQuickTime = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return minutes > 0 ? `${minutes}:${String(rest).padStart(2, '0')}` : `${rest}s`;
  };

  const renderGameCards = () => {
    return (
      <>
        {/* Mobile Unified Games Grid */}
        <div className="grid grid-cols-2 gap-2 md:hidden">
          {engine.gamesData.map(game => {
            const IconComponent = GAME_ICONS[game.id] || Gamepad2;
            const isAgility = ['quick-sort', 'correct-path', 'adventure-path'].includes(game.id);
            return (
              <button
                key={game.id}
                onClick={() => engine.startGame(game.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border bg-bg-card active:scale-95 transition-all text-center aspect-[1.3] justify-center",
                  isAgility ? "border-border hover:border-accent-gold/50" : "border-border hover:border-accent-green/50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 shrink-0",
                  isAgility ? "bg-amber-500/10 text-accent-gold" : "bg-emerald-500/10 text-accent-green"
                )}>
                  <IconComponent className="w-5.5 h-5.5" />
                </div>
                <span className="text-[10px] text-gray-200 font-bold leading-tight truncate max-w-full px-0.5">{game.title}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Games Grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {engine.gamesData.map(game => {
            const IconComponent = GAME_ICONS[game.id] || Gamepad2;
            return (
              <div key={game.id} className="pg-game-card rounded-lg p-6">
                <div className="flex-grow">
                  <div className="mb-4 h-32 bg-[#0B0F19] rounded-lg flex items-center justify-center border border-[#374151]">
                    <IconComponent className={`w-12 h-12 ${game.color === 'gold' || game.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{game.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{game.description}</p>
                </div>
                <button onClick={() => engine.startGame(game.id)} className={cn(
                  "mt-4 w-full font-bold py-2 px-4 rounded-lg transition-colors",
                  game.color === 'gold' || game.color === 'amber'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}>
                  Jugar
                </button>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="pg-container space-y-4 md:space-y-6 p-1">
      {!engine.activeGame && (
        <div className="hidden md:flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base md:text-2xl font-bold text-gradient-green flex items-center gap-1.5 truncate">
              <Trophy className="w-5 h-5 text-accent-gold shrink-0" />
              Juegos
            </h2>
            <p className="hidden md:block text-text-secondary mt-1 text-sm">8 modos de entrenamiento interactivo. Adaptado a tu nivel.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 card p-1.5 px-2.5 text-xs">
              <Database className="w-3.5 h-3.5 text-accent-gold shrink-0" />
              <span className="font-bold text-text-primary max-w-[90px] sm:max-w-[160px] truncate">
                {engine.activePack?.name || 'Sin datos'}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 card p-1.5 px-3 text-xs">
              <span className="text-text-muted">Conceptos</span>
              <span className="font-bold text-text-primary">{totalConcepts}</span>
              <span className="text-accent-green font-bold">{masteredConcepts} dominados</span>
              <span className="text-accent-gold font-bold">{pendingConcepts} pendientes</span>
            </div>
            <div className="flex items-center gap-1.5 card p-1.5 px-3 glow-green text-xs">
              <Zap className="w-4 h-4 text-accent-green shrink-0 animate-pulse" />
              <span className="font-bold text-text-primary shrink-0">Score: {engine.score}</span>
            </div>
          </div>
        </div>
      )}

      <motion.div
        key={engine.activeGame || 'menu'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        {engine.activeGame && (
          <div className="pg-game-box flex flex-col justify-start overflow-hidden">
            {engine.quickTest.status === 'running' && (
              <div className="mb-2 rounded-xl border border-accent-gold/25 bg-accent-gold/10 px-3 py-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Zap className="w-4 h-4 text-accent-gold shrink-0" />
                  <span className="font-black text-text-primary truncate">{engine.quickTest.currentGameTitle || 'Prueba rápida'}</span>
                  <span className="text-text-muted shrink-0">{engine.quickTest.current}/{engine.quickTest.total}</span>
                  <span className="hidden sm:inline text-text-muted shrink-0">{DIFFICULTIES.find(item => item.id === engine.gameDifficulty)?.label}</span>
                </div>
                <div className="font-black text-accent-gold shrink-0 flex items-center gap-2">
                  {typeof engine.quickTest.lastPoints === 'number' && <span className="text-accent-green">+{engine.quickTest.lastPoints}</span>}
                  <span>{engine.quickTest.score} pts</span>
                </div>
              </div>
            )}
            <div className="flex-shrink-0 flex items-center gap-4">
              <button onClick={() => engine.exitGame()} className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-bold text-xs md:text-sm">
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al menú
              </button>
            </div>
            <div className="pg-timer-track w-full bg-[#374151] rounded-full h-2 my-2 shrink-0">
              <div id="pg-timer-bar" className="pg-timer-fill h-1.5"></div>
            </div>
            <div ref={engine.gameContentRef} className="w-full flex-1 flex flex-col justify-start gap-3 py-1 min-h-0 overflow-hidden"></div>
          </div>
        )}

        {!engine.activeGame && (
          <div className="w-full">
            <div className="card p-3 mb-3 border-accent-gold/25 bg-accent-gold/8 flex items-center justify-between gap-2">
              <button
                onClick={engine.startQuickTest}
                className="flex-1 min-w-0 rounded-xl bg-accent-gold/15 border border-accent-gold/30 px-3 py-2 text-accent-gold font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Zap className="w-4 h-4" />
                Prueba rápida
              </button>
              <button
                onClick={() => setShowQuickPodium(true)}
                className="shrink-0 rounded-xl bg-bg-secondary border border-border px-3 py-2 text-xs font-black text-text-primary flex items-center gap-2"
              >
                <Trophy className="w-4 h-4 text-accent-gold" />
                {bestQuickScore ? `Mejor ${bestQuickScore.score}` : 'Podio'}
              </button>
            </div>

            <div className="card p-2 mb-3 border-border bg-bg-card flex items-center gap-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1 shrink-0">Dificultad</div>
              <div className="grid grid-cols-3 gap-1 flex-1">
                {DIFFICULTIES.map(item => {
                  const active = engine.gameDifficulty === item.id;
                  const recommended = engine.recommendedDifficulty === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => engine.setGameDifficulty(item.id)}
                      className={cn(
                        'rounded-lg px-2 py-2 text-[11px] font-black border transition-colors',
                        active ? 'bg-accent-green/15 border-accent-green/40 text-accent-green' : 'bg-bg-secondary border-border text-text-secondary'
                      )}
                    >
                      {item.label}{recommended && <span className="hidden sm:inline"> · Recomendada</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {engine.quickTest.status === 'finished' && engine.quickTest.lastResult && (
              <div className="card p-4 mb-3 border-accent-green/30 bg-accent-green/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent-green">Prueba rápida completada</p>
                    <h3 className="text-2xl font-black text-text-primary mt-1">{engine.quickTest.lastResult.score} pts</h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {engine.quickTest.lastResult.correct}/{engine.quickTest.lastResult.total} correctas · {formatQuickTime(engine.quickTest.lastResult.totalMs)}
                    </p>
                  </div>
                  <button onClick={engine.clearQuickTestResult} className="text-xs font-bold text-text-muted hover:text-text-primary">Cerrar</button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={engine.startQuickTest} className="rounded-xl bg-accent-green text-bg-primary py-2 text-xs font-black">Repetir</button>
                  <button onClick={() => setShowQuickPodium(true)} className="rounded-xl bg-bg-secondary border border-border py-2 text-xs font-black text-text-primary">Ver podio</button>
                </div>
              </div>
            )}

            {engine.studyFocus && (
              <div className="card p-3 mb-3 border-accent-green/30 bg-accent-green/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-accent-green">{mapSession ? 'Práctica automática del mapa' : 'Foco de estudio activo'}</p>
                  <p className="text-sm font-bold text-text-primary truncate">{engine.studyFocus.title}</p>
                </div>
                <button onClick={mapSession ? stopMapPractice : engine.clearStudyFocus} className="text-xs font-bold text-text-muted hover:text-text-primary shrink-0">
                  Quitar
                </button>
              </div>
            )}
            {renderGameCards()}
          </div>
        )}
      </motion.div>

      {engine.showConfirmModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-[#1F2937] rounded-lg p-6 md:p-8 max-w-sm w-full mx-4 border border-[#374151]">
            <h3 className="text-xl font-bold mb-4 text-white">{engine.confirmTitle}</h3>
            <p className="text-gray-300 mb-6">{engine.confirmText}</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => engine.setShowConfirmModal(false)} className="px-4 py-2 bg-[#374151] hover:bg-[#4B5563] rounded-lg text-white">
                Cancelar
              </button>
              <button onClick={engine.confirmReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuickPodium && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-2xl p-4 md:p-6 max-w-sm w-full border border-[#374151] shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-accent-gold">Top 10</p>
                <h3 className="text-xl font-black text-white">Podio prueba rápida</h3>
              </div>
              <button onClick={() => setShowQuickPodium(false)} className="text-sm font-bold text-gray-400 hover:text-white">Cerrar</button>
            </div>

            {engine.quickLeaderboard.length === 0 ? (
              <div className="rounded-xl border border-border bg-bg-secondary/60 p-4 text-sm text-text-secondary text-center">
                Todavía no hay resultados.
              </div>
            ) : (
              <div className="space-y-2">
                {engine.quickLeaderboard.map((result, index) => (
                  <div key={result.id} className="rounded-xl border border-border bg-bg-secondary/70 px-3 py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0',
                        index === 0 ? 'bg-accent-gold text-bg-primary' : 'bg-bg-primary text-text-secondary'
                      )}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-text-primary">{result.score} pts</div>
                        <div className="text-[11px] text-text-muted">{result.correct}/{result.total} · {formatQuickTime(result.totalMs)}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-text-muted shrink-0">
                      {new Date(result.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
