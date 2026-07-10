// Parser para archivos de tablas preflop
import { PreflopTable } from '../../types/coach';

function sanitizeId(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function parseHandList(text: string): string[] {
  return text
    .split(',')
    .map(h => h.trim())
    .filter(h => h.length > 0);
}

function parsePercentage(text: string): number {
  const match = text.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 0;
}

export function parseTableMarkdown(md: string): PreflopTable[] {
  const tables: PreflopTable[] = [];
  const lines = md.split('\n');
  let currentPosition = '';
  let currentOpenRaise: string[] = [];
  let currentThreeBet: string[] = [];
  let currentCall: string[] = [];
  let currentOpenRaisePct = 0;
  let currentThreeBetPct = 0;
  let currentCallPct = 0;

  function flush() {
    if (currentPosition) {
      tables.push({
        id: sanitizeId(currentPosition) || `table-${tables.length}`,
        position: currentPosition,
        openRaise: currentOpenRaise,
        openRaisePercentage: currentOpenRaisePct,
        threeBet: currentThreeBet,
        threeBetPercentage: currentThreeBetPct,
        call: currentCall,
        callPercentage: currentCallPct
      });
    }
    currentPosition = '';
    currentOpenRaise = [];
    currentThreeBet = [];
    currentCall = [];
    currentOpenRaisePct = 0;
    currentThreeBetPct = 0;
    currentCallPct = 0;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) continue;

    const headerMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headerMatch) {
      flush();
      const headerText = headerMatch[1].trim();
      const pctMatch = headerText.match(/\((\d+)%/);
      currentPosition = headerText.replace(/\(\d+%\s*Open Raise\)/, '').trim();
      currentOpenRaisePct = pctMatch ? parseInt(pctMatch[1]) : 0;
      continue;
    }

    const boldMatch = trimmed.match(/^[-*]?\s*\*\*(.+?)\*\*\s*[:—\-–]\s*(.+)$/);
    if (boldMatch) {
      const label = boldMatch[1].trim().toLowerCase();
      const value = boldMatch[2].trim();

      if (label.includes('open raise')) {
        currentOpenRaise = parseHandList(value);
      } else if (label.includes('3bet') || label.includes('3-bet')) {
        currentThreeBet = parseHandList(value);
        const pctMatch = value.match(/\((\d+)%\)/);
        currentThreeBetPct = pctMatch ? parseInt(pctMatch[1]) : parsePercentage(value);
      } else if (label.includes('call')) {
        currentCall = parseHandList(value);
        const pctMatch = value.match(/\((\d+)%\)/);
        currentCallPct = pctMatch ? parseInt(pctMatch[1]) : parsePercentage(value);
      }
    }
  }

  flush();

  return tables;
}

export function parseTableJSON(json: string): PreflopTable[] {
  const parsed = JSON.parse(json);
  const arr = Array.isArray(parsed) ? parsed : parsed.tables || parsed.data || [];
  return arr.map((item: Record<string, any>, i: number) => ({
    id: item.id || sanitizeId(item.position || '') || `table-${i}`,
    position: item.position || item.posicion || `Posición ${i + 1}`,
    openRaise: item.openRaise || item.open_raise || item.apertura || [],
    openRaisePercentage: item.openRaisePercentage || item.open_raise_percentage || 0,
    threeBet: item.threeBet || item.three_bet || item.resubida || [],
    threeBetPercentage: item.threeBetPercentage || item.three_bet_percentage || 0,
    call: item.call || item.pago || [],
    callPercentage: item.callPercentage || item.call_percentage || 0
  })).filter((t: PreflopTable) => t.position);
}
