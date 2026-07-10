import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Database, Upload, FileText, CheckCircle2, Trash2, Zap, Package, TrendingUp, Video, GraduationCap, BookOpen, Loader2, Edit3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  getAllDataPacks,
  getActiveDataPack,
  setActiveDataPack,
  prepareDataPackFromSources,
  saveDataPackDraft,
  saveDataPackDraftAllowIncomplete,
  deleteDataPack,
  getProgressForPack,
  updateDataPack,
  type DataPack,
  type DataPackDraft,
} from '../../data/dataPackService';
import {
  generateMultipleChoice,
  generatePathQuestions,
  generateTrueFalse,
  type ConceptMapData,
  type CoverageMatrixItem,
  type DataPackSourceType,
  type ParsedDataPack,
  type RawDataPackSource,
  type StudyGuide as ParserStudyGuide,
  type StudyPlan,
} from '../../data/dataPackParser';
import { buildStudyGuideFromText, type StudyGuide, type StudyGuideBlock } from '../../services/studyGuideService';
import { StudyGuideViewer } from './StudyGuideViewer';
import type { PokerConcept } from './pokerKnowledge';

type Preview = {
  mode: 'ai' | 'local';
  conceptCount: number;
  questionCount: number;
  sources: { fileName: string; conceptCount: number }[];
  concepts: { term: string; definition: string; category: string }[];
};

// La API key de OpenRouter la maneja el servidor Express (server.ts) vía .env.local (motor de Sintex)

function getFileOrder(fileName: string, index: number): number {
  const match = fileName.match(/\d+/);
  return match ? Number(match[0]) : index + 1;
}

function buildSourceId(fileName: string, order: number): string {
  return `source-${order}-${fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'txt'}`;
}

async function readTxtFiles(files: FileList, sourceType: DataPackSourceType): Promise<RawDataPackSource[]> {
  const selected = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.txt'));
  const sorted = selected.sort((a, b) => getFileOrder(a.name, 0) - getFileOrder(b.name, 0));
  const limited = sourceType === 'single-video' ? sorted.slice(0, 1) : sorted;

  return Promise.all(limited.map(async (file, index) => {
    const order = sourceType === 'single-video' ? 1 : getFileOrder(file.name, index);
    const content = await file.text();
    return {
      id: buildSourceId(file.name, order),
      order,
      fileName: file.name,
      title: sourceType === 'single-video' ? file.name.replace(/\.txt$/i, '') : `Modulo ${order}`,
      content,
    };
  }));
}

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

function firstSentence(value: string): string {
  return compact(value.split(/[.!?]/)[0] || value, 90);
}

function blockToText(block: StudyGuideBlock): string {
  const title = block.title ? `${block.title}:\n` : '';
  if (block.type === 'paragraph') return `${title}${block.text}`.trim();
  if (block.type === 'list') return `${title}${block.items.join('\n')}`.trim();
  return `${title}${[block.headers, ...block.rows].map(row => row.join(' | ')).join('\n')}`.trim();
}

function guideToMarkdown(guide: StudyGuide): string {
  return [
    `# ${guide.title}`,
    ...guide.sections.flatMap(section => [
      `## ${section.title}`,
      ...section.blocks.map(block => blockToText(block)),
    ]),
  ].join('\n\n');
}

function buildEditableGuideFromPack(pack: DataPack): StudyGuide {
  if (pack.editableGuide?.sections?.length) return pack.editableGuide;

  const planSections = pack.studyPlan?.sections || [];
  if (planSections.length > 0) {
    return {
      title: pack.studyPlan?.title || pack.studyGuide?.title || pack.name,
      sections: planSections.map((section, index) => {
        const concepts = section.conceptIds
          .map(id => pack.concepts.find(concept => concept.id === id))
          .filter(Boolean) as PokerConcept[];
        const blocks: StudyGuideBlock[] = [];
        if (section.summary) blocks.push({ id: `${section.id}-summary`, type: 'paragraph', title: 'Resumen', text: section.summary });
        if (concepts.length > 0) {
          blocks.push({
            id: `${section.id}-concepts`,
            type: 'table',
            title: 'Conceptos',
            headers: ['Concepto', 'Descripcion'],
            rows: concepts.map(concept => [concept.term, concept.shortDefinition || concept.definition]),
          });
        }
        return {
          id: section.id || `section-${index + 1}`,
          title: section.title || `Seccion ${index + 1}`,
          blocks: blocks.length ? blocks : [{ id: `block-${index + 1}`, type: 'paragraph', text: 'Nuevo texto' }],
        };
      }),
    };
  }

  const groups = new Map<string, PokerConcept[]>();
  for (const concept of pack.concepts) {
    const key = concept.category || 'Conceptos principales';
    groups.set(key, [...(groups.get(key) || []), concept]);
  }

  return {
    title: pack.studyGuide?.title || pack.name,
    sections: Array.from(groups.entries()).map(([title, concepts], index) => ({
      id: `section-${sanitizeId(title) || index + 1}`,
      title,
      blocks: [{
        id: `block-${index + 1}`,
        type: 'table',
        title: 'Conceptos',
        headers: ['Concepto', 'Descripcion'],
        rows: concepts.map(concept => [concept.term, concept.shortDefinition || concept.definition]),
      }],
    })),
  };
}

function parseItemConcept(item: string): { term: string; definition: string } {
  const colonMatch = item.match(/^(.{2,70}?)\s*[:|]\s*(.{8,})$/);
  if (colonMatch) return { term: compact(colonMatch[1], 48), definition: compact(colonMatch[2], 220) };
  const dashMatch = item.match(/^(.{2,70}?)\s+[–—-]\s+(.{8,})$/);
  if (dashMatch) return { term: compact(dashMatch[1], 48), definition: compact(dashMatch[2], 220) };
  const words = item.split(/\s+/).slice(0, 6).join(' ');
  return { term: compact(words, 48), definition: compact(item, 220) };
}

function guideToParsedDataPack(guide: StudyGuide, pack: DataPack): ParsedDataPack {
  const concepts: PokerConcept[] = [];
  const relationships: ParsedDataPack['relationships'] = [];
  const seen = new Set<string>();
  const sectionConceptIds = new Map<string, string[]>();

  const addConcept = (sectionId: string, sectionTitle: string, termValue: string, definitionValue: string) => {
    const term = compact(termValue, 48);
    const definition = compact(definitionValue, 220);
    if (!term || definition.length < 8) return;
    const base = sanitizeId(`${sectionTitle}-${term}`) || `concept-${concepts.length + 1}`;
    let id = base;
    let suffix = 2;
    while (seen.has(id)) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }
    seen.add(id);
    concepts.push({
      id,
      term,
      definition,
      shortDefinition: firstSentence(definition),
      category: compact(sectionTitle.replace(/^\d+\.\s*/, ''), 36),
      sourceId: pack.sources?.[0]?.id,
      sourceTitle: pack.sources?.[0]?.title,
    });
    sectionConceptIds.set(sectionId, [...(sectionConceptIds.get(sectionId) || []), id]);
  };

  for (const section of guide.sections) {
    for (const block of section.blocks) {
      if (block.type === 'table') {
        for (const row of block.rows) {
          addConcept(section.id, section.title, row[0] || block.title || section.title, row.slice(1).join('. ') || row[0] || block.title || section.title);
        }
        continue;
      }
      if (block.type === 'list') {
        for (const item of block.items) {
          const parsed = parseItemConcept(item);
          addConcept(section.id, section.title, parsed.term, parsed.definition);
        }
        continue;
      }
      const sentences = block.text.split(/(?<=[.!?])\s+/).map(item => item.trim()).filter(item => item.length >= 24);
      if (sentences.length === 0 && block.text.trim()) {
        addConcept(section.id, section.title, block.title || section.title, block.text);
      }
      for (const sentence of sentences.slice(0, 8)) {
        const parsed = parseItemConcept(sentence);
        addConcept(section.id, section.title, parsed.term, parsed.definition);
      }
    }
  }

  const summary = compact(guide.sections.flatMap(section => section.blocks.map(blockToText)).join(' '), 700);
  const parserGuide: ParserStudyGuide = {
    title: guide.title,
    summary,
    sections: guide.sections.map(section => ({
      title: section.title,
      content: section.blocks.map(blockToText).filter(Boolean),
    })),
    classificationTables: guide.sections.flatMap(section => section.blocks
      .filter((block): block is Extract<StudyGuideBlock, { type: 'table' }> => block.type === 'table')
      .map(block => ({ title: block.title || section.title, headers: block.headers, rows: block.rows }))),
    glossary: concepts.map(concept => ({ term: concept.term, definition: concept.shortDefinition || concept.definition })),
    reviewQuestions: [],
    essayPrompts: [],
  };

  const studyPlanSections: StudyPlan['sections'] = guide.sections.map((section, index) => {
    const conceptIds = sectionConceptIds.get(section.id) || [];
    return {
      id: section.id || `section-${index + 1}`,
      title: section.title,
      summary: compact(section.blocks.map(blockToText).join(' '), 180) || `Seccion con ${conceptIds.length} conceptos.`,
      keyIdeas: conceptIds.map(id => concepts.find(concept => concept.id === id)?.shortDefinition || '').filter(Boolean).slice(0, 5),
      mustMaster: conceptIds.map(id => concepts.find(concept => concept.id === id)?.term || '').filter(Boolean).slice(0, 5),
      conceptIds,
    };
  });

  const studyPlan: StudyPlan = {
    title: guide.title,
    objective: 'Dominar los conceptos principales guardados en Datos.',
    summary,
    sections: studyPlanSections,
    glossary: concepts.map(concept => ({ term: concept.term, definition: concept.shortDefinition || concept.definition, conceptId: concept.id })),
    flashcards: concepts.map(concept => ({ id: `flashcard-${concept.id}`, conceptId: concept.id, front: concept.term, back: concept.definition })),
    practicalCases: studyPlanSections.map((section, index) => ({ id: `case-${index + 1}`, title: `Aplicar ${section.title}`, prompt: section.summary, conceptIds: section.conceptIds.slice(0, 5) })),
    reviewQuestions: [],
    commonMistakes: [],
    comparisons: [],
    mustMaster: concepts.slice(0, 12).map(concept => concept.term),
    recommendedPath: studyPlanSections.map((section, index) => ({ id: `path-${index + 1}`, title: section.title, description: section.summary, conceptIds: section.conceptIds })),
  };

  const conceptMap: ConceptMapData = {
    rootId: 'root',
    nodes: [{ id: 'root', label: guide.title, type: 'root' }],
    edges: [],
  };
  for (const section of studyPlanSections) {
    const sectionNodeId = `section-${sanitizeId(section.id)}`;
    conceptMap.nodes.push({ id: sectionNodeId, label: section.title, type: 'section', parentId: 'root' });
    conceptMap.edges.push({ id: `edge-root-${sectionNodeId}`, from: 'root', to: sectionNodeId });
    for (const conceptId of section.conceptIds) {
      const concept = concepts.find(item => item.id === conceptId);
      if (!concept) continue;
      const nodeId = `concept-${concept.id}`;
      conceptMap.nodes.push({ id: nodeId, label: concept.term, type: 'concept', parentId: sectionNodeId, conceptId: concept.id });
      conceptMap.edges.push({ id: `edge-${sectionNodeId}-${nodeId}`, from: sectionNodeId, to: nodeId });
    }
  }

  const coverageMatrix: CoverageMatrixItem[] = studyPlanSections.map(section => ({
    blockId: section.id,
    title: section.title,
    summary: section.summary,
    status: section.conceptIds.length > 0 ? 'used' : 'discarded',
    extractedConceptIds: section.conceptIds,
    reason: section.conceptIds.length > 0 ? 'Seccion editable usada para generar datos.' : 'Seccion sin conceptos detectables.',
    importance: section.conceptIds.length >= 6 ? 'high' : section.conceptIds.length > 0 ? 'medium' : 'low',
  }));

  const multipleChoiceQuestions = generateMultipleChoice(concepts);
  const pathQuestions = generatePathQuestions(concepts);
  const trueFalseQuestions = generateTrueFalse(concepts);
  const questionCount = multipleChoiceQuestions.length + pathQuestions.length + trueFalseQuestions.length;

  return {
    studyGuide: parserGuide,
    studyPlan,
    conceptMap,
    coverageMatrix,
    concepts,
    multipleChoiceQuestions,
    pathQuestions,
    trueFalseQuestions,
    sources: pack.sources,
    relationships,
    metadata: {
      schemaVersion: 1,
      promptVersion: 'editable-guide-v1',
      sourceType: pack.sourceType,
      sourceCount: pack.sources?.length || 1,
      conceptCount: concepts.length,
      questionCount,
      relationshipCount: relationships.length,
      quality: {
        density: concepts.length,
        hasEnoughConcepts: concepts.length >= 6,
        hasEnoughQuestions: questionCount >= concepts.length,
      },
    },
  };
}

function buildPackFromEditableGuide(pack: DataPack, guide: StudyGuide): DataPack {
  const parsed = guideToParsedDataPack(guide, pack);
  return {
    ...pack,
    name: guide.title || pack.name,
    studyGuide: parsed.studyGuide,
    studyPlan: parsed.studyPlan,
    conceptMap: parsed.conceptMap,
    coverageMatrix: parsed.coverageMatrix,
    concepts: parsed.concepts,
    multipleChoiceQuestions: parsed.multipleChoiceQuestions,
    pathQuestions: parsed.pathQuestions,
    trueFalseQuestions: parsed.trueFalseQuestions,
    relationships: parsed.relationships,
    metadata: parsed.metadata,
    editableGuide: guide,
    rawContent: guideToMarkdown(guide),
  };
}

export function DataPackManager() {
  const [packs, setPacks] = useState<DataPack[]>(() => getAllDataPacks());
  const [activeId, setActiveId] = useState<string>(() => getActiveDataPack()?.id || 'codex-poker');
  const [showCreate, setShowCreate] = useState(false);
  const [sourceType, setSourceType] = useState<DataPackSourceType>('single-video');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [sources, setSources] = useState<RawDataPackSource[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [draft, setDraft] = useState<DataPackDraft | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
  const [studyGuideLoading, setStudyGuideLoading] = useState(false);
  const [studyGuideError, setStudyGuideError] = useState('');
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [editingGuide, setEditingGuide] = useState<StudyGuide | null>(null);
  const [guideDirty, setGuideDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshPacks = () => {
    setPacks(getAllDataPacks());
    setActiveId(getActiveDataPack()?.id || 'codex-poker');
  };

  const getMasteryPercentage = (pack: DataPack): number => {
    const progress = getProgressForPack(pack.id);
    if (pack.concepts.length === 0) return 0;
    const totalScore = Object.values(progress.conceptMastery).reduce((sum, m) => sum + m.score, 0);
    const maxScore = pack.concepts.length * 100;
    return Math.round((totalScore / maxScore) * 100);
  };

  const getMasteryLevel = (percentage: number): { label: string; color: string } => {
    if (percentage >= 90) return { label: 'Dominado', color: 'text-emerald-400' };
    if (percentage >= 70) return { label: 'Avanzado', color: 'text-green-400' };
    if (percentage >= 50) return { label: 'Intermedio', color: 'text-amber-400' };
    if (percentage >= 25) return { label: 'Aprendiendo', color: 'text-orange-400' };
    return { label: 'Nuevo', color: 'text-text-muted' };
  };

  const resetCreateForm = () => {
    setNewName('');
    setNewDescription('');
    setSources([]);
    setPreview(null);
    setDraft(null);
    setStudyGuide(null);
    setStudyGuideError('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEditingPack = (pack: DataPack) => {
    if (pack.type === 'codex') return;
    setEditingPackId(pack.id);
    setEditingGuide(buildEditableGuideFromPack(pack));
    setGuideDirty(false);
    setExpandedPackId(pack.id);
  };

  const handleEditingGuideChange = (guide: StudyGuide) => {
    setEditingGuide(guide);
    setGuideDirty(true);
  };

  const handleSaveEditingGuide = () => {
    if (!editingPackId || !editingGuide) return;
    const currentPack = packs.find(pack => pack.id === editingPackId);
    if (!currentPack || currentPack.type === 'codex') return;

    try {
      const updatedPack = updateDataPack(buildPackFromEditableGuide(currentPack, editingGuide));
      if (activeId === updatedPack.id) setActiveDataPack(updatedPack.id);
      refreshPacks();
      setEditingGuide(updatedPack.editableGuide || editingGuide);
      setGuideDirty(false);
      setSuccess('Datos de juego guardados. Resumen, mapa y juegos se regeneraron desde esta guía.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.');
    }
  };

  const buildPreview = (nextSources: RawDataPackSource[]) => {
    setPreview({
      mode: 'ai',
      conceptCount: 0,
      questionCount: 0,
      sources: nextSources.map(source => ({ fileName: source.fileName, conceptCount: 0 })),
      concepts: [],
    });
    setError('');
  };

  const handleSourceTypeChange = (nextType: DataPackSourceType) => {
    setSourceType(nextType);
    setSources([]);
    setPreview(null);
    setDraft(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError('');
    const nextSources = await readTxtFiles(files, sourceType);
    if (nextSources.length === 0) {
      setError('Sube archivos .txt. Otros formatos no se procesan en juegos.');
      return;
    }
    setSources(nextSources);
    setDraft(null);
    setStudyGuide(null);
    setStudyGuideError('');
    const nextName = newName.trim() || (sourceType === 'single-video' ? nextSources[0].title : 'Curso de Estudio');
    if (!newName.trim()) {
      setNewName(nextName);
    }
    buildPreview(nextSources);
    void processUploadedSources(nextSources, nextName);
  };

  

  const handleBuildDraft = async () => {
    if (!newName.trim()) {
      setError('Ingresa un nombre para este conocimiento.');
      return;
    }
    if (sources.length === 0) {
      setError('Sube al menos un archivo .txt.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      const combined = sources.map(s => `# ${s.fileName}\n\n${s.content}`).join('\n\n---\n\n');
      const editableGuide = studyGuide || await buildStudyGuideFromText(combined);
      const nextDraftBase = prepareDataPackFromSources(newName, newDescription, sourceType, sources);
      const nextDraft = {
        ...nextDraftBase,
        pack: buildPackFromEditableGuide(nextDraftBase.pack, editableGuide),
      };

      setDraft(nextDraft);
      if (nextDraft.report.blockers.length > 0) {
        setError('Revisión bloqueada: corrige la cobertura antes de activar.');
      } else {
        setSuccess(`Revisión generada: ${nextDraft.pack.concepts.length} conceptos listos para activar.`);
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando el TXT.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processUploadedSources = async (nextSources: RawDataPackSource[], nextName: string) => {
    const combined = nextSources.map(s => `# ${s.fileName}\n\n${s.content}`).join('\n\n---\n\n');
    setStudyGuideLoading(true);
    setStudyGuideError('');
    let generatedGuide: StudyGuide | null = null;

    try {
      generatedGuide = await buildStudyGuideFromText(combined);
      setStudyGuide(generatedGuide);
    } catch (err) {
      setStudyGuideLoading(false);
      setStudyGuideError(err instanceof Error ? err.message : 'Error generando la guía editable.');
      setError(err instanceof Error ? err.message : 'Error generando la guía editable.');
      return;
    } finally {
      setStudyGuideLoading(false);
    }

    if (!generatedGuide) return;

    try {
      const nextDraftBase = prepareDataPackFromSources(nextName, newDescription, sourceType, nextSources);
      const editableGuide = generatedGuide;
      const nextDraft = {
        ...nextDraftBase,
        pack: buildPackFromEditableGuide(nextDraftBase.pack, editableGuide),
      };
      setDraft(nextDraft);
      const pack = saveDataPackDraftAllowIncomplete(nextDraft);
      setActiveDataPack(pack.id);
      setEditingPackId(pack.id);
      setEditingGuide(pack.editableGuide || editableGuide);
      setGuideDirty(false);
      setExpandedPackId(pack.id);
      setShowCreate(false);
      resetCreateForm();
      refreshPacks();
      setSuccess(`Documento "${pack.name}" creado y activado automáticamente para editar.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando datos jugables.');
    }
  };

  const handleActivateDraft = () => {
    if (!draft) return;
    try {
      const pack = saveDataPackDraft(draft);
      setActiveDataPack(pack.id);
      setShowCreate(false);
      setEditingPackId(pack.id);
      setEditingGuide(pack.editableGuide || buildEditableGuideFromPack(pack));
      setGuideDirty(false);
      setExpandedPackId(pack.id);
      resetCreateForm();
      refreshPacks();
      setSuccess(`Conocimiento "${pack.name}" creado con ${pack.concepts.length} conceptos y activado para juegos.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo activar el DataPack.');
    }
  };

  const handleActivate = (id: string) => {
    setActiveDataPack(id);
    refreshPacks();
  };

  const handleDelete = (id: string) => {
    if (id === 'codex-poker') return;
    deleteDataPack(id);
    refreshPacks();
  };

  const handleCancel = () => {
    setShowCreate(false);
    resetCreateForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gradient-gold flex items-center gap-2">
            <Database className="w-6 h-6" />
            Conocimiento para Juegos
          </h2>
          <p className="text-text-secondary mt-1 text-sm">
            Sube TXT, crea DataPacks y activa el conocimiento que alimenta todos los juegos.
          </p>
        </div>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2 shrink-0">
            <Upload className="w-4 h-4" />
            Crear
          </button>
        )}
      </div>

      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 bg-accent-green/10 border-accent-green flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-accent-green" />
          <p className="text-accent-green font-bold text-sm">{success}</p>
        </motion.div>
      )}

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 md:p-6 space-y-4">
          <h3 className="text-lg font-bold text-text-primary">Nuevo conocimiento jugable</h3>

          <div className="card p-4 bg-bg-primary border-border space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted block">Motor de datos</label>
                <p className="text-xs text-text-secondary mt-1">
                  Sintex transforma el TXT en el documento editable de Datos. La API key se configura en el servidor (.env.local).
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0 bg-accent-green/20 text-accent-green">
                SINTEX
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSourceTypeChange('single-video')}
              className={cn(
                'p-4 rounded-xl border text-left transition-all',
                sourceType === 'single-video' ? 'border-accent-green bg-accent-green/10' : 'border-border bg-bg-primary hover:border-accent-green/40'
              )}
            >
              <Video className="w-5 h-5 text-accent-green mb-2" />
              <div className="font-bold text-sm">Video único</div>
              <div className="text-xs text-text-muted mt-1">Un solo archivo .txt.</div>
            </button>
            <button
              onClick={() => handleSourceTypeChange('course')}
              className={cn(
                'p-4 rounded-xl border text-left transition-all',
                sourceType === 'course' ? 'border-accent-gold bg-accent-gold/10' : 'border-border bg-bg-primary hover:border-accent-gold/40'
              )}
            >
              <GraduationCap className="w-5 h-5 text-accent-gold mb-2" />
              <div className="font-bold text-sm">Curso</div>
              <div className="text-xs text-text-muted mt-1">Varios TXT numerados.</div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">Nombre</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setDraft(null); }}
                placeholder={sourceType === 'single-video' ? 'Ej: Video de 3Bet Pots' : 'Ej: Curso Mental Game'}
                className="w-full bg-bg-primary border border-border rounded-lg px-4 py-3 text-text-primary focus:border-accent-gold focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">Descripcion opcional</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => { setNewDescription(e.target.value); setDraft(null); }}
                placeholder="Ej: Conceptos para entrenar en juegos"
                className="w-full bg-bg-primary border border-border rounded-lg px-4 py-3 text-text-primary focus:border-accent-gold focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
              {sourceType === 'single-video' ? 'Subir 1 TXT' : 'Subir TXT del curso'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              multiple={sourceType === 'course'}
              onChange={handleFileUpload}
              className="w-full bg-bg-primary border border-border rounded-lg px-4 py-3 text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-gold/20 file:text-accent-gold file:font-bold file:cursor-pointer"
            />
            <p className="text-xs text-text-muted mt-2">
              {sourceType === 'single-video'
                ? 'La app convertira ese TXT en conceptos y preguntas para todos los juegos.'
                : 'Selecciona varios TXT. Se ordenan por el numero del nombre: 1.txt, 2.txt, 3.txt.'}
            </p>
          </div>

          {sources.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sources.map(source => (
                <div key={source.id} className="p-3 rounded-lg bg-bg-primary border border-border flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent-gold shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{source.fileName}</div>
                    <div className="text-[10px] text-text-muted">Orden {source.order} · {source.content.length} caracteres</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">{error}</div>}

          {preview && preview.conceptCount > 0 && (
            <div className="p-4 rounded-lg bg-bg-primary border border-accent-green/30 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="px-2 py-1 rounded bg-accent-green/10 text-accent-green">{preview.conceptCount} conceptos</span>
                <span className="px-2 py-1 rounded bg-accent-gold/10 text-accent-gold">{preview.questionCount} preguntas</span>
                <span className="px-2 py-1 rounded bg-bg-secondary text-text-secondary">{sources.length} TXT</span>
              </div>
              <div className="space-y-2">
                {preview.concepts.map((concept, i) => (
                  <div key={`${concept.term}-${i}`} className="p-2 rounded bg-bg-secondary">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary text-sm">{concept.term}</span>
                      <span className="text-[9px] text-accent-gold uppercase font-bold">{concept.category}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{concept.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview?.mode === 'ai' && (
            <div className="p-4 rounded-lg bg-bg-primary border border-accent-green/30 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="px-2 py-1 rounded bg-accent-green/10 text-accent-green">IA estructuradora activa</span>
                <span className="px-2 py-1 rounded bg-bg-secondary text-text-secondary">{sources.length} TXT</span>
                {studyGuideLoading && (
                  <span className="px-2 py-1 rounded bg-accent-gold/15 text-accent-gold flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generando guía...
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">
                {studyGuide
                  ? 'La guía editable ya está lista. Puedes editar, eliminar o agregar secciones.'
                  : 'Al subir el TXT, la IA genera la guía editable y los datos para los juegos en segundo plano.'}
              </p>
              {studyGuideError && (
                <p className="text-xs text-red-300">{studyGuideError}</p>
              )}
            </div>
          )}

          {studyGuide && (
            <StudyGuideViewer guide={studyGuide} onChange={setStudyGuide} />
          )}

          {draft && (
            <div className="p-4 rounded-xl bg-bg-primary border border-accent-gold/30 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-text-primary">Revisión antes de activar</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    El DataPack todavía no se guardó. Revisa cobertura, categorías y bloqueos antes de enviarlo a juegos.
                  </p>
                </div>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-1 rounded-full shrink-0',
                  draft.report.status === 'ready' ? 'bg-accent-green/20 text-accent-green' :
                    draft.report.status === 'warning' ? 'bg-accent-gold/20 text-accent-gold' :
                      'bg-red-500/20 text-red-300'
                )}>
                  {draft.report.status === 'ready' ? 'LISTO' : draft.report.status === 'warning' ? 'CON AVISOS' : 'BLOQUEADO'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold">
                <div className="p-3 rounded-lg bg-bg-secondary">
                  <div className="text-text-muted uppercase text-[9px]">Conceptos</div>
                  <div className="text-lg text-text-primary">{draft.report.conceptCount}</div>
                </div>
                <div className="p-3 rounded-lg bg-bg-secondary">
                  <div className="text-text-muted uppercase text-[9px]">Preguntas</div>
                  <div className="text-lg text-text-primary">{draft.report.questionCount}</div>
                </div>
                <div className="p-3 rounded-lg bg-bg-secondary">
                  <div className="text-text-muted uppercase text-[9px]">Categorias</div>
                  <div className="text-lg text-text-primary">{draft.report.categoryCount}</div>
                </div>
                <div className="p-3 rounded-lg bg-bg-secondary">
                  <div className="text-text-muted uppercase text-[9px]">Fuentes</div>
                  <div className="text-lg text-text-primary">{draft.report.sourceCount}</div>
                </div>
              </div>

              {draft.report.blockers.length > 0 && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/40 space-y-1">
                  <div className="text-xs font-bold uppercase text-red-300">Bloqueos</div>
                  {draft.report.blockers.map((item, i) => (
                    <p key={`${item}-${i}`} className="text-xs text-red-200">{item}</p>
                  ))}
                </div>
              )}

              {draft.report.warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-accent-gold/10 border border-accent-gold/30 space-y-1">
                  <div className="text-xs font-bold uppercase text-accent-gold">Avisos</div>
                  {draft.report.warnings.map((item, i) => (
                    <p key={`${item}-${i}`} className="text-xs text-text-secondary">{item}</p>
                  ))}
                </div>
              )}

              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Cobertura por juego</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {draft.report.coverage.map(item => (
                    <div key={item.game} className="p-3 rounded-lg bg-bg-secondary border border-border flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-text-primary">{item.game}</div>
                        <div className="text-[10px] text-text-muted">{item.detail}</div>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full shrink-0', item.ready ? 'bg-accent-green/20 text-accent-green' : 'bg-red-500/20 text-red-300')}>
                        {item.ready ? 'OK' : 'FALTA'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Categorias detectadas</div>
                <div className="flex flex-wrap gap-2">
                  {draft.report.categories.map(category => (
                    <span key={category.name} className="px-2 py-1 rounded bg-bg-secondary text-xs text-text-secondary">
                      <strong className="text-text-primary">{category.name}</strong> · {category.count}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {draft.pack.concepts.slice(0, 12).map(concept => (
                  <div key={concept.id} className="p-3 rounded-lg bg-bg-secondary border border-border">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-text-primary truncate">{concept.term}</span>
                      <span className="text-[9px] text-accent-gold uppercase font-bold shrink-0">{concept.category}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{concept.shortDefinition || concept.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleCancel} className="flex-1 px-6 py-2 bg-bg-secondary hover:bg-bg-card rounded-lg font-bold text-text-secondary">
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {packs.map((pack) => {
          const isActive = pack.id === activeId;
          const progress = getProgressForPack(pack.id);
          const mastery = getMasteryPercentage(pack);
          const masteryLevel = getMasteryLevel(mastery);
          const dominatedCount = pack.concepts.filter(concept => (progress.conceptMastery[concept.id]?.score || 50) >= 80).length;
          return (
            <motion.div key={pack.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('card p-5 transition-all', isActive ? 'border-accent-green glow-green' : 'hover:border-accent-gold/30')}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                  <div className={cn('w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0', isActive ? 'bg-accent-green/20' : 'bg-accent-gold/10')}>
                    {pack.type === 'codex' ? <Package className={cn('w-5 h-5 md:w-6 md:h-6', isActive ? 'text-accent-green' : 'text-accent-gold')} /> : <Database className={cn('w-5 h-5 md:w-6 md:h-6', isActive ? 'text-accent-green' : 'text-accent-gold')} />}
                  </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-text-primary">{pack.name}</h3>
                    {isActive && <span className="px-2 py-0.5 rounded-full bg-accent-green/20 text-accent-green text-[10px] font-bold">ACTIVO</span>}
                    <span className="px-2 py-0.5 rounded-full border border-border text-text-muted text-[10px] font-bold">
                      {pack.sourceType === 'course' ? 'CURSO' : pack.sourceType === 'single-video' ? 'VIDEO' : pack.type.toUpperCase()}
                    </span>
                  </div>
                  {pack.description && <p className="text-sm text-text-secondary mt-1">{pack.description}</p>}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className={cn('w-3.5 h-3.5', masteryLevel.color)} />
                        <span className={cn('text-xs font-bold', masteryLevel.color)}>{masteryLevel.label}</span>
                      </div>
                      <span className="text-xs font-bold text-text-muted">{mastery}% dominio</span>
                    </div>
                    <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${mastery}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} className={cn('h-full rounded-full', mastery >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : mastery >= 50 ? 'bg-gradient-to-r from-amber-500 to-green-400' : 'bg-gradient-to-r from-accent-gold to-amber-400')} />
                    </div>
                     <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-[10px] md:text-xs text-text-muted">
                    <span>{pack.concepts.length} conceptos</span>
                    <span>·</span>
                    <span>{dominatedCount} dominados</span>
                    <span>·</span>
                    <span>{Math.max(0, pack.concepts.length - dominatedCount)} pendientes</span>
                    <span>·</span>
                    <span>{pack.sources?.length || 1} fuente(s)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap md:shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-border/20 justify-end">
              {pack.type !== 'codex' && (
                <button
                  onClick={() => startEditingPack(pack)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1',
                    editingPackId === pack.id ? 'bg-accent-gold/20 text-accent-gold' : 'bg-bg-secondary hover:bg-bg-card text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Edit3 className="w-3 h-3" />
                  <span className="hidden sm:inline">Editar datos</span>
                  <span className="inline sm:hidden">Editar</span>
                </button>
              )}
                  <button
                    onClick={() => setExpandedPackId(expandedPackId === pack.id ? null : pack.id)}
                    className="px-3 py-1.5 bg-bg-secondary hover:bg-bg-card text-text-secondary hover:text-text-primary rounded-lg text-sm font-bold"
                  >
                    {expandedPackId === pack.id ? 'Ocultar' : 'Ver conceptos'}
                  </button>
                  {!isActive && (
                    <button onClick={() => handleActivate(pack.id)} className="px-3 py-1.5 bg-accent-green/20 hover:bg-accent-green/30 text-accent-green rounded-lg text-sm font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Activar
                    </button>
                  )}
                  {pack.type !== 'codex' && (
                    <button onClick={() => handleDelete(pack.id)} className="p-1.5 hover:bg-red-900/30 text-text-muted hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {editingPackId === pack.id && editingGuide && (
                <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                  <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/10 p-3">
                    <div className="text-xs font-bold uppercase tracking-widest text-accent-gold">Raiz editable de datos</div>
                    <p className="text-xs text-text-secondary mt-1">
                      Edita, elimina, agrega o reordena bloques. Al guardar se regeneran los conceptos, el resumen, el mapa y los datos de juegos desde esta estructura.
                    </p>
                  </div>
                  <StudyGuideViewer
                    guide={editingGuide}
                    onChange={handleEditingGuideChange}
                    onSave={handleSaveEditingGuide}
                    dirty={guideDirty}
                  />
                </div>
              )}
              {expandedPackId === pack.id && (
                <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs font-bold mb-3">
                    <span className="px-2 py-1 rounded bg-accent-green/10 text-accent-green">{pack.concepts.length} conceptos totales</span>
                    <span className="px-2 py-1 rounded bg-accent-gold/10 text-accent-gold">{Math.max(0, pack.concepts.length - dominatedCount)} por dominar</span>
                    <span className="px-2 py-1 rounded bg-bg-secondary text-text-secondary">La frecuencia en juegos prioriza los menos dominados</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                    {pack.concepts.map(concept => {
                      const score = progress.conceptMastery[concept.id]?.score || 50;
                      return (
                        <div key={concept.id} className="p-3 rounded-lg bg-bg-primary border border-border">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-text-primary truncate">{concept.term}</div>
                              <div className="text-[9px] font-bold uppercase text-accent-gold mt-0.5">{concept.category}</div>
                            </div>
                            <span className={cn('text-[10px] font-bold shrink-0', score >= 80 ? 'text-accent-green' : score <= 35 ? 'text-accent-red' : 'text-accent-gold')}>
                              {score}%
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-2 leading-relaxed">{concept.shortDefinition || concept.definition}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
