// Editor de estrategias del coach
import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Save, Upload, Zap, Edit2, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { StrategyRule } from '../../types/coach';
import { FileUploader } from './FileUploader';
import { parseStrategyMarkdown, parseStrategyJSON } from '../../data/parsers/strategyParser';

interface StrategyEditorProps {
  strategies: StrategyRule[];
  onSave: (strategies: StrategyRule[]) => void;
}

const CATEGORIES: Array<'Preflop' | 'Flop' | 'Turn' | 'River'> = ['Preflop', 'Flop', 'Turn', 'River'];

export function StrategyEditor({ strategies, onSave }: StrategyEditorProps) {
  const [localStrategies, setLocalStrategies] = useState<StrategyRule[]>(strategies);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState<StrategyRule>({
    id: '',
    condition: '',
    action: '',
    explanation: '',
    category: 'Preflop'
  });
  const [showFileUpload, setShowFileUpload] = useState(false);

  const handleSave = () => {
    onSave(localStrategies);
  };

  const handleAdd = () => {
    if (!newRule.condition.trim() || !newRule.action.trim()) return;
    
    const rule: StrategyRule = {
      ...newRule,
      id: `rule-${Date.now()}`
    };
    
    setLocalStrategies([...localStrategies, rule]);
    setNewRule({ id: '', condition: '', action: '', explanation: '', category: 'Preflop' });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setLocalStrategies(localStrategies.filter(s => s.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<StrategyRule>) => {
    setLocalStrategies(localStrategies.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleFileLoaded = (content: string, fileName: string) => {
    let parsed: StrategyRule[] = [];
    
    if (fileName.endsWith('.json')) {
      try {
        parsed = parseStrategyJSON(content);
      } catch {
        alert('Error al parsear el archivo JSON');
        return;
      }
    } else {
      parsed = parseStrategyMarkdown(content);
    }
    
    if (parsed.length > 0) {
      setLocalStrategies(parsed);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Preflop': return 'text-purple-400 bg-purple-400/10';
      case 'Flop': return 'text-blue-400 bg-blue-400/10';
      case 'Turn': return 'text-amber-400 bg-amber-400/10';
      case 'River': return 'text-red-400 bg-red-400/10';
      default: return 'text-text-muted bg-bg-secondary';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 md:w-5 md:h-5 text-accent-gold" />
          <h3 className="text-sm md:text-lg font-bold text-text-primary">Estrategias</h3>
          <span className="text-[10px] text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded">
            {localStrategies.length} reglas
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
            <span className="sm:hidden">💾</span>
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
            label="Subir archivo de estrategias"
            description="Formato: '- **Si condición**: Acción. Explicación.' Agrupado por secciones (## Preflop, ## Flop, etc.)"
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
          <h4 className="text-sm font-bold text-text-primary">Nueva Regla</h4>
          
          <select
            value={newRule.category}
            onChange={(e) => setNewRule({ ...newRule, category: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <input
            type="text"
            placeholder="Condición (ej: 3Bet rival > 10%)"
            value={newRule.condition}
            onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
          />
          
          <input
            type="text"
            placeholder="Acción (ej: Hacer Fold)"
            value={newRule.action}
            onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
          />
          
          <textarea
            placeholder="Explicación (opcional)"
            value={newRule.explanation}
            onChange={(e) => setNewRule({ ...newRule, explanation: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold resize-none"
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

      {/* Lista de reglas agrupadas por categoría */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {CATEGORIES.map(category => {
          const categoryRules = localStrategies.filter(s => s.category === category);
          if (categoryRules.length === 0) return null;
          
          return (
            <div key={category}>
              <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-2", getCategoryColor(category))}>
                {category}
                <span className="text-[10px] opacity-70">({categoryRules.length})</span>
              </div>
              <div className="space-y-2">
                {categoryRules.map(rule => (
                  <motion.div
                    key={rule.id}
                    layout
                    className="card p-3 group"
                  >
                    {editingId === rule.id ? (
                      <div className="space-y-2">
                        <select
                          value={rule.category}
                          onChange={(e) => handleUpdate(rule.id, { category: e.target.value as any })}
                          className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={rule.condition}
                          onChange={(e) => handleUpdate(rule.id, { condition: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold"
                        />
                        <input
                          type="text"
                          value={rule.action}
                          onChange={(e) => handleUpdate(rule.id, { action: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold"
                        />
                        <textarea
                          value={rule.explanation}
                          onChange={(e) => handleUpdate(rule.id, { explanation: e.target.value })}
                          rows={2}
                          className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold resize-none"
                        />
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-accent-green hover:underline"
                        >
                          Listo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-accent-gold">Si</span>
                              <span className="text-sm text-text-primary font-medium">{rule.condition}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-accent-green">→</span>
                              <span className="text-sm text-text-secondary">{rule.action}</span>
                            </div>
                            {rule.explanation && (
                              <p className="text-xs text-text-muted mt-1 italic">{rule.explanation}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingId(rule.id)}
                              className="p-2 text-text-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(rule.id)}
                              className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {localStrategies.length === 0 && (
        <div className="text-center py-8 text-text-muted">
          <Zap className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay estrategias aún</p>
          <p className="text-xs mt-1">Agrega reglas manualmente o carga un archivo MD/JSON</p>
        </div>
      )}
    </div>
  );
}
