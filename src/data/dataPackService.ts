import { pokerKnowledgeBase, MultipleChoiceQuestion, PokerConcept, PathQuestion, TrueFalseQuestion } from '../components/training/pokerKnowledge';
import type { StudyGuide as EditableStudyGuide } from '../services/studyGuideService';
import {
  parseContent,
  parseSources,
  generateMultipleChoice,
  generatePathQuestions,
  generateTrueFalse,
  GAME_DATAPACK_PROMPT,
  GAME_DATAPACK_PROMPT_VERSION,
  type ConceptRelationship,
  type ConceptMapData,
  type CoverageMatrixItem,
  type DataPackSourceType,
  type ParsedDataPack,
  type ParsedDataPackMetadata,
  type ParsedDataPackSource,
  type RawDataPackSource,
  type StudyGuide,
  type StudyPlan,
} from './dataPackParser';

export interface DataPack {
  id: string;
  name: string;
  description: string;
  type: 'codex' | 'glossary' | 'strategy' | 'custom';
  sourceType?: DataPackSourceType;
  studyGuide?: StudyGuide;
  studyPlan?: StudyPlan;
  conceptMap?: ConceptMapData;
  coverageMatrix?: CoverageMatrixItem[];
  editableGuide?: EditableStudyGuide;
  sources?: ParsedDataPackSource[];
  concepts: PokerConcept[];
  multipleChoiceQuestions?: MultipleChoiceQuestion[];
  pathQuestions: PathQuestion[];
  trueFalseQuestions: TrueFalseQuestion[];
  relationships?: ConceptRelationship[];
  metadata?: ParsedDataPackMetadata;
  rawContent?: string;
  systemPrompt?: string;
  createdAt: string;
}

export interface DataPackGameCoverage {
  game: string;
  ready: boolean;
  detail: string;
}

export interface DataPackReviewReport {
  status: 'ready' | 'warning' | 'blocked';
  conceptCount: number;
  questionCount: number;
  sourceCount: number;
  categoryCount: number;
  categories: { name: string; count: number }[];
  coverage: DataPackGameCoverage[];
  warnings: string[];
  blockers: string[];
}

export interface DataPackDraft {
  pack: DataPack;
  report: DataPackReviewReport;
}

export interface StudyFocus {
  packId: string;
  title: string;
  conceptIds: string[];
  createdAt: string;
}

const LS_PACKS_KEY = 'pokercoach_datapacks';
const LS_ACTIVE_KEY = 'pokercoach_active_datapack';
const LS_PROGRESS_PREFIX = 'pokercoach_games_state_';
const LS_STUDY_FOCUS_KEY = 'pokercoach_study_focus';

let remotePacksCache: DataPack[] | null = null;

export function setStudyFocus(focus: Omit<StudyFocus, 'createdAt'>): void {
  localStorage.setItem(LS_STUDY_FOCUS_KEY, JSON.stringify({ ...focus, createdAt: new Date().toISOString() }));
  window.dispatchEvent(new CustomEvent('study-focus-changed', { detail: focus }));
}

export function getStudyFocusForPack(packId: string): StudyFocus | null {
  try {
    const raw = localStorage.getItem(LS_STUDY_FOCUS_KEY);
    if (!raw) return null;
    const focus = JSON.parse(raw) as StudyFocus;
    if (focus.packId !== packId || !focus.conceptIds?.length) return null;
    return focus;
  } catch {
    return null;
  }
}

export function clearStudyFocus(): void {
  localStorage.removeItem(LS_STUDY_FOCUS_KEY);
  window.dispatchEvent(new CustomEvent('study-focus-changed'));
}

function sanitizeId(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function compact(value: string, max: number): string {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : text.slice(0, max - 3).trim() + '...';
}

function buildShortDefinition(concept: PokerConcept): string {
  const base = concept.shortDefinition || concept.definition;
  const firstSentence = base.split(/[.!?]/)[0]?.trim() || base;
  return compact(firstSentence, 72);
}

function createMetadata(
  concepts: PokerConcept[],
  multipleChoiceQuestions: MultipleChoiceQuestion[],
  pathQuestions: PathQuestion[],
  trueFalseQuestions: TrueFalseQuestion[],
  relationships: ConceptRelationship[],
  sourceType?: DataPackSourceType,
  sourceCount = 1
): ParsedDataPackMetadata {
  const questionCount = multipleChoiceQuestions.length + pathQuestions.length + trueFalseQuestions.length;
  return {
    schemaVersion: 1,
    promptVersion: `${GAME_DATAPACK_PROMPT_VERSION}-normalized`,
    sourceType,
    sourceCount,
    conceptCount: concepts.length,
    questionCount,
    relationshipCount: relationships.length,
    quality: {
      density: concepts.length,
      hasEnoughConcepts: concepts.length >= 6,
      hasEnoughQuestions: questionCount >= concepts.length,
    },
  };
}

function buildPackId(): string {
  return `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getQuestionCount(pack: Pick<DataPack, 'multipleChoiceQuestions' | 'pathQuestions' | 'trueFalseQuestions'>): number {
  return (pack.multipleChoiceQuestions?.length || 0) + (pack.pathQuestions?.length || 0) + (pack.trueFalseQuestions?.length || 0);
}

function buildRawContentFromSources(sources: RawDataPackSource[]): string {
  return sources.map(source => `# ${source.title}\n\n${source.content}`).join('\n\n---\n\n');
}

function getCategoryCounts(concepts: PokerConcept[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const concept of concepts) {
    const category = concept.category || 'General';
    counts.set(category, (counts.get(category) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function conceptsByCategory(concepts: PokerConcept[]): { category: string; concepts: PokerConcept[] }[] {
  const groups = new Map<string, PokerConcept[]>();
  for (const concept of concepts) {
    const category = concept.category || 'Conceptos principales';
    groups.set(category, [...(groups.get(category) || []), concept]);
  }
  return Array.from(groups.entries()).map(([category, items]) => ({ category, concepts: items }));
}

function buildFallbackStudyPlan(parsed: ParsedDataPack, title = 'Plan de estudio'): StudyPlan {
  const concepts = parsed.concepts;
  const groups = conceptsByCategory(concepts);
  const summary = parsed.studyGuide?.summary || `Plan generado desde ${concepts.length} conceptos estructurados del documento.`;
  return {
    title: parsed.studyGuide?.title || title,
    objective: `Dominar las secciones principales y aplicar los conceptos clave del documento.`,
    summary,
    sections: groups.map((group, index) => ({
      id: `section-${sanitizeId(group.category) || index + 1}`,
      title: group.category,
      summary: `Bloque de estudio con ${group.concepts.length} conceptos relacionados: ${group.concepts.slice(0, 4).map(c => c.term).join(', ')}.`,
      keyIdeas: group.concepts.slice(0, 5).map(concept => concept.shortDefinition || concept.definition),
      mustMaster: group.concepts.slice(0, 5).map(concept => concept.term),
      conceptIds: group.concepts.map(concept => concept.id),
    })),
    glossary: concepts.map(concept => ({ term: concept.term, definition: concept.shortDefinition || concept.definition, conceptId: concept.id })),
    flashcards: concepts.map(concept => ({
      id: `flashcard-${concept.id}`,
      conceptId: concept.id,
      front: concept.term,
      back: concept.definition,
      example: concept.examples?.[0],
      application: concept.applications?.[0],
      relatedConceptIds: (parsed.relationships || []).filter(rel => rel.from === concept.id || rel.to === concept.id).map(rel => rel.from === concept.id ? rel.to : rel.from).slice(0, 4),
    })),
    practicalCases: groups.slice(0, 6).map((group, index) => ({
      id: `case-${index + 1}`,
      title: `Aplicar ${group.category}`,
      prompt: `Identifica cuándo usar los conceptos de ${group.category} y qué errores evitar.`,
      conceptIds: group.concepts.slice(0, 5).map(concept => concept.id),
    })),
    reviewQuestions: parsed.studyGuide?.reviewQuestions.map(item => ({ ...item })) || [],
    commonMistakes: concepts.flatMap(concept => (concept.mistakes || []).map(mistake => ({ title: concept.term, description: mistake, conceptIds: [concept.id] }))).slice(0, 20),
    comparisons: groups.filter(group => group.concepts.length >= 2).slice(0, 6).map(group => ({
      title: `Comparar conceptos de ${group.category}`,
      items: group.concepts.slice(0, 4).map(concept => concept.term),
      conceptIds: group.concepts.slice(0, 4).map(concept => concept.id),
    })),
    mustMaster: concepts.slice(0, 12).map(concept => concept.term),
    recommendedPath: groups.slice(0, 6).map((group, index) => ({
      id: `path-${index + 1}`,
      title: group.category,
      description: `Estudia ${group.concepts.slice(0, 3).map(concept => concept.term).join(', ')} y luego practica el bloque en juegos.`,
      conceptIds: group.concepts.map(concept => concept.id),
    })),
  };
}

function buildFallbackConceptMap(parsed: ParsedDataPack, rootLabel = 'DataPack'): ConceptMapData {
  const groups = conceptsByCategory(parsed.concepts);
  const nodes: ConceptMapData['nodes'] = [{ id: 'root', label: rootLabel, type: 'root' }];
  const edges: ConceptMapData['edges'] = [];
  for (const group of groups) {
    const sectionId = `section-${sanitizeId(group.category)}`;
    nodes.push({ id: sectionId, label: group.category, type: 'section', parentId: 'root' });
    edges.push({ id: `edge-root-${sectionId}`, from: 'root', to: sectionId });
    for (const concept of group.concepts) {
      const nodeId = `concept-${concept.id}`;
      nodes.push({ id: nodeId, label: concept.term, type: 'concept', parentId: sectionId, conceptId: concept.id });
      edges.push({ id: `edge-${sectionId}-${nodeId}`, from: sectionId, to: nodeId });
    }
  }
  return { rootId: 'root', nodes, edges };
}

function buildFallbackCoverageMatrix(parsed: ParsedDataPack): CoverageMatrixItem[] {
  if (parsed.sources?.length) {
    return parsed.sources.map(source => ({
      blockId: source.id,
      title: source.title || source.fileName,
      summary: `${source.characterCount} caracteres procesados.`,
      status: source.conceptIds.length > 0 ? 'used' : 'discarded',
      extractedConceptIds: source.conceptIds,
      reason: source.conceptIds.length > 0 ? 'Se extrajeron conceptos jugables de este bloque.' : 'No se detectaron conceptos suficientemente claros.',
      importance: source.conceptIds.length >= 6 ? 'high' : source.conceptIds.length > 0 ? 'medium' : 'low',
    }));
  }
  return conceptsByCategory(parsed.concepts).map(group => ({
    blockId: `block-${sanitizeId(group.category)}`,
    title: group.category,
    summary: `Bloque inferido por categoría con ${group.concepts.length} conceptos.`,
    status: 'used',
    extractedConceptIds: group.concepts.map(concept => concept.id),
    reason: 'Bloque creado como fallback desde categorías existentes.',
    importance: group.concepts.length >= 6 ? 'high' : 'medium',
  }));
}

export function reviewDataPack(pack: DataPack): DataPackReviewReport {
  const conceptCount = pack.concepts.length;
  const questionCount = getQuestionCount(pack);
  const categories = getCategoryCounts(pack.concepts);
  const sourceCount = pack.sources?.length || 1;
  const conceptsWithLongDefinition = pack.concepts.filter(concept => (concept.shortDefinition || concept.definition).split(/\s+/).length >= 4).length;
  const coverage: DataPackGameCoverage[] = [
    { game: 'Opción múltiple', ready: conceptCount >= 2 && (pack.multipleChoiceQuestions?.length || 0) >= conceptCount, detail: `${pack.multipleChoiceQuestions?.length || 0}/${conceptCount} preguntas` },
    { game: 'Verdadero/Falso', ready: conceptCount >= 2 && (pack.trueFalseQuestions?.length || 0) >= conceptCount, detail: `${pack.trueFalseQuestions?.length || 0}/${conceptCount} preguntas` },
    { game: 'Categorización', ready: categories.length >= 2, detail: `${categories.length} categorías` },
    { game: 'Memoria', ready: conceptCount >= 2, detail: `${conceptCount} pares posibles` },
    { game: 'Conecta Ideas', ready: conceptCount >= 2, detail: `${conceptCount} conexiones término-definición` },
    { game: 'Descifra', ready: conceptsWithLongDefinition >= Math.min(6, conceptCount), detail: `${conceptsWithLongDefinition}/${conceptCount} definiciones útiles` },
    { game: 'Camino Correcto', ready: conceptCount >= 3 && (pack.pathQuestions?.length || 0) >= Math.min(8, conceptCount), detail: `${pack.pathQuestions?.length || 0} pasos` },
    { game: 'Aventura', ready: conceptCount >= 6 && questionCount >= conceptCount, detail: `${questionCount} preguntas totales` },
  ];

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (conceptCount < 6) blockers.push('Necesita al menos 6 conceptos limpios para activar juegos.');
  if (questionCount < conceptCount) blockers.push('Necesita al menos una pregunta generada por concepto.');
  if (categories.length < 2) blockers.push('Necesita al menos 2 categorías para que Categorización funcione bien.');
  if (coverage.some(item => !item.ready)) blockers.push('No todos los juegos tienen datos mínimos de cobertura.');
  if (conceptCount < 10) warnings.push('El DataPack es pequeño; conviene subir una transcripción más completa si el curso tiene más contenido.');
  if (sourceCount > 1 && pack.sources?.some(source => source.conceptIds.length === 0)) warnings.push('Hay TXT sin conceptos detectados. Revisa si son intro, cierre o contenido mal transcrito.');
  if (pack.concepts.some(concept => !concept.examples?.length && !concept.applications?.length)) warnings.push('Algunos conceptos no tienen ejemplos o aplicaciones; los juegos funcionarán, pero el estudio será menos rico.');

  return {
    status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'ready',
    conceptCount,
    questionCount,
    sourceCount,
    categoryCount: categories.length,
    categories,
    coverage,
    warnings,
    blockers,
  };
}

function normalizeParsedDataPack(parsed: ParsedDataPack, sourceType?: DataPackSourceType): ParsedDataPack {
  const seen = new Set<string>();
  const concepts = parsed.concepts
    .map((concept, index) => {
      const term = compact(concept.term, 48);
      const id = sanitizeId(concept.id || term) || `concept-${index + 1}`;
      return {
        ...concept,
        id,
        term,
        definition: compact(concept.definition, 220),
        shortDefinition: buildShortDefinition(concept),
        category: compact(concept.category || 'General', 36),
        examples: (concept.examples || []).map(item => compact(item, 120)).filter(Boolean).slice(0, 3),
        mistakes: (concept.mistakes || []).map(item => compact(item, 120)).filter(Boolean).slice(0, 3),
        applications: (concept.applications || []).map(item => compact(item, 120)).filter(Boolean).slice(0, 3),
      };
    })
    .filter(concept => {
      if (!concept.term || !concept.definition || concept.definition.length < 12) return false;
      if (concept.term.split(' ').length > 6) return false;
      if (seen.has(concept.id)) return false;
      seen.add(concept.id);
      return true;
    });

  const conceptIds = new Set(concepts.map(concept => concept.id));
  const relationships = (parsed.relationships || [])
    .filter(rel => conceptIds.has(rel.from) && conceptIds.has(rel.to) && rel.from !== rel.to)
    .map(rel => ({ ...rel, reason: compact(rel.reason, 120) }))
    .slice(0, 80);

  const multipleChoiceQuestions = generateMultipleChoice(concepts);
  const pathQuestions = generatePathQuestions(concepts);
  const trueFalseQuestions = generateTrueFalse(concepts);
  const normalizedBase = { ...parsed, concepts, relationships };
  const studyPlan = parsed.studyPlan?.sections?.length ? parsed.studyPlan : buildFallbackStudyPlan(normalizedBase, parsed.studyGuide?.title || 'Plan de estudio');
  const conceptMap = parsed.conceptMap?.nodes?.length ? parsed.conceptMap : buildFallbackConceptMap(normalizedBase, studyPlan.title);
  const coverageMatrix = parsed.coverageMatrix?.length ? parsed.coverageMatrix : buildFallbackCoverageMatrix(normalizedBase);

  return {
    ...parsed,
    concepts,
    studyPlan,
    conceptMap,
    coverageMatrix,
    multipleChoiceQuestions,
    pathQuestions,
    trueFalseQuestions,
    relationships,
    metadata: createMetadata(
      concepts,
      multipleChoiceQuestions,
      pathQuestions,
      trueFalseQuestions,
      relationships,
      sourceType,
      parsed.sources?.length || 1
    ),
  };
}

function assertReadyForGames(parsed: ParsedDataPack): void {
  if (parsed.concepts.length < 6) {
    throw new Error('El DataPack no tiene suficientes conceptos limpios para juegos.');
  }
  if (!parsed.multipleChoiceQuestions?.length || !parsed.pathQuestions.length || !parsed.trueFalseQuestions.length) {
    throw new Error('El DataPack no pudo generar preguntas internas para todos los juegos.');
  }
}

function assertReportReady(report: DataPackReviewReport): void {
  if (report.blockers.length > 0) {
    throw new Error(report.blockers[0]);
  }
}

function buildDataPackDraft(
  name: string,
  description: string,
  sourceType: DataPackSourceType | undefined,
  sources: RawDataPackSource[] | undefined,
  parsed: ParsedDataPack,
  type: DataPack['type'],
  rawContent?: string
): DataPackDraft {
  const ready = normalizeParsedDataPack(parsed, sourceType);
  const pack: DataPack = {
    id: buildPackId(),
    name,
    description,
    type,
    sourceType,
    studyGuide: ready.studyGuide,
    studyPlan: ready.studyPlan,
    conceptMap: ready.conceptMap,
    coverageMatrix: ready.coverageMatrix,
    sources: ready.sources,
    concepts: ready.concepts,
    multipleChoiceQuestions: ready.multipleChoiceQuestions,
    pathQuestions: ready.pathQuestions,
    trueFalseQuestions: ready.trueFalseQuestions,
    relationships: ready.relationships,
    metadata: ready.metadata,
    rawContent: sources ? buildRawContentFromSources(sources) : rawContent,
    systemPrompt: GAME_DATAPACK_PROMPT,
    createdAt: new Date().toISOString().split('T')[0],
  };
  const report = reviewDataPack(pack);
  return { pack, report };
}

export function getBuiltInCodex(): DataPack {
  return {
    id: 'codex-poker',
    name: 'Codex de Estudio',
    description: 'Conceptos de ejemplo incluidos en la app.',
    type: 'codex',
    concepts: pokerKnowledgeBase.concepts,
    multipleChoiceQuestions: undefined,
    pathQuestions: pokerKnowledgeBase.pathQuestions,
    trueFalseQuestions: pokerKnowledgeBase.trueFalseQuestions,
    createdAt: '2026-01-01',
  };
}

export function getTestDataPack(): DataPack {
  const testConcepts: PokerConcept[] = [
    { id: 'test-vpip', term: 'VPIP', definition: 'Voluntarily Put money In Pot. Porcentaje de manos en las que un jugador pone dinero voluntariamente preflop.', shortDefinition: '% manos jugadas preflop', category: 'Stats' },
    { id: 'test-pfr', term: 'PFR', definition: 'Pre-Flop Raise. Porcentaje de manos en las que un jugador hace raise preflop.', shortDefinition: '% raises preflop', category: 'Stats' },
    { id: 'test-3bet', term: '3-Bet', definition: 'La tercera apuesta en una ronda, generalmente un re-raise preflop.', shortDefinition: 'Re-raise preflop', category: 'Agresividad' },
    { id: 'test-cbet', term: 'C-Bet', definition: 'Continuation Bet. Apuesta del agresor preflop en el flop.', shortDefinition: 'Apuesta del agresor en flop', category: 'Postflop' },
    { id: 'test-equity', term: 'Equity', definition: 'Porcentaje del bote que te corresponde según la probabilidad de ganar.', shortDefinition: '% del bote que te toca', category: 'Matemáticas' },
    { id: 'test-fold-equity', term: 'Fold Equity', definition: 'Valor adicional que ganas cuando tu apuesta hace que el oponente foldee.', shortDefinition: 'Valor cuando rival foldea', category: 'Matemáticas' },
    { id: 'test-position', term: 'Posición', definition: 'Tu ubicación relativa al dealer. Actuar último es ventaja.', shortDefinition: 'Actuar último = ventaja', category: 'Fundamento' },
    { id: 'test-range', term: 'Rango', definition: 'Conjunto de manos que un jugador puede tener en una situación dada.', shortDefinition: 'Manos posibles en situación', category: 'Fundamento' },
  ];
  const testTF: TrueFalseQuestion[] = [
    { statement: 'VPIP mide el porcentaje de manos en las que un jugador pone dinero voluntariamente.', answer: true, concept: 'test-vpip' },
    { statement: 'PFR mide el porcentaje de calls preflop.', answer: false, concept: 'test-pfr' },
    { statement: 'Un 3-Bet es la tercera apuesta en una ronda.', answer: true, concept: 'test-3bet' },
    { statement: 'C-Bet es la apuesta del agresor preflop en el flop.', answer: true, concept: 'test-cbet' },
    { statement: 'Equity es el dinero que pierdes en cada mano.', answer: false, concept: 'test-equity' },
    { statement: 'Fold Equity es el valor que ganas cuando el oponente foldea.', answer: true, concept: 'test-fold-equity' },
    { statement: 'Actuar primero postflop es una ventaja.', answer: false, concept: 'test-position' },
    { statement: 'Rango es el conjunto de manos posibles en una situación.', answer: true, concept: 'test-range' },
  ];
  const testPath: PathQuestion[] = [
    { question: '¿Qué stat mide la agresividad preflop?', options: ['PFR', 'VPIP', 'W$SD'], answer: 'PFR', concept: 'test-pfr' },
    { question: '¿Qué es un C-Bet?', options: ['Apuesta del agresor en flop', 'Call en el turn', 'Raise en river'], answer: 'Apuesta del agresor en flop', concept: 'test-cbet' },
    { question: '¿Qué ventaja da la posición?', options: ['Actuar último con más info', 'Ver las cartas del rival', 'Ganar automáticamente'], answer: 'Actuar último con más info', concept: 'test-position' },
    { question: '¿Qué es Fold Equity?', options: ['Valor cuando el rival foldea', 'Dinero perdido', 'Bonus del casino'], answer: 'Valor cuando el rival foldea', concept: 'test-fold-equity' },
  ];
  return {
    id: 'test-pack',
    name: 'Glosario Test',
    description: 'DataPack de prueba con 8 conceptos para verificar que los juegos funcionan.',
    type: 'codex',
    concepts: testConcepts,
    multipleChoiceQuestions: undefined,
    pathQuestions: testPath,
    trueFalseQuestions: testTF,
    createdAt: '2026-01-01',
  };
}

function loadPacks(): DataPack[] {
  if (remotePacksCache) return remotePacksCache;
  try {
    const raw = localStorage.getItem(LS_PACKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePacks(packs: DataPack[]): void {
  remotePacksCache = packs;
  localStorage.setItem(LS_PACKS_KEY, JSON.stringify(packs));
}

function dbToDataPack(data: any): DataPack {
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    type: data.type || 'custom',
    sourceType: data.source_type,
    studyGuide: data.study_guide,
    studyPlan: data.study_plan,
    conceptMap: data.concept_map,
    coverageMatrix: data.coverage_matrix,
    editableGuide: data.editable_guide,
    sources: data.sources,
    concepts: data.concepts || [],
    multipleChoiceQuestions: data.multiple_choice_questions || [],
    pathQuestions: data.path_questions || [],
    trueFalseQuestions: data.true_false_questions || [],
    relationships: data.relationships || [],
    metadata: data.metadata,
    rawContent: data.raw_content,
    systemPrompt: data.system_prompt,
    createdAt: data.created_at,
  };
}

function dataPackToDb(pack: DataPack): Record<string, unknown> {
  return {
    name: pack.name,
    description: pack.description,
    type: pack.type,
    source_type: pack.sourceType,
    study_guide: pack.studyGuide,
    study_plan: pack.studyPlan,
    concept_map: pack.conceptMap,
    coverage_matrix: pack.coverageMatrix,
    editable_guide: pack.editableGuide,
    sources: pack.sources || [],
    concepts: pack.concepts || [],
    multiple_choice_questions: pack.multipleChoiceQuestions || [],
    path_questions: pack.pathQuestions || [],
    true_false_questions: pack.trueFalseQuestions || [],
    relationships: pack.relationships || [],
    metadata: pack.metadata,
    raw_content: pack.rawContent,
    system_prompt: pack.systemPrompt,
  };
}

export async function refreshDataPacks(): Promise<DataPack[]> {
  const { supabaseDatapacks } = await import('../lib/supabase');
  const { data, error } = await supabaseDatapacks
    .from('datapacks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading DataPacks from Supabase:', error);
    throw new Error(`Error al cargar DataPacks desde Supabase: ${error.message}`);
  }

  const remotePacks = (data || []).map(dbToDataPack);
  if (!remotePacks.find(p => p.id === 'codex-poker')) remotePacks.unshift(getBuiltInCodex());
  if (!remotePacks.find(p => p.id === 'test-pack')) remotePacks.push(getTestDataPack());
  savePacks(remotePacks);
  return remotePacks;
}

function ensureBuiltIn(): DataPack[] {
  const packs = loadPacks();
  if (!packs.find(p => p.id === 'codex-poker')) {
    const builtIn = getBuiltInCodex();
    packs.unshift(builtIn);
  }
  if (!packs.find(p => p.id === 'test-pack')) {
    const testPack = getTestDataPack();
    packs.push(testPack);
  }
  savePacks(packs);
  return packs;
}

export function getAllDataPacks(): DataPack[] {
  return ensureBuiltIn();
}

export function getActiveDataPack(): DataPack | null {
  const packs = ensureBuiltIn();
  const activeId = localStorage.getItem(LS_ACTIVE_KEY);
  if (activeId) {
    const pack = packs.find(p => p.id === activeId);
    if (pack) return pack;
  }
  localStorage.setItem(LS_ACTIVE_KEY, 'codex-poker');
  return packs.find(p => p.id === 'codex-poker') || null;
}

export function setActiveDataPack(id: string): void {
  localStorage.setItem(LS_ACTIVE_KEY, id);
  window.dispatchEvent(new CustomEvent('datapack-changed', { detail: { id } }));
}

export function updateDataPack(updatedPack: DataPack): DataPack {
  if (updatedPack.type === 'codex') {
    throw new Error('Los DataPacks incluidos no se pueden editar.');
  }
  const packs = ensureBuiltIn();
  const index = packs.findIndex(pack => pack.id === updatedPack.id);
  if (index < 0) throw new Error('No se encontro el DataPack para editar.');
  packs[index] = updatedPack;
  savePacks(packs);
  void updateDataPackAsync(updatedPack);
  window.dispatchEvent(new CustomEvent('datapack-changed', { detail: { id: updatedPack.id } }));
  return updatedPack;
}

export async function updateDataPackAsync(updatedPack: DataPack): Promise<DataPack> {
  if (updatedPack.type === 'codex') {
    throw new Error('Los DataPacks incluidos no se pueden editar.');
  }
  const { supabaseDatapacks } = await import('../lib/supabase');
  const { data, error } = await supabaseDatapacks
    .from('datapacks')
    .update(dataPackToDb(updatedPack))
    .eq('id', updatedPack.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating datapack in Supabase:', error);
    throw new Error(`Error al actualizar el DataPack en la base de datos: ${error.message}`);
  }
  const pack = dbToDataPack(data);
  const packs = ensureBuiltIn();
  const index = packs.findIndex(item => item.id === pack.id);
  if (index >= 0) packs[index] = pack;
  savePacks(packs);
  return pack;
}

export function createDataPack(
  name: string,
  description: string,
  rawContent: string,
  format: 'md' | 'json' | 'auto' = 'auto'
): DataPack {
  return saveDataPackDraft(prepareDataPack(name, description, rawContent, format));
}

export function prepareDataPack(
  name: string,
  description: string,
  rawContent: string,
  format: 'md' | 'json' | 'auto' = 'auto'
): DataPackDraft {
  return buildDataPackDraft(name, description, undefined, undefined, parseContent(rawContent, format), format === 'json' ? 'custom' : 'glossary', rawContent);
}

export function createDataPackFromSources(
  name: string,
  description: string,
  sourceType: DataPackSourceType,
  sources: RawDataPackSource[]
): DataPack {
  return saveDataPackDraft(prepareDataPackFromSources(name, description, sourceType, sources));
}

export function prepareDataPackFromSources(
  name: string,
  description: string,
  sourceType: DataPackSourceType,
  sources: RawDataPackSource[]
): DataPackDraft {
  return buildDataPackDraft(name, description, sourceType, sources, parseSources(sources, sourceType), 'custom');
}

export function createDataPackFromParsed(
  name: string,
  description: string,
  sourceType: DataPackSourceType,
  sources: RawDataPackSource[],
  parsed: ParsedDataPack
): DataPack {
  return saveDataPackDraft(prepareDataPackFromParsed(name, description, sourceType, sources, parsed));
}

export function prepareDataPackFromParsed(
  name: string,
  description: string,
  sourceType: DataPackSourceType,
  sources: RawDataPackSource[],
  parsed: ParsedDataPack
): DataPackDraft {
  return buildDataPackDraft(name, description, sourceType, sources, parsed, 'custom');
}

export async function saveDataPackDraftAsync(draft: DataPackDraft): Promise<DataPack> {
  assertReportReady(draft.report);
  return saveDataPackDraftAllowIncompleteAsync(draft);
}

export async function saveDataPackDraftAllowIncompleteAsync(draft: DataPackDraft): Promise<DataPack> {
  const supabaseDatapacks = (await import('../lib/supabase')).supabaseDatapacks;
  
  const pack = draft.pack;
  const dbData = dataPackToDb(pack);

  const { data, error } = await supabaseDatapacks
    .from('datapacks')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error('Error saving datapack to Supabase:', error);
    throw new Error(`Error al guardar el DataPack en la base de datos: ${error.message}`);
  }

  const savedPack = dbToDataPack(data);
  const packs = ensureBuiltIn().filter(item => item.id !== savedPack.id);
  packs.unshift(savedPack);
  savePacks(packs);
  window.dispatchEvent(new CustomEvent('datapack-changed', { detail: { id: data.id } }));
  
  return savedPack;
}

export function saveDataPackDraft(draft: DataPackDraft): DataPack {
  assertReportReady(draft.report);
  return saveDataPackDraftAllowIncomplete(draft);
}

export function saveDataPackDraftAllowIncomplete(draft: DataPackDraft): DataPack {
  const packs = ensureBuiltIn();
  const pack = draft.pack;
  packs.push(pack);
  savePacks(packs);
  
  // Guardar en Supabase de forma asíncrona (fire and forget)
  saveDataPackDraftAllowIncompleteAsync(draft).catch(err => {
    console.error('Error saving to Supabase:', err);
  });
  
  return pack;
}

export function deleteDataPack(id: string): void {
  if (id === 'codex-poker') return;
  const packs = loadPacks().filter(p => p.id !== id);
  savePacks(packs);
  void deleteDataPackAsync(id);
  const activeId = localStorage.getItem(LS_ACTIVE_KEY);
  if (activeId === id) {
    localStorage.setItem(LS_ACTIVE_KEY, 'codex-poker');
    window.dispatchEvent(new CustomEvent('datapack-changed', { detail: { id: 'codex-poker' } }));
  }
  localStorage.removeItem(LS_PROGRESS_PREFIX + id);
}

export async function deleteDataPackAsync(id: string): Promise<void> {
  if (id === 'codex-poker' || id === 'test-pack') return;
  const { supabaseDatapacks } = await import('../lib/supabase');
  const { error } = await supabaseDatapacks
    .from('datapacks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting datapack from Supabase:', error);
    throw new Error(`Error al eliminar el DataPack en la base de datos: ${error.message}`);
  }

  const packs = loadPacks().filter(p => p.id !== id);
  savePacks(packs);
  const activeId = localStorage.getItem(LS_ACTIVE_KEY);
  if (activeId === id) {
    localStorage.setItem(LS_ACTIVE_KEY, 'codex-poker');
    window.dispatchEvent(new CustomEvent('datapack-changed', { detail: { id: 'codex-poker' } }));
  } else {
    window.dispatchEvent(new CustomEvent('datapack-changed', { detail: { id } }));
  }
  localStorage.removeItem(LS_PROGRESS_PREFIX + id);
}

export function deleteDataPacksFromFile(fileName: string): void {
  const packs = loadPacks();
  const normalizedFileName = fileName.toLowerCase();
  const toDelete = packs.filter(pack =>
    pack.type !== 'codex' &&
    pack.sources?.some(source => source.fileName.toLowerCase() === normalizedFileName)
  );

  if (toDelete.length === 0) return;

  const deleteIds = new Set(toDelete.map(pack => pack.id));
  savePacks(packs.filter(pack => !deleteIds.has(pack.id)));

  for (const id of deleteIds) {
    localStorage.removeItem(LS_PROGRESS_PREFIX + id);
  }

  const activeId = localStorage.getItem(LS_ACTIVE_KEY);
  if (activeId && deleteIds.has(activeId)) {
    localStorage.setItem(LS_ACTIVE_KEY, 'codex-poker');
    window.dispatchEvent(new CustomEvent('datapack-changed', { detail: { id: 'codex-poker' } }));
  }
}

export interface ConceptMasteryState {
  score: number;
  attempts?: number;
  correct?: number;
  incorrect?: number;
  averageResponseMs?: number;
  streak?: number;
  lastResult?: 'correct' | 'incorrect' | 'timeout';
  lastPracticedAt?: string;
}

export interface DataPackProgress {
  score: number;
  conceptMastery: Record<string, ConceptMasteryState>;
}

export interface ConceptLearningEvent {
  isCorrect: boolean;
  responseMs?: number;
  timedOut?: boolean;
  source?: 'game' | 'study';
}

export function applyConceptLearningEvent(
  conceptMastery: Record<string, ConceptMasteryState>,
  conceptId: string,
  event: ConceptLearningEvent
): Record<string, ConceptMasteryState> {
  if (!conceptId) return conceptMastery;
  const current = conceptMastery[conceptId] || { score: 45, attempts: 0, correct: 0, incorrect: 0, streak: 0 };
  const attempts = (current.attempts || 0) + 1;
  const correct = (current.correct || 0) + (event.isCorrect ? 1 : 0);
  const incorrect = (current.incorrect || 0) + (event.isCorrect ? 0 : 1);
  const previousAverage = current.averageResponseMs || event.responseMs || 0;
  const averageResponseMs = event.responseMs
    ? Math.round(((previousAverage * (attempts - 1)) + event.responseMs) / attempts)
    : previousAverage;
  const streak = event.isCorrect ? (current.streak || 0) + 1 : 0;
  const speedBonus = event.responseMs
    ? event.responseMs <= 5000 ? 6 : event.responseMs <= 10000 ? 3 : event.responseMs <= 16000 ? 0 : -4
    : 0;
  const delta = event.timedOut
    ? -24
    : event.isCorrect
      ? 10 + speedBonus + Math.min(6, streak)
      : -16 + speedBonus;
  const score = Math.max(0, Math.min(100, Math.round((current.score ?? 45) + delta)));

  return {
    ...conceptMastery,
    [conceptId]: {
      ...current,
      score,
      attempts,
      correct,
      incorrect,
      averageResponseMs,
      streak,
      lastResult: event.timedOut ? 'timeout' : event.isCorrect ? 'correct' : 'incorrect',
      lastPracticedAt: new Date().toISOString(),
    },
  };
}

export function recordConceptLearningEvent(packId: string, conceptId: string, event: ConceptLearningEvent): DataPackProgress {
  const progress = getProgressForPack(packId);
  const conceptMastery = applyConceptLearningEvent(progress.conceptMastery, conceptId, event);
  saveProgressForPack(packId, progress.score, conceptMastery);
  return { ...progress, conceptMastery };
}

export function getProgressForPack(packId: string): DataPackProgress {
  try {
    const raw = localStorage.getItem(LS_PROGRESS_PREFIX + packId);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        score: data.score || 0,
        conceptMastery: data.conceptMastery || {},
      };
    }
  } catch { /* ignore */ }
  return { score: 0, conceptMastery: {} };
}

export function saveProgressForPack(
  packId: string,
  score: number,
  conceptMastery: Record<string, ConceptMasteryState>
): void {
  localStorage.setItem(LS_PROGRESS_PREFIX + packId, JSON.stringify({ score, conceptMastery }));
}

export function resetProgressForPack(packId: string): void {
  localStorage.removeItem(LS_PROGRESS_PREFIX + packId);
}
