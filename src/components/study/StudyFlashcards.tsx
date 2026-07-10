import { Brain, Check, RotateCcw, Shuffle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DataPack } from '../../data/dataPackService';
import type { StudyPlanSection } from '../../data/dataPackParser';
import type { PokerConcept } from '../training/pokerKnowledge';
import { buildConceptLabels, buildFlashcardBack, conciseDefinition, FLASHCARD_INTERPRETATION_PROMPT } from './studyInterpretation';

export interface FlashcardLearningState {
  seen: boolean;
  reviewed: number;
  correct: number;
  wrong: number;
  lastSeenAt?: string;
}

interface StudyFlashcardsProps {
  pack: DataPack;
  concept?: PokerConcept;
  section?: StudyPlanSection;
  flipped: boolean;
  autoMode: boolean;
  state?: FlashcardLearningState;
  masteryScore: number;
  conceptsSeenCount: number;
  conceptsMasteredCount: number;
  totalConceptsCount: number;
  onFlip: () => void;
  onNext: () => void;
  onToggleAuto: () => void;
  onRate: (result: 'known' | 'again') => void;
}

function getConcept(pack: DataPack, conceptId: string): PokerConcept | undefined {
  return pack.concepts.find(concept => concept.id === conceptId);
}

function getStudyLevel(state: FlashcardLearningState | undefined, masteryScore: number): { label: string; tone: string } {
  if ((state?.correct || 0) >= 3 || masteryScore >= 80) return { label: 'Dominado', tone: 'text-accent-green' };
  if ((state?.wrong || 0) > (state?.correct || 0)) return { label: 'Prioritario', tone: 'text-red-300' };
  if (state?.reviewed) return { label: 'En progreso', tone: 'text-accent-gold' };
  return { label: 'Nuevo', tone: 'text-accent-blue' };
}

export function StudyFlashcards({ pack, concept, section, flipped, autoMode, state, masteryScore, conceptsSeenCount, conceptsMasteredCount, totalConceptsCount, onFlip, onNext, onToggleAuto, onRate }: StudyFlashcardsProps) {
  if (!concept) return null;

  const card = pack.studyPlan?.flashcards?.find(item => item.conceptId === concept.id);
  const sectionConcepts = section?.conceptIds.map(id => getConcept(pack, id)).filter(Boolean) as PokerConcept[] | undefined;
  const labels = sectionConcepts?.length ? buildConceptLabels(sectionConcepts, section) : undefined;
  const front = labels?.get(concept.id) || card?.front || concept.term;
  const back = conciseDefinition(buildFlashcardBack({ ...concept, definition: card?.back || concept.definition }, front, section));
  const level = getStudyLevel(state, masteryScore);

  return (
    <section className="max-w-lg mx-auto w-full rounded-2xl md:rounded-3xl border border-border bg-bg-card p-3 md:p-6 space-y-3 md:space-y-4" data-study-prompt={FLASHCARD_INTERPRETATION_PROMPT}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg md:text-2xl font-black text-text-primary flex items-center gap-2"><Brain className="w-5 h-5 text-accent-gold" />Flashcards</h2>
          <p className="hidden sm:block text-xs text-text-muted mt-1">Sistema inteligente: prioriza conceptos nuevos, fallados o poco dominados.</p>
        </div>
        <button onClick={onToggleAuto} className={cn('shrink-0 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black border flex items-center gap-1.5', autoMode ? 'bg-accent-green/15 text-accent-green border-accent-green/30' : 'bg-bg-primary text-text-muted border-border')}>
          <Shuffle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Auto
        </button>
      </div>

      <button onClick={flipped ? () => onRate('known') : onFlip} className={cn('w-full min-h-[220px] sm:min-h-[300px] md:min-h-[460px] rounded-xl sm:rounded-2xl md:rounded-[2rem] border p-4 sm:p-6 md:p-10 flex items-center justify-center text-center transition-all', flipped ? 'bg-accent-green/10 border-accent-green/30' : 'bg-bg-primary border-border hover:border-accent-gold/50')}>
        {!flipped ? (
          <div className="max-w-3xl space-y-2 md:space-y-5">
            <div className={cn('text-[9px] sm:text-[10px] font-black uppercase tracking-widest', level.tone)}>{level.label}</div>
            <h3 className="text-2xl sm:text-4xl md:text-7xl font-black text-text-primary leading-tight break-words">{front}</h3>
            <p className="text-[10px] sm:text-xs text-text-muted">Toca para ver la respuesta</p>
          </div>
        ) : (
          <div className="max-w-3xl">
            <p className="text-base sm:text-2xl md:text-4xl leading-snug text-text-primary font-semibold">{back}</p>
          </div>
        )}
      </button>

      {/* Progress stats at the bottom */}
      <div className="pt-2 border-t border-border/40 space-y-2">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Conceptos vistos: <strong className="text-text-primary">{conceptsSeenCount} / {totalConceptsCount}</strong></span>
          <span>Dominados: <strong className="text-accent-green">{conceptsMasteredCount}</strong></span>
        </div>
        <div className="w-full bg-bg-primary rounded-full h-1.5 overflow-hidden border border-border/20">
          <div className="bg-accent-green h-full transition-all duration-300" style={{ width: `${Math.min(100, (conceptsSeenCount / totalConceptsCount) * 100)}%` }}></div>
        </div>
      </div>
    </section>
  );
}
