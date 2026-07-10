// Editor de conocimiento (glosario) del coach
import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Save, Upload, BookOpen, Edit2, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { KnowledgeEntry } from '../../types/coach';
import { FileUploader } from './FileUploader';
import { parseKnowledgeMarkdown, parseKnowledgeJSON } from '../../data/parsers/knowledgeParser';

interface KnowledgeEditorProps {
  entries: KnowledgeEntry[];
  onSave: (entries: KnowledgeEntry[]) => void;
}

export function KnowledgeEditor({ entries, onSave }: KnowledgeEditorProps) {
  const [localEntries, setLocalEntries] = useState<KnowledgeEntry[]>(entries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ term: '', definition: '', category: 'General' });
  const [showFileUpload, setShowFileUpload] = useState(false);

  const handleSave = () => {
    onSave(localEntries);
  };

  const handleAdd = () => {
    if (!newEntry.term.trim() || !newEntry.definition.trim()) return;
    
    const entry: KnowledgeEntry = {
      id: `entry-${Date.now()}`,
      term: newEntry.term.trim(),
      definition: newEntry.definition.trim(),
      category: newEntry.category.trim() || 'General'
    };
    
    setLocalEntries([...localEntries, entry]);
    setNewEntry({ term: '', definition: '', category: 'General' });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setLocalEntries(localEntries.filter(e => e.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<KnowledgeEntry>) => {
    setLocalEntries(localEntries.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleFileLoaded = (content: string, fileName: string) => {
    let parsed: KnowledgeEntry[] = [];
    
    if (fileName.endsWith('.json')) {
      try {
        parsed = parseKnowledgeJSON(content);
      } catch {
        alert('Error al parsear el archivo JSON');
        return;
      }
    } else {
      parsed = parseKnowledgeMarkdown(content);
    }
    
    if (parsed.length > 0) {
      setLocalEntries(parsed);
    }
  };

  const categories = Array.from(new Set(localEntries.map(e => e.category)));

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-accent-gold" />
          <h3 className="text-sm md:text-lg font-bold text-text-primary">Conocimiento</h3>
          <span className="text-[10px] text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded">
            {localEntries.length} términos
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
            label="Subir archivo de conocimiento"
            description="Formato Markdown o JSON. Reemplaza todos los términos actuales."
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
          <h4 className="text-sm font-bold text-text-primary">Nuevo Término</h4>
          
          <input
            type="text"
            placeholder="Término (ej: VPIP)"
            value={newEntry.term}
            onChange={(e) => setNewEntry({ ...newEntry, term: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
          />
          
          <textarea
            placeholder="Definición"
            value={newEntry.definition}
            onChange={(e) => setNewEntry({ ...newEntry, definition: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold resize-none"
          />
          
          <input
            type="text"
            placeholder="Categoría (ej: Fundamentos, Stats, Postflop)"
            value={newEntry.category}
            onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
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

      {/* Lista de términos agrupados por categoría */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {categories.map(category => (
          <div key={category}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 sticky top-0 bg-bg-primary py-1">
              {category}
            </h4>
            <div className="space-y-2">
              {localEntries
                .filter(e => e.category === category)
                .map(entry => (
                  <motion.div
                    key={entry.id}
                    layout
                    className="card p-3 group"
                  >
                    {editingId === entry.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={entry.term}
                          onChange={(e) => handleUpdate(entry.id, { term: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold"
                        />
                        <textarea
                          value={entry.definition}
                          onChange={(e) => handleUpdate(entry.id, { definition: e.target.value })}
                          rows={2}
                          className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-gold resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-accent-green hover:underline"
                          >
                            Listo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-text-primary">{entry.term}</span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{entry.definition}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingId(entry.id)}
                            className="p-2 text-text-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {localEntries.length === 0 && (
        <div className="text-center py-8 text-text-muted">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay términos aún</p>
          <p className="text-xs mt-1">Agrega términos manualmente o carga un archivo MD/JSON</p>
        </div>
      )}
    </div>
  );
}
