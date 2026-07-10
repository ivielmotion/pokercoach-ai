import { ArrowDown, ArrowUp, List, Plus, Save, Table2, Trash2, Type } from 'lucide-react';
import type { StudyGuide, StudyGuideBlock } from '../../services/studyGuideService';

interface StudyGuideViewerProps {
  guide: StudyGuide;
  onChange: (guide: StudyGuide) => void;
  onSave?: () => void;
  dirty?: boolean;
  saveLabel?: string;
}

function newBlock(type: StudyGuideBlock['type']): StudyGuideBlock {
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (type === 'list') return { id, type, title: 'Lista de conceptos', items: ['Nuevo punto'] };
  if (type === 'table') return { id, type, title: 'Tabla', headers: ['Concepto', 'Descripcion'], rows: [['Nuevo concepto', 'Nueva descripcion']] };
  return { id, type: 'paragraph', title: 'Definicion', text: 'Nuevo texto' };
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function StudyGuideViewer({ guide, onChange, onSave, dirty, saveLabel = 'Guardar cambios' }: StudyGuideViewerProps) {
  const updateTitle = (title: string) => onChange({ ...guide, title });

  const updateSectionTitle = (sectionId: string, title: string) => {
    onChange({
      ...guide,
      sections: guide.sections.map(section => section.id === sectionId ? { ...section, title } : section),
    });
  };

  const updateBlock = (sectionId: string, blockId: string, updater: (block: StudyGuideBlock) => StudyGuideBlock) => {
    onChange({
      ...guide,
      sections: guide.sections.map(section => section.id === sectionId
        ? { ...section, blocks: section.blocks.map(block => block.id === blockId ? updater(block) : block) }
        : section),
    });
  };

  const updateParagraph = (sectionId: string, blockId: string, text: string) => {
    updateBlock(sectionId, blockId, block => block.type === 'paragraph' ? { ...block, text } : block);
  };

  const updateBlockTitle = (sectionId: string, blockId: string, title: string) => {
    updateBlock(sectionId, blockId, block => ({ ...block, title }));
  };

  const updateListItem = (sectionId: string, blockId: string, itemIndex: number, value: string) => {
    updateBlock(sectionId, blockId, block => block.type === 'list'
      ? { ...block, items: block.items.map((item, index) => index === itemIndex ? value : item) }
      : block);
  };

  const addListItem = (sectionId: string, blockId: string) => {
    updateBlock(sectionId, blockId, block => block.type === 'list' ? { ...block, items: [...block.items, 'Nuevo punto'] } : block);
  };

  const deleteListItem = (sectionId: string, blockId: string, itemIndex: number) => {
    updateBlock(sectionId, blockId, block => block.type === 'list'
      ? { ...block, items: block.items.filter((_, index) => index !== itemIndex) }
      : block);
  };

  const moveListItem = (sectionId: string, blockId: string, itemIndex: number, direction: -1 | 1) => {
    updateBlock(sectionId, blockId, block => block.type === 'list'
      ? { ...block, items: moveItem(block.items, itemIndex, direction) }
      : block);
  };

  const updateTableHeader = (sectionId: string, blockId: string, columnIndex: number, value: string) => {
    updateBlock(sectionId, blockId, block => block.type === 'table'
      ? { ...block, headers: block.headers.map((header, index) => index === columnIndex ? value : header) }
      : block);
  };

  const updateTableCell = (sectionId: string, blockId: string, rowIndex: number, columnIndex: number, value: string) => {
    updateBlock(sectionId, blockId, block => block.type === 'table'
      ? { ...block, rows: block.rows.map((row, index) => index === rowIndex ? row.map((cell, cellIndex) => cellIndex === columnIndex ? value : cell) : row) }
      : block);
  };

  const addTableRow = (sectionId: string, blockId: string) => {
    updateBlock(sectionId, blockId, block => block.type === 'table'
      ? { ...block, rows: [...block.rows, block.headers.map(() => '')] }
      : block);
  };

  const deleteTableRow = (sectionId: string, blockId: string, rowIndex: number) => {
    updateBlock(sectionId, blockId, block => block.type === 'table'
      ? { ...block, rows: block.rows.filter((_, index) => index !== rowIndex) }
      : block);
  };

  const addTableColumn = (sectionId: string, blockId: string) => {
    updateBlock(sectionId, blockId, block => block.type === 'table'
      ? { ...block, headers: [...block.headers, 'Nueva columna'], rows: block.rows.map(row => [...row, '']) }
      : block);
  };

  const deleteTableColumn = (sectionId: string, blockId: string, columnIndex: number) => {
    updateBlock(sectionId, blockId, block => block.type === 'table'
      ? {
          ...block,
          headers: block.headers.filter((_, index) => index !== columnIndex),
          rows: block.rows.map(row => row.filter((_, index) => index !== columnIndex)),
        }
      : block);
  };

  const deleteSection = (sectionId: string) => {
    onChange({ ...guide, sections: guide.sections.filter(section => section.id !== sectionId) });
  };

  const deleteBlock = (sectionId: string, blockId: string) => {
    onChange({
      ...guide,
      sections: guide.sections.map(section => section.id === sectionId
        ? { ...section, blocks: section.blocks.filter(block => block.id !== blockId) }
        : section),
    });
  };

  const addSection = () => {
    const id = `section-${Date.now()}`;
    onChange({
      ...guide,
      sections: [...guide.sections, { id, title: 'Nueva sección', blocks: [{ id: `block-${Date.now()}`, type: 'paragraph', text: 'Nuevo texto' }] }],
    });
  };

  const addBlock = (sectionId: string, type: StudyGuideBlock['type']) => {
    onChange({
      ...guide,
      sections: guide.sections.map(section => section.id === sectionId
        ? { ...section, blocks: [...section.blocks, newBlock(type)] }
        : section),
    });
  };

  const moveSection = (sectionIndex: number, direction: -1 | 1) => {
    onChange({ ...guide, sections: moveItem(guide.sections, sectionIndex, direction) });
  };

  const moveBlock = (sectionId: string, blockIndex: number, direction: -1 | 1) => {
    onChange({
      ...guide,
      sections: guide.sections.map(section => section.id === sectionId
        ? { ...section, blocks: moveItem(section.blocks, blockIndex, direction) }
        : section),
    });
  };

  return (
    <div className="card p-4 md:p-5 space-y-4 bg-bg-primary border border-accent-gold/30">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <input
          value={guide.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="flex-1 bg-transparent text-lg md:text-xl font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold rounded px-2 py-1"
        />
        {onSave && (
          <button type="button" onClick={onSave} className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap">
            <Save className="w-4 h-4" />
            {dirty ? saveLabel : 'Guardado'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {guide.sections.map((section, sectionIndex) => (
          <div key={section.id} className="rounded-xl border border-border bg-bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={section.title}
                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                className="flex-1 min-w-[220px] bg-transparent text-sm md:text-base font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold rounded px-2 py-1"
              />
              {onSave && (
                <button type="button" onClick={onSave} className="px-2.5 py-1.5 rounded bg-accent-green/15 text-accent-green hover:bg-accent-green/25 text-xs font-bold inline-flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" />
                  Guardar sección
                </button>
              )}
              <button type="button" onClick={() => moveSection(sectionIndex, -1)} disabled={sectionIndex === 0} className="p-1.5 rounded bg-bg-secondary disabled:opacity-30 hover:bg-bg-primary text-text-muted hover:text-text-primary">
                <ArrowUp className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => moveSection(sectionIndex, 1)} disabled={sectionIndex === guide.sections.length - 1} className="p-1.5 rounded bg-bg-secondary disabled:opacity-30 hover:bg-bg-primary text-text-muted hover:text-text-primary">
                <ArrowDown className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => deleteSection(section.id)} className="p-1.5 rounded hover:bg-red-900/30 text-text-muted hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {section.blocks.map((block, blockIndex) => (
              <div key={block.id} className="relative rounded-lg border border-border/60 bg-bg-primary p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted shrink-0">
                      {block.type === 'table' ? 'Tabla' : block.type === 'list' ? 'Lista' : 'Texto'}
                    </span>
                    <input
                      value={block.title || ''}
                      onChange={(e) => updateBlockTitle(section.id, block.id, e.target.value)}
                      placeholder="Subtitulo del bloque"
                      className="flex-1 min-w-0 bg-transparent border-b border-border/70 px-1 py-1 text-xs font-bold text-accent-gold placeholder:text-text-muted focus:border-accent-gold focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveBlock(section.id, blockIndex, -1)} disabled={blockIndex === 0} className="p-1 rounded bg-bg-secondary disabled:opacity-30 text-text-muted hover:text-text-primary">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => moveBlock(section.id, blockIndex, 1)} disabled={blockIndex === section.blocks.length - 1} className="p-1 rounded bg-bg-secondary disabled:opacity-30 text-text-muted hover:text-text-primary">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => deleteBlock(section.id, block.id)} className="p-1 rounded bg-bg-secondary hover:bg-red-900/30 text-text-muted hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {block.type === 'paragraph' && (
                  <textarea
                    value={block.text}
                    onChange={(e) => updateParagraph(section.id, block.id, e.target.value)}
                    rows={Math.max(2, block.text.split('\n').length)}
                    className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-secondary focus:border-accent-gold focus:outline-none resize-y"
                  />
                )}

                {block.type === 'list' && (
                  <div className="space-y-2">
                    {block.items.map((item, itemIndex) => (
                      <div key={`${block.id}-item-${itemIndex}`} className="flex items-center gap-2">
                        <span className="w-5 text-xs font-bold text-text-muted text-right">{itemIndex + 1}</span>
                        <input
                          value={item}
                          onChange={(e) => updateListItem(section.id, block.id, itemIndex, e.target.value)}
                          className="flex-1 bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-secondary focus:border-accent-gold focus:outline-none"
                        />
                        <button type="button" onClick={() => moveListItem(section.id, block.id, itemIndex, -1)} disabled={itemIndex === 0} className="p-1.5 rounded bg-bg-secondary disabled:opacity-30 text-text-muted hover:text-text-primary">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => moveListItem(section.id, block.id, itemIndex, 1)} disabled={itemIndex === block.items.length - 1} className="p-1.5 rounded bg-bg-secondary disabled:opacity-30 text-text-muted hover:text-text-primary">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => deleteListItem(section.id, block.id, itemIndex)} className="p-1.5 rounded bg-bg-secondary hover:bg-red-900/30 text-text-muted hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addListItem(section.id, block.id)} className="px-3 py-1.5 rounded-lg bg-bg-secondary hover:bg-bg-card text-xs font-bold text-text-secondary inline-flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      Agregar punto
                    </button>
                  </div>
                )}

                {block.type === 'table' && (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm border-separate border-spacing-0">
                        <thead>
                          <tr>
                            {block.headers.map((header, columnIndex) => (
                              <th key={`${block.id}-header-${columnIndex}`} className="p-1 align-top border-b border-border">
                                <div className="flex items-center gap-1">
                                  <input
                                    value={header}
                                    onChange={(e) => updateTableHeader(section.id, block.id, columnIndex, e.target.value)}
                                    className="w-full bg-bg-card border border-border rounded-lg px-2 py-2 text-xs font-bold text-text-primary focus:border-accent-gold focus:outline-none"
                                  />
                                  <button type="button" onClick={() => deleteTableColumn(section.id, block.id, columnIndex)} disabled={block.headers.length <= 1} className="p-1 rounded bg-bg-secondary disabled:opacity-30 hover:bg-red-900/30 text-text-muted hover:text-red-400">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </th>
                            ))}
                            <th className="w-10 border-b border-border" />
                          </tr>
                        </thead>
                        <tbody>
                          {block.rows.map((row, rowIndex) => (
                            <tr key={`${block.id}-row-${rowIndex}`}>
                              {block.headers.map((_, columnIndex) => (
                                <td key={`${block.id}-${rowIndex}-${columnIndex}`} className="p-1 align-top border-b border-border/40">
                                  <textarea
                                    value={row[columnIndex] || ''}
                                    onChange={(e) => updateTableCell(section.id, block.id, rowIndex, columnIndex, e.target.value)}
                                    rows={2}
                                    className="w-full min-h-10 bg-bg-card border border-border rounded-lg px-2 py-2 text-xs text-text-secondary focus:border-accent-gold focus:outline-none resize-y"
                                  />
                                </td>
                              ))}
                              <td className="p-1 align-top border-b border-border/40">
                                <button type="button" onClick={() => deleteTableRow(section.id, block.id, rowIndex)} className="p-1.5 rounded bg-bg-secondary hover:bg-red-900/30 text-text-muted hover:text-red-400">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => addTableRow(section.id, block.id)} className="px-3 py-1.5 rounded-lg bg-bg-secondary hover:bg-bg-card text-xs font-bold text-text-secondary inline-flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        Fila
                      </button>
                      <button type="button" onClick={() => addTableColumn(section.id, block.id)} className="px-3 py-1.5 rounded-lg bg-bg-secondary hover:bg-bg-card text-xs font-bold text-text-secondary inline-flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        Columna
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => addBlock(section.id, 'paragraph')} className="px-3 py-1.5 rounded-lg bg-bg-secondary hover:bg-bg-primary text-xs font-bold text-text-secondary flex items-center gap-1">
                <Type className="w-3 h-3" />
                Texto
              </button>
              <button type="button" onClick={() => addBlock(section.id, 'list')} className="px-3 py-1.5 rounded-lg bg-bg-secondary hover:bg-bg-primary text-xs font-bold text-text-secondary flex items-center gap-1">
                <List className="w-3 h-3" />
                Lista
              </button>
              <button type="button" onClick={() => addBlock(section.id, 'table')} className="px-3 py-1.5 rounded-lg bg-bg-secondary hover:bg-bg-primary text-xs font-bold text-text-secondary flex items-center gap-1">
                <Table2 className="w-3 h-3" />
                Tabla
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addSection} className="w-full p-3 rounded-lg bg-accent-green/15 hover:bg-accent-green/25 text-accent-green font-bold flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" />
        Agregar sección
      </button>
    </div>
  );
}
