// Componente principal del módulo Tables.
// Dos sub-secciones: Práctica (mesa con cartas) y Editor (matriz 13x13 + sliders).

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3, Play, LayoutGrid } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RangeEditorView } from './RangeEditorView';
import { TrainerView } from './TrainerView';

type SubTab = 'trainer' | 'editor';

export function TablesApp() {
  const [sub, setSub] = useState<SubTab>('editor');

  return (
<div className="space-y-4">
       <div className="flex items-center gap-2 min-w-0">
         <LayoutGrid className="w-5 h-5 md:w-6 md:h-6 text-accent-gold shrink-0" />
         <h1 className="text-xl md:text-3xl font-bold tracking-tight">
          <span className="text-gradient-gold">Tables</span>
        </h1>
      </div>

      <div className="flex gap-2 bg-bg-secondary p-1 rounded-xl w-fit max-w-full overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setSub('editor')}
          className={cn(
            'px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-2',
            sub === 'editor'
              ? 'bg-bg-card text-text-primary'
              : 'text-text-muted hover:text-text-primary'
          )}
        >
          <Edit3 className="w-4 h-4" /> Editor
        </button>
        <button
          onClick={() => setSub('trainer')}
          className={cn(
            'px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-2',
            sub === 'trainer'
              ? 'bg-accent-gold/20 text-accent-gold'
              : 'text-text-muted hover:text-text-primary'
          )}
        >
          <Play className="w-4 h-4" /> Práctica
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={sub}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
        >
          {sub === 'editor' ? <RangeEditorView /> : <TrainerView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
