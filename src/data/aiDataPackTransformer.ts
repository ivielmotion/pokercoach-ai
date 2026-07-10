import { MultipleChoiceQuestion, PokerConcept, PathQuestion, TrueFalseQuestion } from '../components/training/pokerKnowledge';
import {
  GAME_DATAPACK_PROMPT,
  type ConceptRelationship,
  type DataPackSourceType,
  type ParsedDataPack,
  type RawDataPackSource,
  type StudyGuide,
  generatePathQuestions,
  generateTrueFalse,
  generateMultipleChoice,
} from './dataPackParser';

const OPENROUTER_MODELS = [
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-flash-lite-preview-09-2025',
  'google/gemini-2.5-flash',
];

const JSON_REPAIR_MODEL = 'google/gemini-2.5-flash';

function sanitizeId(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function compact(value: unknown, max: number): string {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : text.slice(0, max - 3).trim() + '...';
}

function normalizeKey(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isGenericRelation(value: unknown): boolean {
  const clean = normalizeKey(value);
  return !clean || clean === 'related' || clean === 'relacionado' || clean === 'se relaciona con' || clean === 'conecta con';
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('La IA no devolvio JSON valido.');
  }
}

async function callOpenRouter(apiKey: string, model: string, prompt: string, maxTokens = 6500): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Aplicacion de Estudio',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'Devuelve solo JSON valido. No uses markdown. No expliques el resultado.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      provider: { sort: 'price' },
      temperature: 0.1,
      top_p: 0.8,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Error IA ${response.status} con ${model}: ${detail || response.statusText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function repairJsonWithAI(apiKey: string, brokenJson: string, parseError: string): Promise<unknown> {
  const prompt = `Corrige este JSON invalido y devuelve solo JSON valido.

Error de parseo:
${parseError}

Reglas:
- No cambies el significado.
- No agregues explicaciones.
- No uses markdown.
- Conserva las claves existentes.
- Si un item esta incompleto, eliminalo antes de romper el JSON.

JSON invalido:
${brokenJson.slice(0, 90000)}`;

  const repaired = await callOpenRouter(apiKey, JSON_REPAIR_MODEL, prompt, 12000);
  return extractJson(repaired);
}

function createMetadata(parsed: ParsedDataPack, sourceType: DataPackSourceType, sourceCount: number): ParsedDataPack['metadata'] {
  const questionCount = (parsed.multipleChoiceQuestions?.length || 0) + parsed.pathQuestions.length + parsed.trueFalseQuestions.length;
  return {
    schemaVersion: 1,
    promptVersion: 'game-datapack-prompt-v1-ai',
    sourceType,
    sourceCount,
    conceptCount: parsed.concepts.length,
    questionCount,
    relationshipCount: parsed.relationships?.length || 0,
    quality: {
      density: parsed.concepts.length,
      hasEnoughConcepts: parsed.concepts.length >= 8,
      hasEnoughQuestions: questionCount >= Math.min(10, parsed.concepts.length),
    },
  };
}

function normalizeStudyGuide(raw: any, title: string): StudyGuide | undefined {
  const guide = raw?.studyGuide;
  if (!guide) return undefined;
  return {
    title: compact(guide.title || title, 120),
    summary: compact(guide.summary || '', 900),
    sections: Array.isArray(guide.sections)
      ? guide.sections.map((section: any) => ({
          title: compact(section.title, 90),
          content: Array.isArray(section.content) ? section.content.map((v: unknown) => compact(v, 260)).filter(Boolean).slice(0, 8) : [],
        })).filter((section: any) => section.title && section.content.length > 0).slice(0, 10)
      : [],
    classificationTables: Array.isArray(guide.classificationTables)
      ? guide.classificationTables.map((table: any) => ({
          title: compact(table.title, 90),
          headers: Array.isArray(table.headers) ? table.headers.map((v: unknown) => compact(v, 40)).slice(0, 6) : [],
          rows: Array.isArray(table.rows) ? table.rows.map((row: unknown[]) => Array.isArray(row) ? row.map((v: unknown) => compact(v, 80)).slice(0, 6) : []).filter((row: string[]) => row.length > 0).slice(0, 12) : [],
        })).filter((table: any) => table.title && table.headers.length > 0).slice(0, 4)
      : [],
    glossary: Array.isArray(guide.glossary)
      ? guide.glossary.map((item: any) => ({ term: compact(item.term, 48), definition: compact(item.definition, 180) })).filter((item: any) => item.term && item.definition).slice(0, 60)
      : [],
    reviewQuestions: Array.isArray(guide.reviewQuestions)
      ? guide.reviewQuestions.map((item: any) => ({ question: compact(item.question, 160), answer: compact(item.answer, 220) })).filter((item: any) => item.question && item.answer).slice(0, 30)
      : [],
    essayPrompts: Array.isArray(guide.essayPrompts) ? guide.essayPrompts.map((v: unknown) => compact(v, 180)).filter(Boolean).slice(0, 10) : [],
  };
}

function normalizeAiParsed(raw: any, sourceType: DataPackSourceType, sources: RawDataPackSource[], title: string): ParsedDataPack {
  const concepts: PokerConcept[] = Array.isArray(raw?.concepts)
    ? raw.concepts.map((item: any, index: number) => {
        const term = compact(item.term || item.name || item.title || `Concepto ${index + 1}`, 48);
        const definition = compact(item.definition || item.description || '', 220);
        const shortDefinition = compact(item.shortDefinition || definition, 72);
        const sourceId = item.sourceId || sources[0]?.id;
        return {
          id: sanitizeId(item.id || term) || `concept-${index + 1}`,
          term,
          definition,
          shortDefinition,
          category: compact(item.category || 'General', 32),
          sourceId,
          sourceTitle: item.sourceTitle || sources.find(s => s.id === sourceId)?.title || sources[0]?.title,
          examples: Array.isArray(item.examples) ? item.examples.map((v: unknown) => compact(v, 120)).filter(Boolean).slice(0, 3) : [],
          mistakes: Array.isArray(item.mistakes) ? item.mistakes.map((v: unknown) => compact(v, 120)).filter(Boolean).slice(0, 3) : [],
          applications: Array.isArray(item.applications) ? item.applications.map((v: unknown) => compact(v, 120)).filter(Boolean).slice(0, 3) : [],
        };
      }).filter((concept: PokerConcept) => concept.term && concept.definition && concept.definition.length >= 20)
    : [];

  const conceptIds = new Set(concepts.map(c => c.id));
  const multipleChoiceQuestions: MultipleChoiceQuestion[] = Array.isArray(raw?.multipleChoiceQuestions)
    ? raw.multipleChoiceQuestions.map((item: any) => {
        const options = Array.isArray(item.options) ? item.options.map((v: unknown) => compact(v, 60)).filter(Boolean).slice(0, 4) : [];
        return {
          question: compact(item.question, 160),
          options,
          answer: compact(item.answer, 60),
          concept: conceptIds.has(item.concept) ? item.concept : concepts[0]?.id,
          points: 1,
        };
      }).filter((q: MultipleChoiceQuestion) => q.question && q.answer && q.options.includes(q.answer) && q.options.length >= 3 && q.concept)
    : [];
  const trueFalseQuestions: TrueFalseQuestion[] = Array.isArray(raw?.trueFalseQuestions)
    ? raw.trueFalseQuestions.map((item: any) => ({
        statement: compact(item.statement, 160),
        answer: Boolean(item.answer),
        concept: conceptIds.has(item.concept) ? item.concept : concepts[0]?.id,
      })).filter((q: TrueFalseQuestion) => q.statement && q.concept)
    : [];

  const pathQuestions: PathQuestion[] = Array.isArray(raw?.pathQuestions)
    ? raw.pathQuestions.map((item: any) => {
        const options = Array.isArray(item.options) ? item.options.map((v: unknown) => compact(v, 60)).filter(Boolean).slice(0, 4) : [];
        return {
          question: compact(item.question, 160),
          options,
          answer: compact(item.answer, 60),
          concept: conceptIds.has(item.concept) ? item.concept : concepts[0]?.id,
        };
      }).filter((q: PathQuestion) => q.question && q.answer && q.options.length >= 2 && q.concept)
    : [];

  const relationships: ConceptRelationship[] = Array.isArray(raw?.relationships)
    ? raw.relationships.map((item: any) => {
        const relation = compact(item.relation || item.type, 40);
        return {
          from: item.from,
          to: item.to,
          type: compact(item.type || relation, 40),
          reason: compact(item.reason, 120),
          title: compact(item.title, 60),
          conceptA: compact(item.conceptA, 48),
          relation,
          conceptB: compact(item.conceptB, 48),
          whyItMatters: compact(item.whyItMatters || item.reason, 140),
          memoryKey: compact(item.memoryKey, 90),
        };
      }).filter((r: ConceptRelationship) => conceptIds.has(r.from) && conceptIds.has(r.to) && r.from !== r.to && !isGenericRelation(r.relation) && normalizeKey(r.whyItMatters).length >= 12)
    : [];

  const parsed: ParsedDataPack = {
    studyGuide: normalizeStudyGuide(raw, title),
    studyPlan: raw?.studyPlan,
    conceptMap: raw?.conceptMap,
    coverageMatrix: Array.isArray(raw?.coverageMatrix) ? raw.coverageMatrix : undefined,
    concepts,
    multipleChoiceQuestions: multipleChoiceQuestions.length > 0 ? multipleChoiceQuestions : generateMultipleChoice(concepts),
    pathQuestions: pathQuestions.length > 0 ? pathQuestions : generatePathQuestions(concepts),
    trueFalseQuestions: trueFalseQuestions.length > 0 ? trueFalseQuestions : generateTrueFalse(concepts),
    relationships,
    sources: sources.map(source => ({
      id: source.id,
      order: source.order,
      fileName: source.fileName,
      title: source.title,
      conceptIds: concepts.filter(c => c.sourceId === source.id).map(c => c.id),
      characterCount: source.content.length,
    })),
  };
  parsed.metadata = createMetadata(parsed, sourceType, sources.length);
  return parsed;
}

function validateStudyData(parsed: ParsedDataPack) {
  const conceptsWithBadText = parsed.concepts.filter(concept =>
    concept.term.length > 55 ||
    concept.definition.length > 240 ||
    (concept.shortDefinition || '').length > 90 ||
    concept.term.split(' ').length > 6
  );
  const conceptIds = new Set(parsed.concepts.map(concept => concept.id));
  const mcConcepts = new Set((parsed.multipleChoiceQuestions || []).map(q => q.concept).filter(id => conceptIds.has(id)));
  const tfConcepts = new Set(parsed.trueFalseQuestions.map(q => q.concept).filter(id => conceptIds.has(id)));
  const coverage = parsed.concepts.length > 0
    ? Math.min(mcConcepts.size, tfConcepts.size) / parsed.concepts.length
    : 0;

  if (parsed.concepts.length < 6) throw new Error('La IA genero muy pocos conceptos. No se guardo el DataPack.');
  if (conceptsWithBadText.length > Math.max(2, parsed.concepts.length * 0.2)) {
    throw new Error('La IA genero conceptos demasiado largos o poco jugables. No se guardo el DataPack.');
  }
  if (coverage < 0.55) {
    throw new Error('La IA no genero suficientes preguntas por concepto. No se guardo el DataPack.');
  }
}

function buildPrompt(sourceType: DataPackSourceType, sources: RawDataPackSource[], title: string): string {
  const sourceText = sources
    .map(source => `ARCHIVO ${source.order}: ${source.fileName}\n${source.content.slice(0, 30000)}`)
    .join('\n\n---\n\n');

  return `${GAME_DATAPACK_PROMPT}

Nombre del DataPack: ${title}
Tipo: ${sourceType}

Pipeline obligatorio:
1. Detecta el dominio real del TXT sin asumir categorias fijas.
2. Divide el documento en secciones de aprendizaje reales.
3. Crea un studyPlan profesional: objetivo, resumen, secciones, ideas clave, mustMaster, flashcards, casos practicos, preguntas, errores, comparaciones y ruta recomendada.
4. Crea conceptMap como arbol simple: root -> secciones -> conceptos.
5. Crea coverageMatrix para demostrar que bloques importantes del TXT se usaron o justificar descartes.
6. Convierte la guia en concepts atomicos. La app generara preguntas de juego desde esos concepts.
7. Crea relationships para la seccion Relaciones: conexiones utiles entre conceptos, no resumenes.

Requisitos de calidad obligatorios:
- Crea entre 20 y 45 conceptos esenciales si el texto lo permite.
- Cada concepto debe ser una unidad aprendible y reutilizable en TODOS los juegos.
- Cada definition debe tener maximo 220 caracteres.
- Cada shortDefinition debe tener maximo 72 caracteres.
- Las preguntas deben usar frases cortas, no parrafos.
- No uses como termino frases largas de la transcripcion.
- No uses fragmentos literales largos del TXT.
- No devuelvas un JSON gigante. No copies todo el texto. Sintetiza.
- studyGuide.summary maximo 5 lineas.
- studyGuide.sections maximo 6 secciones, cada una con maximo 4 bullets cortos.
- studyPlan.sections maximo 8 secciones, con keyIdeas y mustMaster cortos.
- studyPlan.flashcards maximo 1 por concepto importante.
- practicalCases maximo 8, commonMistakes maximo 12, comparisons maximo 8.
- conceptMap debe ser jerarquico y compacto; no inventes nodos innecesarios.
- conceptMap debe servir como mapa visual: labels cortos pero completos, sin puntos suspensivos, sin titulos genericos y sin repetir nodos indistinguibles.
- coverageMatrix debe cubrir los archivos/bloques principales, no cada frase.
- studyGuide.glossary maximo 45 terminos.
- reviewQuestions maximo 10.
- multipleChoiceQuestions, trueFalseQuestions y pathQuestions pueden ir vacios: la app los genera desde los conceptos.
- No categorices automaticamente como Preflop/Flop/Turn/River salvo que el texto trate explicitamente esa estructura.
- Las categorias deben ser utiles para estudiar el documento concreto: por ejemplo Concepto Base, Perfil, Metrica, Estrategia, Error, Ejemplo, Proceso, Clasificacion, etc.
- Si el texto trae variantes parecidas, el termino debe incluir la diferencia real entre ellas.
- Ejemplo correcto: concepto "Metodo de comparacion"; shortDefinition "Contrasta dos opciones usando criterios definidos".
- Ejemplo incorrecto: crear dos conceptos con el mismo nombre sin explicar en que se diferencian.
- Ejemplo incorrecto: usar frases sueltas o ambiguas de la transcripcion como termino.
- Las flashcards deben tener frente y reverso distintos: front = concepto; back = significado claro, funcion practica o como reconocerlo.
- studyPlan.summary debe ser compacto y util: no copiar parrafos largos, no repetir el titulo y no meter relleno.
- relationships debe conectar ideas con estructura: title, conceptA, relation, conceptB, whyItMatters, memoryKey.
- Cada relationship debe poder leerse como: Concepto A -> relacion -> Concepto B.
- No inventes relaciones si el documento no las sostiene. Prioriza entre 8 y 15 relaciones utiles segun el contenido.

TXT:
${sourceText}`;
}

export async function transformSourcesWithAI(
  apiKey: string,
  sourceType: DataPackSourceType,
  sources: RawDataPackSource[],
  title: string
): Promise<ParsedDataPack> {
  const prompt = buildPrompt(sourceType, sources, title);
  let lastError = '';

  for (const model of OPENROUTER_MODELS) {
    try {
      const text = await callOpenRouter(apiKey, model, prompt, 9000);
      let raw: unknown;
      try {
        raw = extractJson(text);
      } catch (err) {
        raw = await repairJsonWithAI(apiKey, text, err instanceof Error ? err.message : 'JSON invalido');
      }
      const parsed = normalizeAiParsed(raw, sourceType, sources, title);
      if (parsed.concepts.length === 0) throw new Error('La IA no genero conceptos validos.');
      validateStudyData(parsed);
      return parsed;
    } catch (err) {
      lastError = err instanceof Error ? err.message : `Error desconocido con ${model}`;
      if (lastError.includes('No endpoints found') || lastError.includes('404') || lastError.includes('JSON')) continue;
      if (model !== OPENROUTER_MODELS[OPENROUTER_MODELS.length - 1]) continue;
      throw new Error(lastError);
    }
  }

  throw new Error(lastError || 'No hay modelos IA disponibles en OpenRouter.');
}
