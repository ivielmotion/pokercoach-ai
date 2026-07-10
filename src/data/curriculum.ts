import { Level, StatColor, QuizQuestion } from '../types';

// Colores exactos basados en la imagen del HUD de PokerTracker del usuario
// 1-2: Blanco/celeste | 3: Naranja | 4: Verde cian | 5,7,11,13: Rojo | 6,8: Verde | 9-10: Celeste | 12: Naranja salmón | 14-15: Gris info

export const STAT_RANGES: Record<string, { low: number; avg: number; high: number }> = {
  // Línea 1 - Perfil General
  vpip: { low: 12, avg: 22, high: 65 },
  pfr: { low: 8, avg: 18, high: 55 },
  '3bet': { low: 3, avg: 7, high: 15 },
  f3bet: { low: 35, avg: 58, high: 85 },
  '4bet': { low: 2, avg: 4, high: 10 },
  f4bet: { low: 30, avg: 55, high: 80 },
  '5bet': { low: 1, avg: 3, high: 8 },
  f5bet: { low: 25, avg: 45, high: 70 },
  wwsf: { low: 30, avg: 47, high: 55 },
  wsd: { low: 48, avg: 54, high: 62 },
  obturn: { low: 5, avg: 12, high: 25 },
  contob: { low: 10, avg: 25, high: 45 },
  obriver: { low: 8, avg: 18, high: 35 },

  // Línea 2 - Juego en Botón (Cold Call, 3Bet, Squeeze, Farha)
  'l2-cc-btn-utg': { low: 8, avg: 15, high: 28 },    // CCvUTG: mínimo 10%, normal ~15
  'l2-3b-btn-utg': { low: 4, avg: 7, high: 12 },      // 3BvUTG: 5-7% normal, 9-10% bien
  'l2-cc-btn-co': { low: 10, avg: 18, high: 32 },     // CCvCO: mínimo 10%, más amplio vs CO
  'l2-3b-btn-co': { low: 6, avg: 10, high: 15 },      // 3BvCO: más alto que vs UTG
  'l2-sqz-gen': { low: 7, avg: 11, high: 18 },        // Squeeze: 10-12% normal
  'l2-sqz-btn': { low: 7, avg: 11, high: 18 },        // SqzvBTN: similar squeeze
  'l2-f-sqz': { low: 35, avg: 49, high: 65 },        // FtoSqz: ~49% está bien
  'l2-c-4bet': { low: 1, avg: 2, high: 5 },           // C4Bet: ~2% (solo AA/KK)
  'l2-farha': { low: 0, avg: 1, high: 3 },            // Farha: casi nunca, muy raro
  'l2-farha-pos': { low: 0, avg: 1, high: 3 },        // FarhaP: casi nunca

  // Línea 3 - Juego en Ciegas (SB/BB vs posiciones, Limp Pots, Multiway)
  'l3-sb-3b-ep': { low: 3, avg: 5, high: 10 },        // SB 3Bet vs EP: bajo, sin posición
  'l3-sb-3b-co': { low: 5, avg: 8, high: 14 },        // SB 3Bet vs CO: más que vs EP
  'l3-sb-f-btn': { low: 75, avg: 85, high: 95 },      // SB Fold vs BTN: GTO ~85%
  'l3-sb-3b-btn': { low: 5, avg: 9, high: 15 },       // SB 3Bet vs BTN: defendemos
  'l3-bb-f-nosteal': { low: 65, avg: 72, high: 80 },  // BB Fold vs No Steal: ~70%
  'l3-bb-3b-ep': { low: 3, avg: 5, high: 9 },         // BB 3Bet vs EP: bajo
  'l3-bb-3b-co': { low: 6, avg: 9, high: 14 },        // BB 3Bet vs CO: ~8-10%
  'l3-bb-f-btn-small': { low: 40, avg: 48, high: 58 }, // BB Fold vs BTN < 2.5bb: ~45-50
  'l3-bb-f-btn-big': { low: 40, avg: 48, high: 58 },   // BB Fold vs BTN >= 2.5bb: ~45-50
  'l3-bb-3b-btn': { low: 8, avg: 14, high: 22 },      // BB 3Bet vs BTN: mínimo 12-15
  'l3-bb-f-sb': { low: 14, avg: 22, high: 32 },       // BB Fold vs SB: 14-25 normal
  'l3-bb-3b-sb': { low: 12, avg: 18, high: 26 },      // BB 3Bet vs SB: 15-25
  'l3-bb-raise-limp': { low: 2, avg: 5, high: 10 },   // Raise vs SB Limp
  'l3-bb-f-float-limp': { low: 30, avg: 42, high: 55 }, // Fold Float Limp Pot
  'l3-bet-flop-mw': { low: 30, avg: 42, high: 55 },   // Bet Flop Multiway: 30-55
  'l3-wwsf-mw': { low: 30, avg: 38, high: 48 },      // WWSF Multiway: 30-45

  // Línea 4 - Juego sin Iniciativa (IP / OOP / Turn)
  'l4-f-flop-ip': { low: 25, avg: 35, high: 48 },     // Fold Flop IP: ~33-35 normal, >40 overfold
  'l4-f-minbet-ip': { low: 30, avg: 42, high: 55 },   // Fold MinBet IP: similar a fold normal
  'l4-float-flop': { low: 10, avg: 28, high: 45 },    // Float Flop: 16 bajo, 30-35 normal
  'l4-f-delayed-ip': { low: 35, avg: 50, high: 70 }, // Fold Delayed IP: ~50%+
  'l4-r-flop-ip': { low: 5, avg: 12, high: 20 },      // Raise Flop IP: ~12%
  'l4-f-flop-oop': { low: 30, avg: 38, high: 55 },   // Fold Flop OOP: ~35-40, >45 explotable
  'l4-probe-turn': { low: 15, avg: 32, high: 50 },   // Probe Turn: similar a float
  'l4-f-delayed-oop': { low: 35, avg: 50, high: 70 }, // Fold Delayed OOP: similar a IP
  'l4-r-flop-oop': { low: 5, avg: 11, high: 20 },    // Raise Flop OOP: ~10-13%
  'l4-2bet-fold': { low: 25, avg: 45, high: 70 },    // 2Bet & Fold: ~43%
  'l4-cont-post-raise': { low: 40, avg: 60, high: 80 }, // Cont. post Raise: ~60% valor
  'l4-f-turn-cbet': { low: 30, avg: 40, high: 55 },   // Fold Turn Cbet: ~40, >45 alto
  'l4-f-overbet-turn': { low: 55, avg: 72, high: 90 }, // Fold Overbet Turn: >72 explotable
  'l4-steal-turn': { low: 30, avg: 48, high: 70 },   // Steal Turn: ~45-57 normal, >57 pasado
  'l4-r-turn': { low: 5, avg: 12, high: 25 },        // Raise Turn: ~12%

  // Línea 5 - Juego en River (Bet, Fold, WSD por tamaños)
  'l5-bet-river': { low: 25, avg: 35, high: 55 },      // Bet River: ~35% normal
  'l5-f-r-bet': { low: 40, avg: 52, high: 65 },       // Fold River Bet: ~50-54
  'l5-wsdwbr': { low: 40, avg: 52, high: 62 },       // WSDWBR: ~48-54
  'l5-wsdwrr': { low: 55, avg: 68, high: 80 },       // WSDWRR: ~60-70 (raise river casi siempre valor)
  'l5-f-r-bet-min': { low: 40, avg: 52, high: 65 },   // Fold River Bet Min
  'l5-f-r-minbet': { low: 40, avg: 52, high: 65 },   // Fold River MinBet
  'l5-f-r-twothird': { low: 45, avg: 58, high: 72 }, // Fold River 2/3
  'l5-f-r-over': { low: 60, avg: 78, high: 92 },     // Fold River Over: >78 explotable
  'l5-f-raise': { low: 50, avg: 65, high: 80 },      // Fold River Raise
  'l5-wsdwbr-min': { low: 40, avg: 52, high: 62 },  // WSDWBR MinBet
  'l5-wsdwbr-half': { low: 40, avg: 52, high: 62 },  // WSDWBR HalfBet
  'l5-wsdwbr-twothird': { low: 40, avg: 52, high: 62 }, // WSDWBR 2/3
  'l5-wsdwbr-quarter': { low: 40, avg: 52, high: 62 },  // WSDWBR QuarterPot
  'l5-wsdwbr-over': { low: 40, avg: 52, high: 62 },  // WSDWBR Overbet
  'l5-bet-river-sm': { low: 25, avg: 35, high: 50 }, // Bet River Small Pot
  'l5-wwrb-small': { low: 40, avg: 52, high: 62 },   // WWRB Small Pot
  'l5-bet-river-big': { low: 25, avg: 35, high: 50 }, // Bet River Big Pot
  'l5-wwrb-big': { low: 40, avg: 52, high: 62 },    // WWRB Big Pot

  // Línea 6 - Juego con Iniciativa (CBets, Delayed, Probes, Floats)
  'l6-cbet-flop-ip': { low: 50, avg: 65, high: 85 },    // CBet Flop IP: ~60-65 GTO, 77+ exploitative
  'l6-minbet-flop': { low: 20, avg: 35, high: 55 },     // MinBet Flop
  'l6-f-t-probe': { low: 35, avg: 50, high: 65 },      // Fold to T Probe: ~50
  'l6-delayed-turn-ip': { low: 20, avg: 35, high: 50 }, // Delayed Turn IP
  'l6-cbet-flop-oop': { low: 45, avg: 58, high: 75 },  // CBet Flop OOP: ~55-58
  'l6-f-f-float': { low: 35, avg: 50, high: 65 },      // Fold to F Float: >50 alto
  'l6-cbet-flop-sb': { low: 25, avg: 40, high: 60 },    // CBet Flop SB vs BB: ~30-40
  'l6-f-f-float-sb': { low: 35, avg: 50, high: 65 },   // Fold to F Float SB vs BB
  'l6-r-f-float': { low: 0, avg: 5, high: 12 },       // Raise F Float: ~0-9
  'l6-delayed-turn-oop': { low: 20, avg: 35, high: 50 }, // Delayed Turn OOP
  'l6-f-raise-flop': { low: 25, avg: 40, high: 55 },   // Fold to Raise Flop: ~40
  'l6-3bet-flop-srp': { low: 0, avg: 3, high: 8 },     // 3Bet Flop SRP: ~0-5
  'l6-f-after-cbet': { low: 30, avg: 45, high: 65 },   // Fold After Cbet to Raise
  'l6-cbet-turn': { low: 35, avg: 45, high: 60 },      // CBet Turn: ~45, >50 alto
  'l6-f-r-probe': { low: 35, avg: 50, high: 65 },      // Fold to R Probe
  'l6-f-t-float': { low: 35, avg: 50, high: 65 },      // Fold to T Float
  'l6-f-raise-turn': { low: 35, avg: 50, high: 65 },   // Fold to Raise Turn

  // Línea 7 - Preflop por Posición (Open Raise, Fold to 3Bet, 4Bet) + Limp Pots
  'l7-rf-ep': { low: 12, avg: 20, high: 30 },        // Raise First EP: ~15-20% UTG, ~20-25% MP
  'l7-f-3b-ep': { low: 60, avg: 75, high: 85 },     // Fold to 3Bet EP: ~70-80%
  'l7-4b-ep': { low: 1, avg: 3, high: 6 },          // 4Bet EP: ~2-4%
  'l7-rf-co': { low: 20, avg: 28, high: 38 },        // Raise First CO: ~25-30%
  'l7-f-3b-co': { low: 55, avg: 68, high: 80 },      // Fold to 3Bet CO: ~65-75%
  'l7-4b-co': { low: 2, avg: 4, high: 8 },           // 4Bet CO: ~3-5%
  'l7-rf-btn': { low: 35, avg: 45, high: 60 },       // Raise First BTN: mínimo 40%, ideal 45-50%
  'l7-f-3b-btn': { low: 55, avg: 70, high: 85 },     // Fold to 3Bet BTN: >70% explotable
  'l7-4b-btn': { low: 3, avg: 6, high: 12 },         // 4Bet BTN: ~4-7%
  'l7-rf-sb': { low: 20, avg: 30, high: 45 },        // Raise First SB: ~25-35%
  'l7-f-3b-sb': { low: 55, avg: 68, high: 80 },      // Fold to 3Bet SB: ~65-75%
  'l7-4b-sb': { low: 2, avg: 4, high: 8 },           // 4Bet SB: ~3-5%
  'l7-limp': { low: 0, avg: 5, high: 15 },            // Preflop Limp: ~0-5% regular
  'l7-limp-fold': { low: 30, avg: 50, high: 70 },     // Limp Fold: ~50%
  'l7-limp-call': { low: 20, avg: 35, high: 50 },     // Limp Call: ~30%
  'l7-bet-flop-limp': { low: 25, avg: 40, high: 55 }, // Bet Flop Limped Pot: ~35%
};

function createQuiz(id: string, question: string, options: string[], correct: number, explanation: string): QuizQuestion {
  return { id, question, options, correctAnswer: correct, explanation };
}

export const CURRICULUM: Level[] = [
  {
    id: 1,
    title: "Línea 1: Perfil General",
    description: "Reconoce cada stat de tu primera línea del HUD: VPIP, PFR, 3Bet, Folds, 4Bet, 5Bet, WWSF, W$SD y Overbets.",
    concepts: [
      {
        id: "vpip",
        name: "VPIP (Voluntarily Put $ In Pot)",
        shortName: "VPIP",
        definition: "% de veces que el jugador pone dinero voluntariamente preflop.",
        color: StatColor.Default,
        row: 1,
        column: 1,
        quizzes: [
          createQuiz("q-vpip-1", "VPIP 65% indica:", ["Jugador tight", "Jugador loose", "Jugador agresivo", "Jugador pasivo"], 1, "65% VPIP es muy alto. Juega casi cualquier mano."),
        ]
      },
      {
        id: "pfr",
        name: "PFR (Preflop Raise)",
        shortName: "PFR",
        definition: "% de veces que el jugador sube la apuesta preflop.",
        color: StatColor.Default,
        row: 1,
        column: 2,
        quizzes: [
          createQuiz("q-pfr-1", "VPIP 40% + PFR 8% = ¿Qué perfil?", ["TAG", "LAG", "Calling Station", "Nit"], 2, "Mucho VPIP, poco PFR = paga mucho, sube poco. Calling station."),
        ]
      },
      {
        id: "3bet",
        name: "3Bet Preflop",
        shortName: "3Bet",
        definition: "Frecuencia con la que resube una apuesta preflop.",
        color: StatColor.Orange,
        row: 1,
        column: 3,
        quizzes: [
          createQuiz("q-3bet-1", "3Bet 12% indica:", ["Muy tight", "Muy agresivo", "Normal", "Pasivo"], 1, "12% es alto. Resube con frecuencia, posiblemente over-bluff."),
        ]
      },
      {
        id: "f3bet",
        name: "Fold to PF 3Bet",
        shortName: "F3B",
        definition: "% de veces que se retira ante una resubida (3Bet) preflop.",
        color: StatColor.Green,
        row: 1,
        column: 4,
        quizzes: [
          createQuiz("q-f3bet-1", "F3B 75% = ¿Qué haces?", ["3Bet más de farol", "Nunca 3Betearle", "Solo con premium", "Igualar"], 0, "Se rinde mucho. Explotable con 3Bets de farol."),
        ]
      },
      // Separador 1
      {
        id: "separator-l1-1",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 5,
      },
      {
        id: "4bet",
        name: "4Bet+ Preflop",
        shortName: "4Bet",
        definition: "Frecuencia con la que resube ante un 3Bet preflop.",
        color: StatColor.Red,
        row: 1,
        column: 5,
        quizzes: [
          createQuiz("q-4bet-1", "4Bet 8% significa:", ["Solo AA/KK", "Rango amplio", "Nunca 4Betea", "Tight"], 1, "8% es amplio. Incluye bluffs posicionales."),
        ]
      },
      {
        id: "f4bet",
        name: "Fold to PF 4Bet",
        shortName: "F4B",
        definition: "% de veces que se retira ante un 4Bet preflop.",
        color: StatColor.Default, // Verde en la imagen
        row: 1,
        column: 6,
        quizzes: [
          createQuiz("q-f4bet-1", "3Betea 12% pero fold 4Bet 60%. ¿Qué deduces?", ["Rango mal construido", "Sólido", "Only value", "Pocos datos"], 0, "Mucho 3Bet pero folda al 4Bet = muchos bluffs sin sustento."),
        ]
      },
      {
        id: "5bet",
        name: "EP 5Bet+ Preflop",
        shortName: "5Bet",
        definition: "Frecuencia con la que resube o va all-in ante un 4Bet.",
        color: StatColor.Red,
        row: 1,
        column: 7,
        quizzes: [
          createQuiz("q-5bet-1", "5Bet del 5% indica:", ["Solo nuts", "Rango amplio", "Nunca 5Betea", "Tight"], 3, "5% es tight. Generalmente solo premium y algunos 4Bet bluffs que no fold."),
        ]
      },
      {
        id: "f5bet",
        name: "Fold to PF5Bet",
        shortName: "F5B",
        definition: "% de veces que se retira ante un 5Bet preflop.",
        color: StatColor.Default,
        row: 1,
        column: 9,
        quizzes: [
          createQuiz("q-f5bet-1", "F5B 70% significa:", ["Sólo 4Beteó con faroles", "Muy sólido", "Nunca fold", "Agresivo"], 0, "Fold al 5Bet alto = su 4Bet range tiene muchos bluffs."),
        ]
      },
      // Separador 2
      {
        id: "separator-l1-2",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 10,
      },
      {
        id: "wwsf",
        name: "WWSF (Won When Saw Flop)",
        shortName: "WWSF",
        definition: "% de veces que ve el flop y termina ganando la mano.",
        color: StatColor.Default, // Celeste
        row: 1,
        column: 9,
        quizzes: [
          createQuiz("q-wwsf-1", "WWSF 54% + W$SD 45% = ¿Perfil?", ["Pasivo", "Agresivo que farolea", "Equilibrado", "Nit"], 1, "WWSF alto con W$SD bajo = pelea mucho pero pierde en showdown."),
        ]
      },
      {
        id: "wsd",
        name: "W$SD (Won $ at Showdown)",
        shortName: "W$SD",
        definition: "% de veces que llega al River (Showdown) y gana la mano.",
        color: StatColor.Default,
        row: 1,
        column: 12,
        quizzes: [
          createQuiz("q-wsd-1", "W$SD 62% + WWSF 35% = ¿Perfil?", ["Bluffador", "Selectivo fuerte", "Pasivo", "Maniaco"], 1, "W$SD alto con WWSF bajo = selectivo, solo llega con manos fuertes."),
        ]
      },
      // Separador 3
      {
        id: "separator-l1-3",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 13,
      },
      {
        id: "obturn",
        name: "Overbet Turn",
        shortName: "OB Turn",
        definition: "Frecuencia de apuestas desproporcionadas (mayores al bote) en el Turn.",
        color: StatColor.Red,
        row: 1,
        column: 11,
        quizzes: [
          createQuiz("q-obturn-1", "OB Turn 18% indica:", ["Nunca overbetea", "Usa overbets frecuentemente", "Sólo value", "Tight"], 1, "18% es alto. Usa overbets como herramienta habitual."),
        ]
      },
      {
        id: "contob",
        name: "River Bet after Turn OB",
        shortName: "Cont OB",
        definition: "% de veces que continúa apostando en el River tras haber hecho un Overbet en el Turn.",
        color: StatColor.Orange,
        row: 1,
        column: 12,
        quizzes: [
          createQuiz("q-contob-1", "Cont OB 35% indica:", ["Rara vez sigue", "Sigue con frecuencia", "Sólo value", "Pasivo"], 1, "35% es alto. Triple barril frecuente después de overbet turn."),
        ]
      },
      {
        id: "obriver",
        name: "Overbet River",
        shortName: "OB River",
        definition: "Frecuencia de apuestas desproporcionadas (mayores al bote) en el River.",
        color: StatColor.Red,
        row: 1,
        column: 16,
        quizzes: [
          createQuiz("q-obriver-1", "OB River 15% significa:", ["Nunca overbetea", "Usa overbets en river", "Sólo faroles", "Tight"], 1, "15% en river indica que usa overbets como herramienta frecuente."),
        ]
      },
      {
        id: "player",
        name: "Player Name",
        shortName: "Player",
        definition: "Nombre del jugador en la mesa. No es una stat de lectura.",
        color: StatColor.Default,
        row: 1,
        column: 14,
        quizzes: []
      },
      {
        id: "hands",
        name: "Hands Abbrev",
        shortName: "Hands",
        definition: "Cantidad abreviada de manos registradas de ese jugador.",
        color: StatColor.Default,
        row: 1,
        column: 15,
        quizzes: []
      },
    ]
  },
  // LÍNEA 2 - Juego en Botón (Cold Call, 3Bet, Squeeze, Farha)
  {
    id: 2,
    title: "Línea 2: Juego en Botón",
    description: "Cold Call y 3Bet desde BTN vs UTG/CO, Squeeze general, Fold to Squeeze, Call 4Bet y Farha.",
    concepts: [
      {
        id: "l2-cc-btn-utg",
        name: "EP BTN Call vs UTG Open",
        shortName: "CCvUTG",
        definition: "Cold Call desde el Botón contra una apertura de UTG (Early Position). Porcentaje de veces que pagas desde BTN cuando UTG abre.",
        color: StatColor.Purple,
        row: 1,
        column: 1,
        quizzes: [
          createQuiz("l2-q1", "¿Qué significa CCvUTG?", ["Cold Call BTN vs UTG", "3Bet BTN vs UTG", "Fold BTN vs UTG"], 0, "CCvUTG = Cold Call desde Botón contra apertura UTG. Morado = situaciones de pago/cold call.")
        ]
      },
      {
        id: "l2-3b-btn-utg",
        name: "BTN 3Bet vs UTG Open",
        shortName: "3BvUTG",
        definition: "3Bet desde el Botón contra una apertura de UTG. Normalmente valores bajos (5-7%). Un 9-10% indica que estás 3-beteando a UTG con el rango correcto.",
        color: StatColor.Orange,
        row: 1,
        column: 2,
        quizzes: [
          createQuiz("l2-q2", "¿Qué rango de 3Bet vs UTG es 'bastante bien'?", ["3-4%", "5-7%", "9-10%"], 2, "Un 9-10% de 3Bet vs UTG desde BTN está bastante bien. Significa que metes manos como A5s-A2s, K9s, Q9s, JTs, T9s contra UTG.")
        ]
      },
      {
        id: "l2-cc-btn-co",
        name: "Call vs CO Open",
        shortName: "CCvCO",
        definition: "Cold Call desde el Botón contra una apertura del Cutoff (CO). Mínimo de cold call debe ser 10%. Menos de eso implica que solo pagas con Pockets y algún suited connector.",
        color: StatColor.Purple,
        row: 1,
        column: 3,
        quizzes: [
          createQuiz("l2-q3", "¿Cuál es el mínimo de Cold Call vs CO desde BTN?", ["5%", "10%", "15%"], 1, "El mínimo de Cold Call desde BTN vs CO debe ser 10%. Contra recreacionales se debe aumentar aún más.")
        ]
      },
      {
        id: "l2-3b-btn-co",
        name: "3Bet vs CO Open",
        shortName: "3BvCO",
        definition: "3Bet desde el Botón contra una apertura del Cutoff (CO). Valores más altos que vs UTG porque la apertura de CO es más wide.",
        color: StatColor.Orange,
        row: 1,
        column: 4,
        quizzes: []
      },
      // Separador 1
      {
        id: "separator-l2-1",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 5,
      },
      {
        id: "l2-sqz-gen",
        name: "Preflop Squeeze",
        shortName: "Sqz",
        definition: "Squeeze Preflop general. Resubir tras una apertura y un call (o varios calls) para aislar al caller. Normalmente 10-12% dependiendo de la secuencia.",
        color: StatColor.Orange,
        row: 1,
        column: 5,
        quizzes: [
          createQuiz("l2-q5", "¿Qué es un Squeeze?", ["Resubir con una apertura y call previos", "Llamar una apertura y un 3Bet", "Hacer all-in preflop"], 0, "Squeeze = resubir cuando hay una apertura y al menos un call. Objetivo: aislar al caller y ganar el bote preflop.")
        ]
      },
      {
        id: "l2-sqz-btn",
        name: "Preflop Squeeze vs BTN",
        shortName: "SqzvBTN",
        definition: "Squeeze cuando el Botón abrió y hay un caller (o callers) antes de ti. Más común desde BB o SB.",
        color: StatColor.Orange,
        row: 1,
        column: 6,
        quizzes: []
      },
      {
        id: "l2-f-sqz",
        name: "Fold to PF Squeeze",
        shortName: "FtoSqz",
        definition: "Fold to Squeeze como caller. Porcentaje de veces que te retiras cuando alguien hace squeeze después de que tú hiciste call a una apertura. Un 49% está bien si no te metes mucho en cold calls.",
        color: StatColor.Green,
        row: 1,
        column: 7,
        quizzes: [
          createQuiz("l2-q7", "Un FtoSqz del 49% indica...", ["Que foldeas demasiado", "Que estás foldeando las manos correctas", "Que no haces suficientes cold calls"], 1, "Un 49% está bien si no colcaleas demasiado. Simplemente estás foldeando las manos sin valor cuando no hay nadie por detrás.")
        ]
      },
      {
        id: "l2-c-4bet",
        name: "Open 4Bet+ Preflop",
        shortName: "C4Bet",
        definition: "Call 4Bet (o 5Bet) Preflop. Normalmente un 2% porque solo pagas con Ases (AA), a veces Reyes (KK), para atrapar. No vas a ver muchos Call 4Bet.",
        color: StatColor.Red,
        row: 1,
        column: 9,
        quizzes: [
          createQuiz("l2-q8", "¿Por qué Call 4Bet es tan bajo (~2%)?", ["Porque solo pagas con Ases", "Porque hacemos 4Bet bluff mucho", "Porque nunca pagamos 4Bets"], 0, "Normalmente los Call 4Bet son con AA, a veces KK para atrapar. Es un número muy bajo porque la situación no se da mucho.")
        ]
      },
      // Separador 2
      {
        id: "separator-l2-2",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 10,
      },
      {
        id: "l2-farha",
        name: "Cold Call 3Bet",
        shortName: "Farha",
        definition: "Farha: pagar una 3Bet en frío (sin haber invertido fichas previamente en el bote) para atrapar. Casi nunca se hace. Solo alguna vez con AA/KK o algún set para atrapar. Contra regulares no se da mucho.",
        color: StatColor.Purple,
        row: 1,
        column: 9,
        quizzes: [
          createQuiz("l2-q9", "¿Qué es Farha?", ["3Bet con manos fuertes", "Cold Call a una 3Bet para atrapar", "Squeeze en 3Bet pot"], 1, "Farha = pagar una 3Bet en frío para atrapar. Muy raro, casi solo con AA/KK para setmining o dejar que el rival bluffee.")
        ]
      },
      {
        id: "l2-farha-pos",
        name: "Cold Call 3Bet Pos",
        shortName: "FarhaP",
        definition: "Farha posicional: variación de Cold Call a 3Bet dependiendo de la posición. También es un número casi nulo en el HUD porque raramente se da la situación.",
        color: StatColor.Purple,
        row: 1,
        column: 10,
        quizzes: []
      },
    ]
  },
  // LÍNEA 3 - Juego en Ciegas (SB/BB vs posiciones, Limp Pots, Multiway)
  {
    id: 3,
    title: "Línea 3: Juego en Ciegas",
    description: "3Bet y Fold desde SB y BB vs diferentes posiciones, guerra de ciegas (limp pots), y stats post-flop multiway.",
    concepts: [
      // Bloque 1: SB vs posiciones tempranas
      {
        id: "l3-sb-3b-ep",
        name: "SB 3Bet vs EP/UTG",
        shortName: "SB3BvEP",
        definition: "3Bet desde la Ciega Pequeña (SB) contra una apertura de posiciones tempranas (UTG/EP). Bajo porque sin posición vs rango cerrado.",
        color: StatColor.Orange,
        row: 1,
        column: 1,
        quizzes: []
      },
      {
        id: "l3-sb-3b-co",
        name: "SB 3Bet vs CO/MP",
        shortName: "SB3BvCO",
        definition: "3Bet desde SB contra una apertura de Cutoff (CO) o Middle Position (MP). Más amplio que vs UTG pero sigue siendo un spot complicado sin posición.",
        color: StatColor.Orange,
        row: 1,
        column: 2,
        quizzes: []
      },
      {
        id: "l3-sb-f-btn",
        name: "SB Fold vs BTN",
        shortName: "SBfBTN",
        definition: "Fold desde SB cuando el Botón abre. En GTO este valor es ~85%. No colcaleamos mucho porque estamos sin posición y el rango de BTN es amplio.",
        color: StatColor.Green,
        row: 1,
        column: 3,
        quizzes: []
      },
      {
        id: "l3-sb-3b-btn",
        name: "SB 3Bet vs BTN",
        shortName: "SB3BvBTN",
        definition: "3Bet desde SB contra una apertura del Botón. Buscamos defendernos con 3Bet porque el rango de BTN es muy amplio. Valor objetivo: más alto que vs UTG.",
        color: StatColor.Orange,
        row: 1,
        column: 4,
        quizzes: []
      },
      // Separador 1
      {
        id: "separator-l3-1",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 5,
        quizzes: []
      },
      // Bloque 2: BB vs posiciones
      {
        id: "l3-bb-f-nosteal",
        name: "BB Fold vs No Steal",
        shortName: "BBfNoSt",
        definition: "Fold desde la Ciega Grande (BB) contra posiciones que NO son de robo (UTG, MP). ~70% está bien. Defendemos ~30% del rango con 3Bet o Call.",
        color: StatColor.Green,
        row: 1,
        column: 6,
        quizzes: []
      },
      {
        id: "l3-bb-3b-ep",
        name: "BB 3Bet vs EP/UTG",
        shortName: "BB3BvEP",
        definition: "3Bet desde BB contra UTG/MP. Valor ~5%. Es bajo porque jugamos sin posición contra rango cerrado, aunque tenemos más rango de colgada (call) que desde SB.",
        color: StatColor.Orange,
        row: 1,
        column: 7,
        quizzes: []
      },
      {
        id: "l3-bb-3b-co",
        name: "BB 3Bet vs CO",
        shortName: "BB3BvCO",
        definition: "3Bet desde BB contra Cutoff (CO). Valor ~8-10%. Más alto que vs UTG porque CO abre más amplio. Fácilmente podría estar en 10.",
        color: StatColor.Orange,
        row: 1,
        column: 8,
        quizzes: []
      },
      {
        id: "l3-bb-f-btn-small",
        name: "BB Fold vs BTN < 2.5bb",
        shortName: "BBfBTN<2.5",
        definition: "Fold desde BB contra Botón cuando la apuesta es MENOR a 2.5bb (min-bet). Normal ~45-50%. Si foldeamos > 60% y 3Bet < 12%, estamos muy explotables.",
        color: StatColor.Green,
        row: 1,
        column: 9,
        quizzes: []
      },
      {
        id: "l3-bb-f-btn-big",
        name: "BB Fold vs BTN >= 2.5bb",
        shortName: "BBfBTN>=2.5",
        definition: "Fold desde BB contra Botón cuando la apuesta es 2.5bb o MAYOR. Normal ~45-50%. Un buen regular entiende que a sizing más grande, paga menos.",
        color: StatColor.Green,
        row: 1,
        column: 10,
        quizzes: []
      },
      {
        id: "l3-bb-3b-btn",
        name: "BB 3Bet vs BTN",
        shortName: "BB3BvBTN",
        definition: "3Bet desde BB contra Botón. MÍNIMO 12-15%, ideal 15-18%. Si es < 10% y fold es alto, el rival puede abrir cualquier carta desde BTN rentablemente.",
        color: StatColor.Orange,
        row: 1,
        column: 11,
        quizzes: []
      },
      // Separador 2
      {
        id: "separator-l3-2",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 12,
        quizzes: []
      },
      // Bloque 3: BB vs SB / Limp pots
      {
        id: "l3-bb-f-sb",
        name: "BB Fold vs SB",
        shortName: "BBfSB",
        definition: "Fold desde BB contra una apertura de SB. Valor ~15-25%. Nos defendemos mucho con 3Bet en este spot porque es incómodo jugar OOP sin iniciativa.",
        color: StatColor.Green,
        row: 1,
        column: 13,
        quizzes: []
      },
      {
        id: "l3-bb-3b-sb",
        name: "BB 3Bet vs SB",
        shortName: "BB3BvSB",
        definition: "3Bet desde BB contra SB. Defendemos más de 50% del rango. 3Bet frecuente aquí porque OOP sin iniciativa es el spot más incómodo de preflop.",
        color: StatColor.Orange,
        row: 1,
        column: 14,
        quizzes: []
      },
      {
        id: "l3-bb-raise-limp",
        name: "Raise vs SB Limp",
        shortName: "RvsLimp",
        definition: "Raise desde BB cuando SB hace limp (paga la ciega). Relacionado a botes limpeados (limp pots). Normalmente raise para tomar iniciativa.",
        color: StatColor.Red,
        row: 1,
        column: 15,
        quizzes: []
      },
      {
        id: "l3-bb-f-float-limp",
        name: "Fold to Float Bet Limp Pot",
        shortName: "fFloatLP",
        definition: "Fold ante Float Bet en bote limpeado (BB vs SB). Cuando SB limp, nosotros check y SB apuesta flop. Indica cuánto foldeamos a esos bets.",
        color: StatColor.Yellow,
        row: 1,
        column: 16,
        quizzes: []
      },
      // Separador 3
      {
        id: "separator-l3-3",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 17,
        quizzes: []
      },
      // Bloque 4: Multiway
      {
        id: "l3-bet-flop-mw",
        name: "Bet Flop Multiway",
        shortName: "BetFlopMW",
        definition: "Bet (apuesta) en el Flop en botes multiway (contra múltiples jugadores). Indica agresión post-flop en spots con muchos rivales. Normalmente por valor.",
        color: StatColor.Pink,
        row: 1,
        column: 18,
        quizzes: []
      },
      {
        id: "l3-wwsf-mw",
        name: "WWSF Multiway",
        shortName: "WWSFMW",
        definition: "Won When Saw Flop Multiway. % de botes ganados al ver el flop en botes multiway. Normalmente más bajo que WWSF normal (40-50%) porque hay más competencia.",
        color: StatColor.Cyan,
        row: 1,
        column: 19,
        quizzes: []
      },
    ]
  },
  // LÍNEA 4 - Juego sin Iniciativa (IP / OOP / Turn)
  {
    id: 4,
    title: "Línea 4: Juego sin Iniciativa",
    description: "Fold y agresión post-flop sin iniciativa: In Position (IP), Out of Position (OOP), y líneas de Turn.",
    concepts: [
      // Bloque 1: In Position (IP)
      {
        id: "l4-f-flop-ip",
        name: "Fold to Cbet Flop IP",
        shortName: "fFlopIP",
        definition: "Fold a la Cbet en flop estando en posición (IP). ~33-35% es normal. >40% es overfold (explotable). <30% es bajo. En IP peleamos más porque podemos materializar equity.",
        color: StatColor.Yellow,
        row: 1,
        column: 1,
        quizzes: []
      },
      {
        id: "l4-f-minbet-ip",
        name: "Fold to MinBet Flop IP",
        shortName: "fMinBet",
        definition: "Fold a apuesta pequeña (< medio bote) en flop estando en posición (IP). Normalmente similar al fold normal a Cbet. Si este fold es muy alto, el rival puede exploitear con bets pequeñas.",
        color: StatColor.Yellow,
        row: 1,
        column: 2,
        quizzes: []
      },
      {
        id: "l4-float-flop",
        name: "Float Flop",
        shortName: "Float",
        definition: "Apuesta (IP) cuando el rival cede la iniciativa con check en flop. Ej: defendes BB, rival hace Cbet, tú call, turn rival check, tú apuestas. ~16% es bajo, 30-35% es normal. Atacas al Miss Cbet.",
        color: StatColor.Pink,
        row: 1,
        column: 3,
        quizzes: []
      },
      {
        id: "l4-f-delayed-ip",
        name: "Fold to Delayed Cbet IP",
        shortName: "fDlyIP",
        definition: "Fold a una delayed Cbet en el turn estando en posición (IP). Ej: call Cbet flop, turn rival apuesta después de haber chequeado. Si >50%, estás tirando mucho y el rival te puede presionar con turn bets.",
        color: StatColor.Yellow,
        row: 1,
        column: 4,
        quizzes: []
      },
      {
        id: "l4-r-flop-ip",
        name: "Raise Cbet Flop IP",
        shortName: "rFlopIP",
        definition: "Resubida a la Cbet del rival en el flop estando en posición (IP). ~12% es normal. En conjunto con Fold to Raise y Cont. post Raise nos dice si el rango de raise está cargado de valor o farol.",
        color: StatColor.Red,
        row: 1,
        column: 5,
        quizzes: []
      },
      // Separador 1
      {
        id: "separator-l4-1",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 6,
        quizzes: []
      },
      // Bloque 2: Out of Position (OOP)
      {
        id: "l4-f-flop-oop",
        name: "Fold to Cbet Flop OOP",
        shortName: "fFlopOOP",
        definition: "Fold a la Cbet en flop estando sin posición (OOP). ~35-40% es normal. >45% es explotable porque OOP sin iniciativa es el spot más incómodo. Se defiende más con 3Bet preflop que con call OOP.",
        color: StatColor.Yellow,
        row: 1,
        column: 7,
        quizzes: []
      },
      {
        id: "l4-probe-turn",
        name: "Probe Turn",
        shortName: "Probe",
        definition: "Apuesta (OOP) en el turn tras check behind del rival en flop. Mismo concepto que float pero sin posición. Funciona igual: atacas al Miss Cbet del rival. En conjunto con Fold Delayed OOP para ver cómo construye el rival cuando le cedes iniciativa.",
        color: StatColor.Pink,
        row: 1,
        column: 8,
        quizzes: []
      },
      {
        id: "l4-f-delayed-oop",
        name: "Fold to Delayed Cbet OOP",
        shortName: "fDlyOOP",
        definition: "Fold a la delayed Cbet del rival estando sin posición (OOP). Similar a Fold Delayed IP pero en OOP. En conjunto con Probe Turn decide si delayar o atacar en turn cuando el rival probea poco.",
        color: StatColor.Yellow,
        row: 1,
        column: 9,
        quizzes: []
      },
      {
        id: "l4-r-flop-oop",
        name: "Raise Cbet Flop OOP",
        shortName: "rFlopOOP",
        definition: "Resubida a la Cbet del rival en el flop estando sin posición (OOP). ~10-13% es normal. En conjunto con 2Bet & Fold y Cont. post Raise interpreta si el rango de raise está cargado de valor o farol.",
        color: StatColor.Red,
        row: 1,
        column: 10,
        quizzes: []
      },
      {
        id: "l4-2bet-fold",
        name: "2Bet & Fold",
        shortName: "2BetF",
        definition: "Fold de tu parte tras haber hecho un Raise (2Bet) previamente en el flop. % de veces que foldeas luego de hacer raise en flop cuando el rival paga y tú apuestas turn. Si es alto (>60%), tu rango de raise tiene muchos faroles.",
        color: StatColor.Yellow,
        row: 1,
        column: 11,
        quizzes: []
      },
      {
        id: "l4-cont-post-raise",
        name: "Cont. post Raise Turn",
        shortName: "ContR",
        definition: "Continuación (apuesta en turn) tras haber hecho Raise en flop. ~60% indica rango de raise cargado de valor. Si es bajo (<40%) y 2Bet & Fold es alto, el raise está cargado de faroles. Si es alto y 2BetF bajo, es valor.",
        color: StatColor.Red,
        row: 1,
        column: 12,
        quizzes: []
      },
      // Separador 2
      {
        id: "separator-l4-2",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 13,
        quizzes: []
      },
      // Bloque 3: Turn
      {
        id: "l4-f-turn-cbet",
        name: "Fold to Turn Cbet",
        shortName: "fTurnCb",
        definition: "Fold a una Cbet de tamaño normal en el turn. ~40% es normal. >45% es alto y se puede explotar. Este dato indica cuánto abandonas en turn cuando el rival apuesta normal.",
        color: StatColor.Yellow,
        row: 1,
        column: 14,
        quizzes: []
      },
      {
        id: "l4-f-overbet-turn",
        name: "Fold to Overbet Turn",
        shortName: "fOverT",
        definition: "Fold a una apuesta gigante (overbet) en el turn. >72-75% es muy explotable. Casi todos los perfiles pasivos tienen >75. Significa que el rival puede hacer overbet con casi todo y no te pagas ni una.",
        color: StatColor.Yellow,
        row: 1,
        column: 15,
        quizzes: []
      },
      {
        id: "l4-steal-turn",
        name: "Steal Turn",
        shortName: "StealT",
        definition: "Apuesta (OOP) en turn tras Cbet en flop y check del rival en turn. Atacas al Miss Cbet en turn. ~45-57% es normal. >57% es pasado (bluffea mucho). Utilizado mucho en 3Bet pots para hacer check-push contra rivales pasados.",
        color: StatColor.Pink,
        row: 1,
        column: 16,
        quizzes: []
      },
      {
        id: "l4-r-turn",
        name: "Raise Turn",
        shortName: "rTurn",
        definition: "Resubida a la apuesta de continuación del rival en el turn. ~12% es normal. Indica agresión directa en turn. En conjunto con Steal Turn indica si el rival está cargado de valor o farol en turn.",
        color: StatColor.Red,
        row: 1,
        column: 17,
        quizzes: []
      },
    ]
  },
  // LÍNEA 5 - Juego en River (Bet, Fold, WSD por tamaños y pot)
  {
    id: 5,
    title: "Línea 5: Juego en River",
    description: "Frecuencia de apuesta, fold y ganancia al showdown en el River por tamaños de apuesta y tamaño de bote.",
    concepts: [
      // Bloque 1: River General
      {
        id: "l5-bet-river",
        name: "Bet River",
        shortName: "BetRiv",
        definition: "Frecuencia de apuesta en el River. ~35% es normal bajo. Superarlo indica que estás incluyendo faroles en tu rango de apuesta.",
        color: StatColor.Red,
        row: 1,
        column: 1,
        quizzes: []
      },
      {
        id: "l5-f-r-bet",
        name: "Fold to River Bet",
        shortName: "fRivBet",
        definition: "Frecuencia de fold ante cualquier apuesta en River. Lo normal es entre 50 y 54%. >60% es overfold.",
        color: StatColor.Yellow,
        row: 1,
        column: 2,
        quizzes: []
      },
      {
        id: "l5-wsdwbr",
        name: "WSDWBR",
        shortName: "WSDWBR",
        definition: "Won $ at Showdown When Bet River. Ganancia al showdown tras apostar en River. Ayuda a ver si el rango de apuesta está equilibrado entre valor y farol.",
        color: StatColor.Cyan,
        row: 1,
        column: 3,
        quizzes: []
      },
      {
        id: "l5-wsdwrr",
        name: "WSDWRR",
        shortName: "WSDWRR",
        definition: "Won $ at Showdown When Raise River. Ganancia al showdown tras subir (raise) en River. Casi nadie lo hace de farol, es una secuencia muy ganadora.",
        color: StatColor.Cyan,
        row: 1,
        column: 4,
        quizzes: []
      },
      {
        id: "l5-f-r-bet-min",
        name: "Fold to River Bet Min",
        shortName: "fRivBetMin",
        definition: "Frecuencia de fold ante apuestas mínimas o en botes pequeños en el River. Normalmente la gente foldea bastante poco a sizing pequeño.",
        color: StatColor.Yellow,
        row: 1,
        column: 5,
        quizzes: []
      },
      {
        id: "l5-f-r-minbet",
        name: "Fold to River MinBet",
        shortName: "fRivMin",
        definition: "Frecuencia de fold ante apuestas de medio bote o tercio en el River. La gente suele foldear bastante poco a estos tamaños.",
        color: StatColor.Yellow,
        row: 1,
        column: 6,
        quizzes: []
      },
      {
        id: "l5-f-r-twothird",
        name: "Fold to River TwoThird",
        shortName: "fRiv2/3",
        definition: "Frecuencia de fold ante apuestas de dos tercios de bote en el River. Valor clave para detectar overfold.",
        color: StatColor.Yellow,
        row: 1,
        column: 7,
        quizzes: []
      },
      {
        id: "l5-f-r-over",
        name: "Fold to River Overbet",
        shortName: "fRivOver",
        definition: "Frecuencia de fold ante overbet en el River. Valores mayores a 78 indican un overfold muy explotable.",
        color: StatColor.Yellow,
        row: 1,
        column: 8,
        quizzes: []
      },
      {
        id: "l5-f-raise",
        name: "Fold to River Raise",
        shortName: "fRivRaise",
        definition: "Frecuencia de fold ante una subida (raise) en el River. Raise en river casi siempre es valor, así que foldear mucho es normal.",
        color: StatColor.Yellow,
        row: 1,
        column: 9,
        quizzes: []
      },
      {
        id: "l5-wsdwbr-min",
        name: "WSDWBR MinBet",
        shortName: "WSDWBRmin",
        definition: "Ganancia al showdown al apostar un tamaño mínimo en el River. Indica si tus bets pequeñas son por valor o bluff.",
        color: StatColor.Cyan,
        row: 1,
        column: 10,
        quizzes: []
      },
      {
        id: "l5-wsdwbr-half",
        name: "WSDWBR HalfBet",
        shortName: "WSDWBRhalf",
        definition: "Ganancia al showdown al apostar medio bote en el River.",
        color: StatColor.Cyan,
        row: 1,
        column: 11,
        quizzes: []
      },
      {
        id: "l5-wsdwbr-twothird",
        name: "WSDWBR TwoThird",
        shortName: "WSDWBR2/3",
        definition: "Ganancia al showdown al apostar dos tercios de bote en el River.",
        color: StatColor.Cyan,
        row: 1,
        column: 12,
        quizzes: []
      },
      {
        id: "l5-wsdwbr-quarter",
        name: "WSDWBR QuarterPot",
        shortName: "WSDWBR1/4",
        definition: "Ganancia al showdown al hacer una apuesta del tamaño del bote (potbet) en el River.",
        color: StatColor.Cyan,
        row: 1,
        column: 13,
        quizzes: []
      },
      {
        id: "l5-wsdwbr-over",
        name: "WSDWBR Overbet",
        shortName: "WSDWBRover",
        definition: "Ganancia al showdown al hacer overbet en el River. Revela qué tanto está faroleando en esta línea específica.",
        color: StatColor.Cyan,
        row: 1,
        column: 14,
        quizzes: []
      },
      // Separador
      {
        id: "separator-l5",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 15,
        quizzes: []
      },
      // Bloque 2: River Small/Big Pots
      {
        id: "l5-bet-river-sm",
        name: "Bet River Small Pot",
        shortName: "BetRivSm",
        definition: "Frecuencia de apuesta en el River en botes pequeños.",
        color: StatColor.Red,
        row: 1,
        column: 16,
        quizzes: []
      },
      {
        id: "l5-wwrb-small",
        name: "WWRB Small Pot",
        shortName: "WWRBsm",
        definition: "Ganancia al showdown tras apostar en botes pequeños en el River.",
        color: StatColor.Cyan,
        row: 1,
        column: 17,
        quizzes: []
      },
      {
        id: "l5-bet-river-big",
        name: "Bet River Big Pot",
        shortName: "BetRivBig",
        definition: "Frecuencia de apuesta en el River en botes grandes. Muy útil para detectar jugadores que se vuelven locos faroleando.",
        color: StatColor.Red,
        row: 1,
        column: 18,
        quizzes: []
      },
      {
        id: "l5-wwrb-big",
        name: "WWRB Big Pot",
        shortName: "WWRBbig",
        definition: "Ganancia al showdown tras apostar en botes grandes en el River.",
        color: StatColor.Cyan,
        row: 1,
        column: 19,
        quizzes: []
      },
    ]
  },
  // LÍNEA 6 - Juego con Iniciativa (CBets, Delayed, Probes, Floats)
  {
    id: 6,
    title: "Línea 6: Juego con Iniciativa",
    description: "Frecuencia de Cbet, Delayed Cbet, Floats, Probes, Folds a raise y check-raise en flop y turn.",
    concepts: [
      // Bloque 1: Flop con Iniciativa
      {
        id: "l6-cbet-flop-ip",
        name: "CBet Flop IP",
        shortName: "CbetFIP",
        definition: "Frecuencia de apuesta de continuación (CBet) en el flop teniendo posición (IP). ~60-65% GTO. Más de 70% es consecuencia de explotar meta que foldea mucho. Implementar líneas de check para equilibrar.",
        color: StatColor.Red,
        row: 1,
        column: 1,
        quizzes: []
      },
      {
        id: "l6-minbet-flop",
        name: "MinBet Flop",
        shortName: "MinBetF",
        definition: "Frecuencia de apuesta mínima (minbet, medio bote o menos) en flop como apuesta de continuación. Cuando el rival foldea mucho, se puede usar minbet para explotar.",
        color: StatColor.Red,
        row: 1,
        column: 2,
        quizzes: []
      },
      {
        id: "l6-f-t-probe",
        name: "Fold to T Probe",
        shortName: "fTProbe",
        definition: "Fold a la Probe Bet en el turn. Ej: haces CBet flop, rival paga, turn rival apuesta (probe). Normal ~50%. >45% es explotable, significa que chequea mucho y foldea al turn.",
        color: StatColor.Yellow,
        row: 1,
        column: 3,
        quizzes: []
      },
      {
        id: "l6-delayed-turn-ip",
        name: "Delayed Turn IP",
        shortName: "DlyTIP",
        definition: "Apuesta en turn (Delayed CBet) con posición tras haber dado check en flop. Ej: check flop, turn rival check, tú apuestas. Atacas al Miss Cbet.",
        color: StatColor.Default,
        row: 1,
        column: 4,
        quizzes: []
      },
      {
        id: "l6-cbet-flop-oop",
        name: "CBet Flop OOP",
        shortName: "CbetFOOP",
        definition: "Apuesta de continuación (CBet) en flop sin posición (OOP). ~55-58% GTO. Es más baja que IP porque OOP sin iniciativa es más incómodo. Se defiende más con 3Bet preflop.",
        color: StatColor.Red,
        row: 1,
        column: 5,
        quizzes: []
      },
      {
        id: "l6-f-f-float",
        name: "Fold to F Float",
        shortName: "fFFloat",
        definition: "Fold ante apuesta Float en flop. Ej: CBet flop, rival paga, turn tú check, rival apuesta. Más de 50% es alto, indica que el rival ataca mucho tu check.",
        color: StatColor.Yellow,
        row: 1,
        column: 6,
        quizzes: []
      },
      {
        id: "l6-cbet-flop-sb",
        name: "CBet Flop SB vs BB",
        shortName: "CbetFSB",
        definition: "CBet en flop específicamente en duelos SB vs BB. Debería ser bajo (~30-40%) porque es un spot difícil con rangos amplios y mucho check-raise del rival.",
        color: StatColor.Red,
        row: 1,
        column: 7,
        quizzes: []
      },
      {
        id: "l6-f-f-float-sb",
        name: "Fold to F Float SB vs BB",
        shortName: "fFFloatSB",
        definition: "Fold ante Float en flop en duelos SB vs BB. Mismo concepto que Fold to F Float general pero en un spot específico con rangos más amplios.",
        color: StatColor.Yellow,
        row: 1,
        column: 8,
        quizzes: []
      },
      {
        id: "l6-r-f-float",
        name: "Raise F Float",
        shortName: "rFFloat",
        definition: "Check-raise para atacar la apuesta Float del rival en flop. Normalmente bajo (~0-9%). Si es alto, el rival te puede estar chequeando manos para esperar tu float y castigarte.",
        color: StatColor.Red,
        row: 1,
        column: 9,
        quizzes: []
      },
      {
        id: "l6-delayed-turn-oop",
        name: "Delayed Turn OOP",
        shortName: "DlyTOOP",
        definition: "Apuesta en turn (Delayed CBet) sin posición tras haber chequeado flop. Atacas al Miss Cbet del rival en turn.",
        color: StatColor.Default,
        row: 1,
        column: 10,
        quizzes: []
      },
      {
        id: "l6-f-raise-flop",
        name: "Fold to Raise Flop",
        shortName: "fRaiseF",
        definition: "Fold ante un raise (subida) en flop. ~40% es normal. Más de 50% significa que tu CBet está muy cargada de aire y el rival te castiga con raise. Menos de 30% significa que tu CBet está cargada de valor.",
        color: StatColor.Yellow,
        row: 1,
        column: 11,
        quizzes: []
      },
      {
        id: "l6-3bet-flop-srp",
        name: "3Bet Flop SRP",
        shortName: "3BetFSRP",
        definition: "Re-raise (3Bet) en flop en botes Single Raised Pot (SRP). Normalmente bajo (~0-5%). Indica cuánto castiga el rival tu check-raise. Si es bajo, puedes hacer mucho check-raise de farol.",
        color: StatColor.Red,
        row: 1,
        column: 12,
        quizzes: []
      },
      {
        id: "l6-f-after-cbet",
        name: "Fold After Cbet to Raise",
        shortName: "fAfterCb",
        definition: "Fold al raise rival después de haber hecho CBet en flop. Es decir, tú CBeteas, rival raisea, tú fold. ~40% normal. Más de 50% significa que tu CBet está muy cargada de aire.",
        color: StatColor.Yellow,
        row: 1,
        column: 13,
        quizzes: []
      },
      // Separador
      {
        id: "separator-l6",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 14,
        quizzes: []
      },
      // Bloque 2: Turn
      {
        id: "l6-cbet-turn",
        name: "CBet Turn",
        shortName: "CbetT",
        definition: "Frecuencia de apuesta de continuación en turn. ~45% normal. >50% es alto (muy agresivo). <40% es bajo (se corta mucho). Construye con Fold to Raise Turn para detectar over-cbet.",
        color: StatColor.Red,
        row: 1,
        column: 15,
        quizzes: []
      },
      {
        id: "l6-f-r-probe",
        name: "Fold to R Probe",
        shortName: "fRProbe",
        definition: "Fold a la Probe Bet en river. Es decir, haces CBet flop, turn, river rival apuesta. >45% es explotable, indica que el rival te puede estar probando mucho.",
        color: StatColor.Yellow,
        row: 1,
        column: 16,
        quizzes: []
      },
      {
        id: "l6-f-t-float",
        name: "Fold to T Float",
        shortName: "fTFloat",
        definition: "Fold a la apuesta Float en turn. Ej: CBet flop, turn check, rival apuesta. Indica cuánto foldeas al turn float.",
        color: StatColor.Yellow,
        row: 1,
        column: 17,
        quizzes: []
      },
      {
        id: "l6-f-raise-turn",
        name: "Fold to Raise Turn",
        shortName: "fRaiseT",
        definition: "Fold ante raise en turn. Indica cuánto foldeas al castigo del rival en turn. Bajo = tu turn bet está cargada de valor. Alto = mucho farol.",
        color: StatColor.Yellow,
        row: 1,
        column: 18,
        quizzes: []
      },
    ]
  },
  // LÍNEA 7 - Preflop por Posición (Open Raise, Fold to 3Bet, 4Bet) + Limp Pots
  {
    id: 7,
    title: "Línea 7: Preflop por Posición",
    description: "Open Raise, Fold to 3Bet y 4Bet por posición (EP, CO, BTN, SB) más datos de Limp Pots.",
    concepts: [
      // Bloque 1: Early Position (UTG/MP)
      {
        id: "l7-rf-ep",
        name: "Raise First EP",
        shortName: "RfEP",
        definition: "Apertura (Open Raise) en Early Position (UTG/MP). Rango fuerte por defecto. ~15-20% en UTG, ~20-25% en MP.",
        color: StatColor.Red,
        row: 1,
        column: 1,
        quizzes: []
      },
      {
        id: "l7-f-3b-ep",
        name: "Fold to PF 3Bet EP",
        shortName: "f3BEP",
        definition: "Fold ante 3Bet en Early Position. Normalmente alto (~70-80%) porque el rango de EP es fuerte y raramente 4Bet bluff.",
        color: StatColor.Green,
        row: 1,
        column: 2,
        quizzes: []
      },
      {
        id: "l7-4b-ep",
        name: "4Bet+ Preflop EP",
        shortName: "4BetEP",
        definition: "4Bet en Early Position. Rango fuerte por defecto (AA, KK, a veces QQ/AK). Valor muy bajo porque la situación es rara.",
        color: StatColor.Red,
        row: 1,
        column: 3,
        quizzes: []
      },
      // Separador 1
      {
        id: "separator-l7-1",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 4,
        quizzes: []
      },
      // Bloque 2: Cutoff
      {
        id: "l7-rf-co",
        name: "Raise First CO",
        shortName: "RfCO",
        definition: "Open Raise en Cutoff (CO). Rango más amplio que EP. ~25-30% es normal.",
        color: StatColor.Red,
        row: 1,
        column: 5,
        quizzes: []
      },
      {
        id: "l7-f-3b-co",
        name: "Fold to PF 3Bet CO",
        shortName: "f3BCO",
        definition: "Fold ante 3Bet en Cutoff. ~65-75% normal. Menos que EP porque CO puede tener más manos de 4Bet bluff.",
        color: StatColor.Green,
        row: 1,
        column: 6,
        quizzes: []
      },
      {
        id: "l7-4b-co",
        name: "4Bet+ Preflop CO",
        shortName: "4BetCO",
        definition: "4Bet en Cutoff. Puede incluir 4Bet bluff. Más frecuente que en EP. ~3-5%.",
        color: StatColor.Red,
        row: 1,
        column: 7,
        quizzes: []
      },
      // Separador 2
      {
        id: "separator-l7-2",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 8,
        quizzes: []
      },
      // Bloque 3: Botón
      {
        id: "l7-rf-btn",
        name: "Raise First BTN",
        shortName: "RfBTN",
        definition: "Open Raise en Botón. Rango más amplio de todas las posiciones. MÍNIMO 40%. Ideal 45-50%. El mejor spot del poker.",
        color: StatColor.Red,
        row: 1,
        column: 9,
        quizzes: []
      },
      {
        id: "l7-f-3b-btn",
        name: "Fold to PF 3Bet BTN",
        shortName: "f3BBTN",
        definition: "Fold ante 3Bet en Botón. Dato VITAL para explotar con 3Bet bluff. >70% es muy explotable. Si es >75%, puedes 3Betear cualquier carta.",
        color: StatColor.Green,
        row: 1,
        column: 10,
        quizzes: []
      },
      {
        id: "l7-4b-btn",
        name: "4Bet+ Preflop BTN",
        shortName: "4BetBTN",
        definition: "4Bet en Botón. Incluye 4Bet de farol. Más frecuente que en EP/CO. ~4-7%. Construye con Fold to 3Bet para detectar 4Bet bluff.",
        color: StatColor.Red,
        row: 1,
        column: 11,
        quizzes: []
      },
      // Separador 3
      {
        id: "separator-l7-3",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 12,
        quizzes: []
      },
      // Bloque 4: Ciega Pequeña
      {
        id: "l7-rf-sb",
        name: "Raise First SB",
        shortName: "RfSB",
        definition: "Open Raise en Ciega Pequeña (SB). Normalmente ~25-35% cuando se abre. SB vs BB es un spot especial con rangos amplios.",
        color: StatColor.Red,
        row: 1,
        column: 13,
        quizzes: []
      },
      {
        id: "l7-f-3b-sb",
        name: "Fold to PF 3Bet SB",
        shortName: "f3BSB",
        definition: "Fold ante 3Bet en SB. La gente foldea muchísimo más aquí porque el rango de SB es más amplio y débil. ~65-75%.",
        color: StatColor.Green,
        row: 1,
        column: 14,
        quizzes: []
      },
      {
        id: "l7-4b-sb",
        name: "4Bet+ Preflop SB",
        shortName: "4BetSB",
        definition: "4Bet en SB. Raro, pero puede incluir bluff. En SB vs BB es más frecuente. ~3-5%.",
        color: StatColor.Red,
        row: 1,
        column: 15,
        quizzes: []
      },
      // Separador 4
      {
        id: "separator-l7-4",
        name: "Separador",
        shortName: "|",
        definition: "",
        color: StatColor.Default,
        row: 1,
        column: 16,
        quizzes: []
      },
      // Bloque 5: Limp Pots
      {
        id: "l7-limp",
        name: "Preflop Limp",
        shortName: "Limp",
        definition: "Frecuencia de Limp preflop (Call inicial en lugar de raise). Normalmente bajo en regulares (~0-5%). Alto en recreacionales.",
        color: StatColor.Purple,
        row: 1,
        column: 17,
        quizzes: []
      },
      {
        id: "l7-limp-fold",
        name: "Preflop Limp Fold",
        shortName: "LimpF",
        definition: "Fold tras haber hecho Limp cuando alguien raisea. Indica cuánto de los limps son puramente pasivos sin intención de pelear.",
        color: StatColor.Green,
        row: 1,
        column: 18,
        quizzes: []
      },
      {
        id: "l7-limp-call",
        name: "Preflop Limp Call",
        shortName: "LimpC",
        definition: "Call tras haber hecho Limp cuando alguien raisea. Indica cuánto de los limps tienen intención de pagar (manos medianas, pockets, suited connectors).",
        color: StatColor.Orange,
        row: 1,
        column: 19,
        quizzes: []
      },
      {
        id: "l7-bet-flop-limp",
        name: "Bet Flop Limped Pot",
        shortName: "BetFLP",
        definition: "Apuesta en el Flop en botes limpeados (limp pots). Cuando hay un limp y tú checks, esta stat indica cuánto apuestas en flop en estos spots.",
        color: StatColor.Red,
        row: 1,
        column: 20,
        quizzes: []
      },
    ]
  },
];
