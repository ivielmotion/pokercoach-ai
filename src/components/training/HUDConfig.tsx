import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Save, Trash2, LayoutGrid, Plus, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { HUDProfile, HUDLine, HUDStat } from '../../types';
import { 
  getAllHUDProfilesAsync, 
  createHUDProfileAsync, 
  updateHUDProfileAsync, 
  deleteHUDProfileAsync,
  HUDProfile as SupabaseHUDProfile 
} from '../../services/supabaseService';

const DEFAULT_COLORS = [
  'text-red-400', 'text-orange-400', 'text-amber-400', 'text-emerald-400',
  'text-green-400', 'text-cyan-400', 'text-blue-400', 'text-purple-400',
  'text-pink-400', 'text-slate-300', 'text-yellow-400', 'text-lime-400'
];

const DEFAULT_PROFILE: HUDProfile = {
  id: 'custom-hud',
  name: 'Mi HUD Personalizado',
  description: 'HUD configurado manualmente',
  lines: [
    { id: 1, name: 'Línea 1 - Preflop Básico', stats: [] },
    { id: 2, name: 'Línea 2 - 3Bet Pots', stats: [] },
    { id: 3, name: 'Línea 3 - Preflop Avanzado', stats: [] },
    { id: 4, name: 'Línea 4 - Flop', stats: [] },
    { id: 5, name: 'Línea 5 - Turn/River', stats: [] },
    { id: 6, name: 'Línea 6 - River Avanzado', stats: [] },
    { id: 7, name: 'Línea 7 - Preflop IP/OOP', stats: [] },
  ]
};

function dbToAppFormat(dbProfile: SupabaseHUDProfile): HUDProfile {
  return {
    id: dbProfile.id,
    name: dbProfile.name,
    description: dbProfile.description || '',
    lines: dbProfile.lines || [],
  };
}

export function HUDConfig() {
  const [profiles, setProfiles] = useState<HUDProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profile, setProfile] = useState<HUDProfile>(DEFAULT_PROFILE);
  const [activeLine, setActiveLine] = useState(0);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const dbProfiles = await getAllHUDProfilesAsync();
    
    if (dbProfiles.length === 0) {
      setProfile(DEFAULT_PROFILE);
      setProfiles([DEFAULT_PROFILE]);
      setActiveProfileId(DEFAULT_PROFILE.id);
    } else {
      const appProfiles = dbProfiles.map(dbToAppFormat);
      setProfiles(appProfiles);
      setActiveProfileId(appProfiles[0].id);
      setProfile(appProfiles[0]);
    }
    setLoading(false);
  };

  const addStat = () => {
    const newStat: HUDStat = {
      id: `stat-${Date.now()}`,
      shortName: 'NEW',
      fullName: 'Nueva Estadística',
      definition: '',
      color: 'text-slate-300',
      exampleValue: '0'
    };
    const updated = { ...profile };
    updated.lines = updated.lines.map((line, idx) =>
      idx === activeLine ? { ...line, stats: [...line.stats, newStat] } : line
    );
    setProfile(updated);
  };

  const removeStat = (statIdx: number) => {
    const updated = { ...profile };
    updated.lines = updated.lines.map((line, idx) =>
      idx === activeLine ? { ...line, stats: line.stats.filter((_, sIdx) => sIdx !== statIdx) } : line
    );
    setProfile(updated);
  };

  const updateStat = (statIdx: number, field: keyof HUDStat, value: string) => {
    const updated = { ...profile };
    updated.lines = updated.lines.map((line, idx) =>
      idx === activeLine ? {
        ...line,
        stats: line.stats.map((stat, sIdx) =>
          sIdx === statIdx ? { ...stat, [field]: value } : stat
        )
      } : line
    );
    setProfile(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (profile.id === 'custom-hud' || profile.id.startsWith('imported-')) {
        const newProfile = await createHUDProfileAsync({
          name: profile.name,
          description: profile.description,
          lines: profile.lines,
        });
        if (newProfile) {
          const appProfile = dbToAppFormat(newProfile);
          setProfile(appProfile);
          setProfiles([...profiles.filter(p => p.id !== 'custom-hud'), appProfile]);
          setActiveProfileId(appProfile.id);
        }
      } else {
        await updateHUDProfileAsync(profile.id, {
          name: profile.name,
          description: profile.description,
          lines: profile.lines,
        });
        setProfiles(profiles.map(p => p.id === profile.id ? profile : p));
      }
      alert('HUD guardado correctamente');
    } catch (error) {
      alert('Error al guardar el HUD');
    }
    setSaving(false);
  };

  const handleNewProfile = async () => {
    setProfile({
      ...DEFAULT_PROFILE,
      id: `new-${Date.now()}`,
      name: 'Nuevo HUD',
      description: '',
    });
    setActiveProfileId(null);
    setActiveLine(0);
  };

  const handleSelectProfile = (profileId: string) => {
    const selected = profiles.find(p => p.id === profileId);
    if (selected) {
      setProfile(selected);
      setActiveProfileId(profileId);
      setActiveLine(0);
    }
  };

  const handleDeleteProfile = async () => {
    if (profile.id === 'custom-hud' || profile.id.startsWith('imported-') || profile.id.startsWith('new-')) {
      setProfiles(profiles.filter(p => p.id !== profile.id));
      setProfile(DEFAULT_PROFILE);
      setActiveProfileId(DEFAULT_PROFILE.id);
      return;
    }
    
    if (!confirm('¿Eliminar este perfil HUD?')) return;
    
    const success = await deleteHUDProfileAsync(profile.id);
    if (success) {
      const remaining = profiles.filter(p => p.id !== profile.id);
      setProfiles(remaining);
      if (remaining.length > 0) {
        setProfile(remaining[0]);
        setActiveProfileId(remaining[0].id);
      } else {
        setProfile(DEFAULT_PROFILE);
        setActiveProfileId(DEFAULT_PROFILE.id);
      }
    }
  };

  const handleJsonImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (data.lines && Array.isArray(data.lines)) {
        setProfile({
          id: `imported-${Date.now()}`,
          name: data.name || 'HUD Importado',
          description: data.description || '',
          lines: data.lines
        });
        setShowJsonImport(false);
        setJsonInput('');
        alert('HUD importado correctamente. Haz clic en "Guardar HUD" para guardar en la base de datos.');
      } else {
        alert('Formato inválido: debe tener un array "lines"');
      }
    } catch {
      alert('JSON inválido');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-accent-gold" />
        <span className="ml-2 text-text-secondary">Cargando HUD...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Selector */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-text-primary">Perfiles HUD</h3>
          <button onClick={handleNewProfile} className="btn-primary text-xs flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Nuevo Perfil
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectProfile(p.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeProfileId === p.id
                  ? "bg-accent-green/20 text-accent-green border border-accent-green/30"
                  : "bg-bg-card text-text-secondary border border-border hover:border-text-muted"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Guardando...' : 'Guardar HUD'}
        </button>
        <button onClick={handleExport} className="btn-dark text-sm flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Exportar JSON
        </button>
        <button onClick={() => setShowJsonImport(!showJsonImport)} className="btn-gold text-sm flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" />
          Importar JSON
        </button>
        {profiles.length > 1 && (
          <button onClick={handleDeleteProfile} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Eliminar Perfil
          </button>
        )}
      </div>

      {/* JSON Import */}
      {showJsonImport && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card p-4">
          <p className="text-sm text-text-secondary mb-2">Pega el JSON del HUD (debe tener formato con lines, stats, etc.):</p>
          <textarea
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            className="w-full h-32 bg-bg-primary border border-border rounded-lg p-3 text-xs font-mono text-text-primary mb-2"
            placeholder={`{ "lines": [{ "id": 1, "name": "Línea 1", "stats": [{"id":"vpip","shortName":"VPIP",...}] }] }`}
          />
          <button onClick={handleJsonImport} className="btn-primary text-sm">Importar</button>
        </motion.div>
      )}

      {/* Profile Info */}
      <div className="card p-4 space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Nombre del HUD</label>
          <input
            type="text"
            value={profile.name}
            onChange={e => setProfile({ ...profile, name: e.target.value })}
            className="w-full mt-1 bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Descripción</label>
          <input
            type="text"
            value={profile.description}
            onChange={e => setProfile({ ...profile, description: e.target.value })}
            className="w-full mt-1 bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
          />
        </div>
      </div>

      {/* Lines Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide max-w-full">
        {profile.lines.map((line, idx) => (
          <button
            key={line.id}
            onClick={() => setActiveLine(idx)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all",
              activeLine === idx
                ? "bg-accent-green/20 text-accent-green border border-accent-green/30"
                : "bg-bg-card text-text-secondary border border-border hover:border-text-muted"
            )}
          >
            Línea {line.id} ({line.stats.length})
          </button>
        ))}
      </div>

      {/* Active Line Editor */}
      <div className="card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-primary">
            {profile.lines[activeLine]?.name}
          </h3>
          <button onClick={addStat} className="btn-primary text-xs flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Agregar Stat
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {profile.lines[activeLine]?.stats.map((stat, idx) => (
            <div key={stat.id} className="bg-bg-primary rounded-lg p-3 border border-border">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                {/* Short Name */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-text-muted">Abrev</label>
                  <input
                    type="text"
                    value={stat.shortName}
                    onChange={e => updateStat(idx, 'shortName', e.target.value)}
                    className="w-full mt-1 bg-bg-card border border-border rounded px-2 py-1 text-xs font-mono text-text-primary"
                  />
                </div>
                {/* Full Name */}
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold uppercase text-text-muted">Nombre Completo</label>
                  <input
                    type="text"
                    value={stat.fullName}
                    onChange={e => updateStat(idx, 'fullName', e.target.value)}
                    className="w-full mt-1 bg-bg-card border border-border rounded px-2 py-1 text-xs text-text-primary"
                  />
                </div>
                {/* Example Value */}
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-bold uppercase text-text-muted">Valor</label>
                  <input
                    type="text"
                    value={stat.exampleValue || ''}
                    onChange={e => updateStat(idx, 'exampleValue', e.target.value)}
                    className="w-full mt-1 bg-bg-card border border-border rounded px-2 py-1 text-xs font-mono text-text-primary"
                  />
                </div>
                {/* Color */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-text-muted">Color</label>
                  <select
                    value={stat.color}
                    onChange={e => updateStat(idx, 'color', e.target.value)}
                    className="w-full mt-1 bg-bg-card border border-border rounded px-2 py-1 text-xs text-text-primary"
                  >
                    {DEFAULT_COLORS.map(c => (
                      <option key={c} value={c}>{c.replace('text-', '').replace('-400', '')}</option>
                    ))}
                  </select>
                </div>
                {/* Definition */}
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold uppercase text-text-muted">Definición</label>
                  <input
                    type="text"
                    value={stat.definition}
                    onChange={e => updateStat(idx, 'definition', e.target.value)}
                    className="w-full mt-1 bg-bg-card border border-border rounded px-2 py-1 text-xs text-text-primary"
                    placeholder="Qué significa esta stat..."
                  />
                </div>
                {/* Delete */}
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    onClick={() => removeStat(idx)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {profile.lines[activeLine]?.stats.length === 0 && (
            <div className="text-center py-8 text-text-muted text-sm">
              No hay stats en esta línea. Haz clic en "Agregar Stat" para empezar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
