// Parser para archivos de configuración HUD
import { HUDLineConfig, HUDStatConfig } from '../../types/coach';

export function parseHUDJSON(json: string): HUDLineConfig[] {
  const parsed = JSON.parse(json);
  const arr = Array.isArray(parsed) ? parsed : parsed.lines || parsed.hud || parsed.data || [];
  return arr.map((item: Record<string, any>, i: number) => ({
    id: item.id || i + 1,
    name: item.name || item.nombre || `Línea ${i + 1}`,
    stats: (item.stats || []).map((stat: Record<string, string>, j: number) => ({
      shortName: stat.shortName || stat.short_name || stat.abreviatura || `Stat ${j + 1}`,
      fullName: stat.fullName || stat.full_name || stat.nombre || '',
      color: stat.color || 'text-slate-300'
    }))
  })).filter((l: HUDLineConfig) => l.name);
}

export function hudToJSON(hud: HUDLineConfig[]): string {
  return JSON.stringify({ lines: hud }, null, 2);
}
