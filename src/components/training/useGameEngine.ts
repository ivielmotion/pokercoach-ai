import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { pokerKnowledgeBase, generateAllConceptQuestions, gamesData } from './pokerKnowledge';
import {
  getActiveDataPack,
  getProgressForPack,
  saveProgressForPack,
  resetProgressForPack,
  applyConceptLearningEvent,
  getStudyFocusForPack,
  clearStudyFocus,
  type DataPack,
  type ConceptLearningEvent,
  type ConceptMasteryState,
} from '../../data/dataPackService';
import { generatePathQuestions, generateTrueFalse } from '../../data/dataPackParser';

export interface QuickTestResult {
  id: string;
  score: number;
  correct: number;
  total: number;
  totalMs: number;
  date: string;
}

export interface QuickTestState {
  status: 'idle' | 'running' | 'finished';
  current: number;
  total: number;
  score: number;
  correct: number;
  lastPoints?: number;
  currentGameId: string | null;
  currentGameTitle: string;
  lastResult?: QuickTestResult;
}

export type GameDifficulty = 'normal' | 'smart' | 'hard';

const QUICK_TEST_STORAGE_PREFIX = 'studyapp_quick_test_scores_v1';
const GAME_DIFFICULTY_STORAGE_PREFIX = 'studyapp_game_difficulty_v1';

function quickTestStorageKey(packId: string): string {
  return `${QUICK_TEST_STORAGE_PREFIX}:${packId}`;
}

function gameDifficultyStorageKey(packId: string): string {
  return `${GAME_DIFFICULTY_STORAGE_PREFIX}:${packId}`;
}

function readGameDifficulty(packId: string): GameDifficulty | null {
  const value = localStorage.getItem(gameDifficultyStorageKey(packId));
  return value === 'normal' || value === 'smart' || value === 'hard' ? value : null;
}

function saveGameDifficulty(packId: string, difficulty: GameDifficulty) {
  localStorage.setItem(gameDifficultyStorageKey(packId), difficulty);
}

function readQuickTestScores(packId: string): QuickTestResult[] {
  try {
    const raw = localStorage.getItem(quickTestStorageKey(packId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQuickTestScore(packId: string, result: QuickTestResult): QuickTestResult[] {
  const next = [result, ...readQuickTestScores(packId)]
    .sort((a, b) => b.score - a.score || a.totalMs - b.totalMs)
    .slice(0, 10);
  localStorage.setItem(quickTestStorageKey(packId), JSON.stringify(next));
  return next;
}

function shuffleList<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function cleanGameText(value: string | undefined): string {
  return String(value || '').replace(/\.\.\.$/, '').replace(/\s+/g, ' ').trim();
}

function tokenize(value: string | undefined): Set<string> {
  return new Set(String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(word => word.length > 2));
}

function overlapScore(a: string | undefined, b: string | undefined): number {
  const left = tokenize(a);
  const right = tokenize(b);
  let score = 0;
  for (const word of left) if (right.has(word)) score += 1;
  return score;
}

function recommendedDifficultyFor(conceptCount: number, mastery: Record<string, ConceptMasteryState>): GameDifficulty {
  if (conceptCount === 0) return 'normal';
  const mastered = Object.values(mastery).filter(item => item.score >= 80).length;
  const ratio = mastered / conceptCount;
  if (ratio >= 0.8) return 'hard';
  if (ratio >= 0.5) return 'smart';
  return 'normal';
}

function generateShortDef(definition: string): string {
  const firstSentence = definition.split(/[.!?]/)[0].trim();
  if (firstSentence.length <= 60) return firstSentence;
  const words = firstSentence.split(' ');
  let short = '';
  for (const word of words) {
    if ((short + ' ' + word).trim().length > 55) break;
    short = (short + ' ' + word).trim();
  }
  return short || firstSentence.slice(0, 55) + '...';
}

function buildKb(pack: DataPack | null) {
  const source = pack || {
        concepts: pokerKnowledgeBase.concepts,
        multipleChoiceQuestions: undefined,
        pathQuestions: pokerKnowledgeBase.pathQuestions,
        trueFalseQuestions: pokerKnowledgeBase.trueFalseQuestions,
      };
  const concepts = source.concepts.map(c => ({
    ...c,
    shortDefinition: c.shortDefinition || generateShortDef(c.definition),
  }));
  return {
    ...source,
    concepts,
    pathQuestions: generatePathQuestions(concepts),
    trueFalseQuestions: generateTrueFalse(concepts),
    allConceptQuestions: generateAllConceptQuestions({ ...pokerKnowledgeBase, concepts }),
  };
}

export function useGameEngine() {
  const [activePack, setActivePack] = useState<DataPack | null>(() => getActiveDataPack());
  const kb = useMemo(() => buildKb(activePack), [activePack]);
  const packId = activePack?.id || 'codex-poker';
  const [studyFocus, setStudyFocusState] = useState(() => getStudyFocusForPack(packId));

  const [score, setScore] = useState(0);
  const [conceptMastery, setConceptMastery] = useState<Record<string, ConceptMasteryState>>({});
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameDifficulty, setGameDifficultyState] = useState<GameDifficulty>(() => readGameDifficulty(packId) || 'normal');
  const [isTestMode, setIsTestMode] = useState(false);
  const [quickTest, setQuickTest] = useState<QuickTestState>({
    status: 'idle',
    current: 0,
    total: gamesData.length,
    score: 0,
    correct: 0,
    currentGameId: null,
    currentGameTitle: '',
  });
  const [quickLeaderboard, setQuickLeaderboard] = useState<QuickTestResult[]>(() => readQuickTestScores(packId));
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const kbRef = useRef(kb);
  kbRef.current = kb;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const conceptMasteryRef = useRef(conceptMastery);
  conceptMasteryRef.current = conceptMastery;

  const activeGameRef = useRef(activeGame);
  activeGameRef.current = activeGame;

  const gameDifficultyRef = useRef(gameDifficulty);
  gameDifficultyRef.current = gameDifficulty;

  const isTestModeRef = useRef(isTestMode);
  isTestModeRef.current = isTestMode;

  const quickTestActiveRef = useRef(false);
  const quickTestQueueRef = useRef<string[]>([]);
  const quickTestIndexRef = useRef(0);
  const quickTestScoreRef = useRef(0);
  const quickTestCorrectRef = useRef(0);
  const quickTestStartedAtRef = useRef(0);
  const quickRoundAnsweredRef = useRef(false);

  const packIdRef = useRef(packId);
  packIdRef.current = packId;

  const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerTimeLeftRef = useRef(0);
  const timerDurationRef = useRef(0);
  const activeTimerConceptIdRef = useRef('');
  const testMistakesRef = useRef<Record<string, number>>({});
  const onTestNextRef = useRef<(() => void) | null>(null);
  const currentGameQueueRef = useRef<typeof kb.concepts>([]);
  const gameContentRef = useRef<HTMLDivElement>(null);

  const saveState = useCallback((s: number, cm: Record<string, ConceptMasteryState>) => {
    saveProgressForPack(packIdRef.current, s, cm);
  }, []);

  useEffect(() => {
    const progress = getProgressForPack(packId);
    setScore(progress.score);
    setConceptMastery(progress.conceptMastery);
    setStudyFocusState(getStudyFocusForPack(packId));
    setQuickLeaderboard(readQuickTestScores(packId));
    setGameDifficultyState(readGameDifficulty(packId) || recommendedDifficultyFor(kbRef.current.concepts.length, progress.conceptMastery));
  }, [packId]);

  const recommendedDifficulty = recommendedDifficultyFor(kb.concepts.length, conceptMastery);

  const setGameDifficulty = useCallback((difficulty: GameDifficulty) => {
    setGameDifficultyState(difficulty);
    gameDifficultyRef.current = difficulty;
    saveGameDifficulty(packIdRef.current, difficulty);
  }, []);

  useEffect(() => {
    const handler = () => setStudyFocusState(getStudyFocusForPack(packIdRef.current));
    window.addEventListener('study-focus-changed', handler);
    return () => window.removeEventListener('study-focus-changed', handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.id) {
        const pack = getActiveDataPack();
        setActivePack(pack);
      }
    };
    window.addEventListener('datapack-changed', handler);
    return () => window.removeEventListener('datapack-changed', handler);
  }, []);

  const updateScore = useCallback((points: number) => {
    setScore(prev => {
      const next = Math.max(0, prev + points);
      saveState(next, conceptMasteryRef.current);
      return next;
    });
  }, [saveState]);

  const updateMastery = useCallback((conceptId: string, isCorrect: boolean, event: Partial<ConceptLearningEvent> = {}) => {
    if (!conceptId) return;
    setConceptMastery(prev => {
      const next = applyConceptLearningEvent(prev, conceptId, { isCorrect, source: 'game', ...event });
      saveState(scoreRef.current, next);
      return next;
    });
  }, [saveState]);

  const getPrioritizedConceptList = useCallback((forLearning = false) => {
    const currentKb = kbRef.current;
    const cm = conceptMasteryRef.current;
    const conceptsWithScores = currentKb.concepts.map(c => ({
      ...c,
      score: cm[c.id]?.score || 50
    }));
    conceptsWithScores.sort((a, b) => a.score - b.score);
    const focus = getStudyFocusForPack(packIdRef.current);
    if (focus?.conceptIds.length) {
      const focusIds = new Set(focus.conceptIds);
      const focused = conceptsWithScores.filter(c => focusIds.has(c.id));
      const rest = conceptsWithScores.filter(c => !focusIds.has(c.id));
      return [...focused, ...rest];
    }
    if (forLearning) return conceptsWithScores;
    const weightedList = conceptsWithScores.flatMap(c => {
      const weight = Math.max(1, 10 - Math.floor(c.score / 10));
      return Array(weight).fill(c);
    });
    const shuffled = weightedList.sort(() => 0.5 - Math.random());
    const uniqueIds = new Set<string>();
    const uniqueShuffled = shuffled.filter((c: typeof currentKb.concepts[0]) => {
      if (!uniqueIds.has(c.id)) { uniqueIds.add(c.id); return true; }
      return false;
    });
    const remainingConcepts = currentKb.concepts.filter(c => !uniqueIds.has(c.id));
    return [...uniqueShuffled, ...remainingConcepts];
  }, []);

  function getConceptSectionId(conceptId: string): string {
    return activePack?.studyPlan?.sections.find(section => section.conceptIds.includes(conceptId))?.id || '';
  }

  function getConceptSectionTitle(conceptId: string): string {
    return cleanGameText(activePack?.studyPlan?.sections.find(section => section.conceptIds.includes(conceptId))?.title || '');
  }

  function areConceptsRelated(aId: string, bId: string): boolean {
    return Boolean(activePack?.relationships?.some(relation =>
      (relation.from === aId && relation.to === bId) || (relation.from === bId && relation.to === aId)
    ));
  }

  function conceptSimilarityScore(base: typeof kb.concepts[0], candidate: typeof kb.concepts[0]): number {
    let score = 0;
    if (getConceptSectionId(base.id) && getConceptSectionId(base.id) === getConceptSectionId(candidate.id)) score += 8;
    if (base.category && base.category === candidate.category) score += 5;
    if (areConceptsRelated(base.id, candidate.id)) score += 7;
    score += overlapScore(base.term, candidate.term) * 3;
    score += overlapScore(base.shortDefinition || base.definition, candidate.shortDefinition || candidate.definition);
    return score;
  }

  function getSmartDistractors(base: typeof kb.concepts[0], count: number): typeof kb.concepts {
    const difficulty = gameDifficultyRef.current;
    const candidates = kbRef.current.concepts.filter(concept => concept.id !== base.id);
    if (difficulty === 'normal') return shuffleList(candidates).slice(0, count);
    const ranked = candidates
      .map(concept => ({ concept, score: conceptSimilarityScore(base, concept) }))
      .sort((a, b) => b.score - a.score);
    const close = ranked.filter(item => item.score > 0).map(item => item.concept);
    const fallback = shuffleList(candidates.filter(concept => !close.some(item => item.id === concept.id)));
    return [...close, ...fallback].slice(0, count);
  }

  function definitionText(concept: typeof kb.concepts[0]): string {
    return cleanGameText(concept.shortDefinition || concept.definition);
  }

  function buildDefinitionOptions(concept: typeof kb.concepts[0]): { options: string[]; answer: string } {
    const answer = definitionText(concept);
    const optionCount = gameDifficultyRef.current === 'hard' ? 4 : 3;
    const distractors = getSmartDistractors(concept, optionCount - 1)
      .map(definitionText)
      .filter(option => option && option !== answer);
    return { options: shuffleList([answer, ...distractors]).slice(0, optionCount), answer };
  }

  function categoryOptionsFor(concept: typeof kb.concepts[0], correctCategory: string): string[] {
    const allCategories = Array.from(new Set([
      ...(activePack?.studyPlan?.sections || []).map(section => cleanGameText(section.title)),
      ...kbRef.current.concepts.map(item => cleanGameText(item.category)),
    ].filter(Boolean)));
    const optionCount = gameDifficultyRef.current === 'hard' ? 4 : 3;
    if (gameDifficultyRef.current === 'normal') {
      return shuffleList([correctCategory, ...allCategories.filter(item => item !== correctCategory)]).slice(0, optionCount);
    }
    const ranked = allCategories
      .filter(item => item !== correctCategory)
      .map(item => ({ item, score: overlapScore(correctCategory, item) + overlapScore(concept.term, item) }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.item);
    return shuffleList([correctCategory, ...ranked.slice(0, optionCount - 1)]).slice(0, optionCount);
  }

  function conceptsForPairGame(count: number): typeof kb.concepts {
    const base = getPrioritizedConceptList()[0];
    if (!base || gameDifficultyRef.current === 'normal') return getPrioritizedConceptList().slice(0, count);
    return [base, ...getSmartDistractors(base, count - 1)].slice(0, count);
  }

  function timerForGame(gameId: string): number {
    const base = gamesData.find(game => game.id === gameId)?.time || 15;
    if (gameDifficultyRef.current === 'hard') return Math.max(6, Math.round(base * 0.5));
    if (gameDifficultyRef.current === 'smart') return Math.max(10, Math.round(base * 0.9));
    return base;
  }

  function pairCountForGame(base: number): number {
    return 4;
  }

  const clearGameTimer = useCallback(() => {
    if (gameTimerRef.current) { clearInterval(gameTimerRef.current); gameTimerRef.current = null; }
  }, []);

  const disableButtons = useCallback((container: HTMLElement) => {
    container.querySelectorAll('button').forEach(btn => (btn as HTMLButtonElement).disabled = true);
  }, []);

  const exitGame = useCallback(() => {
    clearGameTimer();
    setActiveGame(null);
    setIsTestMode(false);
    quickTestActiveRef.current = false;
    quickRoundAnsweredRef.current = false;
    setQuickTest(prev => prev.status === 'running'
      ? { ...prev, status: 'idle', currentGameId: null, currentGameTitle: '' }
      : prev);
    onTestNextRef.current = null;
  }, [clearGameTimer]);

  function getSpeedBonus(): number {
    if (timerDurationRef.current <= 0) return 0;
    const ratio = Math.max(0, timerTimeLeftRef.current / timerDurationRef.current);
    if (ratio >= 0.66) return 2;
    if (ratio >= 0.33) return 1;
    return 0;
  }

  function completeQuickRound(isCorrect: boolean) {
    if (!quickTestActiveRef.current || quickRoundAnsweredRef.current) return;
    quickRoundAnsweredRef.current = true;
    clearGameTimer();

    const points = isCorrect ? 3 + getSpeedBonus() : 0;
    quickTestScoreRef.current += points;
    if (isCorrect) quickTestCorrectRef.current += 1;

    const currentIndex = quickTestIndexRef.current;
    const nextIndex = currentIndex + 1;
    const total = quickTestQueueRef.current.length;
    setQuickTest(prev => ({
      ...prev,
      current: Math.min(nextIndex, total),
      score: quickTestScoreRef.current,
      correct: quickTestCorrectRef.current,
      lastPoints: points,
    }));

    window.setTimeout(() => {
      if (!quickTestActiveRef.current) return;
      if (nextIndex >= total) {
        quickTestActiveRef.current = false;
        setIsTestMode(false);
        isTestModeRef.current = false;
        setActiveGame(null);
        activeGameRef.current = null;
        const result: QuickTestResult = {
          id: crypto.randomUUID?.() || `${Date.now()}`,
          score: quickTestScoreRef.current,
          correct: quickTestCorrectRef.current,
          total,
          totalMs: Date.now() - quickTestStartedAtRef.current,
          date: new Date().toISOString(),
        };
        const leaderboard = saveQuickTestScore(packIdRef.current, result);
        setQuickLeaderboard(leaderboard);
        setQuickTest({
          status: 'finished',
          current: total,
          total,
          score: result.score,
          correct: result.correct,
          currentGameId: null,
          currentGameTitle: '',
          lastResult: result,
        });
        return;
      }

      quickTestIndexRef.current = nextIndex;
      setActiveGame(null);
      activeGameRef.current = null;
      startQuickRound(quickTestQueueRef.current[nextIndex]);
    }, isCorrect ? 450 : 850);
  }

  function startQuickRound(gameId: string) {
    quickRoundAnsweredRef.current = false;
    const gameData = gamesData.find(game => game.id === gameId);
    const concepts = getPrioritizedConceptList();
    currentGameQueueRef.current = [concepts[quickTestIndexRef.current % Math.max(1, concepts.length)]].filter(Boolean);
    setQuickTest(prev => ({
      ...prev,
      status: 'running',
      current: quickTestIndexRef.current + 1,
      total: quickTestQueueRef.current.length,
      score: quickTestScoreRef.current,
      correct: quickTestCorrectRef.current,
      currentGameId: gameId,
      currentGameTitle: gameData?.title || 'Juego',
    }));

    setTimeout(() => {
      setActiveGame(gameId);
      activeGameRef.current = gameId;
    }, 40);

    const mountGame = (attempt = 0) => {
      const container = gameContentRef.current;
      if (!container || activeGameRef.current !== gameId) {
        if (attempt < 8) window.setTimeout(() => mountGame(attempt + 1), 50);
        return;
      }
      container.innerHTML = '';
      const concept = currentGameQueueRef.current.shift();
      if (gameId === 'multiple-choice') initMultipleChoiceGame(container, concept);
      else if (gameId === 'true-false') initTrueFalseGame(container, concept);
      else if (gameId === 'quick-sort') initQuickSortGame(container, concept);
      else if (gameId === 'unscramble') initUnscrambleGame(container, concept);
      else if (gameId === 'correct-path') initCorrectPathGame(container);
      else if (gameId === 'adventure-path') initAdventurePathGame(container);
      else if (gameId === 'memory-match') initMemoryGame(container);
      else if (gameId === 'connect-ideas') initConnectIdeasGame(container);
      if (!['correct-path', 'adventure-path'].includes(gameId)) startTimer(timerForGame(gameId));
    };
    setTimeout(() => mountGame(), 90);
  }

  const handleAnswer = useCallback((element: HTMLElement, isCorrect: boolean, conceptId: string, container: HTMLElement, onIncorrectCallback?: () => void) => {
    const responseMs = timerDurationRef.current > 0
      ? Math.round(Math.max(0, timerDurationRef.current - timerTimeLeftRef.current) * 1000)
      : undefined;
    clearGameTimer();
    disableButtons(container);
    updateScore(isCorrect ? 10 : -5);
    updateMastery(conceptId, isCorrect, { responseMs });
    element.classList.add(isCorrect ? 'pg-correct' : 'pg-incorrect');
    if (!isCorrect) {
      if (isTestModeRef.current) testMistakesRef.current[conceptId] = (testMistakesRef.current[conceptId] || 0) + 1;
      if (onIncorrectCallback) onIncorrectCallback();
    }
  }, [clearGameTimer, disableButtons, updateScore, updateMastery]);

  const handleTimeout = useCallback(() => {
    const container = gameContentRef.current;
    if (!container) return;
    disableButtons(container);
    updateScore(-10);
    updateMastery(activeTimerConceptIdRef.current, false, { timedOut: true, responseMs: Math.round(timerDurationRef.current * 1000) });
    container.innerHTML += `<div class="text-center mt-4 p-4 bg-red-900/50 text-red-200 rounded-lg"><strong>¡Se acabó el tiempo!</strong></div>`;
    if (quickTestActiveRef.current) {
      setTimeout(() => completeQuickRound(false), 700);
      return;
    }
    setTimeout(() => exitGame(), 2000);
  }, [disableButtons, updateScore, exitGame]);

  const startTimer = useCallback((duration: number) => {
    clearGameTimer();
    timerDurationRef.current = duration;
    timerTimeLeftRef.current = duration;
    const updateTimer = () => {
      const percentage = (timerTimeLeftRef.current / timerDurationRef.current) * 100;
      const timerBar = document.getElementById('pg-timer-bar');
      if (timerBar) {
        (timerBar as HTMLElement).style.width = `${percentage}%`;
        if (percentage < 25) timerBar.style.background = '#ef4444';
        else if (percentage < 60) timerBar.style.background = '#F59E0B';
        else timerBar.style.background = 'linear-gradient(90deg, #F59E0B, #10B981)';
      }
      if (timerTimeLeftRef.current <= 0) {
        clearGameTimer();
        handleTimeout();
        return;
      }
      timerTimeLeftRef.current -= 0.1;
    };
    gameTimerRef.current = setInterval(updateTimer, 100);
  }, [clearGameTimer, handleTimeout]);

  const pauseTimer = useCallback(() => {
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    const timerBar = document.getElementById('pg-timer-bar');
    if (timerBar) {
      timerBar.style.background = '#6366f1';
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (gameTimerRef.current) return;
    const updateTimer = () => {
      const percentage = (timerTimeLeftRef.current / timerDurationRef.current) * 100;
      const timerBar = document.getElementById('pg-timer-bar');
      if (timerBar) {
        (timerBar as HTMLElement).style.width = `${percentage}%`;
        if (percentage < 25) timerBar.style.background = '#ef4444';
        else if (percentage < 60) timerBar.style.background = '#F59E0B';
        else timerBar.style.background = 'linear-gradient(90deg, #F59E0B, #10B981)';
      }
      if (timerTimeLeftRef.current <= 0) {
        clearGameTimer();
        handleTimeout();
        return;
      }
      timerTimeLeftRef.current -= 0.1;
    };
    gameTimerRef.current = setInterval(updateTimer, 100);
  }, [clearGameTimer, handleTimeout]);

  function initMultipleChoiceGame(container: HTMLElement, questionConcept?: typeof kb.concepts[0]) {
    if (!questionConcept) return;
    activeTimerConceptIdRef.current = questionConcept.id;
    const currentKb = kbRef.current;
    const question = currentKb.allConceptQuestions.find(q => q.concept === questionConcept.id);
    if (!question) return;
    const fullDef = question.question;
    const optionCount = gameDifficultyRef.current === 'hard' ? 4 : 3;
    const { options, answer } = gameDifficultyRef.current === 'normal'
      ? (() => {
          const ans = cleanGameText(question.answer);
          const dist = question.options.map(cleanGameText).filter(o => o !== ans);
          return { options: shuffleList([ans, ...dist.slice(0, optionCount - 1)]).slice(0, optionCount), answer: ans };
        })()
      : buildDefinitionOptions(questionConcept);
    const categoryInfo = questionConcept.category ? `Categoría: ${questionConcept.category}` : '';
    container.innerHTML = `
      <h3 class="text-lg md:text-2xl font-bold text-white text-center mb-1">Opción Múltiple</h3>
      <p class="text-center text-gray-400 mb-2 text-xs md:text-base">Concepto</p>
      <div class="pg-question-display pg-concept-display text-base md:text-2xl mb-3">
        <span id="pg-def-text">${fullDef}</span>
      </div>
      <div id="pg-extra-info" class="hidden p-3 mb-2 bg-indigo-900/30 border border-indigo-500/30 rounded-lg text-center">
        <p class="text-xs md:text-sm text-indigo-300 font-semibold">${categoryInfo}</p>
        <p class="text-[10px] text-indigo-400/70 mt-1">Tiempo pausado — estudia el concepto</p>
      </div>
      ${gameDifficultyRef.current === 'hard' ? '' : `<div class="text-center mb-3">
        <button id="pg-show-more-btn" class="text-xs text-amber-400 hover:text-amber-300 underline">Ver más</button>
      </div>`}
      <div id="pg-mc-options" class="pg-options-list">
        ${options.map(opt => `<button class="option-btn pg-option-row bg-[#1F2937] hover:bg-[#374151] border border-[#374151]" data-correct="${opt === answer}">${opt}</button>`).join('')}
      </div>`;
    const showMoreBtn = container.querySelector('#pg-show-more-btn');
    const extraInfo = container.querySelector('#pg-extra-info');
    let expanded = false;
    if (showMoreBtn && extraInfo) {
      showMoreBtn.addEventListener('click', () => {
        expanded = !expanded;
        if (expanded) {
          extraInfo.classList.remove('hidden');
          showMoreBtn.textContent = 'Ver menos';
          pauseTimer();
        } else {
          extraInfo.classList.add('hidden');
          showMoreBtn.textContent = 'Ver más';
          resumeTimer();
        }
      });
    }
    container.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const isCorrect = target.dataset.correct === 'true';
        handleAnswer(target, isCorrect, questionConcept.id, container, () => {
          if (!isCorrect) {
            const correctBtn = container.querySelector('[data-correct="true"]');
            if (correctBtn) correctBtn.classList.add('pg-correct');
          }
        });
        setTimeout(() => {
          if (quickTestActiveRef.current) completeQuickRound(isCorrect);
          else if (isTestModeRef.current) exitGame();
          else loadNextQuestion();
        }, isCorrect ? 300 : 1000);
      });
    });
  }

  function initTrueFalseGame(container: HTMLElement, concept?: typeof kb.concepts[0]) {
    if (!concept) return;
    activeTimerConceptIdRef.current = concept.id;
    const currentKb = kbRef.current;
    let question = currentKb.trueFalseQuestions.find(q => q.concept === concept.id) || currentKb.trueFalseQuestions[Math.floor(Math.random() * currentKb.trueFalseQuestions.length)];
    if (gameDifficultyRef.current !== 'normal') {
      const distractor = getSmartDistractors(concept, 1)[0];
      const shouldBeTrue = gameDifficultyRef.current === 'smart' ? Math.random() > 0.5 : Math.random() > 0.35;
      question = {
        concept: concept.id,
        answer: shouldBeTrue,
        statement: `${concept.term}: ${shouldBeTrue || !distractor ? definitionText(concept) : definitionText(distractor)}`,
      };
    }
    if (!question) return;
    const categoryInfo = concept.category ? `Categoría: ${concept.category}` : '';

    let statementHtml = question.statement;
    if (question.statement.includes(':')) {
      const parts = question.statement.split(':');
      const term = parts[0].trim();
      const def = parts.slice(1).join(':').trim();
      statementHtml = `
        <div class="flex flex-col gap-2 w-full text-center">
          <span class="text-accent-green font-black text-lg md:text-2xl tracking-wide block">${term}</span>
          <span class="text-text-primary text-xs md:text-sm font-semibold leading-relaxed block">${def}</span>
        </div>
      `;
    }

    container.innerHTML = `
      <h3 class="text-lg md:text-2xl font-bold text-white text-center mb-1">Verdadero o Falso</h3>
      <p class="text-center text-gray-400 mb-2 text-xs md:text-base">¿La siguiente afirmación es verdadera o falsa?</p>
      <div class="pg-question-display statement pg-concept-display text-xs md:text-base mb-3 font-semibold">${statementHtml}</div>
      <div id="pg-extra-info-tf" class="hidden p-3 mb-2 bg-indigo-900/30 border border-indigo-500/30 rounded-lg text-center">
        <p class="text-xs md:text-sm text-indigo-300 font-semibold">${categoryInfo}</p>
        <p class="text-[10px] text-indigo-400/70 mt-1">Tiempo pausado — estudia el concepto</p>
      </div>
      ${gameDifficultyRef.current === 'hard' ? '' : `<div class="text-center mb-3">
        <button id="pg-show-more-tf-btn" class="text-xs text-amber-400 hover:text-amber-300 underline">Ver más</button>
      </div>`}
      <div class="flex flex-row justify-between w-full max-w-[320px] mx-auto gap-3 mt-4">
        <button class="option-btn tf-btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg flex-1 text-center justify-center items-center" data-answer="true">Verdadero</button>
        <button class="option-btn tf-btn bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg flex-1 text-center justify-center items-center" data-answer="false">Falso</button>
      </div>`;
    const showMoreTfBtn = container.querySelector('#pg-show-more-tf-btn');
    const extraInfoTf = container.querySelector('#pg-extra-info-tf');
    let expandedTf = false;
    if (showMoreTfBtn && extraInfoTf) {
      showMoreTfBtn.addEventListener('click', () => {
        expandedTf = !expandedTf;
        if (expandedTf) {
          extraInfoTf.classList.remove('hidden');
          showMoreTfBtn.textContent = 'Ver menos';
          pauseTimer();
        } else {
          extraInfoTf.classList.add('hidden');
          showMoreTfBtn.textContent = 'Ver más';
          resumeTimer();
        }
      });
    }
    container.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const userAnswer = target.dataset.answer === 'true';
        const isCorrect = userAnswer === question.answer;
        handleAnswer(target, isCorrect, question.concept, container, () => {
          if (!isCorrect) {
            const correctBtn = container.querySelector(`[data-answer="${question.answer}"]`);
            if (correctBtn) correctBtn.classList.add('pg-correct');
          }
        });
        setTimeout(() => {
          if (quickTestActiveRef.current) completeQuickRound(isCorrect);
          else if (isTestModeRef.current) exitGame();
          else loadNextQuestion();
        }, isCorrect ? 300 : 1000);
      });
    });
  }

  function initQuickSortGame(container: HTMLElement, concept?: typeof kb.concepts[0]) {
    if (!concept) return;
    activeTimerConceptIdRef.current = concept.id;
    container.innerHTML = `
      <h3 class="text-lg md:text-2xl font-bold text-white text-center mb-1">Categorización Rápida</h3>
      <p class="text-center text-gray-400 mb-2 text-xs md:text-base">Elige la categoría correcta.</p>
      <div id="pg-sort-item-container" class="text-center my-3 pg-concept-shell">
        <div id="pg-sort-item" class="pg-sort-item-card">${concept.term}</div>
      </div>
      <div class="pg-options-list" id="pg-sort-categories"></div>`;
    const itemEl = container.querySelector('#pg-sort-item') as HTMLElement;
    const categoriesContainer = container.querySelector('#pg-sort-categories') as HTMLElement;
    if (!itemEl || !categoriesContainer) return;
    itemEl.draggable = true;
    itemEl.ondragstart = (e) => { if (e.dataTransfer) e.dataTransfer.setData('text/plain', concept.id); };
    const sectionForConcept = activePack?.studyPlan?.sections.find(section => section.conceptIds.includes(concept.id));
    const correctCategory = cleanGameText(sectionForConcept?.title || concept.category);
    const categories = categoryOptionsFor(concept, correctCategory);
    categories.sort(() => 0.5 - Math.random());
    categories.forEach(cat => {
      const zone = document.createElement('div');
      zone.className = 'pg-drop-zone pg-option-row text-xs md:text-sm';
      zone.textContent = cat;
      zone.dataset.category = cat;
      zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('active'); };
      zone.ondragleave = () => { zone.classList.remove('active'); };
      zone.ondrop = (e) => {
        e.preventDefault();
        const isCorrect = zone.dataset.category === correctCategory;
        handleAnswer(zone, isCorrect, concept.id, container);
        setTimeout(() => {
          if (quickTestActiveRef.current) completeQuickRound(isCorrect);
          else if (isTestModeRef.current) exitGame();
          else loadNextQuestion();
        }, isCorrect ? 300 : 1000);
      };
      zone.onclick = () => {
        const isCorrect = zone.dataset.category === correctCategory;
        handleAnswer(zone, isCorrect, concept.id, container);
        setTimeout(() => {
          if (quickTestActiveRef.current) completeQuickRound(isCorrect);
          else if (isTestModeRef.current) exitGame();
          else loadNextQuestion();
        }, isCorrect ? 300 : 1000);
      };
      categoriesContainer.appendChild(zone);
    });
  }

  function chunkDefinition(definition: string, maxChunks = 4) {
    const words = definition.split(' ').filter(w => w.length > 0);
    if (words.length <= maxChunks) return words;
    const chunks: string[] = [];
    const chunkSize = Math.ceil(words.length / maxChunks);
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    return chunks;
  }

  function initUnscrambleGame(container: HTMLElement, concept?: typeof kb.concepts[0]) {
    if (!concept) return;
    activeTimerConceptIdRef.current = concept.id;
    const defToUse = gameDifficultyRef.current === 'hard' ? concept.definition : (concept.shortDefinition || concept.definition);
    const maxChunks = gameDifficultyRef.current === 'hard' ? 8 : gameDifficultyRef.current === 'smart' ? 5 : 4;
    const chunks = chunkDefinition(defToUse, maxChunks);
    const shuffledChunks = [...chunks].sort(() => Math.random() - 0.5);
    let sentence: string[] = [];
    container.innerHTML = `
      <h3 class="text-lg md:text-2xl font-bold text-white text-center mb-1">Descifra la Definición</h3>
      <p class="text-center text-gray-400 mb-2 text-xs md:text-base">Concepto</p>
      <div class="pg-question-display pg-concept-display text-base md:text-xl mb-3 text-amber-400">${concept.term}</div>
      <p class="text-center text-gray-400 mb-2 text-xs md:text-base">Ordena la definición</p>
      <div id="pg-sentence-area" class="min-h-[60px] bg-[#0B0F19] p-2 rounded-lg mb-3 border-2 border-[#374151] flex flex-wrap gap-1.5 items-center"></div>
      <div id="pg-word-bank" class="p-2 flex flex-wrap gap-1.5 justify-center"></div>
      <div class="text-center mt-3">
        <button id="pg-check-unscramble" class="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-5 text-sm rounded-lg">Verificar</button>
      </div>`;
    const sentenceArea = container.querySelector('#pg-sentence-area') as HTMLElement;
    const wordBank = container.querySelector('#pg-word-bank') as HTMLElement;
    function renderWords() {
      if (!wordBank || !sentenceArea) return;
      wordBank.innerHTML = shuffledChunks.map((word, i) => `<button class="p-1.5 md:p-2 rounded-md bg-[#374151] hover:bg-[#4B5563] text-xs md:text-sm text-white" data-index="${i}">${word}</button>`).join('');
      sentenceArea.innerHTML = sentence.map((item, i) => `<button class="p-1.5 md:p-2 rounded-md bg-emerald-800 hover:bg-emerald-700 text-xs md:text-sm text-white" data-index="${i}">${item}</button>`).join('');
      wordBank.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
          const wordIndex = parseInt(btn.dataset.index || '0');
          sentence.push(shuffledChunks[wordIndex]);
          shuffledChunks.splice(wordIndex, 1);
          renderWords();
        };
      });
      sentenceArea.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
          const wordIndex = parseInt(btn.dataset.index || '0');
          shuffledChunks.push(sentence[wordIndex]);
          sentence.splice(wordIndex, 1);
          renderWords();
        };
      });
    }
    const checkBtn = container.querySelector('#pg-check-unscramble');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        const isCorrect = sentence.join(' ') === chunks.join(' ');
        handleAnswer(sentenceArea, isCorrect, concept.id, container);
        setTimeout(() => {
          if (quickTestActiveRef.current) completeQuickRound(isCorrect);
          else if (isTestModeRef.current) exitGame();
          else loadNextQuestion();
        }, isCorrect ? 300 : 1000);
      });
    }
    renderWords();
  }

  function initCorrectPathGame(container: HTMLElement) {
    const currentKb = kbRef.current;
    let currentStep = 0;
    const totalSteps = Math.min(3, currentKb.pathQuestions.length);
    if (totalSteps === 0) {
      container.innerHTML = `<div class="text-center p-8"><h3 class="text-2xl font-bold text-amber-400">Sin preguntas de camino</h3><p class="text-gray-300 mt-2">Este DataPack no tiene suficientes datos para este juego.</p></div>`;
      setTimeout(() => exitGame(), 2500);
      return;
    }
    function renderPath() {
      container.innerHTML = `
        <h3 class="text-lg md:text-2xl font-bold text-white text-center mb-1">El Camino Correcto</h3>
        <div class="flex items-center justify-center my-3 flex-wrap gap-1">
          ${Array(totalSteps).fill(0).map((_, i) => `
            <div class="pg-step-circle ${i < currentStep ? 'bg-emerald-500 border-emerald-400' : i === currentStep ? 'bg-emerald-600 border-emerald-400 scale-110' : 'bg-[#374151] border-[#4B5563]'} text-xs md:text-base text-white">${i + 1}</div>` +
            (i < totalSteps - 1 ? `<div class="pg-step-line ${i < currentStep ? 'bg-emerald-400' : 'bg-[#374151]'}"></div>` : '')
          ).join('')}
        </div>
        <div id="pg-path-question-area"></div>`;
      const questionArea = container.querySelector('#pg-path-question-area') as HTMLElement;
      if (!questionArea) return;
      if (currentStep >= totalSteps) {
        questionArea.innerHTML = `<p class="text-center text-2xl font-bold text-emerald-400">¡Ruta completada!</p>`;
        updateScore(20);
        setTimeout(() => exitGame(), 2000);
        return;
      }
      const question = currentKb.pathQuestions[currentStep];
      activeTimerConceptIdRef.current = question.concept;
      const questionConcept = currentKb.concepts.find(concept => concept.id === question.concept);
      const optionCount = gameDifficultyRef.current === 'hard' ? 4 : 3;
      const smartQuestion = questionConcept && gameDifficultyRef.current !== 'normal'
        ? { question: questionConcept.term, ...buildDefinitionOptions(questionConcept) }
        : (() => {
            const ans = cleanGameText(question.answer);
            const dist = question.options.map(cleanGameText).filter(o => o !== ans);
            return { question: question.question, options: shuffleList([ans, ...dist.slice(0, optionCount - 1)]).slice(0, optionCount), answer: ans };
          })();
      questionArea.innerHTML = `
        <p class="text-center text-gray-400 mb-2 text-xs md:text-base">Concepto</p>
        <div class="pg-question-display pg-concept-display text-base md:text-2xl mb-3">${smartQuestion.question}</div>
        <div class="pg-options-list w-full max-w-lg mx-auto">
          ${smartQuestion.options.map(opt => `<button class="option-btn pg-option-row bg-[#374151] hover:bg-[#4B5563] text-white" data-correct="${opt === smartQuestion.answer}">${opt}</button>`).join('')}
        </div>`;
      questionArea.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLElement;
          const isCorrect = target.dataset.correct === 'true';
          disableButtons(questionArea);
          if (isCorrect) {
            const responseMs = timerDurationRef.current > 0
              ? Math.round(Math.max(0, timerDurationRef.current - timerTimeLeftRef.current) * 1000)
              : undefined;
            clearGameTimer();
            updateMastery(question.concept, true, { responseMs });
            currentStep++;
            target.classList.add('pg-correct');
            if (quickTestActiveRef.current) setTimeout(() => completeQuickRound(true), 300);
            else setTimeout(renderPath, 300);
          } else {
            handleAnswer(target, false, question.concept, container);
            setTimeout(() => {
              if (quickTestActiveRef.current) completeQuickRound(false);
              else exitGame();
            }, 1000);
          }
        });
      });
      startTimer(timerForGame('correct-path'));
    }
    renderPath();
  }

  function initAdventurePathGame(container: HTMLElement) {
    const currentKb = kbRef.current;
    const GRID_COLS = 7;
    const GRID_ROWS = 5;
    let currentPosition = 1;
    let boardLayout: { number: number; type: string; gridPos: { r: number; c: number }; target?: number }[] = [];
    let questions = [...currentKb.allConceptQuestions].sort(() => 0.5 - Math.random());
    let currentQuestionIndex = 0;

    if (questions.length === 0) {
      container.innerHTML = `<div class="text-center p-8"><h3 class="text-2xl font-bold text-amber-400">Sin preguntas</h3><p class="text-gray-300 mt-2">Este DataPack no tiene suficientes datos para Aventura.</p></div>`;
      setTimeout(() => exitGame(), 2500);
      return;
    }

    function createBoard() {
      generateRandomPath();
      boardLayout[0].type = 'start';
      boardLayout[boardLayout.length - 1].type = 'end';
      let specialCells = 3;
      while (specialCells > 0) {
        const index = Math.floor(Math.random() * (boardLayout.length - 2)) + 1;
        if (boardLayout[index].type === 'normal') {
          const isShortcut = Math.random() > 0.5;
          const targetIndex = isShortcut
            ? Math.min(boardLayout.length - 1, index + Math.floor(Math.random() * 4) + 3)
            : Math.max(0, index - Math.floor(Math.random() * 4) - 3);
          if (boardLayout[targetIndex].type === 'normal') {
            boardLayout[index].type = isShortcut ? 'shortcut' : 'setback';
            boardLayout[index].target = targetIndex + 1;
            specialCells--;
          }
        }
      }
    }

    function generateRandomPath() {
      const pathLength = Math.floor(Math.random() * 5) + 20;
      boardLayout = [];
      const visited = new Set<string>();
      let current = { r: Math.floor(Math.random() * GRID_ROWS), c: 0 };
      for (let i = 0; i < pathLength; i++) {
        const key = `${current.r},${current.c}`;
        visited.add(key);
        boardLayout.push({ number: i + 1, type: 'normal', gridPos: { r: current.r, c: current.c } });
        if (i === pathLength - 1) {
          boardLayout[i].gridPos.c = GRID_COLS - 1;
          break;
        }
        let options = [
          { r: current.r, c: current.c + 1, weight: 10 },
          { r: current.r, c: current.c - 1, weight: 1 },
          { r: current.r - 1, c: current.c, weight: 4 },
          { r: current.r + 1, c: current.c, weight: 4 },
        ];
        let validOptions = options.filter(opt =>
          opt.r >= 0 && opt.r < GRID_ROWS &&
          opt.c >= 0 && opt.c < GRID_COLS &&
          !visited.has(`${opt.r},${opt.c}`)
        );
        if (current.c >= GRID_COLS - 2) {
          validOptions = validOptions.filter(opt => opt.c > current.c || opt.r !== current.r);
        }
        if (validOptions.length === 0) { generateRandomPath(); return; }
        const weightedOptions = validOptions.flatMap(opt => Array(opt.weight).fill(opt));
        current = weightedOptions[Math.floor(Math.random() * weightedOptions.length)];
      }
    }

    function renderBoard() {
      container.innerHTML = `
        <h3 class="text-lg md:text-2xl font-bold text-white text-center mb-1">Aventura Cognitiva</h3>
        <p class="text-center text-gray-400 mb-3 text-xs md:text-base">Llega a la meta respondiendo correctamente.</p>
        <div id="pg-adventure-board" class="pg-adventure-grid"></div>
        <div id="pg-adventure-question-area" class="mt-3"></div>`;
      const grid = container.querySelector('#pg-adventure-board') as HTMLElement;
      if (!grid) return;
      const pathMap = new Map(boardLayout.map(cell => [`${cell.gridPos.r},${cell.gridPos.c}`, cell]));
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const gridCell = document.createElement('div');
          gridCell.className = 'pg-grid-cell';
          gridCell.dataset.r = String(r);
          gridCell.dataset.c = String(c);
          const pathData = pathMap.get(`${r},${c}`);
          if (pathData) {
            gridCell.classList.add('path', pathData.type);
            let emoji = '';
            if (pathData.type === 'start') emoji = '🏁';
            if (pathData.type === 'end') emoji = '🏆';
            if (pathData.type === 'shortcut') emoji = '⚡';
            if (pathData.type === 'setback') emoji = '💀';
            gridCell.innerHTML = `<div class="absolute inset-0 flex items-center justify-center text-xs sm:text-base">${emoji}</div>`;
          }
          grid.appendChild(gridCell);
        }
      }
      updatePlayerPosition();
      askQuestion();
    }

    function updatePlayerPosition() {
      const oldPiece = container.querySelector('.pg-player-piece');
      if (oldPiece) oldPiece.remove();
      const pos = boardLayout[currentPosition - 1]?.gridPos;
      if (!pos) return;
      const targetCell = container.querySelector(`.pg-grid-cell[data-r="${pos.r}"][data-c="${pos.c}"]`);
      if (targetCell) {
        const piece = document.createElement('div');
        piece.className = 'pg-player-piece absolute inset-0 flex items-center justify-center z-10';
        piece.innerHTML = '<span class="text-sm sm:text-lg">🔴</span>';
        targetCell.appendChild(piece);
      }
    }

    function askQuestion() {
      const questionArea = container.querySelector('#pg-adventure-question-area') as HTMLElement;
      if (!questionArea) return;
      if (currentPosition >= boardLayout.length) {
        questionArea.innerHTML = '<p class="text-center text-2xl font-bold text-emerald-400">¡Felicidades! ¡Completaste la Aventura!</p>';
        updateScore(50);
        setTimeout(() => exitGame(), 3000);
        return;
      }
      if (currentQuestionIndex >= questions.length) {
        currentQuestionIndex = 0;
        questions.sort(() => 0.5 - Math.random());
      }
      const currentQuestion = questions[currentQuestionIndex];
      activeTimerConceptIdRef.current = currentQuestion.concept;
      const concept = currentKb.concepts.find(c => c.id === currentQuestion.concept);
      const optionCount = gameDifficultyRef.current === 'hard' ? 4 : 3;
      const smartQuestion = concept && gameDifficultyRef.current !== 'normal'
        ? { question: concept.term, ...buildDefinitionOptions(concept) }
        : (() => {
            const ans = cleanGameText(currentQuestion.answer);
            const dist = currentQuestion.options.map(cleanGameText).filter(o => o !== ans);
            return { question: currentQuestion.question, options: shuffleList([ans, ...dist.slice(0, optionCount - 1)]).slice(0, optionCount), answer: ans };
          })();
      questionArea.innerHTML = `
        <p class="text-center text-xs md:text-base text-gray-300 mb-2">Paso ${currentPosition} de ${boardLayout.length}<span class="pg-points-badge">+${currentQuestion.points}</span></p>
        <div class="pg-question-display statement pg-concept-display text-xs md:text-sm mb-3 font-semibold">${smartQuestion.question}</div>
        <div class="pg-options-list w-full max-w-lg mx-auto">
          ${smartQuestion.options.map(opt => `<button class="option-btn pg-option-row bg-[#374151] hover:bg-[#4B5563] text-white" data-correct="${opt === smartQuestion.answer}">${opt}</button>`).join('')}
        </div>`;
      questionArea.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLElement;
          handlePathAnswer(target.dataset.correct === 'true', target, currentQuestion);
        });
      });
      startTimer(timerForGame('adventure-path'));
    }

    function handlePathAnswer(isCorrect: boolean, element: HTMLElement, question: typeof currentKb.allConceptQuestions[0]) {
      const responseMs = timerDurationRef.current > 0
        ? Math.round(Math.max(0, timerDurationRef.current - timerTimeLeftRef.current) * 1000)
        : undefined;
      clearGameTimer();
      const questionArea = container.querySelector('#pg-adventure-question-area') as HTMLElement;
      if (!questionArea) return;
      disableButtons(questionArea);
      element.classList.add(isCorrect ? 'pg-correct' : 'pg-incorrect');
      if (!isCorrect) {
        const correctBtn = Array.from(questionArea.querySelectorAll('.option-btn')).find(btn => btn.textContent === question.answer);
        if (correctBtn) correctBtn.classList.add('pg-correct');
      }
      updateScore(isCorrect ? 10 : -5);
      updateMastery(question.concept, isCorrect, { responseMs });
      setTimeout(() => {
        if (quickTestActiveRef.current) {
          completeQuickRound(isCorrect);
          return;
        }
        let newPosition = currentPosition;
        if (isCorrect) newPosition += question.points;
        else newPosition -= (Math.floor(Math.random() * 2) + 1);
        newPosition = Math.max(1, Math.min(boardLayout.length, newPosition));
        currentPosition = newPosition;
        updatePlayerPosition();
        setTimeout(() => {
          const currentCellData = boardLayout[currentPosition - 1];
          if ((currentCellData.type === 'shortcut' || currentCellData.type === 'setback') && currentCellData.target) {
            currentPosition = currentCellData.target;
            updatePlayerPosition();
          }
          setTimeout(askQuestion, isCorrect ? 150 : 400);
        }, isCorrect ? 150 : 400);
        currentQuestionIndex++;
      }, isCorrect ? 300 : 1000);
    }

    createBoard();
    renderBoard();
  }

  function initMemoryGame(container: HTMLElement) {
    const numPairs = pairCountForGame(Math.min(4, kbRef.current.concepts.length));
    if (numPairs < 2) {
      container.innerHTML = `<div class="text-center p-8"><h3 class="text-2xl font-bold text-amber-400">Muy pocos conceptos</h3><p class="text-gray-300 mt-2">Se necesitan al menos 2 conceptos para Memoria.</p></div>`;
      setTimeout(() => exitGame(), 2500);
      return;
    }
    const conceptsForGame = conceptsForPairGame(numPairs);
    let cards: { type: string; content: string; id: string }[] = [];
    conceptsForGame.forEach(concept => {
      cards.push({ type: 'term', content: concept.term, id: concept.id });
      cards.push({ type: 'definition', content: concept.shortDefinition || concept.definition, id: concept.id });
    });
    cards.sort(() => 0.5 - Math.random());
    container.innerHTML = `
      <div class="flex-1 flex flex-col justify-start items-center w-full min-h-0 gap-3">
        <div class="text-center shrink-0">
          <h3 class="text-base md:text-xl font-bold text-white mb-0.5">Memoria de Conceptos</h3>
          <p class="text-gray-400 text-xs font-semibold">Encuentra los ${numPairs} pares correctos.</p>
        </div>
        <div class="pg-memory-grid flex-1 w-full max-w-lg md:max-w-3xl min-h-0 mx-auto">
          ${cards.map((card, index) => `
            <div class="pg-memory-card" data-index="${index}" data-id="${card.id}">
              <div class="front"><span class="pg-memory-question">?</span></div>
              <div class="back">${card.content}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
    let flippedCards: HTMLElement[] = [];
    let matchedPairs = 0;
    let isChecking = false;
    container.querySelectorAll('.pg-memory-card').forEach(cardEl => {
      cardEl.addEventListener('click', () => {
        const el = cardEl as HTMLElement;
        if (isChecking || el.classList.contains('flipped') || el.classList.contains('matched')) return;
        el.classList.add('flipped');
        flippedCards.push(el);
        if (flippedCards.length === 2) {
          isChecking = true;
          const [card1, card2] = flippedCards;
          if (card1.dataset.id === card2.dataset.id) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            updateMastery(card1.dataset.id || '', true);
            flippedCards = [];
            isChecking = false;
            if (matchedPairs === numPairs) {
              clearGameTimer();
              updateScore(25);
              container.innerHTML += '<div class="text-center mt-4 p-4 bg-emerald-900/50 text-emerald-200 rounded-lg"><strong>¡Todos los pares encontrados!</strong></div>';
              setTimeout(() => {
                if (quickTestActiveRef.current) completeQuickRound(true);
                else exitGame();
              }, 1000);
            }
          } else {
            updateMastery(card1.dataset.id || '', false);
            updateMastery(card2.dataset.id || '', false);
            setTimeout(() => {
              card1.classList.remove('flipped');
              card2.classList.remove('flipped');
              flippedCards = [];
              isChecking = false;
            }, 600);
          }
        }
      });
    });
  }

  function initConnectIdeasGame(container: HTMLElement) {
    const numPairs = pairCountForGame(Math.min(4, kbRef.current.concepts.length));
    if (numPairs < 2) {
      container.innerHTML = `<div class="text-center p-8"><h3 class="text-2xl font-bold text-amber-400">Muy pocos conceptos</h3><p class="text-gray-300 mt-2">Se necesitan al menos 2 conceptos para Conecta Ideas.</p></div>`;
      setTimeout(() => exitGame(), 2500);
      return;
    }
    const conceptsForGame = conceptsForPairGame(numPairs);
    const terms = [...conceptsForGame];
    const definitions = [...conceptsForGame].sort(() => 0.5 - Math.random());
    container.innerHTML = `
      <div class="flex-1 flex flex-col justify-start items-center w-full min-h-0 gap-3">
        <div class="text-center shrink-0">
          <h3 class="text-base md:text-xl font-bold text-white mb-0.5">Conecta las Ideas</h3>
          <p class="text-gray-400 text-xs font-semibold">Une cada término con su definición.</p>
        </div>
        <div class="pg-connect-container flex-1 w-full max-w-3xl min-h-0 mx-auto">
          <div id="pg-terms-column" class="pg-connect-column">
            ${terms.map(c => `<div class="pg-connect-item" data-id="${c.id}">${c.term}</div>`).join('')}
          </div>
          <div id="pg-defs-column" class="pg-connect-column">
            ${definitions.map(c => `<div class="pg-connect-item" data-id="${c.id}">${c.shortDefinition || c.definition}</div>`).join('')}
          </div>
          <svg id="pg-connect-svg"></svg>
        </div>
      </div>`;
    let selectedItem: HTMLElement | null = null;
    let lines: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    let connectedPairs = 0;
    const svg = container.querySelector('#pg-connect-svg') as SVGSVGElement;
    function getAnchorPoint(element: HTMLElement) {
      const isTerm = element.parentElement?.id === 'pg-terms-column';
      const x = isTerm ? element.offsetWidth - 2 : 2;
      const y = element.offsetTop + element.offsetHeight / 2;
      return { x, y };
    }
    function drawLines() {
      if (!svg) return;
      svg.innerHTML = lines.map(line =>
        `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${line.color}" stroke-width="3"/>`
      ).join('');
    }
    container.querySelectorAll('.pg-connect-item').forEach(item => {
      item.addEventListener('click', () => {
        const el = item as HTMLElement;
        if (el.classList.contains('connected')) return;
        if (!selectedItem) {
          selectedItem = el;
          el.classList.add('selected');
        } else {
          if (selectedItem.parentElement === el.parentElement) {
            selectedItem.classList.remove('selected');
            selectedItem = el;
            el.classList.add('selected');
            return;
          }
          const isCorrect = selectedItem.dataset.id === el.dataset.id;
          const startPoint = getAnchorPoint(selectedItem);
          const endPoint = getAnchorPoint(el);
          if (isCorrect) {
            lines.push({ x1: startPoint.x, y1: startPoint.y, x2: endPoint.x, y2: endPoint.y, color: '#10B981' });
            selectedItem.classList.add('connected');
            el.classList.add('connected');
            selectedItem.classList.remove('selected');
            connectedPairs++;
            updateMastery(el.dataset.id || '', true);
          } else {
            lines.push({ x1: startPoint.x, y1: startPoint.y, x2: endPoint.x, y2: endPoint.y, color: '#EF4444' });
            updateScore(-5);
            updateMastery(selectedItem.dataset.id || '', false);
            updateMastery(el.dataset.id || '', false);
            selectedItem.classList.remove('selected');
            setTimeout(() => { lines.pop(); drawLines(); }, 350);
          }
          drawLines();
          selectedItem = null;
          if (connectedPairs === numPairs) {
            clearGameTimer();
            updateScore(25);
            container.innerHTML += '<div class="text-center mt-4 p-4 bg-emerald-900/50 text-emerald-200 rounded-lg"><strong>¡Todo conectado!</strong></div>';
            setTimeout(() => {
              if (quickTestActiveRef.current) completeQuickRound(true);
              else exitGame();
            }, 1000);
          }
        }
      });
    });
  }

  const loadNextQuestion = useCallback(() => {
    clearGameTimer();
    const container = gameContentRef.current;
    if (!container) { exitGame(); return; }

    const currentActiveGame = activeGameRef.current;

    if (currentActiveGame === 'adventure-path' || currentActiveGame === 'correct-path') {
      if (currentActiveGame === 'adventure-path') initAdventurePathGame(container);
      else initCorrectPathGame(container);
      return;
    }

    if (currentGameQueueRef.current.length === 0 && !['memory-match', 'connect-ideas'].includes(currentActiveGame || '')) {
      container.innerHTML = `<div class="text-center p-8"><h3 class="text-2xl font-bold text-emerald-400">¡Ronda completada!</h3><p class="text-gray-300 mt-2">Has repasado todos los conceptos en este juego.</p></div>`;
      setTimeout(() => exitGame(), 2500);
      return;
    }

    const nextConcept = currentGameQueueRef.current.shift();
    container.innerHTML = '';
    const gameData = gamesData.find(g => g.id === currentActiveGame);

    const gameFunctions: Record<string, (c: HTMLElement, concept?: typeof kb.concepts[0]) => void> = {
      'multiple-choice': initMultipleChoiceGame,
      'true-false': initTrueFalseGame,
      'quick-sort': initQuickSortGame,
      'unscramble': initUnscrambleGame,
      'memory-match': initMemoryGame,
      'connect-ideas': initConnectIdeasGame,
    };

    if (gameFunctions[currentActiveGame || ''] && nextConcept) {
      gameFunctions[currentActiveGame || ''](container, nextConcept);
      if (gameData) startTimer(timerForGame(gameData.id));
    }
  }, [clearGameTimer, exitGame, startTimer, handleAnswer, disableButtons, updateScore, updateMastery, getPrioritizedConceptList]);

  const startGame = useCallback((gameId: string) => {
    setActiveGame(gameId);
    activeGameRef.current = gameId;
    currentGameQueueRef.current = getPrioritizedConceptList();
    setTimeout(() => {
      const container = gameContentRef.current;
      if (!container) return;
      if (gameId === 'adventure-path') initAdventurePathGame(container);
      else if (gameId === 'correct-path') initCorrectPathGame(container);
      else if (gameId === 'memory-match') { initMemoryGame(container); startTimer(timerForGame(gameId)); }
      else if (gameId === 'connect-ideas') { initConnectIdeasGame(container); startTimer(timerForGame(gameId)); }
      else { loadNextQuestion(); }
    }, 0);
  }, [getPrioritizedConceptList, loadNextQuestion, startTimer]);

  const startKnowledgeTest = useCallback(() => {
    testMistakesRef.current = {};
    setIsTestMode(true);
    isTestModeRef.current = true;
    let testGames = [...gamesData.map(g => g.id)].sort(() => 0.5 - Math.random());
    let currentTestIndex = 0;
    const nextTestGame = () => {
      if (currentTestIndex >= testGames.length) {
        setIsTestMode(false);
        isTestModeRef.current = false;
        exitGame();
        return;
      }
      const gameId = testGames[currentTestIndex];
      currentTestIndex++;
      onTestNextRef.current = nextTestGame;
      currentGameQueueRef.current = [getPrioritizedConceptList()[0]];
      startGame(gameId);
    };
    nextTestGame();
  }, [startGame, exitGame, getPrioritizedConceptList]);

  const startQuickTest = useCallback(() => {
    clearGameTimer();
    const queue = shuffleList(gamesData.map(game => game.id));
    quickTestQueueRef.current = queue;
    quickTestIndexRef.current = 0;
    quickTestScoreRef.current = 0;
    quickTestCorrectRef.current = 0;
    quickTestStartedAtRef.current = Date.now();
    quickTestActiveRef.current = true;
    quickRoundAnsweredRef.current = false;
    setIsTestMode(true);
    isTestModeRef.current = true;
    setQuickTest({
      status: 'running',
      current: 1,
      total: queue.length,
      score: 0,
      correct: 0,
      currentGameId: queue[0] || null,
      currentGameTitle: gamesData.find(game => game.id === queue[0])?.title || 'Juego',
    });
    if (queue[0]) startQuickRound(queue[0]);
  }, [clearGameTimer]);

  const clearQuickTestResult = useCallback(() => {
    setQuickTest(prev => prev.status === 'finished'
      ? { ...prev, status: 'idle', currentGameId: null, currentGameTitle: '' }
      : prev);
  }, []);

  const resetProgress = useCallback(() => {
    setConfirmTitle('Reiniciar Progreso');
    setConfirmText('¿Estás seguro de que quieres reiniciar todo tu progreso? Esta acción no se puede deshacer.');
    setShowConfirmModal(true);
  }, []);

  const confirmReset = useCallback(() => {
    setScore(0);
    setConceptMastery({});
    testMistakesRef.current = {};
    resetProgressForPack(packIdRef.current);
    setShowConfirmModal(false);
  }, []);

  return {
    score,
    conceptMastery,
    activeGame,
    gameDifficulty,
    recommendedDifficulty,
    setGameDifficulty,
    quickTest,
    quickLeaderboard,
    gameContentRef,
    startGame,
    exitGame,
    startKnowledgeTest,
    startQuickTest,
    clearQuickTestResult,
    resetProgress,
    showConfirmModal,
    setShowConfirmModal,
    confirmTitle,
    confirmText,
    confirmReset,
    getPrioritizedConceptList,
    studyFocus,
    clearStudyFocus,
    gamesData,
    kb,
    activePack,
  };
}
