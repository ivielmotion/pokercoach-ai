import { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, Video, BookOpen, CheckCircle2, AlertCircle, Brain, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CoachContent {
  id: string;
  type: 'text' | 'video' | 'hand';
  title: string;
  content: string;
  tags: string[];
  date: string;
}

// Demo de contenido - en el futuro se extrae automáticamente del texto pegado
const DEMO_CONTENT: CoachContent[] = [
  {
    id: '1',
    type: 'text',
    title: '3-Bet Light en Posición',
    content: 'Cuando estás en BTN o CO y el raiser es un jugador loose (VPIP > 30), puedes expandir tu rango de 3-bet a manos como AJo, KQo, 99.',
    tags: ['3-bet', 'posición', 'explotativo'],
    date: '2026-05-30',
  },
  {
    id: '2',
    type: 'hand',
    title: 'Hand Review: Hero en BTN con AK',
    content: 'Villain UTG raise 3bb. Hero BTN 3-bet 9bb. Flop A74 rainbow. Villain check. Hero c-bet 1/3 pot. Villain call...',
    tags: ['AK', 'BTN', 'cbet'],
    date: '2026-05-29',
  },
  {
    id: '3',
    type: 'text',
    title: 'Overbet Strategy en River',
    content: 'El overbet en river funciona mejor contra jugadores con W$SD < 48%. Usa un sizing de 1.3x-1.5x pot con polarizadas.',
    tags: ['river', 'overbet', 'explotativo'],
    date: '2026-05-28',
  },
];

export function ContentLoader() {
  const [activeTab, setActiveTab] = useState<'library' | 'add'>('library');
  const [newContent, setNewContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [savedContent, setSavedContent] = useState<CoachContent[]>(() => {
    const saved = localStorage.getItem('pokercoach_content');
    return saved ? JSON.parse(saved) : DEMO_CONTENT;
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    if (!newContent.trim() || !newTitle.trim()) return;
    
    const content: CoachContent = {
      id: crypto.randomUUID(),
      type: 'text',
      title: newTitle,
      content: newContent,
      tags: extractTags(newContent),
      date: new Date().toISOString().split('T')[0],
    };
    
    const updated = [content, ...savedContent];
    setSavedContent(updated);
    localStorage.setItem('pokercoach_content', JSON.stringify(updated));
    setNewContent('');
    setNewTitle('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const extractTags = (text: string): string[] => {
    const keywords = ['3-bet', 'cbet', 'river', 'bluff', 'position', 'BTN', 'UTG', 'BB', 'preflop', 'postflop', 'equity', 'fold', 'raise', 'call'];
    return keywords.filter(k => text.toLowerCase().includes(k.toLowerCase()));
  };

  return (
    <div className="space-y-4">

      {/* Tabs */}
      <div className="flex gap-2 bg-bg-secondary p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('library')}
          className={cn(
            "px-4 py-2 rounded-lg font-bold text-sm transition-all",
            activeTab === 'library' ? "bg-bg-card text-text-primary" : "text-text-muted hover:text-text-primary"
          )}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Biblioteca
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={cn(
            "px-4 py-2 rounded-lg font-bold text-sm transition-all",
            activeTab === 'add' ? "bg-accent-gold/20 text-accent-gold" : "text-text-muted hover:text-text-primary"
          )}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Agregar
        </button>
      </div>

      {activeTab === 'library' ? (
        <div className="space-y-3">
          {savedContent.length === 0 ? (
            <div className="card p-8 text-center">
              <BookOpen className="w-10 h-10 mx-auto text-text-muted mb-3" />
              <p className="text-text-secondary">No hay contenido guardado aún.</p>
            </div>
          ) : (
            savedContent.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-4 md:p-5 hover:border-accent-gold/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-gold/10 flex items-center justify-center shrink-0">
                    {item.type === 'video' ? <Video className="w-5 h-5 text-accent-gold" /> : 
                     item.type === 'hand' ? <Brain className="w-5 h-5 text-accent-gold" /> : 
                     <FileText className="w-5 h-5 text-accent-gold" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text-primary">{item.title}</h3>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{item.content}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-bg-primary border border-border text-[10px] font-bold text-text-muted">
                          {tag}
                        </span>
                      ))}
                      <span className="text-[10px] text-text-muted ml-auto">{item.date}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 bg-accent-green/10 border-accent-green flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-accent-green" />
              <p className="text-accent-green font-bold text-sm">Contenido agregado correctamente. La app lo usará para generar entrenamiento.</p>
            </motion.div>
          )}
          
          <div className="card p-4 md:p-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">Título del concepto</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej: 3-Bet Light en Posición"
                className="w-full bg-bg-primary border border-border rounded-lg px-4 py-3 text-text-primary focus:border-accent-gold focus:outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">Contenido del coach</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Pega aquí textos, notas, o descripción de manos de tu coach..."
                rows={6}
                className="w-full bg-bg-primary border border-border rounded-lg px-4 py-3 text-text-primary focus:border-accent-gold focus:outline-none transition-colors resize-none"
              />
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-primary border border-border">
              <Sparkles className="w-4 h-4 text-accent-gold shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary">
                La app analizará automáticamente este contenido y generará escenarios, quizzes y juegos basados en estos conceptos.
              </p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={!newContent.trim() || !newTitle.trim()}
              className={cn(
                "btn-gold w-full flex items-center justify-center gap-2",
                (!newContent.trim() || !newTitle.trim()) && "opacity-50 cursor-not-allowed"
              )}
            >
              <Upload className="w-4 h-4" />
              Guardar y Generar Entrenamiento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}