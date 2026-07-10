export interface HUDStat {
  id: string;
  shortName: string;
  fullName: string;
  definition: string;
  color: string; // tailwind color class
  exampleValue?: string;
}

export interface HUDLine {
  id: number;
  name: string;
  stats: HUDStat[];
}

export interface HUDProfile {
  id: string;
  name: string;
  description: string;
  lines: HUDLine[];
}

// Color mapping for stats (similar to PT4 color coding)
export const STAT_COLOR_MAP: Record<string, string> = {
  'vpip': 'text-red-400',
  'pfr': 'text-red-400',
  '3bet': 'text-orange-400',
  'f3bet': 'text-emerald-400',
  '4bet': 'text-orange-400',
  'f4bet': 'text-emerald-400',
  'steal': 'text-orange-400',
  'fts': 'text-emerald-400',
  'cbet': 'text-red-400',
  'fcbet': 'text-emerald-400',
  'af': 'text-green-400',
  'wwsf': 'text-slate-300',
  'wsd': 'text-slate-300',
  'wtsd': 'text-slate-300',
  'default': 'text-slate-300',
};
