import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, Zap, Target, AlertCircle, CheckCircle2, ChevronRight, Trophy } from 'lucide-react';
import { useActiveCoach } from '../../lib/activeCoach';
import { StrategyRule } from '../../types/coach';

const LOCAL_UID = 'local-user';

// Escenarios estáticos para demo - en el futuro se generan dinámicamente del coach
const DEMO_SCENARIOS = [
  {
    id: 's1',
    context: "Estás en el BTN con AKo. El UTG hace raise 3bb. Tienes 100bb efectivos. ¿Qué haces?",
    options: [
      { text: "3-Bet a 9bb", feedback: "Correcto. Con AKo en BTN vs UTG, el 3-bet por valor es la línea estándar GTO.", correct: true },
      { text: "Call", feedback: "Pasivo. Pierdes valor y permites que blinds entren baratos.", correct: false },
      { text: "Fold", feedback: "Demasiado tight. AKo es premium y debe jugarse agresivamente preflop.", correct: false },
    ]
  },
  {
    id: 's2',
    context: "Flop: K♠ Q♦ 7♣. Tienes top pair KJ en BB. Villain (BTN) c-bet 2/3 pot. ¿Tu acción?",
    options: [
      { text: "Check-raise", feedback: "Agresivo pero válido. Dependiendo del board y el rival, puede ser explotativo.", correct: true },
      { text: "Call", feedback: "Línea estándar. Controlas el pozo y das una carta gratis, pero pierdes iniciativa.", correct: false },
      { text: "Fold", feedback: "Too weak. Top pair con kicker decente es más que defendible.", correct: false },
    ]
  },
  {
    id: 's3',
    context: "River: A♠ 9♦ 2♣ 5♠ 8♠. Board con 4 espadas. Tienes J♠ T♠. Villain overbets 1.5x pot. ¿Qué haces?",
    options: [
      { text: "Call", feedback: "¡Correcto! Tienes la segunda espada más alta. El overbet puede ser un farol de miedo.", correct: true },
      { text: "Raise all-in", feedback: "Too thin. Solo pagas manos mejores o faroles que ya ganabas.", correct: false },
      { text: "Fold", feedback: "Miedo excesivo. J-high flush es mano muy fuerte en este spot.", correct: false },
    ]
  },
];

export function CoachScenarios() {
  const { coach } = useActiveCoach();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);

  // Mostrar estrategias del coach si existen
  const coachStrategies: StrategyRule[] = coach?.strategies || [];

  const scenario = DEMO_SCENARIOS[scenarioIndex];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    setTotal(t => t + 1);
    if (scenario.options[idx].correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setScenarioIndex((prev) => (prev + 1) % DEMO_SCENARIOS.length);
  };

  if (!coach) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-accent-gold mb-4" />
        <h3 className="text-lg font-bold mb-2">Selecciona un Coach primero</h3>
        <p className="text-text-secondary text-sm">Ve a la sección Datos para activar un coach.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gradient-gold">Escenarios de {coach.name}</h2>
          <p className="text-text-secondary mt-1 text-sm">Práctica basada en la estrategia: {coach.style}</p>
          {coachStrategies.length > 0 && (
            <p className="text-xs text-accent-green mt-1">{coachStrategies.length} reglas de estrategia cargadas</p>
          )}
        </div>
        <div className="flex items-center gap-3 card px-4 py-2">
          <Trophy className="w-5 h-5 text-accent-gold" />
          <span className="font-bold text-lg">{score}/{total}</span>
        </div>
      </div>

      {/* Mostrar estrategias del coach */}
      {coachStrategies.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Estrategias Activas</h3>
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
            {coachStrategies.slice(0, 5).map((rule, idx) => (
              <div key={rule.id} className="flex items-start gap-2 p-2 rounded-lg bg-bg-primary border border-border">
                <Zap className="w-3.5 h-3.5 text-accent-gold shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-accent-gold">Si {rule.condition}</span>
                  <span className="text-text-secondary"> → {rule.action}</span>
                </div>
              </div>
            ))}
            {coachStrategies.length > 5 && (
              <p className="text-xs text-text-muted text-center">+{coachStrategies.length - 5} reglas más</p>
            )}
          </div>
        </div>
      )}

      <motion.div
        key={scenario.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="card p-6 md:p-8 glow-gold">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-accent-gold" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Escenario {scenarioIndex + 1}/{DEMO_SCENARIOS.length}</span>
          </div>
          <p className="text-lg md:text-xl font-medium leading-relaxed text-text-primary">{scenario.context}</p>
        </div>

        <div className="grid gap-3">
          {scenario.options.map((option, i) => (
            <button
              key={i}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
              className={`w-full p-4 md:p-5 rounded-xl border text-left transition-all flex items-center justify-between ${
                isAnswered
                  ? option.correct
                    ? 'bg-accent-green/10 border-accent-green text-accent-green'
                    : i === selectedOption
                      ? 'bg-accent-red/10 border-accent-red text-accent-red'
                      : 'bg-bg-primary border-border opacity-50'
                  : 'bg-bg-card border-border hover:border-text-muted text-text-primary'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1 block">Opción {i + 1}</span>
                <p className="font-bold">{option.text}</p>
                {isAnswered && (
                  <p className="mt-2 text-sm opacity-80">{option.feedback}</p>
                )}
              </div>
              {isAnswered && option.correct && <CheckCircle2 className="w-6 h-6 shrink-0" />}
            </button>
          ))}
        </div>

        {isAnswered && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleNext}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Siguiente Escenario
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}