// Parser para archivos de conocimiento (glosario)
import { KnowledgeEntry } from '../../types/coach';

function sanitizeId(term: string): string {
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export function parseKnowledgeMarkdown(md: string): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];
  const lines = md.split('\n');
  let currentCategory = 'General';
  let currentTerm: string | null = null;
  let currentDefinition: string[] = [];

  function flush() {
    if (currentTerm && currentDefinition.length > 0) {
      const def = currentDefinition.join(' ').trim();
      if (def.length > 0) {
        entries.push({
          id: sanitizeId(currentTerm) || `entry-${entries.length}`,
          term: currentTerm.trim(),
          definition: def,
          category: currentCategory
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
      const headerText = headerMatch[1].trim();
      
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

    if (currentTerm) {
      currentDefinition.push(trimmed);
    }
  }

  flush();

  const seen = new Set<string>();
  return entries.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export function parseKnowledgeJSON(json: string): KnowledgeEntry[] {
  const parsed = JSON.parse(json);
  const arr = Array.isArray(parsed) ? parsed : parsed.entries || parsed.data || [];
  return arr.map((item: Record<string, string>, i: number) => ({
    id: item.id || sanitizeId(item.term || '') || `entry-${i}`,
    term: item.term || item.name || item.title || `Término ${i + 1}`,
    definition: item.definition || item.description || item.def || '',
    category: item.category || item.cat || 'General'
  })).filter((e: KnowledgeEntry) => e.term && e.definition);
}
