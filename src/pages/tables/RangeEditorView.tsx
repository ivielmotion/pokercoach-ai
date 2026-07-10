// Vista Editor minimalista:
// 1) Lista de tablas con crear / eliminar (cada tabla tiene su posición).
// 2) Al seleccionar una tabla, se abre la matriz 13x13 + sliders para editarla.
// Layout PC: lista a la izquierda, editor a la derecha. Móvil: pestañas.

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, ListTree, Grid3x3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAllRanges, createRange, updateRange, deleteRange, getActiveRangeId, setActiveRangeId } from './store';
import { getHandLabel, parseRangeNotation, stringifyRange, getFrequencies, RANKS } from './handGrid';
import { POSITION_KEYS } from './types';
import type { HandStrategy, PokerRange, PositionKey } from './types';

export function RangeEditorView() {
  const [ranges, setRanges] = useState<PokerRange[]>(() => getAllRanges());
  const [editingId, setEditingId] = useState<string>(() => getActiveRangeId() || getAllRanges()[0]?.id || '');
  const [mobileView, setMobileView] = useState<'list' | 'edit'>('list');
  const [newName, setNewName] = useState('');
  const [newPos, setNewPos] = useState<PositionKey>('CO');
  const [showCreate, setShowCreate] = useState(false);

  const editing = useMemo(() => ranges.find(r => r.id === editingId) || ranges[0], [ranges, editingId]);

  useEffect(() => {
    if (editing && !editing.hands || (editing && Object.keys(editing.hands).length === 0)) {
      const empty: Record<string, HandStrategy> = {};
      for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
        empty[getHandLabel(r, c)] = { raise: 0, call: 0, fold: 100 };
      }
      const updated = { ...editing, hands: empty };
      updateRange(updated);
      setRanges(getAllRanges());
    }
  }, [editing?.id]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const r = createRange(newName, '', newPos);
    setRanges(getAllRanges());
    setEditingId(r.id);
    setActiveRangeId(r.id);
    setShowCreate(false);
    setNewName('');
    setMobileView('edit');
  };

  const handleDelete = (id: string) => {
    if (ranges.length <= 1) return;
    deleteRange(id);
    const next = getAllRanges();
    setRanges(next);
    setEditingId(getActiveRangeId() || next[0]?.id);
  };

  const handleSelect = (id: string) => {
    setEditingId(id);
    setActiveRangeId(id);
    setMobileView('edit');
  };

  const applyStrategy = (label: string, strat: HandStrategy) => {
    if (!editing) return;
    const updated: PokerRange = { ...editing, hands: { ...editing.hands, [label]: strat } };
    updateRange(updated);
    setRanges(getAllRanges());
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Lista de tablas (PC: izquierda fija, móvil: solo si mobileView==='list') */}
      <div className={cn('lg:w-64 space-y-2', mobileView === 'edit' && 'hidden lg:block')}>
        <div className="card p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-widest text-text-muted font-bold flex items-center gap-1">
              <ListTree className="w-3 h-3" /> Tablas
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="px-2 py-1 rounded bg-accent-gold text-black text-[10px] font-bold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Nueva
            </button>
          </div>

          {showCreate && (
            <div className="space-y-2 mb-2 p-2 rounded border border-accent-gold/30 bg-bg-primary">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nombre (ej. UTG RFI 15%)"
                className="w-full px-2 py-1.5 bg-bg-card border border-border rounded text-xs text-text-primary focus:border-accent-gold focus:outline-none"
                autoFocus
              />
              <div className="flex gap-1 flex-wrap">
                {POSITION_KEYS.map(p => (
                  <button
                    key={p}
                    onClick={() => setNewPos(p)}
                    className={cn(
                      'px-2 py-1 rounded text-[10px] font-bold',
                      newPos === p ? 'bg-accent-gold text-black' : 'bg-bg-card border border-border text-text-secondary'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-1 text-[10px] text-text-secondary">Cancelar</button>
                <button onClick={handleCreate} className="flex-1 py-1 rounded bg-accent-gold text-black text-[10px] font-bold">Crear</button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {ranges.map(r => (
              <div
                key={r.id}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition',
                  r.id === editingId ? 'bg-bg-card border border-accent-gold/30' : 'hover:bg-bg-primary border border-transparent'
                )}
                onClick={() => handleSelect(r.id)}
              >
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[9px] font-bold',
                  r.id === editingId ? 'bg-accent-gold text-black' : 'bg-bg-primary text-text-secondary'
                )}>
                  {r.position}
                </span>
                <span className="flex-1 text-xs text-text-primary truncate">{r.name}</span>
                {ranges.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(r.id); }}
                    className="text-text-muted hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor (PC: derecha, móvil: solo si mobileView==='edit') */}
      <div className={cn('flex-1 min-w-0', mobileView === 'list' && 'hidden lg:block')}>
        {editing ? (
          <RangeMatrixEditor range={editing} onApply={applyStrategy} onBack={() => setMobileView('list')} />
        ) : (
          <div className="card p-6 text-center text-text-secondary text-sm">Selecciona una tabla</div>
        )}
      </div>
    </div>
  );
}

// Editor de tabla: matriz 13x13 + sliders para la mano seleccionada.
function RangeMatrixEditor({
  range,
  onApply,
  onBack,
}: {
  range: PokerRange;
  onApply: (label: string, strat: HandStrategy) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState('AA');
  const strat = range.hands[selected] || { raise: 0, call: 0, fold: 100 };
  const [r, setR] = useState(strat.raise);
  const [c, setC] = useState(strat.call);
  const [f, setF] = useState(strat.fold);
  const [notation, setNotation] = useState(stringifyRange(range.hands));
  const [notationErr, setNotationErr] = useState<string | null>(null);

  useEffect(() => {
    setR(strat.raise);
    setC(strat.call);
    setF(strat.fold);
    setNotation(stringifyRange(range.hands));
  }, [selected, range.id]);

  const onWeight = (type: 'raise' | 'call' | 'fold', value: number) => {
    let nr = r, nc = c, nf = f;
    if (type === 'raise') {
      nr = value;
      const rem = 100 - nr;
      if (nc + nf > 0) {
        const ratio = nc / (nc + nf);
        nc = Math.round(rem * ratio);
        nf = 100 - nr - nc;
      } else { nc = 0; nf = rem; }
    } else if (type === 'call') {
      nc = value;
      const rem = 100 - nc;
      if (nr + nf > 0) {
        const ratio = nr / (nr + nf);
        nr = Math.round(rem * ratio);
        nf = 100 - nc - nr;
      } else { nr = 0; nf = rem; }
    } else {
      nf = value;
      const rem = 100 - nf;
      if (nr + nc > 0) {
        const ratio = nr / (nr + nc);
        nr = Math.round(rem * ratio);
        nc = 100 - nf - nr;
      } else { nr = 0; nc = rem; }
    }
    setR(nr); setC(nc); setF(nf);
    onApply(selected, { raise: nr, call: nc, fold: nf });
  };

  const onParse = () => {
    try {
      setNotationErr(null);
      const parsed = parseRangeNotation(notation);
      // Aplicar todo: para cada label con raise>0 en parsed, setear 100% raise
      for (const k of Object.keys(parsed)) {
        if (parsed[k].raise > 0) onApply(k, { raise: 100, call: 0, fold: 0 });
      }
    } catch {
      setNotationErr('Formato inválido. Ej: 22+, A2s+, KJo, ATo+');
    }
  };

  const freq = getFrequencies(range.hands);

  const gradient = (s: HandStrategy): string => {
    if (s.fold === 100) return 'rgb(31, 41, 55)';
    return `linear-gradient(135deg, #f43f5e 0%, #f43f5e ${s.raise}%, #10b981 ${s.raise}%, #10b981 ${s.raise + s.call}%, #1f2937 ${s.raise + s.call}%, #1f2937 100%)`;
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-bold text-text-primary">{range.name}</div>
          <div className="text-[10px] text-text-muted">Posición: {range.position}</div>
        </div>
        <div className="flex gap-3 text-[10px]">
          <span className="text-rose-400 font-mono font-bold">R {freq.raisePct}%</span>
          <span className="text-emerald-400 font-mono font-bold">C {freq.callPct}%</span>
          <span className="text-text-muted font-mono font-bold">F {freq.foldPct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Matriz 13x13 */}
        <div className="md:col-span-2 space-y-1">
          <div className="flex flex-col gap-[2px] w-full">
            {RANKS.map((_, rIdx) => (
              <div key={rIdx} className="flex gap-[2px] h-7 sm:h-8">
                {RANKS.map((_, cIdx) => {
                  const label = getHandLabel(rIdx, cIdx);
                  const s = range.hands[label] || { raise: 0, call: 0, fold: 100 };
                  const isSel = label === selected;
                  return (
                    <button
                      key={cIdx}
                      onClick={() => setSelected(label)}
                      className={cn(
                        'relative flex-1 flex items-center justify-center text-[8px] sm:text-[9px] font-mono rounded-sm transition',
                        isSel ? 'ring-2 ring-accent-gold z-10' : 'hover:scale-105',
                        s.fold === 100 ? 'text-text-muted' : 'text-white font-bold'
                      )}
                      style={{ background: gradient(s) }}
                      title={label}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 text-[9px] text-text-secondary pt-1">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-500" />R</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" />C</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-bg-tertiary border border-border" />F</span>
          </div>
        </div>

        {/* Slider de la mano seleccionada + notación */}
        <div className="space-y-3">
          <div className="text-center py-2 bg-bg-primary border border-border rounded">
            <div className="text-[9px] uppercase text-text-muted font-bold">Mano</div>
            <div className="text-2xl font-bold font-mono text-accent-gold">{selected}</div>
          </div>
          <div className="space-y-1.5">
            {[
              { key: 'raise' as const, label: 'R', value: r, color: 'text-rose-400' },
              { key: 'call' as const, label: 'C', value: c, color: 'text-emerald-400' },
              { key: 'fold' as const, label: 'F', value: f, color: 'text-text-muted' },
            ].map(s => (
              <div key={s.key}>
                <div className="flex justify-between text-[10px]">
                  <span className={cn('font-bold', s.color)}>{s.label}</span>
                  <span className="font-mono text-text-primary">{s.value}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={s.value}
                  onChange={e => onWeight(s.key, parseInt(e.target.value))}
                  className="w-full h-1"
                />
              </div>
            ))}
          </div>
          <div className="space-y-1 pt-2 border-t border-border">
            <div className="text-[9px] uppercase text-text-muted font-bold">Notación</div>
            <input
              value={notation}
              onChange={e => setNotation(e.target.value)}
              placeholder="22+, A2s+, KJo, ATo+"
              className="w-full px-2 py-1.5 bg-bg-primary border border-border rounded text-[10px] font-mono text-text-primary focus:border-accent-gold focus:outline-none"
            />
            <button
              onClick={onParse}
              className="w-full py-1.5 rounded bg-accent-gold text-black text-[10px] font-bold"
            >
              Aplicar
            </button>
            {notationErr && <div className="text-[9px] text-rose-400">{notationErr}</div>}
            <div className="flex flex-wrap gap-1 pt-1">
              {['UTG 15%', 'CO 27%', 'BTN 48%'].map(p => (
                <button
                  key={p}
                  onClick={() => {
                    const presets: Record<string, string> = {
                      'UTG 15%': '77+, ATs+, KJs+, AJo+, KQo',
                      'CO 27%': '55+, A2s+, K9s+, Q9s+, J9s+, ATo+, KJo+',
                      'BTN 48%': '22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 97s+, 86s+, 75s+, 65s, 54s, A8o+, K9o+, Q9o+, J9o+, T9o',
                    };
                    setNotation(presets[p]);
                  }}
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-bg-primary border border-border text-text-secondary hover:text-text-primary"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
