// Página de detalle del coach con 5 pestañas
import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, BookOpen, Zap, LayoutGrid, Settings, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { CoachProfile } from '../types/coach';
import { coachService } from '../services/coachService';
import { CoachEditor } from '../components/coach/CoachEditor';
import { KnowledgeEditor } from '../components/coach/KnowledgeEditor';
import { StrategyEditor } from '../components/coach/StrategyEditor';
import { TableEditor } from '../components/coach/TableEditor';
import { HUDEditor } from '../components/coach/HUDEditor';

interface CoachDetailProps {
  coach: CoachProfile;
  onBack: () => void;
  onCoachUpdated: () => void;
}

const tabs = [
  { id: 'coach', label: 'Coach', icon: Shield, shortLabel: 'Info' },
  { id: 'knowledge', label: 'Conocimiento', icon: BookOpen, shortLabel: 'Glosario' },
  { id: 'strategies', label: 'Estrategias', icon: Zap, shortLabel: 'Estrategia' },
  { id: 'tables', label: 'Tablas', icon: LayoutGrid, shortLabel: 'Tablas' },
  { id: 'hud', label: 'HUD', icon: Settings, shortLabel: 'HUD' },
];

export function CoachDetail({ coach, onBack, onCoachUpdated }: CoachDetailProps) {
  const [activeTab, setActiveTab] = useState('coach');
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = (updates: Partial<CoachProfile>) => {
    coachService.update(coach.id, updates);
    setSaveMessage('Guardado correctamente');
    onCoachUpdated();
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleSaveKnowledge = (knowledge: any[]) => {
    coachService.updateKnowledge(coach.id, knowledge);
    setSaveMessage('Conocimiento guardado');
    onCoachUpdated();
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleSaveStrategies = (strategies: any[]) => {
    coachService.updateStrategies(coach.id, strategies);
    setSaveMessage('Estrategias guardadas');
    onCoachUpdated();
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleSaveTables = (tables: any[]) => {
    coachService.updateTables(coach.id, tables);
    setSaveMessage('Tablas guardadas');
    onCoachUpdated();
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleSaveHUD = (hudConfig: any[]) => {
    coachService.updateHUD(coach.id, hudConfig);
    setSaveMessage('HUD guardado');
    onCoachUpdated();
    setTimeout(() => setSaveMessage(''), 2000);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] space-y-3 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-text-primary truncate">{coach.name}</h1>
            <p className="text-[10px] md:text-xs text-accent-gold font-medium truncate">{coach.style}</p>
          </div>
        </div>
        
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-green/10 text-accent-green text-[10px] md:text-xs font-medium shrink-0"
          >
            <Check className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">{saveMessage}</span>
            <span className="sm:hidden">OK</span>
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-secondary p-0.5 rounded-lg overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-shrink-0 px-2.5 md:px-3 py-1.5 md:py-2 rounded-md font-medium text-[10px] md:text-xs transition-all flex items-center gap-1 md:gap-1.5",
              activeTab === tab.id 
                ? "bg-bg-card text-text-primary shadow-sm" 
                : "text-text-muted hover:text-text-primary"
            )}
          >
            <tab.icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="card p-3 md:p-6 flex-1"
      >
        {activeTab === 'coach' && (
          <CoachEditor coach={coach} onSave={handleSave} />
        )}
        
        {activeTab === 'knowledge' && (
          <KnowledgeEditor entries={coach.knowledge} onSave={handleSaveKnowledge} />
        )}
        
        {activeTab === 'strategies' && (
          <StrategyEditor strategies={coach.strategies} onSave={handleSaveStrategies} />
        )}
        
        {activeTab === 'tables' && (
          <TableEditor tables={coach.tables} onSave={handleSaveTables} />
        )}
        
        {activeTab === 'hud' && (
          <HUDEditor hudConfig={coach.hudConfig} onSave={handleSaveHUD} />
        )}
      </motion.div>
    </div>
  );
}
