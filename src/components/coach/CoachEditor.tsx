// Editor de información básica del coach
import { useState } from 'react';
import { motion } from 'motion/react';
import { Save, Shield, Plus, X, Trash2 } from 'lucide-react';
import { CoachProfile } from '../../types/coach';

interface CoachEditorProps {
  coach: CoachProfile;
  onSave: (updates: Partial<CoachProfile>) => void;
}

export function CoachEditor({ coach, onSave }: CoachEditorProps) {
  const [name, setName] = useState(coach.name);
  const [description, setDescription] = useState(coach.description);
  const [style, setStyle] = useState(coach.style);
  const [rules, setRules] = useState<string[]>(coach.rules);
  const [newRule, setNewRule] = useState('');

  const handleSave = () => {
    onSave({
      name: name.trim(),
      description: description.trim(),
      style: style.trim(),
      rules: rules.filter(r => r.trim())
    });
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setRules([...rules, newRule.trim()]);
    setNewRule('');
  };

  const handleDeleteRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-accent-gold" />
        <h3 className="text-lg font-bold text-text-primary">Información del Coach</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
            placeholder="Nombre del coach"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Estilo</label>
          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
            placeholder="Ej: GTO / Teórico, Explotativo / Agresivo"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold resize-none"
            placeholder="Descripción del coach y su enfoque"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary mb-2 block">Reglas Generales</label>
          <div className="space-y-2 mb-3">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-bg-primary border border-border group">
                <span className="text-xs text-accent-gold font-bold mt-0.5">{idx + 1}.</span>
                <p className="flex-1 text-sm text-text-secondary">{rule}</p>
                <button
                  onClick={() => handleDeleteRule(idx)}
                  className="p-1 text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              placeholder="Agregar nueva regla..."
              className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
            />
            <button
              onClick={handleAddRule}
              className="p-2 rounded-lg bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border border-accent-green/20 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent-gold text-black hover:bg-accent-gold/90 transition-all"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
