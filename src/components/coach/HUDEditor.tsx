// Editor de HUD del coach
import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Save, Upload, LayoutGrid, Edit2, Check, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { HUDLineConfig, HUDStatConfig } from '../../types/coach';
import { FileUploader } from './FileUploader';
import { parseHUDJSON, hudToJSON } from '../../data/parsers/hudParser';

interface HUDEditorProps {
  hudConfig: HUDLineConfig[];
  onSave: (hudConfig: HUDLineConfig[]) => void;
}

const DEFAULT_COLORS = [
  'text-red-400', 'text-orange-400', 'text-amber-400', 'text-emerald-400',
  'text-green-400', 'text-cyan-400', 'text-blue-400', 'text-purple-400',
  'text-pink-400', 'text-slate-300', 'text-yellow-400', 'text-lime-400'
];

export function HUDEditor({ hudConfig, onSave }: HUDEditorProps) {
  const [localHUD, setLocalHUD] = useState<HUDLineConfig[]>(hudConfig);
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newLine, setNewLine] = useState({ name: '' });
  const [showFileUpload, setShowFileUpload] = useState(false);

  const handleSave = () => {
    onSave(localHUD);
  };

  const handleAdd = () => {
    if (!newLine.name.trim()) return;
    
    const line: HUDLineConfig = {
      id: localHUD.length > 0 ? Math.max(...localHUD.map(l => l.id)) + 1 : 1,
      name: newLine.name.trim(),
      stats: []
    };
    
    setLocalHUD([...localHUD, line]);
    setNewLine({ name: '' });
    setShowAdd(false);
  };

  const handleDeleteLine = (id: number) => {
    setLocalHUD(localHUD.filter(l => l.id !== id));
  };

  const handleUpdateLine = (id: number, updates: Partial<HUDLineConfig>) => {
    setLocalHUD(localHUD.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleAddStat = (lineId: number) => {
    const line = localHUD.find(l => l.id === lineId);
    if (!line) return;
    
    const newStat: HUDStatConfig = {
      shortName: 'NEW',
      fullName: 'Nuevo Stat',
      color: 'text-slate-300'
    };
    
    handleUpdateLine(lineId, { stats: [...line.stats, newStat] });
  };

  const handleDeleteStat = (lineId: number, statIndex: number) => {
    const line = localHUD.find(l => l.id === lineId);
    if (!line) return;
    
    const newStats = line.stats.filter((_, i) => i !== statIndex);
    handleUpdateLine(lineId, { stats: newStats });
  };

  const handleUpdateStat = (lineId: number, statIndex: number, updates: Partial<HUDStatConfig>) => {
    const line = localHUD.find(l => l.id === lineId);
    if (!line) return;
    
    const newStats = line.stats.map((s, i) => i === statIndex ? { ...s, ...updates } : s);
    handleUpdateLine(lineId, { stats: newStats });
  };

  const handleFileLoaded = (content: string, fileName: string) => {
    try {
      const parsed = parseHUDJSON(content);
      if (parsed.length > 0) {
        setLocalHUD(parsed);
      }
    } catch {
      alert('Error al parsear el archivo JSON');
    }
  };

  const handleExportJSON = () => {
    const json = hudToJSON(localHUD);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hud-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 text-accent-gold" />
          <h3 className="text-sm md:text-lg font-bold text-text-primary">Configuración HUD</h3>
          <span className="text-[10px] text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded">
            {localHUD.length} líneas
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
            <span className="hidden sm:inline">Cargar JSON</span>
            <span className="sm:hidden">Cargar</span>
          </button>
          
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-medium bg-bg-secondary text-text-secondary hover:text-text-primary transition-all"
          >
            <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">⬇</span>
          </button>
          
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-medium bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border border-accent-green/20 transition-all"
          >
            <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Agregar Línea</span>
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
            accept=".json"
            onFileLoaded={handleFileLoaded}
            label="Subir configuración HUD"
            description="Formato JSON con líneas y stats"
          />
        </motion.div>
      )}

      {/* Formulario para agregar línea */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-3 md:p-4 space-y-3"
        >
          <h4 className="text-sm font-bold text-text-primary">Nueva Línea</h4>
          
          <input
            type="text"
            placeholder="Nombre de la línea (ej: Línea 1 - Perfil General)"
            value={newLine.name}
            onChange={(e) => setNewLine({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
          />
          
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

      {/* Lista de líneas */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {localHUD.map(line => (
          <motion.div
            key={line.id}
            layout
            className="card p-4 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs md:text-sm font-bold text-accent-gold">Línea {line.id}</span>
                {editingLine === line.id ? (
                  <input
                    type="text"
                    value={line.name}
                    onChange={(e) => handleUpdateLine(line.id, { name: e.target.value })}
                    className="px-2 py-1 rounded bg-bg-primary border border-border text-xs md:text-sm text-text-primary focus:outline-none focus:border-accent-gold flex-1 min-w-0"
                  />
                ) : (
                  <span className="text-xs md:text-sm text-text-secondary truncate">{line.name}</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditingLine(editingLine === line.id ? null : line.id)}
                  className="p-2 text-text-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAddStat(line.id)}
                  className="p-2 text-text-muted hover:text-accent-green hover:bg-accent-green/10 rounded transition-colors"
                  title="Agregar stat"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteLine(line.id)}
                  className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {/* Stats de la línea */}
            <div className="space-y-2">
              {line.stats.map((stat, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 p-2 rounded-lg bg-bg-primary border border-border">
                  <select
                    value={stat.color}
                    onChange={(e) => handleUpdateStat(line.id, idx, { color: e.target.value })}
                    className="px-2 py-1 rounded bg-bg-secondary border border-border text-xs text-text-primary focus:outline-none focus:border-accent-gold md:w-auto w-full"
                  >
                    {DEFAULT_COLORS.map(color => (
                      <option key={color} value={color}>{color.replace('text-', '')}</option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    value={stat.shortName}
                    onChange={(e) => handleUpdateStat(line.id, idx, { shortName: e.target.value })}
                    placeholder="Abreviatura"
                    className="flex-1 px-2 py-1 rounded bg-bg-secondary border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
                  />
                  
                  <input
                    type="text"
                    value={stat.fullName}
                    onChange={(e) => handleUpdateStat(line.id, idx, { fullName: e.target.value })}
                    placeholder="Nombre completo"
                    className="flex-1 px-2 py-1 rounded bg-bg-secondary border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
                  />
                  
                  <button
                    onClick={() => handleDeleteStat(line.id, idx)}
                    className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors self-end md:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              
              {line.stats.length === 0 && (
                <p className="text-xs text-text-muted text-center py-2">
                  No hay stats. Click en + para agregar.
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {localHUD.length === 0 && (
        <div className="text-center py-8 text-text-muted">
          <LayoutGrid className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay configuración HUD aún</p>
          <p className="text-xs mt-1">Agrega líneas manualmente o carga un archivo JSON</p>
        </div>
      )}
    </div>
  );
}
