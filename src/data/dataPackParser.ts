import { MultipleChoiceQuestion, PokerConcept, PathQuestion, TrueFalseQuestion } from '../components/training/pokerKnowledge';

export type DataPackSourceType = 'single-video' | 'course';

export interface RawDataPackSource {
  id: string;
  order: number;
  fileName: string;
  title: string;
  content: string;
}

export interface ParsedDataPackSource {
  id: string;
  order: number;
  fileName: string;
  title: string;
  conceptIds: string[];
  characterCount: number;
}

export interface ConceptRelationship {
  from: string;
  to: string;
  type: 'related' | 'prerequisite' | 'contrast' | string;
  reason: string;
  title?: string;
  conceptA?: string;
  relation?: string;
  conceptB?: string;
  whyItMatters?: string;
  memoryKey?: string;
}

export interface ParsedDataPackMetadata {
  schemaVersion: 1;
  promptVersion: string;
  sourceType?: DataPackSourceType;
  sourceCount: number;
  conceptCount: number;
  questionCount: number;
  relationshipCount: number;
  quality: {
    density: number;
    hasEnoughConcepts: boolean;
    hasEnoughQuestions: boolean;
  };
}

export interface StudyGuide {
  title: string;
  summary: string;
  sections: { title: string; content: string[] }[];
  classificationTables: { title: string; headers: string[]; rows: string[][] }[];
  glossary: { term: string; definition: string }[];
  reviewQuestions: { question: string; answer: string }[];
  essayPrompts: string[];
}

export interface StudyPlanSection {
  id: string;
  title: string;
  summary: string;
  keyIdeas: string[];
  mustMaster: string[];
  conceptIds: string[];
}

export interface StudyPlanStep {
  id: string;
  title: string;
  description: string;
  conceptIds: string[];
}

export interface StudyPlan {
  title: string;
  objective: string;
  summary: string;
  sections: StudyPlanSection[];
  glossary: { term: string; definition: string; conceptId?: string }[];
  flashcards: { id: string; conceptId: string; front: string; back: string; example?: string; application?: string; relatedConceptIds?: string[] }[];
  practicalCases: { id: string; title: string; prompt: string; conceptIds: string[] }[];
  reviewQuestions: { question: string; answer: string; conceptIds?: string[] }[];
  commonMistakes: { title: string; description: string; conceptIds: string[] }[];
  comparisons: { title: string; items: string[]; conceptIds: string[] }[];
  mustMaster: string[];
  recommendedPath: StudyPlanStep[];
}

export interface ConceptMapData {
  rootId: string;
  nodes: { id: string; label: string; type: 'root' | 'section' | 'concept'; parentId?: string; conceptId?: string }[];
  edges: { id: string; from: string; to: string; label?: string }[];
}

export interface CoverageMatrixItem {
  blockId: string;
  title: string;
  summary: string;
  status: 'used' | 'partially_used' | 'discarded';
  extractedConceptIds: string[];
  reason: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface ParsedDataPack {
  studyGuide?: StudyGuide;
  studyPlan?: StudyPlan;
  conceptMap?: ConceptMapData;
  coverageMatrix?: CoverageMatrixItem[];
  concepts: PokerConcept[];
  multipleChoiceQuestions?: MultipleChoiceQuestion[];
  pathQuestions: PathQuestion[];
  trueFalseQuestions: TrueFalseQuestion[];
  sources?: ParsedDataPackSource[];
  relationships?: ConceptRelationship[];
  metadata?: ParsedDataPackMetadata;
}

export const GAME_DATAPACK_PROMPT_VERSION = 'game-datapack-prompt-v1';

export const GAME_DATAPACK_PROMPT = `Eres un transformador de conocimiento educativo para una app de entrenamiento.

Tu unica tarea es convertir transcripciones TXT en un DataPack profesional, estructurado y jugable.

Tipos permitidos:
- single-video: 1 archivo TXT de un video.
- course: varios TXT numerados que forman un curso.

Objetivo:
Convertir texto desordenado en datos de aprendizaje reutilizables por juegos, quizzes, mapas, rutas, memoria, relaciones y futuros modulos.

Principio principal:
La app es dinamica. No asumas que el contenido es poker, matematicas, idiomas o cualquier dominio especifico. Primero detecta el dominio del texto y crea una taxonomia propia basada en ese contenido.

Contrato de salida JSON:
{
  "schemaVersion": 1,
  "title": "string",
  "sourceType": "single-video | course",
  "studyGuide": {
    "title": "string",
    "summary": "string",
    "sections": [{ "title": "string", "content": ["string"] }],
    "classificationTables": [{ "title": "string", "headers": ["string"], "rows": [["string"]] }],
    "glossary": [{ "term": "string", "definition": "string" }],
    "reviewQuestions": [{ "question": "string", "answer": "string" }],
    "essayPrompts": ["string"]
  },
  "studyPlan": {
    "title": "string",
    "objective": "string",
    "summary": "string",
    "sections": [{ "id": "string", "title": "string", "summary": "string", "keyIdeas": ["string"], "mustMaster": ["string"], "conceptIds": ["conceptId"] }],
    "glossary": [{ "term": "string", "definition": "string", "conceptId": "conceptId" }],
    "flashcards": [{ "id": "string", "conceptId": "conceptId", "front": "string", "back": "string", "example": "string", "application": "string", "relatedConceptIds": ["conceptId"] }],
    "practicalCases": [{ "id": "string", "title": "string", "prompt": "string", "conceptIds": ["conceptId"] }],
    "reviewQuestions": [{ "question": "string", "answer": "string", "conceptIds": ["conceptId"] }],
    "commonMistakes": [{ "title": "string", "description": "string", "conceptIds": ["conceptId"] }],
    "comparisons": [{ "title": "string", "items": ["string"], "conceptIds": ["conceptId"] }],
    "mustMaster": ["string"],
    "recommendedPath": [{ "id": "string", "title": "string", "description": "string", "conceptIds": ["conceptId"] }]
  },
  "conceptMap": {
    "rootId": "root",
    "nodes": [{ "id": "string", "label": "string", "type": "root | section | concept", "parentId": "string", "conceptId": "conceptId" }],
    "edges": [{ "id": "string", "from": "string", "to": "string", "label": "string" }]
  },
  "coverageMatrix": [{ "blockId": "string", "title": "string", "summary": "string", "status": "used | partially_used | discarded", "extractedConceptIds": ["conceptId"], "reason": "string", "importance": "low | medium | high | critical" }],
  "sources": [{ "id": "string", "order": number, "fileName": "string", "title": "string" }],
  "concepts": [{
    "id": "string",
    "term": "string",
    "definition": "string",
    "shortDefinition": "string",
    "category": "string",
    "sourceId": "string",
    "sourceTitle": "string",
    "examples": ["string"],
    "mistakes": ["string"],
    "applications": ["string"]
  }],
  "multipleChoiceQuestions": [],
  "trueFalseQuestions": [],
  "pathQuestions": [],
  "relationships": [{ "from": "conceptId", "to": "conceptId", "type": "related | prerequisite | contrast | relation label", "reason": "string", "title": "string", "conceptA": "string", "relation": "string", "conceptB": "string", "whyItMatters": "string", "memoryKey": "string" }]
}

Reglas:
- No hagas resumen superficial. Extrae conocimiento accionable.
- No fuerces categorias predefinidas. Las categorias deben salir del documento.
- Si hay varios archivos, analiza cada TXT por separado, conserva el orden y triangula el curso completo.
- Fusiona conceptos repetidos y conserva la mejor definicion final.
- No inventes conocimiento fuera del texto.
- No dupliques conceptos con nombres ligeramente distintos.
- Las preguntas deben ser claras, jugables y tener una unica respuesta correcta.
- Cada concepto debe poder entrenarse solo: termino claro, definicion clara, categoria, definicion corta.
- Conserva terminos compuestos completos. No dividas nombres por espacios o guiones internos: "Semi Fish", "Agro-Caller", "Bet When Missed" son un solo concepto si el texto los usa asi.
- No generes preguntas salvo que sean imprescindibles. La app genera preguntas desde concepts.
- Prioriza un plan de estudio completo: secciones, ideas clave, ruta recomendada, mapa conceptual, glosario, flashcards, casos practicos, errores, comparaciones, relaciones y matriz de cobertura.
- Las relationships alimentan la seccion Relaciones: no son resumenes ni definiciones aisladas. Deben conectar conceptos como Concepto A -> relacion -> Concepto B.
- No uses relaciones genericas como "se relaciona con", "related" o "conecta con". Especifica el vinculo real.
- Cada relationship debe explicar por que importa en una linea y una clave corta para recordarla.
- Detecta relaciones reales del documento: pertenece a, es parte de, se compone de, causa, produce, requiere, depende de, se diferencia de, contrasta con, sirve para, ayuda a, ocurre antes de, ocurre despues de, se usa en.
- Si hay pocas relaciones claras, genera pocas pero buenas. No inventes relaciones.
- Recomendado: 8 a 15 relationships como maximo util por documento.
- La matriz de cobertura debe demostrar que bloques importantes del TXT fueron usados o justificar si se descartaron.
- Mantén el JSON compacto. No copies parrafos largos ni transcripcion literal.
- Devuelve solo JSON valido. Sin markdown. Sin explicaciones fuera del JSON.`;

function sanitizeId(term: string): string {
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function generateShortDefinition(definition: string): string {
  const sentences = definition.split(/[.!?]/).filter(s => s.trim().length > 0);
  if (sentences.length <= 1) return definition.length <= 90 ? definition : definition.slice(0, 87).trim() + '...';
  const firstTwo = sentences.slice(0, 2).map(s => s.trim()).join('. ');
  if (firstTwo.length <= 90) return firstTwo;
  return sentences[0].trim();
}

function compactDefinition(definition: string): string {
  const clean = normalizeWhitespace(definition);
  if (clean.length <= 260) return clean;
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  let compact = '';
  for (const sentence of sentences) {
    if ((compact + ' ' + sentence).trim().length > 260) break;
    compact = (compact + ' ' + sentence).trim();
  }
  return compact || clean.slice(0, 257).trim() + '...';
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/\[[^\]]{1,40}\]/g, ' ')
    .replace(/\(?\b\d{1,2}:\d{2}(?::\d{2})?\b\)?/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function createMetadata(
  concepts: PokerConcept[],
  multipleChoiceQuestions: MultipleChoiceQuestion[],
  pathQuestions: PathQuestion[],
  trueFalseQuestions: TrueFalseQuestion[],
  relationships: ConceptRelationship[],
  sourceCount: number,
  totalCharacters: number,
  sourceType?: DataPackSourceType
): ParsedDataPackMetadata {
  const questionCount = multipleChoiceQuestions.length + pathQuestions.length + trueFalseQuestions.length;
  const density = totalCharacters > 0 ? Number((concepts.length / Math.max(1, totalCharacters / 1000)).toFixed(2)) : 0;
  return {
    schemaVersion: 1,
    promptVersion: GAME_DATAPACK_PROMPT_VERSION,
    sourceType,
    sourceCount,
    conceptCount: concepts.length,
    questionCount,
    relationshipCount: relationships.length,
    quality: {
      density,
      hasEnoughConcepts: concepts.length >= 8,
      hasEnoughQuestions: questionCount >= Math.min(10, concepts.length),
    },
  };
}

function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .slice(0, 8)
    .map(word => word.length <= 3 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/^\w/, c => c.toUpperCase());
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/define|definici[oó]n|significa|concepto|qu[eé] es/.test(lower)) return 'Concepto Base';
  if (/tipo|perfil|categor[ií]a|clasificaci[oó]n|grupo/.test(lower)) return 'Clasificación';
  if (/m[eé]trica|estad[ií]stica|porcentaje|indicador|valor|intervalo|escala/.test(lower)) return 'Métrica';
  if (/estrategia|adaptaci[oó]n|recomendaci[oó]n|regla|paso|m[eé]todo/.test(lower)) return 'Estrategia';
  if (/error|fallo|evita|incorrecto|problema/.test(lower)) return 'Errores';
  if (/ejemplo|caso|supongamos|imagina/.test(lower)) return 'Ejemplo';
  return 'General';
}

function getTermFromSentence(sentence: string): string | null {
  const patterns = [
    /^(.{3,70}?)\s+(?:es|son|significa|consiste en|se refiere a|representa|mide)\s+/i,
    /(?:cuando hablamos de|si hablamos de|la idea de|el concepto de)\s+(.{3,60}?)(?:\s+es|\s+significa|\s+consiste|,|\.)/i,
    /(?:concepto de|idea de|principio de|regla de)\s+(.{3,60}?)(?:\s+es|\s+significa|\s+consiste|,|\.)/i,
    /^(.{3,60}?)\s*[:–—-]\s+.{12,}/,
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match?.[1]) {
      const term = match[1]
        .replace(/^(entonces|porque|cuando|si|pero|y|la|el|los|las|un|una)\s+/i, '')
        .replace(/["'“”]/g, '')
        .trim();
      if (term.length >= 3 && term.length <= 70 && !/[.!?]$/.test(term)) return titleCase(term);
    }
  }

  const acronym = sentence.match(/\b([A-ZÁÉÍÓÚÑ]{2,8}|[A-Z]{1,4}\$?[A-Z]{1,4})\b/);
  if (acronym?.[1]) return acronym[1];

  return null;
}

function getKeywordTerm(paragraph: string, index: number): string {
  const clean = normalizeWhitespace(paragraph);
  const keywordPatterns = [
    /\b(?:concepto|m[eé]todo|proceso|sistema|modelo|principio|regla|criterio|perfil|categor[ií]a|m[eé]trica|indicador|estrategia|t[eé]cnica|paso|fase|riesgo|error|causa|efecto|objetivo|resultado|comparaci[oó]n|aplicaci[oó]n)\b/gi,
    /\b[A-ZÁÉÍÓÚÑ]{2,8}\b/g,
  ];
  const candidates: string[] = [];
  for (const pattern of keywordPatterns) {
    const matches = clean.match(pattern) || [];
    candidates.push(...matches);
  }
  const [first] = candidates
    .map(candidate => titleCase(candidate))
    .filter(candidate => candidate.length >= 3 && candidate.length <= 45);
  if (first) return first;

  const firstSentence = clean.split(/[.!?]/)[0]?.trim() || clean.slice(0, 80);
  const compact = firstSentence
    .replace(/^(entonces|bueno|ahora|vamos a ver|en este video|en esta clase|lo primero que|una cosa que)\s+/i, '')
    .slice(0, 55);
  return titleCase(compact || `Concepto ${index + 1}`);
}

function splitParagraphs(text: string): string[] {
  const normalized = normalizeWhitespace(text);
  const byBlankLines = normalized
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length >= 90);

  if (byBlankLines.length >= 3) return byBlankLines;

  const sentences = splitSentences(normalized);
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    const chunk = sentences.slice(i, i + 3).join(' ').trim();
    if (chunk.length >= 90) chunks.push(chunk);
  }
  return chunks;
}

function extractExamples(sentences: string[]): string[] {
  return sentences
    .filter(s => /por ejemplo|ejemplo|imagina|supongamos|caso/i.test(s))
    .slice(0, 2);
}

function extractMistakes(sentences: string[]): string[] {
  return sentences
    .filter(s => /error|fallo|malo|incorrecto|no debes|evita|leak/i.test(s))
    .slice(0, 2);
}

function extractApplications(sentences: string[]): string[] {
  return sentences
    .filter(s => /debes|conviene|aplica|usa|ajusta|haz|identifica|compara|clasifica|analiza|calcula|construye|eval[uú]a|decide|verifica/i.test(s))
    .slice(0, 2);
}

function splitSentences(text: string): string[] {
  return normalizeWhitespace(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length >= 35 && s.length <= 420);
}

function parsePlainTextToConcepts(text: string, source?: RawDataPackSource): PokerConcept[] {
  const sentences = splitSentences(text);
  const concepts: PokerConcept[] = [];
  const usedTerms = new Set<string>();

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const term = getTermFromSentence(sentence);
    if (!term) continue;

    const idBase = sanitizeId(term);
    if (!idBase || usedTerms.has(idBase)) continue;

    const context = [sentence, sentences[i + 1], sentences[i + 2]].filter(Boolean);
    const definition = compactDefinition(context.join(' ').trim());
    if (definition.length < 45) continue;

    usedTerms.add(idBase);
    concepts.push({
      id: source ? `${source.id}-${idBase}` : idBase,
      term,
      definition,
      shortDefinition: generateShortDefinition(definition),
      category: detectCategory(definition),
      sourceId: source?.id,
      sourceTitle: source?.title,
      examples: extractExamples(context),
      mistakes: extractMistakes(context),
      applications: extractApplications(context),
    });

    if (concepts.length >= 120) break;
  }

  const paragraphs = splitParagraphs(text);
  const paragraphConcepts = paragraphs.slice(0, 80).map((paragraph, i) => {
    const term = getKeywordTerm(paragraph, i);
    const idBase = sanitizeId(term) || `concept-${i}`;
    return {
      id: source ? `${source.id}-${idBase}` : idBase,
      term,
      definition: compactDefinition(paragraph),
      shortDefinition: generateShortDefinition(paragraph),
      category: detectCategory(paragraph),
      sourceId: source?.id,
      sourceTitle: source?.title,
      examples: extractExamples(splitSentences(paragraph)),
      mistakes: extractMistakes(splitSentences(paragraph)),
      applications: extractApplications(splitSentences(paragraph)),
    };
  });

  return mergeDuplicateConcepts([...concepts, ...paragraphConcepts]);
}

function mergeDuplicateConcepts(concepts: PokerConcept[]): PokerConcept[] {
  const byTerm = new Map<string, PokerConcept>();
  for (const concept of concepts) {
    const key = sanitizeId(concept.term);
    const existing = byTerm.get(key);
    if (!existing) {
      byTerm.set(key, concept);
      continue;
    }

    const mergedDefinition = existing.definition.includes(concept.definition)
      ? existing.definition
      : `${existing.definition} ${concept.definition}`;
    byTerm.set(key, {
      ...existing,
      definition: mergedDefinition.slice(0, 1200),
      shortDefinition: generateShortDefinition(mergedDefinition),
      examples: Array.from(new Set([...(existing.examples || []), ...(concept.examples || [])])).slice(0, 3),
      mistakes: Array.from(new Set([...(existing.mistakes || []), ...(concept.mistakes || [])])).slice(0, 3),
      applications: Array.from(new Set([...(existing.applications || []), ...(concept.applications || [])])).slice(0, 3),
    });
  }
  return Array.from(byTerm.values());
}

function generateRelationships(concepts: PokerConcept[]): ConceptRelationship[] {
  void concepts;
  return [];
}

export function parseMarkdownToConcepts(md: string): PokerConcept[] {
  const concepts: PokerConcept[] = [];
  const lines = md.split('\n');
  let currentCategory = 'General';
  let currentTerm: string | null = null;
  let currentDefinition: string[] = [];

  function flush() {
    if (currentTerm && currentDefinition.length > 0) {
      const def = currentDefinition.join(' ').trim();
      if (def.length > 0) {
        concepts.push({
          id: sanitizeId(currentTerm) || `concept-${concepts.length}`,
          term: currentTerm.trim(),
          definition: def,
          shortDefinition: generateShortDefinition(def),
          category: currentCategory,
        });
      }
    }
    currentTerm = null;
    currentDefinition = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.length === 0 || /^[-]{3,}$/.test(trimmed)) {
      if (currentTerm && currentDefinition.length > 0) {
        flush();
      }
      continue;
    }

    const headerMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headerMatch) {
      flush();
      let headerText = headerMatch[1].trim();
      headerText = headerText.replace(/<a\s+name="[^"]*"\s*><\/a>/gi, '').trim();
      headerText = headerText.replace(/^\d+\.\s*/, '').trim();

      if (/^[A-ZÁÉÍÓÚÑa-záéíóúñ0-9]/.test(headerText) && headerText.length < 60 && !headerText.includes('.')) {
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        if (nextLine && !nextLine.match(/^#{1,3}\s/) && nextLine.length > 5) {
          currentTerm = headerText;
          currentDefinition = [];
          continue;
        }
      }
      currentCategory = headerText;
      continue;
    }

    const boldColonMatch = trimmed.match(/^[-*]?\s*\*\*(.+?)\*\*\s*[:—\-–]\s*(.+)$/);
    if (boldColonMatch) {
      flush();
      currentTerm = boldColonMatch[1].trim();
      currentDefinition = [boldColonMatch[2].trim()];
      flush();
      continue;
    }

    const boldDashMatch = trimmed.match(/^[-*]?\s*\*\*(.+?)\*\*\s*[-–—]\s*(.+)$/);
    if (boldDashMatch && !boldColonMatch) {
      flush();
      currentTerm = boldDashMatch[1].trim();
      currentDefinition = [boldDashMatch[2].trim()];
      flush();
      continue;
    }

    const listItemMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listItemMatch && !currentTerm) {
      const content = listItemMatch[1].trim();
      const parts = content.match(/^(.+?)\s*[:|]\s*(.+)$/) || content.match(/^(.+?)\s+[—\-–]\s+(.+)$/);
      if (parts) {
        flush();
        currentTerm = parts[1].replace(/^\*\*|\*\*$/g, '').trim();
        currentDefinition = [parts[2].trim()];
        flush();
        continue;
      }
    }

    if (currentTerm) {
      currentDefinition.push(trimmed);
    }
  }

  flush();

  const seen = new Set<string>();
  return concepts.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

export function parseJSONToConcepts(json: string): PokerConcept[] {
  const parsed = JSON.parse(json);
  const arr = Array.isArray(parsed) ? parsed : parsed.concepts || parsed.data || [];
  return arr.map((item: Record<string, string>, i: number) => {
    const def = item.definition || item.description || item.def || '';
    return {
      id: item.id || sanitizeId(item.term || item.name || item.concept || '') || `concept-${i}`,
      term: item.term || item.name || item.concept || item.title || `Concepto ${i + 1}`,
      definition: def,
      shortDefinition: item.shortDefinition || generateShortDefinition(def),
      category: item.category || item.cat || 'General',
    };
  }).filter((c: PokerConcept) => c.term && c.definition);
}

export function generateTrueFalse(concepts: PokerConcept[]): TrueFalseQuestion[] {
  if (concepts.length < 2) return [];
  const questions: TrueFalseQuestion[] = [];

  for (const concept of concepts) {
    questions.push({
      statement: `${concept.term}: ${concept.shortDefinition || generateShortDefinition(concept.definition)}`,
      answer: true,
      concept: concept.id,
    });

    const others = concepts.filter(c => c.id !== concept.id);
    const randomOther = others[Math.floor(Math.random() * others.length)];
    if (randomOther) {
      questions.push({
        statement: `${concept.term}: ${randomOther.shortDefinition || generateShortDefinition(randomOther.definition)}`,
        answer: false,
        concept: concept.id,
      });
    }
  }

  return questions.sort(() => Math.random() - 0.5);
}

export function generateMultipleChoice(concepts: PokerConcept[]): MultipleChoiceQuestion[] {
  if (concepts.length < 2) return [];
  return concepts.map(concept => {
    const answer = concept.shortDefinition || generateShortDefinition(concept.definition);
    const others = concepts
      .filter(c => c.id !== concept.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return {
      question: concept.term,
      options: [answer, ...others.map(o => o.shortDefinition || generateShortDefinition(o.definition))].sort(() => Math.random() - 0.5),
      answer,
      concept: concept.id,
      points: 1,
    };
  });
}

export function generatePathQuestions(concepts: PokerConcept[]): PathQuestion[] {
  if (concepts.length < 3) return [];
  const questions = concepts.map(concept => {
    const others = concepts
      .filter(c => c.id !== concept.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const answer = concept.shortDefinition || generateShortDefinition(concept.definition);

    return {
      question: concept.term,
      options: [answer, ...others.map(o => o.shortDefinition || generateShortDefinition(o.definition))].sort(() => Math.random() - 0.5),
      answer,
      concept: concept.id,
    };
  });

  return questions.sort(() => Math.random() - 0.5).slice(0, Math.max(8, concepts.length));
}

export function parseContent(content: string, format: 'md' | 'json' | 'auto' = 'auto'): ParsedDataPack {
  let concepts: PokerConcept[] = [];

  if (format === 'json' || (format === 'auto' && content.trim().startsWith('['))) {
    try {
      concepts = parseJSONToConcepts(content);
    } catch {
      concepts = parseMarkdownToConcepts(content);
    }
  } else {
    concepts = parseMarkdownToConcepts(content);
    if (concepts.length === 0) {
      concepts = parsePlainTextToConcepts(content);
    }
  }

  const multipleChoiceQuestions = generateMultipleChoice(concepts);
  const pathQuestions = generatePathQuestions(concepts);
  const trueFalseQuestions = generateTrueFalse(concepts);
  const relationships = generateRelationships(concepts);

  return {
    concepts,
    multipleChoiceQuestions,
    pathQuestions,
    trueFalseQuestions,
    relationships,
    metadata: createMetadata(concepts, multipleChoiceQuestions, pathQuestions, trueFalseQuestions, relationships, 1, content.length),
  };
}

export function parseSources(sources: RawDataPackSource[], sourceType: DataPackSourceType): ParsedDataPack {
  const parsedSources: ParsedDataPackSource[] = [];
  const allConcepts = sources
    .sort((a, b) => a.order - b.order)
    .flatMap(source => {
      const concepts = parsePlainTextToConcepts(source.content, source);
      parsedSources.push({
        id: source.id,
        order: source.order,
        fileName: source.fileName,
        title: source.title,
        conceptIds: concepts.map(c => c.id),
        characterCount: source.content.length,
      });
      return concepts;
    });

  const concepts = sourceType === 'course' ? mergeDuplicateConcepts(allConcepts) : allConcepts;

  const multipleChoiceQuestions = generateMultipleChoice(concepts);
  const pathQuestions = generatePathQuestions(concepts);
  const trueFalseQuestions = generateTrueFalse(concepts);
  const relationships = generateRelationships(concepts);
  const totalCharacters = sources.reduce((sum, source) => sum + source.content.length, 0);

  return {
    concepts,
    multipleChoiceQuestions,
    pathQuestions,
    trueFalseQuestions,
    sources: parsedSources,
    relationships,
    metadata: createMetadata(concepts, multipleChoiceQuestions, pathQuestions, trueFalseQuestions, relationships, sources.length, totalCharacters, sourceType),
  };
}
