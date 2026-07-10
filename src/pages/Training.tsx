import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Eye, LayoutGrid } from 'lucide-react';
import { HUDMaster } from '../components/training/HUDMaster';
import { Tables } from './Tables';
import { cn } from '../lib/utils';

type TrainingTab = 'hud' | 'tables';

export function Training() {
  const [activeTab, setActiveTab] = useState<TrainingTab>('hud');

  return (
<div className="space-y-4 md:space-y-6">
       <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="min-w-0">
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words">
            <span className="text-gradient-green">Centro de</span> Entrenamiento
          </h1>
          <p className="text-text-secondary mt-1">
            {activeTab === 'hud'
              ? 'HUD Master - Aprende las estadísticas del poker'
              : 'Tables - Crea y practica tus tablas preflop'}
          </p>
        </div>
        <div className="flex items-center gap-2 card px-4 py-2 glow-green">
          <Zap className="w-5 h-5 text-accent-green" />
          <span className="text-sm font-bold text-text-primary">Modo: Pro</span>
        </div>
      </div>

      <div className="flex gap-2 bg-bg-secondary p-1 rounded-xl w-fit max-w-full overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('hud')}
          className={cn(
            'px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2',
            activeTab === 'hud'
              ? 'bg-bg-card text-text-primary'
              : 'text-text-muted hover:text-text-primary'
          )}
        >
          <Eye className="w-4 h-4" />
          HUD Master
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={cn(
            'px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2',
            activeTab === 'tables'
              ? 'bg-accent-gold/20 text-accent-gold'
              : 'text-text-muted hover:text-text-primary'
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          Tables
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'hud' ? (
          <motion.div
            key="hud"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <HUDMaster />
          </motion.div>
        ) : (
          <motion.div
            key="tables"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Tables />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
