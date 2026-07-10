import { NavLink } from 'react-router-dom';
import { Home, Play, Gamepad2, Database, Shield, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/training', icon: Play, label: 'Entrenar' },
  { to: '/games', icon: Gamepad2, label: 'Juegos' },
  { to: '/study', icon: BookOpen, label: 'Estudio' },
  { to: '/data', icon: Database, label: 'Datos' },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 bg-bg-secondary border-r border-border h-screen sticky top-0">
      <div className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-green to-emerald-700 flex items-center justify-center">
          <Shield className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-text-primary leading-tight">Aplicación de Estudio</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Local Edition</p>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-accent-green/10 text-accent-green border border-accent-green/20" 
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              )
            }
          >
            <item.icon className="w-4 h-4 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="bg-bg-card rounded-lg p-3 border border-border">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Modo</p>
          <p className="text-xs text-accent-green font-bold">Entrenamiento Local</p>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-xl border-t border-border px-2 py-2 z-50 overflow-x-auto scrollbar-hide">
      <div className="flex justify-between items-center gap-1 min-w-max">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center space-y-1 transition-all duration-200 py-1 px-2 rounded-lg",
                isActive ? "text-accent-green scale-110" : "text-text-muted"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            <span className="text-[8px] font-medium uppercase tracking-wider whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
