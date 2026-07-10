import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Link2, BookOpen, Layers3, Map as MapIcon, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { getActiveDataPack, getProgressForPack, setStudyFocus, type DataPack, type DataPackProgress } from '../data/dataPackService';
import { startMapPracticeSession } from '../data/mapPracticeActions';
import type { PokerConcept } from '../components/training/pokerKnowledge';
import type { StudyPlanSection } from '../data/dataPackParser';
import { StudyMap } from '../components/study/StudyMap';
import { StudyRelations } from '../components/study/StudyRelations';
import { StudyFlashcards, type FlashcardLearningState } from '../components/study/StudyFlashcards';

type StudyTab = 'map' | 'relations' | 'flashcards';
type FlashcardState = Record<string, FlashcardLearningState>;

const FLASHCARD_STATE_PREFIX = 'pokercoach_flashcards_';
const tabs: { id: StudyTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'map', label: 'Mapa', icon: MapIcon },
  { id: 'relations', label: 'Relaciones', icon: Link2 },
  { id: 'flashcards', label: 'Flashcards', icon: Layers3 },
];

function getConceptScore(progress: DataPackProgress, conceptId: string): number {
  return progress.conceptMastery[conceptId]?.score ?? 0;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-accent-green';
  if (score >= 50) return 'text-accent-gold';
  return 'text-red-300';
}

function getConcept(pack: DataPack, conceptId: string): PokerConcept | undefined {
  return pack.concepts.find(concept => concept.id === conceptId);
}

function fallbackSections(pack: DataPack): StudyPlanSection[] {
  const groups = new Map<string, PokerConcept[]>();
  for (const concept of pack.concepts) {
    const key = concept.category || 'Conceptos principales';
    groups.set(key, [...(groups.get(key) || []), concept]);
  }
  return Array.from(groups.entries()).map(([title, concepts], index) => ({
    id: `fallback-${index + 1}`,
    title,
    summary: `Bloque de estudio con ${concepts.length} conceptos relacionados.`,
    keyIdeas: concepts.slice(0, 5).map(concept => concept.shortDefinition || concept.definition),
    mustMaster: concepts.slice(0, 5).map(concept => concept.term),
    conceptIds: concepts.map(concept => concept.id),
  }));
}

function getPlanSections(pack: DataPack): StudyPlanSection[] {
  return pack.studyPlan?.sections?.length ? pack.studyPlan.sections : fallbackSections(pack);
}

function loadFlashcardState(packId: string): FlashcardState {
  try {
    return JSON.parse(localStorage.getItem(FLASHCARD_STATE_PREFIX + packId) || '{}');
  } catch {
    return {};
  }
}

function saveFlashcardState(packId: string, state: FlashcardState): void {
  localStorage.setItem(FLASHCARD_STATE_PREFIX + packId, JSON.stringify(state));
}

function getFlashcardIds(pack: DataPack, conceptById: Map<string, PokerConcept>): string[] {
  const planned = pack.studyPlan?.flashcards?.map(card => card.conceptId).filter(id => conceptById.has(id)) || [];
  return planned.length ? planned : pack.concepts.map(concept => concept.id);
}

function getFlashcardWeight(id: string, progress: DataPackProgress, state: FlashcardState): number {
  const mastery = getConceptScore(progress, id);
  const card = state[id];
  const reviewed = card?.reviewed || 0;
  const correct = card?.correct || 0;
  const wrong = card?.wrong || 0;
  const mastered = mastery >= 80 || (correct >= 3 && wrong <= 1);
  let weight = 1 + (100 - mastery) / 30 + Math.max(0, 4 - reviewed) * 0.85 + wrong * 1.6 - correct * 0.35;
  if (mastered) weight *= 0.25;
  return Math.max(0.2, weight);
}

function pickSmartFlashcardId(pack: DataPack, conceptById: Map<string, PokerConcept>, progress: DataPackProgress, state: FlashcardState, currentId = ''): string {
  const ids = getFlashcardIds(pack, conceptById);
  const candidates = ids.length > 1 ? ids.filter(id => id !== currentId) : ids;
  const weighted = candidates.map(id => ({ id, weight: getFlashcardWeight(id, progress, state) }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.id;
  }
  return weighted[0]?.id || ids[0] || '';
}

export function Study() {
  const navigate = useNavigate();
  const [pack, setPack] = useState<DataPack | null>(() => getActiveDataPack());
  const [progress, setProgress] = useState<DataPackProgress>(() => {
    const active = getActiveDataPack();
    return active ? getProgressForPack(active.id) : { score: 0, conceptMastery: {} };
  });
  const [activeTab, setActiveTab] = useState<StudyTab>('map');
  const [selectedConcept, setSelectedConcept] = useState<PokerConcept | null>(null);
  const [flashcardId, setFlashcardId] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [flashcardState, setFlashcardState] = useState<FlashcardState>({});

  useEffect(() => {
    const active = getActiveDataPack();
    const activeProgress = active ? getProgressForPack(active.id) : { score: 0, conceptMastery: {} };
    const activeState = active ? loadFlashcardState(active.id) : {};
    const activeConceptMap = new Map((active?.concepts || []).map(concept => [concept.id, concept]));
    setPack(active);
    setProgress(activeProgress);
    setFlashcardId(active ? pickSmartFlashcardId(active, activeConceptMap, activeProgress, activeState) : '');
    setFlashcardState(activeState);
  }, []);

  const sections = useMemo(() => pack ? getPlanSections(pack) : [], [pack]);
  const conceptById = useMemo(() => new Map((pack?.concepts || []).map(concept => [concept.id, concept])), [pack]);
  const weakConcepts = useMemo(() => (pack?.concepts || [])
    .filter(concept => getConceptScore(progress, concept.id) < 80)
    .sort((a, b) => getConceptScore(progress, a.id) - getConceptScore(progress, b.id)), [pack, progress]);
  const routeConcepts = weakConcepts.slice(0, 5).length ? weakConcepts.slice(0, 5) : (pack?.concepts || []).slice(0, 5);
  const activeFlashcard = pack?.concepts.find(concept => concept.id === flashcardId) || routeConcepts[0] || pack?.concepts[0];

  const totalConceptsCount = pack?.concepts.length || 0;
  const conceptsSeenCount = Object.values(flashcardState).filter(s => s.seen).length;
  const conceptsMasteredCount = pack?.concepts.filter(c => getConceptScore(progress, c.id) >= 80).length || 0;

  useEffect(() => {
    if (!activeFlashcard || !autoMode) return;
    const flipTimer = window.setTimeout(() => setFlipped(true), 1400);
    const nextTimer = window.setTimeout(() => nextFlashcard(), 5000);
    return () => {
      window.clearTimeout(flipTimer);
      window.clearTimeout(nextTimer);
    };
  }, [activeFlashcard?.id, autoMode]);

  useEffect(() => {
    if (!pack || !activeFlashcard || !flipped) return;
    setFlashcardState(prev => {
      const next = {
        ...prev,
        [activeFlashcard.id]: {
          ...(prev[activeFlashcard.id] || { reviewed: 0, correct: 0, wrong: 0 }),
          seen: true,
          lastSeenAt: new Date().toISOString(),
        },
      };
      saveFlashcardState(pack.id, next);
      return next;
    });
  }, [pack, activeFlashcard?.id, flipped]);

  const openFlashcard = (concept: PokerConcept) => {
    setFlashcardId(concept.id);
    setFlipped(false);
    setActiveTab('flashcards');
  };

  const nextFlashcard = () => {
    if (!pack || !activeFlashcard) return;
    setFlashcardId(pickSmartFlashcardId(pack, conceptById, progress, flashcardState, activeFlashcard.id));
    setFlipped(false);
  };

  const rateFlashcard = (result: 'known' | 'again') => {
    if (!pack || !activeFlashcard) return;
    setFlashcardState(prev => {
      const current = prev[activeFlashcard.id] || { seen: false, reviewed: 0, correct: 0, wrong: 0 };
      const next = {
        ...prev,
        [activeFlashcard.id]: {
          seen: true,
          reviewed: current.reviewed + 1,
          correct: current.correct + (result === 'known' ? 1 : 0),
          wrong: current.wrong + (result === 'again' ? 1 : 0),
          lastSeenAt: new Date().toISOString(),
        },
      };
      saveFlashcardState(pack.id, next);
      setFlashcardId(pickSmartFlashcardId(pack, conceptById, progress, next, activeFlashcard.id));
      return next;
    });
    setFlipped(false);
  };

  const practiceConcepts = (title: string, concepts: PokerConcept[]) => {
    if (!pack || concepts.length === 0) return;
    setStudyFocus({ packId: pack.id, title, conceptIds: concepts.map(concept => concept.id) });
    navigate('/games');
  };

  const practiceMapConcepts = (title: string, concepts: PokerConcept[]) => {
    if (!pack || concepts.length === 0) return;
    const conceptIds = concepts.map(concept => concept.id);
    setStudyFocus({ packId: pack.id, title, conceptIds });
    startMapPracticeSession(pack.id, title, conceptIds);
    navigate('/games');
  };

  if (!pack) {
    return (
      <div className="card p-8 text-center">
        <BookOpen className="w-10 h-10 text-accent-green mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-text-primary">Estudio</h1>
        <p className="text-text-secondary mt-2">Activa un DataPack para estudiar.</p>
        <Link to="/data" className="btn-gold inline-flex mt-5">Ir a Datos</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      <header className="hidden md:flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-accent-green">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Estudio</span>
          </div>
          <h1 className="text-xl md:text-3xl font-bold text-text-primary break-words leading-tight mt-1">{pack.studyPlan?.title || pack.name}</h1>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-1.5 md:gap-2 bg-bg-secondary p-1 rounded-2xl sticky top-2 z-20 border border-border/60">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('py-2 px-1 md:px-3 rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-[10px] md:text-sm font-bold transition-all', active ? 'bg-bg-card text-accent-green border border-accent-green/20' : 'text-text-muted hover:text-text-primary')}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        {activeTab === 'map' && <StudyMap pack={pack} sections={sections} onSelect={setSelectedConcept} onPractice={practiceMapConcepts} />}
        {activeTab === 'relations' && <StudyRelations pack={pack} sections={sections} onMap={() => setActiveTab('map')} />}
        {activeTab === 'flashcards' && <StudyFlashcards pack={pack} concept={activeFlashcard} section={sections.find(section => section.conceptIds.includes(activeFlashcard?.id || ''))} flipped={flipped} autoMode={autoMode} state={activeFlashcard ? flashcardState[activeFlashcard.id] : undefined} masteryScore={activeFlashcard ? getConceptScore(progress, activeFlashcard.id) : 0} conceptsSeenCount={conceptsSeenCount} conceptsMasteredCount={conceptsMasteredCount} totalConceptsCount={totalConceptsCount} onFlip={() => setFlipped(prev => !prev)} onNext={nextFlashcard} onToggleAuto={() => setAutoMode(prev => !prev)} onRate={rateFlashcard} />}
      </motion.div>

      {selectedConcept && <ConceptModal pack={pack} sections={sections} concept={selectedConcept} score={getConceptScore(progress, selectedConcept.id)} onClose={() => setSelectedConcept(null)} onFlashcard={() => { openFlashcard(selectedConcept); setSelectedConcept(null); }} onPractice={() => practiceConcepts(selectedConcept.term, [selectedConcept])} />}
    </div>
  );
}

function ConceptModal({ pack, sections, concept, score, onClose, onFlashcard, onPractice }: { pack: DataPack; sections: StudyPlanSection[]; concept: PokerConcept; score: number; onClose: () => void; onFlashcard: () => void; onPractice: () => void }) {
  const section = sections.find(item => item.conceptIds.includes(concept.id));
  const related = (pack.relationships || []).filter(rel => rel.from === concept.id || rel.to === concept.id).map(rel => getConcept(pack, rel.from === concept.id ? rel.to : rel.from)).filter(Boolean) as PokerConcept[];
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-3 md:p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl card p-5 md:p-6">
        <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-widest text-accent-blue">{section?.title || concept.category || 'Sección'}</div><h2 className="text-2xl md:text-3xl font-bold mt-1">{concept.term}</h2></div><button onClick={onClose} className="p-2 rounded-lg bg-bg-secondary"><X className="w-5 h-5" /></button></div>
        <p className="mt-4 p-4 rounded-xl bg-bg-primary border border-border text-text-secondary leading-relaxed">{concept.definition}</p>
        {related.length > 0 && <p className="mt-3 text-xs text-text-muted">Relacionado: {related.map(item => item.term).join(', ')}</p>}
        <div className="mt-3 text-sm font-bold"><span className={getScoreColor(score)}>Dominio {score}%</span></div>
        <div className="grid grid-cols-2 gap-2 mt-5"><button onClick={onFlashcard} className="px-3 py-2 rounded-lg bg-accent-blue/15 text-accent-blue font-bold text-sm">Flashcard</button><button onClick={onPractice} className="px-3 py-2 rounded-lg bg-accent-green/15 text-accent-green font-bold text-sm">Jugar</button></div>
      </motion.div>
    </div>
  );
}
