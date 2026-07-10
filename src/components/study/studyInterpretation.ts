import type { DataPack } from '../../data/dataPackService';
import type { StudyPlanSection } from '../../data/dataPackParser';
import type { PokerConcept } from '../training/pokerKnowledge';

export const MAP_INTERPRETATION_PROMPT = `
Mapa: convertir el DataPack en una ayuda visual rapida.
- No copiar textos largos.
- No cortar nombres importantes.
- El nodo debe decir una etiqueta corta, completa y entendible.
- Objetivo de etiqueta: 2 a 4 palabras utiles.
- No usar puntos suspensivos.
- No mostrar definiciones dentro del nodo.
- Si hay terminos repetidos o genericos, desambiguar con su funcion, contexto o diferencia real.
- Mostrar secciones como puntos de conexion, no como parrafos.
- La definicion queda para el modal, no para llenar el mapa.
`;

export const RELATIONS_INTERPRETATION_PROMPT = `
Relaciones: complemento de comprension entre Mapa y Flashcards.
- Funcion: No confundas. Mostrar contrastes minimos entre estructuras principales.
- No crear secciones visuales, tarjetas, resumenes ni explicaciones largas.
- Formato unico: Estructura: Concepto A != Concepto B - palabra clave A vs palabra clave B.
- Usar solo estructuras centrales del DataPack, no todos los conceptos.
- Texto bruto, una linea, minimas palabras, sin cortar palabras.
- Cada linea debe ayudar a diferenciar a largo plazo.
- Maximo 6 lineas utiles.
- No inventar contenido fuera del DataPack.
- Debe funcionar con cualquier tema.
`;

export const SUMMARY_INTERPRETATION_PROMPT = RELATIONS_INTERPRETATION_PROMPT;

export const FLASHCARD_INTERPRETATION_PROMPT = `
Flashcards: convertir conceptos del DataPack en tarjetas aprendibles.
- Frente: concepto claro, completo y sin duplicados confusos.
- Reverso: explicacion corta de que significa, para que sirve o como se reconoce.
- Sin titulos decorativos dentro de la tarjeta: concepto por un lado, respuesta por el otro.
- Seleccion inteligente: priorizar poco vistos, fallados y bajo dominio; reducir dominados.
- Nunca repetir el mismo texto del frente como respuesta.
- Si el DataPack trae un termino pobre, reconstruirlo desde definicion, aplicacion o seccion.
`;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeText(value: string | undefined): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

const LABEL_STOPWORDS = new Set([
  'a', 'al', 'and', 'como', 'con', 'de', 'del', 'el', 'en', 'for', 'la', 'las', 'los', 'of', 'para', 'por', 'the', 'to', 'un', 'una', 'y',
]);

const DEFINITION_BOUNDARIES = [
  /\s+(?:que|quien|cuando|donde|porque|consiste|significa|representa|mide|sirve|permite|ayuda|describe)\s+/i,
  /\s+-\s+/,
  /\.\s+/,
];

function titleCaseLabel(value: string): string {
  return normalizeText(value)
    .split(' ')
    .map(word => {
      if (/^[A-Z0-9]{2,}$/.test(word)) return word;
      if (word.length <= 2 && LABEL_STOPWORDS.has(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function removeDefinitionTail(value: string): string {
  let clean = normalizeText(value);
  for (const boundary of DEFINITION_BOUNDARIES) {
    const parts = clean.split(boundary);
    if (parts[0] && parts[0].length >= 3) clean = parts[0];
  }
  return clean.replace(/[:;,]+$/g, '').trim();
}

function meaningfulWords(value: string, maxWords: number): string {
  const words = normalizeText(value)
    .replace(/[()\[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const selected = words.filter(word => !LABEL_STOPWORDS.has(word.toLowerCase())).slice(0, maxWords);
  const fallback = words.slice(0, maxWords);
  return titleCaseLabel((selected.length ? selected : fallback).join(' '));
}

function shortMapLabel(value: string, maxWords = 3): string {
  let clean = stripStudyPrefix(value);
  clean = clean.replace(/^\d+\.\s*/, '').trim();

  const metricMatch = clean.match(/^(m[eé]tricas\s+clave\s+para\s+catalogar|m[eé]tricas\s+para\s+catalogar|catalogaci[oó]n\s+de)\s+(.+)$/i);
  if (metricMatch?.[2]) clean = metricMatch[2];

  if (clean.includes(':')) {
    const [left, ...rest] = clean.split(':');
    const right = removeDefinitionTail(rest.join(':'));
    const rightHead = meaningfulWords(right, 1);
    return titleCaseLabel([meaningfulWords(left, 1), rightHead].filter(Boolean).join(' '));
  }

  clean = clean.replace(/\s+en\s+.+$/i, '').trim() || clean;
  clean = removeDefinitionTail(clean);
  return meaningfulWords(clean, maxWords);
}

function isAmbiguousShortTerm(term: string): boolean {
  const words = normalizeText(term).split(/\s+/).filter(Boolean);
  if (words.length !== 1) return false;
  if (/^[A-Z0-9]{2,}$/.test(term)) return false;
  return term.length <= 5;
}

export function stripStudyPrefix(value: string): string {
  return normalizeText(value)
    .replace(/^gu[ií]a\s+de\s+estudios?\s*[:\-]\s*/i, '')
    .replace(/^study\s+guide\s*[:\-]\s*/i, '')
    .trim();
}

export function cleanStudyTitle(pack: DataPack): string {
  return shortMapLabel(pack.studyPlan?.title || pack.studyGuide?.title || pack.name || 'Estudio', 3);
}

export function cleanSectionTitle(title: string): string {
  const clean = stripStudyPrefix(title).replace(/^\d+\.\s*/, '').trim();
  const definitionMatch = clean.match(/^definici[oó]n\s+y\s+tipos?\s+de\s+(.+)$/i);
  if (definitionMatch?.[1]) return shortMapLabel(`Tipos ${definitionMatch[1]}`, 3);
  const catalogMatch = clean.match(/^(m[eé]tricas\s+clave\s+para\s+catalogar|m[eé]tricas\s+para\s+catalogar|catalogaci[oó]n\s+de)\s+(.+)$/i);
  if (catalogMatch?.[2]) return shortMapLabel(catalogMatch[2], 3);
  return shortMapLabel(clean, 3);
}

export function firstUsefulSentence(value: string | undefined, maxSentences = 1): string {
  const clean = normalizeText(value);
  if (!clean) return '';
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, maxSentences);
  return sentences.join(' ').trim() || clean;
}

function qualifierFromEvidence(concept: PokerConcept, section?: StudyPlanSection): string {
  const evidence = normalizeText([
    concept.shortDefinition,
    concept.definition,
    concept.applications?.[0],
    concept.examples?.[0],
    section?.title,
  ].filter(Boolean).join(' '));
  const sentence = firstUsefulSentence(evidence, 1);
  const clean = sentence
    .replace(new RegExp(`^${escapeRegExp(concept.term)}\\s*[:\\-]?\\s*`, 'i'), '')
    .replace(/^(es|son|significa|define)\s+/i, '')
    .trim();
  return shortMapLabel(clean, 2);
}

export function buildConceptLabel(concept: PokerConcept, section?: StudyPlanSection, duplicate = false): string {
  const term = normalizeText(concept.term);
  if (!duplicate && term.length > 2 && !isAmbiguousShortTerm(term)) return shortMapLabel(term, 3);

  const qualifier = qualifierFromEvidence(concept, section);
  if (!qualifier) return term;
  return shortMapLabel(`${term}: ${qualifier}`, 3);
}

export function buildConceptLabels(concepts: PokerConcept[], section?: StudyPlanSection): Map<string, string> {
  const counts = new Map<string, number>();
  for (const concept of concepts) {
    const key = normalizeText(concept.term).toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const used = new Map<string, number>();
  const labels = new Map<string, string>();
  for (const concept of concepts) {
    const key = normalizeText(concept.term).toLowerCase();
    let label = buildConceptLabel(concept, section, (counts.get(key) || 0) > 1 || isAmbiguousShortTerm(concept.term));
    const labelKey = label.toLowerCase();
    const count = used.get(labelKey) || 0;
    if (count > 0) {
      const qualifier = qualifierFromEvidence(concept, section);
      label = qualifier ? shortMapLabel(`${label}: ${qualifier}`, 3) : `${label} ${count + 1}`;
    }
    used.set(labelKey, count + 1);
    labels.set(concept.id, label);
  }
  return labels;
}

export function buildFlashcardBack(concept: PokerConcept, front: string, section?: StudyPlanSection): string {
  const options = [
    concept.definition,
    concept.shortDefinition,
    concept.applications?.[0],
    concept.examples?.[0],
  ].map(normalizeText).filter(Boolean);

  const frontKey = normalizeText(front).toLowerCase();
  const termKey = normalizeText(concept.term).toLowerCase();
  const answer = options.find(option => {
    const key = option.toLowerCase();
    return key !== frontKey && key !== termKey && key.length > 8;
  });

  if (answer) {
    const cleanAnswer = answer.replace(new RegExp(`^${escapeRegExp(front)}\\s*[:\\-]?\\s*`, 'i'), '').trim();
    return firstUsefulSentence(cleanAnswer || answer, 2);
  }
  return `Concepto del bloque ${cleanSectionTitle(section?.title || concept.category || 'principal')}. Revisa que significa, como se reconoce y con que otros conceptos se conecta.`;
}

export function compactParagraph(value: string | undefined, maxSentences = 2): string {
  return firstUsefulSentence(value, maxSentences);
}

export function conciseDefinition(value: string | undefined): string {
  const clean = firstUsefulSentence(value, 1);
  if (clean.length <= 180) return clean;
  const parts = clean.split(/[,;:]/).map(part => part.trim()).filter(Boolean);
  return parts[0]?.length >= 24 ? parts[0] : `${clean.slice(0, 177).trim()}...`;
}
