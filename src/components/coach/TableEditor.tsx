// Editor de tablas preflop del coach
import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Save, Upload, LayoutGrid, Edit2, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PreflopTable } from '../../types/coach';
import { FileUploader } from './FileUploader';
import { parseTableMarkdown, parseTableJSON } from '../../data/parsers/tableParser';

interface TableEditorProps {
  tables: PreflopTable[];
  onSave: (tables: PreflopTable[]) => void;
}

const POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

export function TableEditor({ tables, onSave }: TableEditorProps) {
  const [localTables, setLocalTables] = useState<PreflopTable[]>(tables);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTable, setNewTable] = useState<PreflopTable>({
    id: '',
    position: 'UTG',
    openRaise: [],
    openRaisePercentage: 0,
    threeBet: [],
    threeBetPercentage: 0,
    call: [],
    callPercentage: 0
  });
  const [showFileUpload, setShowFileUpload] = useState(false);

  const handleSave = () => {
    onSave(localTables);
  };

  const handleAdd = () => {
    if (!newTable.position.trim()) return;
    
    const table: PreflopTable = {
      ...newTable,
      id: `table-${Date.now()}`
    };
    
    setLocalTables([...localTables, table]);
    setNewTable({
      id: '',
      position: 'UTG',
      openRaise: [],
      openRaisePercentage: 0,
      threeBet: [],
      threeBetPercentage: 0,
      call: [],
      callPercentage: 0
    });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setLocalTables(localTables.filter(t => t.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<PreflopTable>) => {
    setLocalTables(localTables.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleFileLoaded = (content: string, fileName: string) => {
    let parsed: PreflopTable[] = [];
    
    if (fileName.endsWith('.json')) {
      try {
        parsed = parseTableJSON(content);
      } catch {
        alert('Error al parsear el archivo JSON');
        return;
      }
    } else {
      parsed = parseTableMarkdown(content);
    }
    
    if (parsed.length > 0) {
      setLocalTables(parsed);
    }
  };

  const parseHandsInput = (input: string): string[] => {
    return input
      .split(',')
      .map(h => h.trim())
      .filter(h => h.length > 0);
  };

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 text-accent-gold" />
          <h3 className="text-sm md:text-lg font-bold text-text-primary">Tablas Preflop</h3>
          <span className="text-[10px] text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded">
            {localTables.length} posiciones
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-medium transition-all",
              showFileUpload 
                ? "bg-accent-gold/10 text-accent-gold border border-accent-gold/20"
                : "bg-bg-secondary text-text-secondary hover:text-text-primary"
            )}
          >
            <Upload className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Cargar MD/JSON</span>
            <span className="sm:hidden">Cargar</span>
          </button>
          
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-medium bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border border-accent-green/20 transition-all"
          >
            <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Agregar</span>
            <span className="sm:hidden">+</span>
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-medium bg-accent-gold text-black hover:bg-accent-gold/90 transition-all"
          >
            <Save className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Guardar</span>
            <span className="sm:hidden"></span>
          </button>
        </div>
      </div>

      {/* Upload de archivos */}
      {showFileUpload && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card p-4"
        >
          <FileUploader
            accept=".md,.markdown,.json,.txt"
            onFileLoaded={handleFileLoaded}
            label="Subir archivo de tablas"
            description="Formato Markdown o JSON con rangos por posición"
          />
        </motion.div>
      )}

      {/* Formulario para agregar */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-3 md:p-4 space-y-3"
        >
          <h4 className="text-sm font-bold text-text-primary">Nueva Posición</h4>
          
          <select
            value={newTable.position}
            onChange={(e) => setNewTable({ ...newTable, position: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold"
          >
            {POSITIONS.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">Open Raise (separado por comas)</label>
            <textarea
              placeholder="AA, KK, QQ, AKs, AKo..."
              value={newTable.openRaise.join(', ')}
              onChange={(e) => setNewTable({ ...newTable, openRaise: parseHandsInput(e.target.value) })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold resize-none"
            />
            <input
              type="number"
              placeholder="Porcentaje (ej: 15)"
              value={newTable.openRaisePercentage || ''}
              onChange={(e) => setNewTable({ ...newTable, openRaisePercentage: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">3Bet (separado por comas)</label>
            <textarea
              placeholder="AA, KK, QQ, AKs..."
              value={newTable.threeBet.join(', ')}
              onChange={(e) => setNewTable({ ...newTable, threeBet: parseHandsInput(e.target.value) })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold resize-none"
            />
            <input
              type="number"
              placeholder="Porcentaje (ej: 5)"
              value={newTable.threeBetPercentage || ''}
              onChange={(e) => setNewTable({ ...newTable, threeBetPercentage: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">Call (separado por comas)</label>
            <textarea
              placeholder="99, 88, AQo, AJs..."
              value={newTable.call.join(', ')}
              onChange={(e) => setNewTable({ ...newTable, call: parseHandsInput(e.target.value) })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold resize-none"
            />
            <input
              type="number"
              placeholder="Porcentaje (ej: 10)"
              value={newTable.callPercentage || ''}
              onChange={(e) => setNewTable({ ...newTable, callPercentage: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent-green text-black hover:bg-accent-green/90 transition-all"
            >
              <Check className="w-4 h-4" />
              Agregar
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-bg-secondary text-text-secondary hover:text-text-primary transition-all"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {/* Lista de tablas */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {localTables.map(table => (
          <motion.div
            key={table.id}
            layout
            className="card p-4 group"
          >
            {editingId === table.id ? (
              <div className="space-y-3">
                <select
                  value={table.position}
                  onChange={(e) => handleUpdate(table.id, { position: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold"
                >
                  {POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Open Raise</label>
                  <textarea
                    value={table.openRaise.join(', ')}
                    onChange={(e) => handleUpdate(table.id, { openRaise: parseHandsInput(e.target.value) })}
                    rows={2}
                    className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold resize-none"
                  />
                  <input
                    type="number"
                    value={table.openRaisePercentage || ''}
                    onChange={(e) => handleUpdate(table.id, { openRaisePercentage: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold"
                    placeholder="%"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">3Bet</label>
                  <textarea
                    value={table.threeBet.join(', ')}
                    onChange={(e) => handleUpdate(table.id, { threeBet: parseHandsInput(e.target.value) })}
                    rows={2}
                    className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold resize-none"
                  />
                  <input
                    type="number"
                    value={table.threeBetPercentage || ''}
                    onChange={(e) => handleUpdate(table.id, { threeBetPercentage: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold"
                    placeholder="%"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Call</label>
                  <textarea
                    value={table.call.join(', ')}
                    onChange={(e) => handleUpdate(table.id, { call: parseHandsInput(e.target.value) })}
                    rows={2}
                    className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold resize-none"
                  />
                  <input
                    type="number"
                    value={table.callPercentage || ''}
                    onChange={(e) => handleUpdate(table.id, { callPercentage: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold"
                    placeholder="%"
                  />
                </div>
                
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-accent-green hover:underline"
                >
                  Listo
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base md:text-lg font-bold text-accent-gold">{table.position}</span>
                    <span className="text-[10px] md:text-xs text-text-muted bg-bg-secondary px-2 py-0.5 rounded">
                      Open {table.openRaisePercentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingId(table.id)}
                      className="p-2 text-text-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(table.id)}
                      className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs font-bold text-accent-green mb-1">Open Raise ({table.openRaise.length})</div>
                    <div className="text-xs text-text-secondary line-clamp-3">{table.openRaise.join(', ') || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-accent-gold mb-1">3Bet ({table.threeBetPercentage}%)</div>
                    <div className="text-xs text-text-secondary line-clamp-3">{table.threeBet.join(', ') || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-400 mb-1">Call ({table.callPercentage}%)</div>
                    <div className="text-xs text-text-secondary line-clamp-3">{table.call.join(', ') || '—'}</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {localTables.length === 0 && (
        <div className="text-center py-8 text-text-muted">
          <LayoutGrid className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay tablas aún</p>
          <p className="text-xs mt-1">Agrega rangos por posición o carga un archivo MD/JSON</p>
        </div>
      )}
    </div>
  );
}
