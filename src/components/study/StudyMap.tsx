import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DataPack } from '../../data/dataPackService';
import type { StudyPlanSection } from '../../data/dataPackParser';
import type { PokerConcept } from '../training/pokerKnowledge';
import { buildConceptLabels, cleanSectionTitle, cleanStudyTitle, MAP_INTERPRETATION_PROMPT } from './studyInterpretation';

interface ConceptTreeNode {
  id: string;
  title: string;
  concept?: PokerConcept;
  concepts?: PokerConcept[];
  children?: ConceptTreeNode[];
}

interface StudyMapProps {
  pack: DataPack;
  sections: StudyPlanSection[];
  onSelect: (concept: PokerConcept) => void;
  onPractice: (title: string, concepts: PokerConcept[]) => void;
}

function getConcept(pack: DataPack, conceptId: string): PokerConcept | undefined {
  return pack.concepts.find(concept => concept.id === conceptId);
}

function collectCollapsibleNodeIds(node: ConceptTreeNode): string[] {
  const ids: string[] = [];
  const walk = (current: ConceptTreeNode) => {
    if (current.children?.length) ids.push(current.id);
    current.children?.forEach(walk);
  };
  walk(node);
  return ids;
}

function getInitialCollapsedNodeIds(rootNode: ConceptTreeNode): Set<string> {
  const ids = new Set(collectCollapsibleNodeIds(rootNode));
  ids.delete(rootNode.id);
  return ids;
}

export function StudyMap({ pack, sections, onSelect }: StudyMapProps) {
  const rootNode = useMemo<ConceptTreeNode>(() => ({
    id: 'study-root',
    title: cleanStudyTitle(pack),
    concepts: pack.concepts,
    children: sections.map(section => {
      const concepts = section.conceptIds.map(id => getConcept(pack, id)).filter(Boolean) as PokerConcept[];
      const labels = buildConceptLabels(concepts, section);
      return {
        id: `section-${section.id}`,
        title: cleanSectionTitle(section.title),
        concepts,
        children: concepts.map(concept => ({
            id: `concept-${concept.id}`,
            title: labels.get(concept.id) || concept.term,
            concept,
            concepts: [concept],
          })),
      };
    }),
  }), [pack, sections]);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCollapsedIds(getInitialCollapsedNodeIds(rootNode));
  }, [rootNode]);

  const toggleNode = (id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="study-map-surface overflow-auto bg-bg-primary p-4 md:p-6 min-h-[320px] md:min-h-[640px]" data-study-prompt={MAP_INTERPRETATION_PROMPT}>
      <div className="min-w-fit">
        <ul className="study-map-root study-map-compact">
          <ConceptTreeNodeView node={rootNode} collapsedIds={collapsedIds} onConceptSelect={onSelect} onToggle={toggleNode} />
        </ul>
      </div>
    </section>
  );
}

function ConceptTreeNodeView({ node, collapsedIds, onConceptSelect, onToggle }: { node: ConceptTreeNode; collapsedIds: Set<string>; onConceptSelect: (concept: PokerConcept) => void; onToggle: (id: string) => void }) {
  const hasChildren = !!node.children?.length;
  const isCollapsed = collapsedIds.has(node.id);
  const handleClick = () => {
    if (node.concept) onConceptSelect(node.concept);
    else if (hasChildren) onToggle(node.id);
  };

  return (
    <li className="study-map-li">
      <div
        className={cn('study-map-card', node.id === 'study-root' && 'study-map-card-root')}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
          }
        }}
      >
        <span className="study-map-card-title">{node.title}</span>
        {hasChildren && (
          <button type="button" className="study-map-toggle" onClick={event => { event.stopPropagation(); onToggle(node.id); }} aria-label={isCollapsed ? 'Expandir' : 'Contraer'}>
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', isCollapsed && '-rotate-90')} />
          </button>
        )}
      </div>
      {hasChildren && !isCollapsed && (
        <ul className="study-map-children">
          {node.children!.map(child => <ConceptTreeNodeView key={child.id} node={child} collapsedIds={collapsedIds} onConceptSelect={onConceptSelect} onToggle={onToggle} />)}
        </ul>
      )}
    </li>
  );
}
