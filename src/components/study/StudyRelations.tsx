import { Link2, Network } from 'lucide-react';
import type { DataPack } from '../../data/dataPackService';
import type { ConceptRelationship, StudyPlanSection } from '../../data/dataPackParser';
import type { PokerConcept } from '../training/pokerKnowledge';
import { buildConceptLabels, cleanSectionTitle, conciseDefinition, normalizeText, RELATIONS_INTERPRETATION_PROMPT } from './studyInterpretation';

interface StudyRelationsProps {
  pack: DataPack;
  sections: StudyPlanSection[];
  onMap: () => void;
}

interface RelationLine {
  id: string;
  structure: string;
  conceptA: string;
  conceptB: string;
  relation: string;
  aHint: string;
  bHint: string;
}

interface RelationGroup {
  structure: string;
  lines: RelationLine[];
}

const HINT_STOPWORDS = new Set([
  'a', 'al', 'ante', 'con', 'como', 'de', 'del', 'el', 'en', 'es', 'la', 'las', 'lo', 'los', 'que', 'se', 'su', 'sus', 'un', 'una', 'y',
  'concepto', 'tipo', 'perfil', 'valor', 'porcentaje', 'frecuencia',
]);

function getConcept(pack: DataPack, conceptId: string): PokerConcept | undefined {
  return pack.concepts.find(concept => concept.id === conceptId);
}

function normalizeKey(value: string): string {
  return normalizeText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function stripConceptName(value: string, concept: string): string {
  return value.replace(new RegExp(`^${concept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:\\-]?\\s*`, 'i'), '').trim();
}

function compactHint(value: string | undefined, concept: string): string {
  const clean = stripConceptName(conciseDefinition(value).replace(/\s+/g, ' ').trim(), concept)
    .replace(/^(es|son|significa|mide|representa|indica|sirve para)\s+/i, '')
    .replace(/[()]/g, ' ')
    .replace(/[,. ;:]+$/g, '')
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const meaningful = words.filter(word => !HINT_STOPWORDS.has(normalizeKey(word))).slice(0, 4);
  const selected = meaningful.length >= 2 ? meaningful : words.slice(0, 4);
  return selected.join(' ');
}

function relationLabel(relation: ConceptRelationship): string {
  const value = normalizeText(relation.relation || relation.type);
  const clean = normalizeKey(value);
  if (!value || clean === 'related' || clean === 'relacionado' || clean === 'se relaciona con' || clean === 'conecta con') return '≠';
  if (clean === 'contrast' || clean === 'contrasta con' || clean === 'diferencia') return '≠';
  if (clean === 'prerequisite' || clean === 'requiere') return 'requiere';
  return value;
}

function buildLabels(pack: DataPack, sections: StudyPlanSection[]): Map<string, string> {
  const labels = new Map<string, string>();
  for (const section of sections) {
    const concepts = section.conceptIds.map(id => getConcept(pack, id)).filter(Boolean) as PokerConcept[];
    const sectionLabels = buildConceptLabels(concepts, section);
    for (const [id, label] of sectionLabels) labels.set(id, label);
  }
  for (const concept of pack.concepts) {
    if (!labels.has(concept.id)) labels.set(concept.id, concept.term);
  }
  return labels;
}

function buildSectionByConcept(sections: StudyPlanSection[]): Map<string, StudyPlanSection> {
  const sectionByConcept = new Map<string, StudyPlanSection>();
  for (const section of sections) {
    for (const conceptId of section.conceptIds) sectionByConcept.set(conceptId, section);
  }
  return sectionByConcept;
}

function importance(concept: PokerConcept, sections: StudyPlanSection[]): number {
  const key = normalizeKey(concept.term);
  let score = 0;
  for (const section of sections) {
    if (!section.conceptIds.includes(concept.id)) continue;
    if (section.mustMaster.some(item => normalizeKey(item).includes(key) || key.includes(normalizeKey(item)))) score += 4;
    if (section.keyIdeas.some(item => normalizeKey(item).includes(key))) score += 2;
  }
  if (concept.applications?.length) score += 1;
  if (concept.examples?.length) score += 1;
  return score;
}

function mainSections(pack: DataPack, sections: StudyPlanSection[]): StudyPlanSection[] {
  const relationCounts = new Map<string, number>();
  const sectionByConcept = buildSectionByConcept(sections);
  for (const relation of pack.relationships || []) {
    const section = sectionByConcept.get(relation.from) || sectionByConcept.get(relation.to);
    if (section) relationCounts.set(section.id, (relationCounts.get(section.id) || 0) + 1);
  }

  return [...sections]
    .sort((a, b) => {
      const scoreA = a.conceptIds.length + a.mustMaster.length * 2 + a.keyIdeas.length + (relationCounts.get(a.id) || 0) * 2;
      const scoreB = b.conceptIds.length + b.mustMaster.length * 2 + b.keyIdeas.length + (relationCounts.get(b.id) || 0) * 2;
      return scoreB - scoreA;
    })
    .slice(0, 3);
}

function fromStoredRelation(pack: DataPack, sections: StudyPlanSection[], labels: Map<string, string>, allowedSections: Set<string>, relation: ConceptRelationship, index: number): RelationLine | null {
  const conceptA = getConcept(pack, relation.from);
  const conceptB = getConcept(pack, relation.to);
  if (!conceptA || !conceptB) return null;

  const sectionByConcept = buildSectionByConcept(sections);
  const section = sectionByConcept.get(conceptA.id) || sectionByConcept.get(conceptB.id);
  if (!section || !allowedSections.has(section.id)) return null;
  const conceptAName = relation.conceptA || labels.get(conceptA.id) || conceptA.term;
  const conceptBName = relation.conceptB || labels.get(conceptB.id) || conceptB.term;
  if (normalizeKey(conceptAName) === normalizeKey(conceptBName)) return null;
  const aHint = compactHint(conceptA.shortDefinition || conceptA.definition, conceptAName);
  const bHint = compactHint(conceptB.shortDefinition || conceptB.definition, conceptBName);
  if (!aHint || !bHint) return null;

  return {
    id: `stored-${relation.from}-${relation.to}-${index}`,
    structure: cleanSectionTitle(section?.title || conceptA.category || conceptB.category || 'Clave'),
    conceptA: conceptAName,
    conceptB: conceptBName,
    relation: relationLabel(relation),
    aHint,
    bHint,
  };
}

function fallbackLines(pack: DataPack, sections: StudyPlanSection[], labels: Map<string, string>): RelationLine[] {
  const lines: RelationLine[] = [];
  for (const section of sections) {
    const concepts = section.conceptIds
      .map(id => getConcept(pack, id))
      .filter(Boolean) as PokerConcept[];
    const ranked = [...concepts]
      .sort((a, b) => importance(b, sections) - importance(a, sections))
      .slice(0, 5);

    for (let index = 0; index < ranked.length - 1; index++) {
      const conceptA = ranked[index];
      const conceptB = ranked[index + 1];
      const conceptAName = labels.get(conceptA.id) || conceptA.term;
      const conceptBName = labels.get(conceptB.id) || conceptB.term;
      if (normalizeKey(conceptAName) === normalizeKey(conceptBName)) continue;
      const aHint = compactHint(conceptA.shortDefinition || conceptA.definition, conceptAName);
      const bHint = compactHint(conceptB.shortDefinition || conceptB.definition, conceptBName);
      if (!aHint || !bHint) continue;
      lines.push({
        id: `line-${section.id}-${conceptA.id}-${conceptB.id}`,
        structure: cleanSectionTitle(section.title),
        conceptA: conceptAName,
        conceptB: conceptBName,
        relation: '≠',
        aHint,
        bHint,
      });
    }
  }
  return lines;
}

function buildLines(pack: DataPack, sections: StudyPlanSection[]): RelationLine[] {
  const labels = buildLabels(pack, sections);
  const principalSections = mainSections(pack, sections);
  const allowedSections = new Set(principalSections.map(section => section.id));
  const stored = (pack.relationships || [])
    .map((relation, index) => fromStoredRelation(pack, sections, labels, allowedSections, relation, index))
    .filter(Boolean) as RelationLine[];
  const source = stored.length > 0 ? stored : fallbackLines(pack, principalSections, labels);
  const seen = new Set<string>();
  const perStructure = new Map<string, number>();

  return source.filter(line => {
    const key = `${line.conceptA}|${line.conceptB}`.toLowerCase();
    const reverseKey = `${line.conceptB}|${line.conceptA}`.toLowerCase();
    if (seen.has(key) || seen.has(reverseKey)) return false;
    if (!line.aHint || !line.bHint) return false;
    const structureCount = perStructure.get(line.structure) || 0;
    if (structureCount >= 2) return false;
    perStructure.set(line.structure, structureCount + 1);
    seen.add(key);
    return true;
  }).slice(0, 6);
}

function groupLines(lines: RelationLine[]): RelationGroup[] {
  const groups: RelationGroup[] = [];
  for (const line of lines) {
    let group = groups.find(item => item.structure === line.structure);
    if (!group) {
      group = { structure: line.structure, lines: [] };
      groups.push(group);
    }
    group.lines.push(line);
  }
  return groups;
}

const GROUP_STYLES = [
  {
    border: 'border-accent-green/25',
    header: 'text-accent-green',
    badge: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  },
  {
    border: 'border-accent-gold/25',
    header: 'text-accent-gold',
    badge: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20',
  },
  {
    border: 'border-purple-400/25',
    header: 'text-purple-300',
    badge: 'bg-purple-400/10 text-purple-300 border-purple-400/20',
  },
];

export function StudyRelations({ pack, sections, onMap }: StudyRelationsProps) {
  const lines = buildLines(pack, sections);
  const groups = groupLines(lines);

  return (
    <section className="rounded-3xl border border-border bg-bg-card overflow-hidden" data-study-prompt={RELATIONS_INTERPRETATION_PROMPT}>
      <header className="px-4 py-3 md:px-5 md:py-4 border-b border-border bg-bg-primary/20">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-accent-green">
              <Network className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Relaciones</span>
            </div>
            <p className="text-xs md:text-sm text-text-secondary mt-1">Estructuras principales. Una línea por contraste.</p>
          </div>
          <button onClick={onMap} className="shrink-0 px-3 py-2 rounded-xl bg-accent-gold/12 text-accent-gold font-black text-xs flex items-center gap-2">
            <Link2 className="w-4 h-4" />Mapa
          </button>
        </div>
      </header>

      <div className="p-3 md:p-4 space-y-3 bg-bg-primary/25">
        {groups.map((group, index) => <RelationGroupCard key={group.structure} group={group} style={GROUP_STYLES[index % GROUP_STYLES.length]} />)}
      </div>
    </section>
  );
}

function RelationGroupCard({ group, style }: { group: RelationGroup; style: typeof GROUP_STYLES[number] }) {
  return (
    <section className={`rounded-2xl border ${style.border} bg-bg-secondary/35 overflow-hidden`}>
      <header className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border/80">
        <div className={`text-xs md:text-sm font-black ${style.header}`}>{group.structure}</div>
        <div className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${style.badge}`}>{group.lines.length} relaciones</div>
      </header>
      <div className="divide-y divide-border/70">
        {group.lines.map(line => <RelationRow key={line.id} line={line} style={style} />)}
      </div>
    </section>
  );
}

function RelationRow({ line, style }: { line: RelationLine; style: typeof GROUP_STYLES[number] }) {
  return (
    <article className="px-3 py-2.5 bg-bg-primary/35">
      <div className="min-w-0">
        <div className="text-sm md:text-base font-black text-text-primary leading-tight break-words">
          {line.conceptA} <span className="text-accent-gold">{line.relation}</span> {line.conceptB}
        </div>
        <div className="text-xs md:text-sm text-text-muted leading-snug mt-1 break-words">
          {line.aHint} vs {line.bHint}
        </div>
      </div>
    </article>
  );
}
