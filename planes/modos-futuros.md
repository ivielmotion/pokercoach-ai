# Plan de Desarrollo: Modos Definir y Scanner

## 1. MODO DEFINIR (Ultra-rápido)

### Concepto
Micro-quiz de 1 sola pregunta por stat. El usuario ve un valor y debe clasificarlo.

### Flujo de juego
1. Pantalla muestra: **"VPIP 65%"**
2. Opciones: **[Tight]** **[Normal]** **[Loose]**
3. Click directo → feedback inmediato (verde/rojo) → auto-next en 400ms
4. No hay botón de "Verificar"

### Preguntas por stat (ejemplos)
- VPIP: "65%" → Loose (≥40%), Normal (25-39%), Tight (<25%)
- PFR: "8%" → Passive (<12%), Normal (12-22%), Aggressive (>22%)
- 3Bet: "12%" → Low (<7%), Normal (7-12%), High (>12%)
- F3B: "70%" → Foldy (>65%), Normal (45-65%), Sticky (<45%)
- WWSF: "45%" → Low (<38%), Normal (38-50%), High (>50%)
- W$SD: "52%" → Unlucky (<48%), Normal (48-55%), Lucky (>55%)

### Puntuación
- +10 puntos por respuesta correcta
- Racha de 5 correctas seguidas = ×2 multiplicador
- Racha de 10 = ×3
- Incorrecta = racha resetea a 0, -5 puntos
- Meta por nivel: 100 puntos en 60 segundos

### Estructura de datos necesaria
```typescript
interface DefineQuestion {
  statId: string;
  value: number;
  options: { label: string; correct: boolean }[];
}
```

### UI
- Pantalla completa centrada
- Valor grande en display tipo slot machine
- 3 botones grandes debajo
- Score arriba derecha, timer arriba izquierda
- Sin texto explicativo, solo los valores y opciones

---

## 2. MODO SCANNER (Estratégico)

### Concepto
Se muestra el HUD COMPLETO de una línea con valores reales. El usuario debe responder UNA pregunta estratégica sobre ese jugador.

### Flujo de juego
1. Pantalla muestra los 13 stats de la línea con valores simulados
2. Pregunta: *"¿Cómo ajustas tu 3Bet vs este jugador?"*
3. Opciones:
   - **[Polarizar]** (frente a loose/passive)
   - **[Mergear]** (frente a tight/aggressive)
   - **[Fold]** (frente a nitt)
4. Click → feedback → auto-next

### Tipos de preguntas estratégicas
1. **Preflop adjustment**: "3Bet range?", "Call range?", "Fold?"
2. **Postflop read**: "CBet freq?", "Barrel turn?", "Call down?"
3. **Player type identification**: "¿Qué tipo de jugador es?" (Nit/LAG/REG/Whale)
4. **Exploit identification**: "¿Cuál es el mayor exploit?"

### Valores simulados
Los valores se generan aleatoriamente dentro de rangos realistas para crear perfiles coherentes:
- Perfil **NIT**: VPIP 12, PFR 10, 3Bet 4, F3B 80
- Perfil **LAG**: VPIP 45, PFR 35, 3Bet 15, F3B 30
- Perfil **REG**: VPIP 22, PFR 18, 3Bet 8, F3B 55
- Perfil **WHALE**: VPIP 65, PFR 20, 3Bet 5, F3B 40

### Puntuación
- +25 puntos por respuesta correcta
- Sin timer (es estratégico, no velocidad)
- Bonus de +15 si aciertas el tipo de jugador + el exploit

### Estructura de datos
```typescript
interface ScannerProfile {
  id: string;
  name: string; // "NIT", "LAG", "REG", "WHALE"
  values: Record<string, number>;
  correctAnswer: string;
  question: string;
  options: string[];
}
```

### UI
- HUD completo arriba (13 stats en línea)
- Pregunta en medio
- 3-4 botones grandes abajo
- Sin scroll, todo en una pantalla

---

## 3. Implementación paso a paso

### Fase 1: Modo Definir (2-3 horas)
1. [ ] Crear componente `DefineGame.tsx`
2. [ ] Generar banco de preguntas a partir de `CURRICULUM` + rangos
3. [ ] Implementar lógica de puntuación con rachas
4. [ ] Timer de 60 segundos por sesión
5. [ ] Pantalla de resultados finales

### Fase 2: Modo Scanner (3-4 horas)
1. [ ] Crear perfiles predefinidos (NIT, LAG, REG, WHALE)
2. [ ] Generador aleatorio de valores coherentes
3. [ ] Banco de 20+ preguntas estratégicas
4. [ ] Crear componente `ScannerGame.tsx`
5. [ ] Sistema de puntuación sin timer

### Fase 3: Integración (1 hora)
1. [ ] Conectar ambos modos al `LevelMenu` (quitar "Próximamente")
2. [ ] Guardar progreso en localStorage
3. [ ] Actualizar progreso del nivel en dashboard

---

## 4. Notas técnicas

- **Sin dependencias nuevas**: usar solo React + Framer Motion
- **Responsive**: los botones deben ser táctiles (min 48px altura)
- **Performance**: precargar el banco de preguntas, no generar en tiempo real
- **Accesibilidad**: mantener colores pero añadir iconos (✓ ✗) para daltonismo

---

## 5. Datos pendientes del usuario

- [ ] **Líneas 2-7**: necesito los stats reales para reemplazar placeholders
- [ ] **Rangos correctos**: confirmar umbrales de Tight/Normal/Loose para cada stat
- [ ] **Preguntas Scanner**: ¿prefieres que yo cree 20 preguntas o me las das?
