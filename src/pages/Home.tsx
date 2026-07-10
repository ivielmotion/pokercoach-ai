import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, Play, Trophy, TrendingUp, Database, ChevronRight, Clock, CheckCircle2, ArrowRight, Zap, Target, BookOpen, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { userService, handService } from '../services/dbService';
import { UserProfile, PokerHand } from '../types';
import { cn } from '../lib/utils';
import { useActiveCoach } from '../lib/activeCoach';
import { getActiveDataPack, getProgressForPack, type DataPack } from '../data/dataPackService';

const LOCAL_UID = 'local-user';

export function Home() {
  const { coach } = useActiveCoach();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentHands, setRecentHands] = useState<PokerHand[]>([]);
  const [activePack, setActivePack] = useState<DataPack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const p = await userService.getProfile(LOCAL_UID);
      setProfile(p);
      setActivePack(getActiveDataPack());
      handService.getUserHands(LOCAL_UID, setRecentHands);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-border border-t-accent-green rounded-full animate-spin" />
    </div>
  );

  const packProgress = activePack ? getProgressForPack(activePack.id) : null;
  const masteredConcepts = activePack ? activePack.concepts.filter(concept => (packProgress?.conceptMastery[concept.id]?.score || 0) >= 80).length : 0;
  const totalConcepts = activePack?.concepts.length || 0;
  const masteryPercent = totalConcepts > 0
    ? Math.round(activePack!.concepts.reduce((sum, concept) => sum + (packProgress?.conceptMastery[concept.id]?.score || 0), 0) / (totalConcepts * 100) * 100)
    : 0;
  const questionCount = activePack ? (activePack.multipleChoiceQuestions?.length || 0) + activePack.pathQuestions.length + activePack.trueFalseQuestions.length : 0;

  return (
    <div className="space-y-4 md:space-y-8 p-1">
      {/* Header */}
      <header className="hidden md:flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-4xl font-bold tracking-tight">
            Hola, <span className="text-gradient-green">{profile?.displayName || 'Jugador'}</span>
          </h1>
          <p className="hidden md:block text-text-secondary mt-1 text-base md:text-lg">Tu camino a la maestría en el póker comienza aquí.</p>
        </div>
        {coach && (
          <div className="card p-1.5 px-3 flex items-center gap-2 glow-green text-xs sm:text-sm">
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-accent-green/10 items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-accent-green" />
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-text-muted">Coach</p>
              <p className="font-bold text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{coach.name}</p>
            </div>
          </div>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-4">
        <StatCard icon={TrendingUp} label="Nivel" value={profile?.experienceLevel || 'Principiante'} color="green" />
        <StatCard icon={Target} label="Manos" value={recentHands.length.toString()} color="blue" />
        <StatCard icon={Trophy} label="Media" value={profile?.stats?.averageScore?.toString() || '0%'} color="gold" />
      </div>

      {activePack && (
        <section className="card p-3 md:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent-green" />
                <h2 className="text-sm md:text-xl font-bold">Aprendizaje</h2>
              </div>
              <p className="text-xs text-text-secondary truncate mt-1">DataPack activo: {activePack.name}</p>
            </div>
            <Link to="/study" className="px-3 py-2 rounded-lg bg-accent-green/15 text-accent-green font-bold text-xs shrink-0">Estudiar</Link>
          </div>
          <div className="h-2 rounded-full bg-bg-primary border border-border overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent-green to-accent-blue" style={{ width: `${masteryPercent}%` }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MiniMetric label="Dominio" value={`${masteryPercent}%`} color="green" />
            <MiniMetric label="Conceptos" value={String(totalConcepts)} color="blue" />
            <MiniMetric label="Pendientes" value={String(Math.max(0, totalConcepts - masteredConcepts))} color="gold" />
            <MiniMetric label="Preguntas" value={String(questionCount)} color="blue" />
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <section className="space-y-2 md:space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-gold animate-pulse" />
            <h2 className="text-sm md:text-xl font-bold">Acciones Rápidas</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2 md:gap-3">
            <QuickAction 
              to="/training" 
              icon={Play} 
              title="Entrenar" 
              description="Domina el HUD con 5 niveles de dificultad."
              accent="green"
            />
            <QuickAction 
              to="/study" 
              icon={BookOpen} 
              title="Estudio" 
              description="Repasa el DataPack activo antes de jugar."
              accent="blue"
            />
            <QuickAction 
              to="/games" 
              icon={Gamepad2} 
              title="Juegos" 
              description="Practica con prioridad inteligente."
              accent="green"
            />
            <QuickAction 
              to="/data" 
              icon={Database} 
              title="Datos" 
              description="Gestiona tu coach y su conocimiento."
              accent="gold"
            />
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-2 md:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-green" />
              <h2 className="text-sm md:text-xl font-bold">Actividad Reciente</h2>
            </div>
          </div>
          <div className="card overflow-hidden">
            {recentHands.length === 0 ? (
              <div className="p-5 md:p-8 text-center flex flex-col items-center justify-center">
                <Clock className="w-6 h-6 text-text-muted mb-1.5" />
                <p className="text-xs text-text-secondary mb-2">No hay actividad reciente. Empieza a entrenar.</p>
                <Link to="/training" className="btn-primary inline-block py-1 px-3.5 text-[11px] font-bold">Ir a Entrenar</Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentHands.slice(0, 4).map((hand, idx) => (
                  <div 
                    key={hand.id} 
                    className={cn(
                      "p-2.5 md:p-4 flex items-center justify-between hover:bg-bg-hover/50 transition-colors",
                      idx >= 2 && "hidden md:flex"
                    )}
                  >
                    <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        hand.analysis?.error ? "bg-accent-red/10 text-accent-red" : "bg-accent-green/10 text-accent-green"
                      )}>
                        {hand.analysis?.error ? <Trophy className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs md:text-sm truncate">{hand.history}</p>
                        <p className="text-[8px] md:text-[10px] font-bold text-text-muted uppercase tracking-widest">{new Date(hand.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, color }: { label: string; value: string; color: 'green' | 'blue' | 'gold' }) {
  const colors = {
    green: 'text-accent-green',
    blue: 'text-accent-blue',
    gold: 'text-accent-gold',
  };
  return (
    <div className="p-2 md:p-3 rounded-xl bg-bg-primary border border-border">
      <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-text-muted truncate">{label}</p>
      <p className={cn('text-sm md:text-xl font-bold', colors[color])}>{value}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colorMap: Record<string, string> = {
    green: 'bg-accent-green/10 text-accent-green',
    blue: 'bg-accent-blue/10 text-accent-blue',
    gold: 'bg-accent-gold/10 text-accent-gold',
    red: 'bg-accent-red/10 text-accent-red',
    purple: 'bg-accent-purple/10 text-accent-purple',
  };

  return (
    <div className="card p-2 md:p-4 flex flex-col min-[400px]:flex-row items-center gap-1.5 md:gap-4 text-center min-[400px]:text-left">
      <div className={cn("w-8 h-8 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center shrink-0", colorMap[color] || colorMap.green)}>
        <Icon className="w-4 h-4 md:w-5 md:h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-text-muted truncate">{label}</p>
        <p className="text-xs md:text-lg font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, description, accent }: any) {
  const accentMap: Record<string, string> = {
    green: 'border-l-2 md:border-l-4 border-l-accent-green hover:bg-accent-green/5',
    blue: 'border-l-2 md:border-l-4 border-l-accent-blue hover:bg-accent-blue/5',
    gold: 'border-l-2 md:border-l-4 border-l-accent-gold hover:bg-accent-gold/5',
  };

  return (
    <Link to={to} className="flex-1">
      <motion.div 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn("card p-2 md:p-4 flex flex-col md:flex-row items-center gap-1.5 md:gap-4 cursor-pointer transition-colors text-center md:text-left h-full justify-center md:justify-start", accentMap[accent] || accentMap.green)}
      >
        <div className="w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-bg-primary flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 md:w-6 md:h-6 text-text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs md:text-base truncate">{title}</h3>
          <p className="hidden md:block text-sm text-text-secondary line-clamp-1">{description}</p>
        </div>
        <ArrowRight className="hidden md:block w-5 h-5 text-text-muted" />
      </motion.div>
    </Link>
  );
}
