/**
 * studyGuideService.ts
 *
 * Define el tipo StudyGuide y la función que pide al servidor Express
 * (server.ts, motor de Sintex) la guía en Markdown y la convierte a StudyGuide editable.
 */

import { markdownToStudyGuide } from './sintexTransformer';

export type StudyGuideBlock =
  | { id: string; type: 'paragraph'; title?: string; text: string }
  | { id: string; type: 'list'; title?: string; items: string[] }
  | { id: string; type: 'table'; title?: string; headers: string[]; rows: string[][] };

export interface StudyGuideSection {
  id: string;
  title: string;
  blocks: StudyGuideBlock[];
}

export interface StudyGuide {
  title: string;
  sections: StudyGuideSection[];
}

async function readJsonResponse(response: Response): Promise<{ result?: string; error?: string }> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      'El servidor respondio vacio. Verifica que pokercoach-ai este corriendo con npm run dev y que el puerto no apunte a otro proyecto.'
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `El servidor no devolvio JSON valido. Respuesta recibida: ${text.slice(0, 180)}`
    );
  }
}

export async function buildStudyGuideFromText(content: string): Promise<StudyGuide> {
  if (!content?.trim()) throw new Error('El archivo txt esta vacio.');

  const response = await fetch('/api/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.error || 'Ocurrio un error al sintetizar la guia.');
  }

  if (!data?.result || typeof data.result !== 'string') {
    throw new Error('La IA no devolvio texto valido.');
  }

  return markdownToStudyGuide(data.result);
}
