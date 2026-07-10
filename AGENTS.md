# AGENTS.md - Aplicacion de Estudio

## Regla obligatoria antes de modificar funciones

Revisar `STUDY_APP_RULES.md` antes de crear o modificar prompts, transformadores, mapas, resumenes, flashcards, juegos o cualquier interpretacion de DataPack.

La aplicacion es generica: debe funcionar con cualquier tipo de documento TXT/DataPack. No agregar reglas hardcodeadas de poker, HUD, stats, perfiles u otro dominio especifico salvo que el usuario lo pida explicitamente para ese documento.

## Historial del Problema Crítico

### Fecha: 2026-05-31
### Severidad: CRÍTICA - App no arrancaba

## Qué pasó

La app mostraba error: `"Cannot read 'image.png' (this model does not support image input)."`

El usuario no podía ver NADA. Pantalla en blanco / error de conexión.

## Causa Raíz

El paquete `@google/genai` (Gemini SDK) era importado estáticamente al inicio de `aiService.ts`:

```typescript
// ❌ MAL - import estático que crashea la app
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
```

Cuando no había API Key configurada (sin archivo `.env`), el SDK intentaba hacer una operación interna que provocaba el error `"Cannot read 'image.png'"`, crasheando toda la aplicación React ANTES de que pudiera renderizar.

El error NO era de nuestro código. Era del SDK de Gemini inicializándose mal.

## Solución Aplicada

### 1. Eliminación completa de dependencias externas

Se eliminaron TODAS las dependencias que requieren internet o APIs externas:

**Eliminados de package.json:**
- `@google/genai` (Gemini SDK)
- `firebase` (Firebase SDK)
- `dotenv`
- `express`
- `better-sqlite3` (del proyecto original)

**Archivos eliminados:**
- `src/firebase.ts`
- `src/services/aiService.ts`
- `src/pages/Upload.tsx`
- `firebase-applet-config.json`
- `firebase-blueprint.json`
- `firestore.rules`

### 2. Reemplazo con localStorage

Toda la persistencia ahora usa `localStorage` (ver `src/lib/store.ts`):

- Perfiles de usuario
- Estrategias/coaches
- Manos analizadas
- Progreso del HUD

### 3. Diseño Unificado Oscuro (Poker Pro)

Todo el tema es oscuro estilo casino/poker de alto nivel:
- Fondo: `#0B0F19`
- Tarjetas: `#1F2937`
- Acentos: Verde esmeralda `#10B981`, Dorado `#F59E0B`
- Tipografía: Inter (Google Fonts)
- Responsive: Sidebar desktop, bottom nav móvil

### 4. Hub de Entrenamiento (`/training`)

La sección Entrenar es un hub con 3 pestañas internas (SOLO entrenamiento, sin config):

| Tab | Componente | Qué hace |
|-----|-----------|----------|
| **HUD Master** | `src/components/training/HUDMaster.tsx` | **Juego arcade de 3 modos por nivel (línea):** Memorizar (Simon Says: stat resalta → toca abreviatura correcta en 3s), Definir (quiz ultra-corto), Scanner (interpreta valores). Desbloqueo progresivo. Sin texto largo, 100% visual y rápido. |
| **Escenarios** | `src/components/training/CoachScenarios.tsx` | Práctica basada en el coach activo |
| **Juegos** | `src/components/training/GamesHub.tsx` | 8 juegos interactivos de poker (CogniFlow) |

### HUD Master — Arquitectura de Juego

**Niveles = Líneas del HUD:**
- Nivel 1 = Línea 1 del HUD (15 stats: VPIP, PFR, 3Bet, F3B, 4Bet, F4B, 5Bet, F5B, WWSF, W$SD, OB Turn, Cont OB, OB River, Player, Hands)
- Nivel 2-7 = Próximamente (se configuran en Centro de Configuración)

**3 Modos de Juego (desbloqueo progresivo):**
1. **Memorizar** (Arcade): HUD arriba → un stat resalta/parpadea → 4 botones de abreviaturas abajo → toca la correcta en 3 segundos. Timer, score, racha. 10 rondas.
2. **Definir** (Quiz): Preguntas ultra-cortas de 2-3 opciones sobre qué mide cada stat.
3. **Scanner** (Interpretación): HUD con valores aleatorios → 1 pregunta estratégica (ej: "VPIP 65% + PFR 8% = ¿Cómo explotas?")

**Colores exactos del HUD del usuario:**
| Pos | Stat | Color Tailwind |
|-----|------|---------------|
| 1-2 | VPIP/PFR | `text-slate-100` |
| 3 | 3Bet | `text-amber-400` |
| 4 | F3B | `text-emerald-300` |
| 5,7,11,13 | 4Bet/5Bet/OB Turn/OB River | `text-red-500` |
| 6,8 | F4B/F5B | `text-green-500` / `text-lime-400` |
| 9-10 | WWSF/W$SD | `text-cyan-300` |
| 12 | Cont OB | `text-orange-300` |
| 14-15 | Player/Hands | `text-slate-500` (info) |

### 4b. Centro de Configuración (`/coach`)

La página Coach NO es chat IA. Es el centro de configuración:

| Tab | Qué hace |
|-----|----------|
| **Coach Activo** | Muestra el coach seleccionado con sus reglas y estilo |
| **Cargar Contenido** | Pega textos, notas y manos del coach (ContentLoader) |
| **Configurar HUD** | Editor del HUD de 7 líneas con import/export JSON |

### 5. Motor Sintex para Datos

La creación de DataPacks desde TXT usa el servidor Express `server.ts` en puerto `5193`.

Flujo actual:
- `npm run dev` ejecuta `tsx server.ts`.
- `ABRIR.bat` debe abrir esta app completa con `npm run dev`, no un servidor estático con Python.
- Express carga `.env.local` y expone `/api/synthesize`.
- En Vercel, `/api/synthesize` vive en `api/synthesize.ts` como función serverless. Vercel no ejecuta `server.ts` de Express.
- El prompt compartido vive en `src/server/syntexEngine.ts`, usado por local (`server.ts`) y producción (`api/synthesize.ts`).
- `DataPackManager.tsx` envía el TXT a `/api/synthesize`.
- `src/services/sintexTransformer.ts` convierte el Markdown devuelto en `StudyGuide` editable.
- `StudyGuideViewer.tsx` permite editar listas, textos y tablas sin cambiar la estructura base.
- `/api/config-check` verifica si existe API key en el servidor.

Reglas del conversor Markdown:
- `# Título` define `guide.title`.
- `## N. Sección` crea una sección nueva.
- Texto suelto después de `##` crea un bloque `paragraph`.
- `### N.M Subgrupo` define el título de la siguiente lista.
- `* **Concepto:** definición` crea un item editable de lista.
- `**Término:** descripción` sin viñeta crea un bloque `paragraph` con título.

La API externa vive únicamente en el servidor. No importar SDKs de IA en el bundle React.

Regla de integración: Syntex no es una segunda app para abrir aparte. El motor de Syntex vive dentro de PokerCoach para la pantalla Datos, en la misma app local `http://localhost:5193`.

Regla de salida Syntex: las definiciones generadas para cualquier TXT deben ser compactas pero explicativas, con explicaciones de `30-55` caracteres. Esto alimenta Datos, flashcards y juegos, por lo que no deben ser frases largas.

## Cómo agregar un Juego Nuevo

### Paso 1: Crear el componente del juego

```
src/games/
  MiJuego.tsx          ← Tu componente React del juego
  index.ts             ← Registro de juegos (actualizar)
```

### Paso 2: Implementar el juego

```tsx
// src/games/MiJuego.tsx
export function MiJuego() {
  return (
    <div className="space-y-4">
      <h2>Mi Juego de Poker</h2>
      {/* Lógica del juego */}
    </div>
  );
}
```

### Paso 3: Registrar en el índice

```typescript
// src/games/index.ts
import { MiJuego } from './MiJuego';

export const GAMES_REGISTRY: GameConfig[] = [
  {
    id: 'mi-juego',
    name: 'Mi Juego',
    description: '...',
    icon: Gamepad2,
    component: <MiJuego />,
    tags: ['preflop', 'GTO'],
    difficulty: 'intermediate',
  },
];
```

### Paso 4: Conectar con el Hub

En `src/components/training/GamesHub.tsx`, agregar el juego a la lista `GAMES` o cargar dinámicamente desde `GAMES_REGISTRY`.

## Cómo agregar Contenido del Coach

### Desde la UI (Centro de Configuración):

1. Ve a `/coach` → pestaña **Cargar Contenido**
2. Escribe un título y pega el contenido del coach
3. Click en "Guardar y Generar Entrenamiento"

### Programáticamente:

```typescript
// El contenido se guarda en localStorage bajo 'pokercoach_content'
const content = {
  id: crypto.randomUUID(),
  type: 'text',
  title: 'Mi Concepto',
  content: 'Aquí el texto del coach...',
  tags: ['3-bet', 'posición'],
  date: '2026-05-31',
};

const existing = JSON.parse(localStorage.getItem('pokercoach_content') || '[]');
localStorage.setItem('pokercoach_content', JSON.stringify([content, ...existing]));
```

## Prevención - Checklist Obligatoria

Antes de agregar CUALQUIER dependencia externa:

- [ ] ¿Funciona sin internet?
- [ ] ¿Tiene dynamic import o está cargado perezosamente?
- [ ] ¿Si falla la API, la app sigue funcionando?
- [ ] ¿No hay imports estáticos de SDKs de terceros en el bundle principal?
- [ ] ¿El error boundary muestra un mensaje amigable si algo falla?

## Troubleshooting Rápido

### "No se puede acceder a este sitio web" / ERR_CONNECTION_REFUSED

**Causa:** El servidor no está corriendo.
**Fix:** Ejecutar `npm run dev` (deja la terminal abierta) o usar `ABRIR.bat`.

### Pantalla en blanco

**Causa:** Error de JavaScript que impide que React renderice.
**Fix:** Abrir DevTools (F12) → Console. Si ves un error, busca si viene de un paquete externo.

### App lenta o no responde

**Causa:** Procesos de Node anteriores bloqueando puertos.
**Fix:** `taskkill /F /IM node.exe` en PowerShell.

## Estructura del Proyecto

```
pokercoach-ai/
├── src/
│   ├── components/
│   │   ├── training/
│   │   │   ├── HUDMaster.tsx      ← Curso HUD (5 niveles, simulador, quizzes)
│   │   │   ├── CoachScenarios.tsx ← Escenarios dinámicos del coach activo
│   │   │   ├── GamesHub.tsx       ← Hub de juegos (placeholder para nuevos)
│   │   │   └── ContentLoader.tsx  ← Carga contenido del coach (texto, notas)
│   │   ├── Layout.tsx             ← Layout oscuro con sidebar/bottom nav
│   │   └── Navigation.tsx         ← Sidebar desktop + mobile nav
│   ├── data/
│   │   ├── curriculum.ts          ← Datos del curso HUD
│   │   └── defaultStrategies.ts   ← Coaches precargados
│   ├── games/
│   │   └── index.ts               ← Registro de juegos
│   ├── lib/
│   │   ├── store.ts               ← localStorage wrapper
│   │   └── utils.ts               ← cn() helper
│   ├── pages/
│   │   ├── Training.tsx           ← Hub principal con 3 tabs (HUD, Escenarios, Juegos)
│   │   ├── Home.tsx               ← Dashboard oscuro
│   │   ├── Analysis.tsx           ← Placeholder (sin funcionalidad actual)
│   │   ├── Coach.tsx              ← Centro de Configuración (Coach, Contenido, HUD)
│   │   ├── Strategies.tsx         ← Selección de coach/estrategia
│   │   └── Progress.tsx           ← Stats y logros
│   ├── services/
│   │   └── dbService.ts           ← Todo localStorage
│   ├── types.ts                   ← Tipos TypeScript
│   ├── App.tsx                    ← Rutas + init local
│   ├── main.tsx                   ← Entry point React
│   └── index.css                  ← Tailwind v4 tema oscuro poker
├── index.html                     ← HTML con loading oscuro elegante
├── package.json                   ← Sin dependencias externas
├── vite.config.ts               ← Config Vite
└── AGENTS.md                    ← Este archivo
```

## Regla de Oro

> **La app debe funcionar 100% offline sin configuración adicional.**
> Si una funcionalidad requiere API externa, debe ser opt-in y nunca bloquear el arranque.

---

## Regla de Oro para Nuevas Líneas del HUD

> **Toda línea nueva (Nivel) del HUD Master DEBE cumplir la misma dinámica de juego que las líneas ya existentes.**

### Requisitos obligatorios para cada línea:

1. **3 Modos de Juego funcionales** (no "Próximamente"):
   - **Memorizar**: Stat resalta → 4 botones de abreviaturas → toca la correcta en 3s. Timer, score, racha.
   - **Definir**: Quiz automático de definiciones. "¿Qué significa [shortName]?" con 4 opciones.
   - **Scanner**: Interpretación de valores. Muestra un valor aleatorio → pregunta si es Bajo, Normal o Alto según `STAT_RANGES`.

2. **Separadores visuales**: Si la línea tiene bloques lógicos, usar concepts con `id: "separator-..."` y `shortName: "|"`. El renderizado los muestra como barras verticales cian automáticamente.

3. **Colores en HUDMaster.tsx**: Cada stat nuevo DEBE tener su entrada en el diccionario `STAT_COLORS` dentro de `src/components/training/HUDMaster.tsx`, usando el `concept.id` exacto.

4. **Rangos en STAT_RANGES**: Cada stat nuevo DEBE tener su rango numérico en `src/data/curriculum.ts` dentro de `STAT_RANGES`, para que el juego genere valores aleatorios coherentes.

5. **Quizzes no son obligatorios**: Los 3 modos de juego generan sus preguntas automáticamente a partir de los datos del concept (`shortName`, `definition`, `name`). No es necesario escribir quizzes manualmente en `curriculum.ts`.

### Checklist para agregar una Línea N:
- [ ] Agregar los `concepts` en `CURRICULUM` (incluir separadores si aplica).
- [ ] Agregar `STAT_RANGES` para cada stat nuevo.
- [ ] Agregar `STAT_COLORS` en `HUDMaster.tsx` para cada stat nuevo.
- [ ] Verificar que los 3 modos de juego funcionan (sin "Próximamente").
- [ ] Build exitoso.

## Puertos

- **Dev:** `5193` (`npm run dev` levanta Express + Vite middleware)
- **Preview:** `5193`
- Vite no define puerto propio en `vite.config.ts` porque Express maneja el servidor.

## Comandos

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

## Dependencias Actuales

- `react` + `react-dom` - Framework UI
- `react-router-dom` - Routing
- `tailwindcss` + `@tailwindcss/vite` - CSS
- `lucide-react` - Iconos
- `motion` - Animaciones
- `clsx` + `tailwind-merge` - Utilidades CSS
- `react-markdown` - Renderizado markdown (UI local)
- `vite` - Bundler
- `express` + `dotenv` - Servidor local para `/api/synthesize`
- `tsx` - Ejecuta `server.ts` en desarrollo

La app arranca localmente; la generación Sintex requiere API key y conexión solo al crear Datos desde TXT.
