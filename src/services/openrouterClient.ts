/**
 * openrouterClient.ts
 *
 * Wrapper minimo sobre la API de OpenRouter para usarlo desde
 * distintos servicios de la app.
 */

export const OPENROUTER_MODELS = [
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-flash-lite-preview-09-2025',
  'google/gemini-2.5-flash',
];

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function getOpenRouterApiKey(): string {
  const envKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';
  if (envKey) return envKey;
  try {
    return localStorage.getItem('pokercoach_games_ai_api_key') || localStorage.getItem('pokercoach_openrouter_api_key') || '';
  } catch {
    return '';
  }
}

export function setOpenRouterApiKey(value: string): void {
  try {
    if (value.trim()) localStorage.setItem('pokercoach_games_ai_api_key', value.trim());
    else localStorage.removeItem('pokercoach_games_ai_api_key');
  } catch {
    // ignorar
  }
}

export async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 8000
): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error('Falta la API key de OpenRouter. Configurala en el panel de IA.');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://study-app.local',
      'X-Title': 'Aplicacion de Estudio',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
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

export function extractJson(text: string): any {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        throw new Error('JSON invalido despues de extraer bloque.');
      }
    }
    throw new Error('No se encontro JSON valido en la respuesta.');
  }
}

export async function repairJson(text: string, parseError: string, model: string): Promise<any> {
  const repairSystem = REPAIR_SYSTEM;
  const repairPrompt = REPAIR_USER_TEMPLATE(text, parseError);
  const repaired = await callOpenRouter(model, repairSystem, repairPrompt, 12000);
  return extractJson(repaired);
}

const REPAIR_SYSTEM = 'Devuelve solo JSON valido. Sin markdown. Sin explicaciones. Conserva el significado.';

function REPAIR_USER_TEMPLATE(brokenJson: string, parseError: string): string {
  return `Corrige este JSON invalido.

Error de parseo: ${parseError}

Reglas:
- No cambies el significado ni las claves.
- Si un item esta incompleto o roto, eliminalo antes de cerrar el JSON.
- Conserva el mayor contenido posible.

JSON invalido:
${brokenJson.slice(0, 100000)}`;
}
