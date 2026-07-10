// Parser para archivos de estrategias
import { StrategyRule } from '../../types/coach';

function sanitizeId(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function parseCategory(header: string): 'Preflop' | 'Flop' | 'Turn' | 'River' {
  const lower = header.toLowerCase();
  if (lower.includes('preflop') || lower.includes('pre-flop')) return 'Preflop';
  if (lower.includes('flop')) return 'Flop';
  if (lower.includes('turn')) return 'Turn';
  if (lower.includes('river')) return 'River';
  return 'Preflop';
}

export function parseStrategyMarkdown(md: string): StrategyRule[] {
  const rules: StrategyRule[] = [];
  const lines = md.split('\n');
  let currentCategory: 'Preflop' | 'Flop' | 'Turn' | 'River' = 'Preflop';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) continue;

    const headerMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headerMatch) {
      currentCategory = parseCategory(headerMatch[1]);
      continue;
    }

    // Formato: "- **Si X**: Y. Explicación."
    const ruleMatch = trimmed.match(/^[-*]\s+\*\*(.+?)\*\*\s*[:—\-–]\s*(.+)$/);
    if (ruleMatch) {
      const condition = ruleMatch[1].trim();
      const rest = ruleMatch[2].trim();
      
      // Separar acción de explicación (la explicación suele empezar después del primer punto)
      const dotIndex = rest.indexOf('.');
      let action = rest;
      let explanation = '';
      
      if (dotIndex > 0 && dotIndex < rest.length - 1) {
        action = rest.substring(0, dotIndex + 1).trim();
        explanation = rest.substring(dotIndex + 1).trim();
      }

      rules.push({
        id: sanitizeId(condition) || `rule-${rules.length}`,
        condition,
        action,
        explanation,
        category: currentCategory
      });
    }
  }

  return rules;
}

export function parseStrategyJSON(json: string): StrategyRule[] {
  const parsed = JSON.parse(json);
  const arr = Array.isArray(parsed) ? parsed : parsed.rules || parsed.strategies || parsed.data || [];
  return arr.map((item: Record<string, string>, i: number) => ({
    id: item.id || sanitizeId(item.condition || '') || `rule-${i}`,
    condition: item.condition || item.situacion || item.si || '',
    action: item.action || item.accion || item.entonces || '',
    explanation: item.explanation || item.explicacion || item.por_que || '',
    category: item.category || item.categoria || 'Preflop'
  })).filter((r: StrategyRule) => r.condition && r.action);
}
