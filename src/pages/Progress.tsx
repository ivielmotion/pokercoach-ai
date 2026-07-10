import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart2, TrendingUp, Target, Award, Calendar, ChevronRight, Star, CheckCircle2, Trophy } from 'lucide-react';
import { userService, handService } from '../services/dbService';
import { UserProfile, PokerHand } from '../types';
import { cn } from '../lib/utils';

const LOCAL_UID = 'local-user';

export function Progress() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hands, setHands] = useState<PokerHand[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'habilidades' | 'logros'>('resumen');

  useEffect(() => {
    const init = async () => {
      const p = await userService.getProfile(LOCAL_UID);
      setProfile(p);
      handService.getUserHands(LOCAL_UID, setHands);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-border border-t-accent-green rounded-full animate-spin" />
    </div>
  );

  const errorRate = hands.length > 0 
    ? (hands.filter(h => h.analysis?.error).length / hands.length * 100).toFixed(1)
    : '0';

  return (
    <div className="flex flex-col md:h-auto justify-between space-y-3 md:space-y-8 overflow-visible md:overflow-hidden">
      <header>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">
          <span className="text-gradient-green">Tu</span> Progreso
        </h1>
        <p className="hidden md:block text-text-secondary mt-1 text-base md:text-lg">Visualiza tu evolución y áreas de mejora.</p>
      </header>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden gap-1 bg-bg-secondary p-0.5 rounded-lg w-full shrink-0">
        {(['resumen', 'habilidades', 'logros'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-1.5 rounded-md font-bold text-xs capitalize transition-all",
              activeTab === tab 
                ? "bg-bg-card text-text-primary shadow-sm" 
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Grid - Desktop */}
      <div className="hidden md:grid grid-cols-4 gap-4 shrink-0">
        <ProgressCard icon={Target} label="Precisión" value={`${100 - parseFloat(errorRate)}%`} sub="Basado en manos" color="green" />
        <ProgressCard icon={BarChart2} label="Manos" value={hands.length.toString()} sub="Total analizadas" color="blue" />
        <ProgressCard icon={Award} label="Sesiones" value={profile?.stats?.trainingSessions?.toString() || '0'} sub="Entrenamientos" color="gold" />
        <ProgressCard icon={TrendingUp} label="Puntos" value="1,240" sub="XP Acumulada" color="purple" />
      </div>

      {/* Stats Grid - Mobile (Only in Resumen tab) */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 md:hidden shrink-0">
          <ProgressCard icon={Target} label="Precisión" value={`${100 - parseFloat(errorRate)}%`} sub="Basado en manos" color="green" />
          <ProgressCard icon={BarChart2} label="Manos" value={hands.length.toString()} sub="Total analizadas" color="blue" />
          <ProgressCard icon={Award} label="Sesiones" value={profile?.stats?.trainingSessions?.toString() || '0'} sub="Entrenamientos" color="gold" />
          <ProgressCard icon={TrendingUp} label="Puntos" value="1,240" sub="XP Acumulada" color="purple" />
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 min-h-0 md:overflow-visible md:grid md:grid-cols-3 md:gap-6">
        {/* Left Column (Chart and Skills) */}
        <div className={cn(
          "h-full md:col-span-2 flex flex-col gap-3 md:gap-6",
          activeTab !== 'resumen' && activeTab !== 'habilidades' && "hidden md:flex"
        )}>
          <section className={cn(
            "card p-3 md:p-8 flex-1 min-h-0 flex flex-col justify-center",
            activeTab !== 'resumen' && "hidden md:flex"
          )}>
            <h3 className="text-xs md:text-xl font-bold mb-3 md:mb-6">Análisis de Rendimiento</h3>
            <div className="h-28 md:h-64 flex items-end justify-between px-2 md:px-4 gap-1.5 md:gap-2">
              {[40, 65, 55, 80, 75, 90, 85].map((h, i) => (
                <div key={i} className="flex flex-col items-center space-y-1 w-full">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className={cn(
                      "w-4 md:w-8 rounded-t-sm md:rounded-t-lg transition-all duration-500",
                      i === 6 ? "bg-gradient-to-t from-accent-green to-emerald-400" : "bg-bg-hover"
                    )}
                  />
                  <span className="text-[8px] md:text-[10px] font-bold text-text-muted">D{i + 1}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={cn(
            "card p-4 md:p-8 flex-1 min-h-0 flex flex-col justify-center space-y-3 md:space-y-4",
            activeTab !== 'habilidades' && "hidden md:flex"
          )}>
            <h3 className="text-xs md:text-xl font-bold mb-1 md:mb-6">Habilidades</h3>
            <div className="space-y-3 md:space-y-5">
              <SkillBar label="Pre-flop" percentage={85} />
              <SkillBar label="Post-flop" percentage={60} />
              <SkillBar label="Gestión de Banca" percentage={95} />
              <SkillBar label="Control Mental" percentage={45} />
            </div>
          </section>
        </div>

        {/* Right Column (Achievements) */}
        <div className={cn(
          "h-full flex flex-col gap-3 md:gap-4",
          activeTab !== 'logros' && "hidden md:flex"
        )}>
          <div className="card p-3 md:p-8 relative overflow-hidden glow-gold flex-1 flex flex-col justify-center">
            <Star className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 text-accent-gold/5 rotate-12 shrink-0" />
            <h3 className="text-xs md:text-xl font-bold mb-1">Siguiente Rango</h3>
            <p className="text-[10px] md:text-sm text-text-secondary mb-3 md:mb-6">Estás a 240 XP de convertirte en "Avanzado".</p>
            <div className="w-full h-1.5 md:h-2 bg-bg-primary rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-gradient-to-r from-accent-gold to-amber-400 rounded-full" />
            </div>
            <div className="mt-2 flex justify-between text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-text-muted">
              <span>Intermedio</span>
              <span>Avanzado</span>
            </div>
          </div>

          <div className="card p-3 md:p-8 flex-1 flex flex-col justify-center">
            <h3 className="text-xs md:text-lg font-bold mb-2 md:mb-4">Logros Recientes</h3>
            <div className="space-y-2 md:space-y-3">
              <Logro icon={CheckCircle2} title="Analista de Élite" date="Hace 2h" />
              <Logro icon={Calendar} title="Racha de 7 días" date="Ayer" />
              <Logro icon={Trophy} title="Primer 100% en Test" date="Hace 3d" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressCard({ icon: Icon, label, value, sub, color }: any) {
  const colorMap: Record<string, string> = {
    green: 'bg-accent-green/10 text-accent-green',
    blue: 'bg-accent-blue/10 text-accent-blue',
    purple: 'bg-accent-purple/10 text-accent-purple',
    gold: 'bg-accent-gold/10 text-accent-gold',
    red: 'bg-accent-red/10 text-accent-red',
  };

  return (
    <div className="card p-2 md:p-5 flex flex-col md:block items-center justify-center text-center md:text-left">
      <div className={cn("w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mb-1 md:mb-3 shrink-0", colorMap[color] || colorMap.green)}>
        <Icon className="w-4 h-4 md:w-5 md:h-5" />
      </div>
      <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-text-muted truncate w-full">{label}</p>
      <p className="text-xs md:text-2xl font-bold mt-0.5 md:mt-1 truncate w-full">{value}</p>
      <p className="hidden md:block text-[10px] text-text-muted mt-1">{sub}</p>
    </div>
  );
}

function SkillBar({ label, percentage }: any) {
  return (
    <div className="space-y-1 md:space-y-2">
      <div className="flex justify-between text-xs md:text-sm font-bold">
        <span className="text-text-primary text-[10px] md:text-sm">{label}</span>
        <span className="text-text-muted text-[10px] md:text-sm">{percentage}%</span>
      </div>
      <div className="w-full h-2 md:h-2.5 bg-bg-primary rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className="h-full bg-gradient-to-r from-accent-green to-emerald-400 rounded-full"
        />
      </div>
    </div>
  );
}

function Logro({ icon: Icon, title, date }: any) {
  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-bg-primary flex items-center justify-center text-text-muted group-hover:bg-accent-green/10 group-hover:text-accent-green transition-colors shrink-0">
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs md:text-sm font-bold text-text-primary truncate">{title}</p>
          <p className="text-[8px] md:text-[10px] text-text-muted">{date}</p>
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
    </div>
  );
}