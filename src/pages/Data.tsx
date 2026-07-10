import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Database, Gamepad2, LayoutGrid, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { HUDConfig } from '../components/training/HUDConfig';
import { DataPackManager } from '../components/training/DataPackManager';
import { TableEditor } from '../components/coach/TableEditor';
import type { PreflopTable } from '../types/coach';
import { 
  getAllPreflopTablesAsync, 
  createPreflopTableAsync, 
  updatePreflopTableAsync, 
  deletePreflopTableAsync 
} from '../services/supabaseService';

type DataSection = 'hud' | 'tables' | 'games';

const sections: { id: DataSection; label: string; description: string; icon: ComponentType<any> }[] = [
  {
    id: 'hud',
    label: 'HUD',
    description: 'Base de datos y configuración del HUD.',
    icon: BarChart3,
  },
  {
    id: 'tables',
    label: 'Tablas',
    description: 'Bases de datos de rangos y tablas preflop.',
    icon: LayoutGrid,
  },
  {
    id: 'games',
    label: 'Datos de Juegos',
    description: 'Conocimiento que alimenta los juegos.',
    icon: Gamepad2,
  },
];

export function Data() {
  const [activeSection, setActiveSection] = useState<DataSection>('games');
  const [tables, setTables] = useState<PreflopTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (activeSection === 'tables') {
      loadTables();
    }
  }, [activeSection]);

  const loadTables = async () => {
    setLoadingTables(true);
    const dbTables = await getAllPreflopTablesAsync();
    setTables(dbTables);
    setLoadingTables(false);
  };

  const handleSaveTables = async (nextTables: PreflopTable[]) => {
    setSaving(true);
    
    // Obtener IDs existentes en la base de datos
    const existingIds = new Set(tables.map(t => t.id));
    const nextIds = new Set(nextTables.map(t => t.id));
    
    // Eliminar tablas que ya no existen
    for (const table of tables) {
      if (!nextIds.has(table.id) && !table.id.startsWith('table-')) {
        await deletePreflopTableAsync(table.id);
      }
    }
    
    // Crear o actualizar tablas
    for (const table of nextTables) {
      if (table.id.startsWith('table-')) {
        // Nueva tabla, crear en Supabase
        const newTable = await createPreflopTableAsync({
          position: table.position,
          openRaise: table.openRaise,
          openRaisePercentage: table.openRaisePercentage,
          threeBet: table.threeBet,
          threeBetPercentage: table.threeBetPercentage,
          call: table.call,
          callPercentage: table.callPercentage,
        });
        if (newTable) {
          table.id = newTable.id;
        }
      } else if (existingIds.has(table.id)) {
        // Tabla existente, actualizar
        await updatePreflopTableAsync(table.id, {
          position: table.position,
          openRaise: table.openRaise,
          openRaisePercentage: table.openRaisePercentage,
          threeBet: table.threeBet,
          threeBetPercentage: table.threeBetPercentage,
          call: table.call,
          callPercentage: table.callPercentage,
        });
      }
    }
    
    setTables(nextTables);
    setSaving(false);
    setSavedMessage('Tablas guardadas correctamente en Supabase.');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const ActiveIcon = sections.find(section => section.id === activeSection)?.icon || Database;

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-5rem)] space-y-4 pb-24 md:pb-8">
      <header className="hidden md:block">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-5 h-5 md:w-6 md:h-6 text-accent-gold" />
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">
            Panel de <span className="text-gradient-gold">Datos</span>
          </h1>
        </div>
        <p className="text-text-secondary text-xs md:text-base">
          Todo el conocimiento de la app se administra aquí: HUD, Tablas y Juegos.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {sections.map(section => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'card p-3 md:p-4 text-left transition-all border',
                isActive ? 'border-accent-gold glow-gold bg-accent-gold/5' : 'hover:border-border-light'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('w-4 h-4 md:w-5 md:h-5', isActive ? 'text-accent-gold' : 'text-text-muted')} />
                <span className="font-bold text-xs md:text-base text-text-primary">{section.label}</span>
              </div>
              <p className="hidden md:block text-xs text-text-secondary line-clamp-2">{section.description}</p>
            </button>
          );
        })}
      </div>

      <motion.section
        key={activeSection}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="space-y-4"
      >
        <div className="card p-4 md:p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bg-primary border border-border flex items-center justify-center shrink-0">
            <ActiveIcon className="w-5 h-5 text-accent-gold" />
          </div>
          <div>
            <h2 className="text-base md:text-xl font-bold text-text-primary">
              {sections.find(section => section.id === activeSection)?.label}
            </h2>
            <p className="text-xs md:text-sm text-text-secondary">
              {sections.find(section => section.id === activeSection)?.description}
            </p>
          </div>
        </div>

        {activeSection === 'hud' && <HUDConfig />}

        {activeSection === 'tables' && (
          <div className="space-y-3">
            {savedMessage && (
              <div className="card p-3 border-accent-green bg-accent-green/10 text-accent-green text-sm font-bold">
                {savedMessage}
              </div>
            )}
            {loadingTables ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent-gold" />
                <span className="ml-2 text-text-secondary">Cargando tablas...</span>
              </div>
            ) : (
              <TableEditor tables={tables} onSave={handleSaveTables} saving={saving} />
            )}
          </div>
        )}

        {activeSection === 'games' && <DataPackManager />}
      </motion.section>
    </div>
  );
}
