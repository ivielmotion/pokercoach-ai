import { createClient } from '@supabase/supabase-js';

const supabaseRanges = createClient(
  'https://adhqicolbufktfzzpbzk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkaHFpY29sYnVma3RmenpwYnprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzYzMzI2NCwiZXhwIjoyMDk5MjA5MjY0fQ.WG2Oe1Y-5QRHffgcm0dPaC7o67hK9ZF3Xuu7aDaePgQ'
);

const HUD_DATA = {
  name: "HUD Master - Perfil Completo",
  description: "Las 7 líneas del HUD con todos los stats del curriculum",
  lines: [
    {
      id: 1,
      name: "Línea 1 - Perfil General",
      stats: [
        { id: "vpip", shortName: "VPIP", fullName: "VPIP (Voluntarily Put $ In Pot)", definition: "% de veces que el jugador pone dinero voluntariamente preflop.", color: "text-slate-300", exampleValue: "22" },
        { id: "pfr", shortName: "PFR", fullName: "PFR (Preflop Raise)", definition: "% de veces que el jugador sube la apuesta preflop.", color: "text-slate-300", exampleValue: "18" },
        { id: "3bet", shortName: "3Bet", fullName: "3Bet Preflop", definition: "Frecuencia con la que resube una apuesta preflop.", color: "text-amber-400", exampleValue: "7" },
        { id: "f3bet", shortName: "F3B", fullName: "Fold to PF 3Bet", definition: "% de veces que se retira ante una resubida (3Bet) preflop.", color: "text-emerald-400", exampleValue: "58" },
        { id: "separator-l1-1", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "4bet", shortName: "4Bet", fullName: "4Bet+ Preflop", definition: "Frecuencia con la que resube ante un 3Bet preflop.", color: "text-red-500", exampleValue: "4" },
        { id: "f4bet", shortName: "F4B", fullName: "Fold to PF 4Bet", definition: "% de veces que se retira ante un 4Bet preflop.", color: "text-green-500", exampleValue: "55" },
        { id: "5bet", shortName: "5Bet", fullName: "EP 5Bet+ Preflop", definition: "Frecuencia con la que resube o va all-in ante un 4Bet.", color: "text-red-500", exampleValue: "3" },
        { id: "f5bet", shortName: "F5B", fullName: "Fold to PF5Bet", definition: "% de veces que se retira ante un 5Bet preflop.", color: "text-lime-400", exampleValue: "45" },
        { id: "separator-l1-2", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "wwsf", shortName: "WWSF", fullName: "WWSF (Won When Saw Flop)", definition: "% de veces que ve el flop y termina ganando la mano.", color: "text-cyan-300", exampleValue: "47" },
        { id: "wsd", shortName: "W$SD", fullName: "W$SD (Won $ at Showdown)", definition: "% de veces que llega al River (Showdown) y gana la mano.", color: "text-slate-300", exampleValue: "54" },
        { id: "separator-l1-3", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "obturn", shortName: "OB Turn", fullName: "Overbet Turn", definition: "Frecuencia de apuestas desproporcionadas (mayores al bote) en el Turn.", color: "text-red-500", exampleValue: "12" },
        { id: "contob", shortName: "Cont OB", fullName: "River Bet after Turn OB", definition: "% de veces que continúa apostando en el River tras haber hecho un Overbet en el Turn.", color: "text-orange-300", exampleValue: "25" },
        { id: "obriver", shortName: "OB River", fullName: "Overbet River", definition: "Frecuencia de apuestas desproporcionadas (mayores al bote) en el River.", color: "text-red-500", exampleValue: "18" },
        { id: "player", shortName: "Player", fullName: "Player Name", definition: "Nombre del jugador en la mesa. No es una stat de lectura.", color: "text-slate-500", exampleValue: "" },
        { id: "hands", shortName: "Hands", fullName: "Hands Abbrev", definition: "Cantidad abreviada de manos registradas de ese jugador.", color: "text-slate-500", exampleValue: "" },
      ]
    },
    {
      id: 2,
      name: "Línea 2 - Juego en Botón",
      stats: [
        { id: "l2-cc-btn-utg", shortName: "CCvUTG", fullName: "EP BTN Call vs UTG Open", definition: "Cold Call desde el Botón contra una apertura de UTG.", color: "text-purple-400", exampleValue: "15" },
        { id: "l2-3b-btn-utg", shortName: "3BvUTG", fullName: "BTN 3Bet vs UTG Open", definition: "3Bet desde el Botón contra una apertura de UTG.", color: "text-amber-400", exampleValue: "7" },
        { id: "l2-cc-btn-co", shortName: "CCvCO", fullName: "Call vs CO Open", definition: "Cold Call desde el Botón contra una apertura del Cutoff.", color: "text-purple-400", exampleValue: "18" },
        { id: "l2-3b-btn-co", shortName: "3BvCO", fullName: "3Bet vs CO Open", definition: "3Bet desde el Botón contra una apertura del Cutoff.", color: "text-amber-400", exampleValue: "10" },
        { id: "separator-l2-1", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "l2-sqz-gen", shortName: "Sqz", fullName: "Preflop Squeeze", definition: "Squeeze Preflop general.", color: "text-amber-400", exampleValue: "11" },
        { id: "l2-sqz-btn", shortName: "SqzvBTN", fullName: "Preflop Squeeze vs BTN", definition: "Squeeze cuando el Botón abrió.", color: "text-amber-400", exampleValue: "11" },
        { id: "l2-f-sqz", shortName: "FtoSqz", fullName: "Fold to PF Squeeze", definition: "Fold to Squeeze como caller.", color: "text-emerald-400", exampleValue: "49" },
        { id: "l2-c-4bet", shortName: "C4Bet", fullName: "Open 4Bet+ Preflop", definition: "Call 4Bet (o 5Bet) Preflop.", color: "text-red-500", exampleValue: "2" },
        { id: "separator-l2-2", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "l2-farha", shortName: "Farha", fullName: "Cold Call 3Bet", definition: "Farha: pagar una 3Bet en frío para atrapar.", color: "text-purple-400", exampleValue: "1" },
        { id: "l2-farha-pos", shortName: "FarhaP", fullName: "Cold Call 3Bet Pos", definition: "Farha posicional.", color: "text-purple-400", exampleValue: "1" },
      ]
    },
    {
      id: 3,
      name: "Línea 3 - Juego en Ciegas",
      stats: [
        { id: "l3-sb-3b-ep", shortName: "SB3BvEP", fullName: "SB 3Bet vs EP/UTG", definition: "3Bet desde SB contra UTG/EP.", color: "text-amber-400", exampleValue: "5" },
        { id: "l3-sb-3b-co", shortName: "SB3BvCO", fullName: "SB 3Bet vs CO/MP", definition: "3Bet desde SB contra CO/MP.", color: "text-amber-400", exampleValue: "8" },
        { id: "l3-sb-f-btn", shortName: "SBfBTN", fullName: "SB Fold vs BTN", definition: "Fold desde SB cuando el Botón abre.", color: "text-emerald-400", exampleValue: "85" },
        { id: "l3-sb-3b-btn", shortName: "SB3BvBTN", fullName: "SB 3Bet vs BTN", definition: "3Bet desde SB contra el Botón.", color: "text-amber-400", exampleValue: "9" },
        { id: "separator-l3-1", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "l3-bb-f-nosteal", shortName: "BBfNoSt", fullName: "BB Fold vs No Steal", definition: "Fold desde BB contra posiciones que NO son de robo.", color: "text-emerald-400", exampleValue: "72" },
        { id: "l3-bb-3b-ep", shortName: "BB3BvEP", fullName: "BB 3Bet vs EP/UTG", definition: "3Bet desde BB contra UTG/EP.", color: "text-amber-400", exampleValue: "5" },
        { id: "l3-bb-3b-co", shortName: "BB3BvCO", fullName: "BB 3Bet vs CO", definition: "3Bet desde BB contra Cutoff.", color: "text-amber-400", exampleValue: "9" },
        { id: "l3-bb-f-btn-small", shortName: "BBfBTN<2.5", fullName: "BB Fold vs BTN < 2.5bb", definition: "Fold desde BB contra Botón < 2.5bb.", color: "text-emerald-400", exampleValue: "48" },
        { id: "l3-bb-f-btn-big", shortName: "BBfBTN>=2.5", fullName: "BB Fold vs BTN >= 2.5bb", definition: "Fold desde BB contra Botón >= 2.5bb.", color: "text-emerald-400", exampleValue: "48" },
        { id: "l3-bb-3b-btn", shortName: "BB3BvBTN", fullName: "BB 3Bet vs BTN", definition: "3Bet desde BB contra Botón.", color: "text-amber-400", exampleValue: "14" },
        { id: "separator-l3-2", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "l3-bb-f-sb", shortName: "BBfSB", fullName: "BB Fold vs SB", definition: "Fold desde BB contra SB.", color: "text-emerald-400", exampleValue: "22" },
        { id: "l3-bb-3b-sb", shortName: "BB3BvSB", fullName: "BB 3Bet vs SB", definition: "3Bet desde BB contra SB.", color: "text-amber-400", exampleValue: "18" },
        { id: "l3-bb-raise-limp", shortName: "RvsLimp", fullName: "Raise vs SB Limp", definition: "Raise desde BB cuando SB hace limp.", color: "text-red-500", exampleValue: "5" },
        { id: "l3-bb-f-float-limp", shortName: "fFloatLP", fullName: "Fold to Float Bet Limp Pot", definition: "Fold ante Float Bet en bote limpeado.", color: "text-yellow-400", exampleValue: "42" },
        { id: "separator-l3-3", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "l3-bet-flop-mw", shortName: "BetFlopMW", fullName: "Bet Flop Multiway", definition: "Bet en el Flop en botes multiway.", color: "text-pink-300", exampleValue: "42" },
        { id: "l3-wwsf-mw", shortName: "WWSFMW", fullName: "WWSF Multiway", definition: "Won When Saw Flop Multiway.", color: "text-cyan-300", exampleValue: "38" },
      ]
    },
    {
      id: 4,
      name: "Línea 4 - Juego sin Iniciativa",
      stats: [
        { id: "l4-f-flop-ip", shortName: "fFlopIP", fullName: "Fold to Cbet Flop IP", definition: "Fold a la Cbet en flop estando en posición.", color: "text-yellow-400", exampleValue: "35" },
        { id: "l4-f-minbet-ip", shortName: "fMinBet", fullName: "Fold to MinBet Flop IP", definition: "Fold a apuesta pequeña en flop estando en posición.", color: "text-yellow-400", exampleValue: "42" },
        { id: "l4-float-flop", shortName: "Float", fullName: "Float Flop", definition: "Apuesta (IP) cuando el rival cede la iniciativa con check en flop.", color: "text-pink-300", exampleValue: "28" },
        { id: "l4-f-delayed-ip", shortName: "fDlyIP", fullName: "Fold to Delayed Cbet IP", definition: "Fold a una delayed Cbet en el turn estando en posición.", color: "text-yellow-400", exampleValue: "50" },
        { id: "l4-r-flop-ip", shortName: "rFlopIP", fullName: "Raise Cbet Flop IP", definition: "Resubida a la Cbet del rival en el flop estando en posición.", color: "text-red-500", exampleValue: "12" },
        { id: "separator-l4-1", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "l4-f-flop-oop", shortName: "fFlopOOP", fullName: "Fold to Cbet Flop OOP", definition: "Fold a la Cbet en flop estando sin posición.", color: "text-yellow-400", exampleValue: "38" },
        { id: "l4-probe-turn", shortName: "Probe", fullName: "Probe Turn", definition: "Apuesta (OOP) en el turn tras check behind del rival en flop.", color: "text-pink-300", exampleValue: "32" },
        { id: "l4-f-delayed-oop", shortName: "fDlyOOP", fullName: "Fold to Delayed Cbet OOP", definition: "Fold a la delayed Cbet del rival estando sin posición.", color: "text-yellow-400", exampleValue: "50" },
        { id: "l4-r-flop-oop", shortName: "rFlopOOP", fullName: "Raise Cbet Flop OOP", definition: "Resubida a la Cbet del rival en el flop estando sin posición.", color: "text-red-500", exampleValue: "11" },
        { id: "l4-2bet-fold", shortName: "2BetF", fullName: "2Bet & Fold", definition: "Fold tras haber hecho un Raise previamente en el flop.", color: "text-yellow-400", exampleValue: "45" },
        { id: "l4-cont-post-raise", shortName: "ContR", fullName: "Cont. post Raise Turn", definition: "Continuación tras haber hecho Raise en flop.", color: "text-red-500", exampleValue: "60" },
        { id: "separator-l4-2", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "l4-f-turn-cbet", shortName: "fTurnCb", fullName: "Fold to Turn Cbet", definition: "Fold a una Cbet de tamaño normal en el turn.", color: "text-yellow-400", exampleValue: "40" },
        { id: "l4-f-overbet-turn", shortName: "fOverT", fullName: "Fold to Overbet Turn", definition: "Fold a una apuesta gigante (overbet) en el turn.", color: "text-yellow-400", exampleValue: "72" },
        { id: "l4-steal-turn", shortName: "StealT", fullName: "Steal Turn", definition: "Apuesta (OOP) en turn tras Cbet en flop y check del rival.", color: "text-pink-300", exampleValue: "48" },
        { id: "l4-r-turn", shortName: "rTurn", fullName: "Raise Turn", definition: "Resubida a la apuesta de continuación del rival en el turn.", color: "text-red-500", exampleValue: "12" },
      ]
    },
    {
      id: 5,
      name: "Línea 5 - Juego en River",
      stats: [
        { id: "l5-bet-river", shortName: "BetRiv", fullName: "Bet River", definition: "Frecuencia de apuesta en el River.", color: "text-red-500", exampleValue: "35" },
        { id: "l5-f-r-bet", shortName: "fRivBet", fullName: "Fold to River Bet", definition: "Frecuencia de fold ante cualquier apuesta en River.", color: "text-yellow-400", exampleValue: "52" },
        { id: "l5-wsdwbr", shortName: "WSDWBR", fullName: "WSDWBR", definition: "Won $ at Showdown When Bet River.", color: "text-cyan-300", exampleValue: "52" },
        { id: "l5-wsdwrr", shortName: "WSDWRR", fullName: "WSDWRR", definition: "Won $ at Showdown When Raise River.", color: "text-cyan-300", exampleValue: "68" },
        { id: "l5-f-r-bet-min", shortName: "fRivBetMin", fullName: "Fold to River Bet Min", definition: "Frecuencia de fold ante apuestas mínimas en el River.", color: "text-yellow-400", exampleValue: "52" },
        { id: "l5-f-r-minbet", shortName: "fRivMin", fullName: "Fold to River MinBet", definition: "Frecuencia de fold ante apuestas de medio bote en el River.", color: "text-yellow-400", exampleValue: "52" },
        { id: "l5-f-r-twothird", shortName: "fRiv2/3", fullName: "Fold to River TwoThird", definition: "Frecuencia de fold ante apuestas de dos tercios en el River.", color: "text-yellow-400", exampleValue: "58" },
        { id: "l5-f-r-over", shortName: "fRivOver", fullName: "Fold to River Overbet", definition: "Frecuencia de fold ante overbet en el River.", color: "text-yellow-400", exampleValue: "78" },
        { id: "l5-f-raise", shortName: "fRivRaise", fullName: "Fold to River Raise", definition: "Frecuencia de fold ante una subida en el River.", color: "text-yellow-400", exampleValue: "65" },
        { id: "l5-wsdwbr-min", shortName: "WSDWBRmin", fullName: "WSDWBR MinBet", definition: "Ganancia al showdown al apostar mínimo en el River.", color: "text-cyan-300", exampleValue: "52" },
        { id: "l5-wsdwbr-half", shortName: "WSDWBRhalf", fullName: "WSDWBR HalfBet", definition: "Ganancia al showdown al apostar medio bote en el River.", color: "text-cyan-300", exampleValue: "52" },
        { id: "l5-wsdwbr-twothird", shortName: "WSDWBR2/3", fullName: "WSDWBR TwoThird", definition: "Ganancia al showdown al apostar dos tercios en el River.", color: "text-cyan-300", exampleValue: "52" },
        { id: "l5-wsdwbr-quarter", shortName: "WSDWBR1/4", fullName: "WSDWBR QuarterPot", definition: "Ganancia al showdown al hacer potbet en el River.", color: "text-cyan-300", exampleValue: "52" },
        { id: "l5-wsdwbr-over", shortName: "WSDWBRover", fullName: "WSDWBR Overbet", definition: "Ganancia al showdown al hacer overbet en el River.", color: "text-cyan-300", exampleValue: "52" },
        { id: "separator-l5", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "l5-bet-river-sm", shortName: "BetRivSm", fullName: "Bet River Small Pot", definition: "Frecuencia de apuesta en el River en botes pequeños.", color: "text-red-500", exampleValue: "35" },
        { id: "l5-wwrb-small", shortName: "WWRBsm", fullName: "WWRB Small Pot", definition: "Ganancia al showdown tras apostar en botes pequeños.", color: "text-cyan-300", exampleValue: "52" },
        { id: "l5-bet-river-big", shortName: "BetRivBig", fullName: "Bet River Big Pot", definition: "Frecuencia de apuesta en el River en botes grandes.", color: "text-red-500", exampleValue: "35" },
        { id: "l5-wwrb-big", shortName: "WWRBbig", fullName: "WWRB Big Pot", definition: "Ganancia al showdown tras apostar en botes grandes.", color: "text-cyan-300", exampleValue: "52" },
      ]
    },
    {
      id: 6,
      name: "Línea 6 - Juego con Iniciativa",
      stats: [
        { id: "l6-cbet-flop-ip", shortName: "CbetFIP", fullName: "CBet Flop IP", definition: "Frecuencia de CBet en el flop teniendo posición.", color: "text-red-500", exampleValue: "65" },
        { id: "l6-minbet-flop", shortName: "MinBetF", fullName: "MinBet Flop", definition: "Frecuencia de apuesta mínima en flop.", color: "text-red-500", exampleValue: "35" },
        { id: "l6-f-t-probe", shortName: "fTProbe", fullName: "Fold to T Probe", definition: "Fold a la Probe Bet en el turn.", color: "text-yellow-400", exampleValue: "50" },
        { id: "l6-delayed-turn-ip", shortName: "DlyTIP", fullName: "Delayed Turn IP", definition: "Apuesta en turn con posición tras check en flop.", color: "text-slate-300", exampleValue: "35" },
        { id: "l6-cbet-flop-oop", shortName: "CbetFOOP", fullName: "CBet Flop OOP", definition: "CBet en flop sin posición.", color: "text-red-500", exampleValue: "58" },
        { id: "l6-f-f-float", shortName: "fFFloat", fullName: "Fold to F Float", definition: "Fold ante apuesta Float en flop.", color: "text-yellow-400", exampleValue: "50" },
        { id: "l6-cbet-flop-sb", shortName: "CbetFSB", fullName: "CBet Flop SB vs BB", definition: "CBet en flop en duelos SB vs BB.", color: "text-red-500", exampleValue: "40" },
        { id: "l6-f-f-float-sb", shortName: "fFFloatSB", fullName: "Fold to F Float SB vs BB", definition: "Fold ante Float en flop en duelos SB vs BB.", color: "text-yellow-400", exampleValue: "50" },
        { id: "l6-r-f-float", shortName: "rFFloat", fullName: "Raise F Float", definition: "Check-raise para atacar la apuesta Float del rival en flop.", color: "text-red-500", exampleValue: "5" },
        { id: "l6-delayed-turn-oop", shortName: "DlyTOOP", fullName: "Delayed Turn OOP", definition: "Apuesta en turn sin posición tras check flop.", color: "text-slate-300", exampleValue: "35" },
        { id: "l6-f-raise-flop", shortName: "fRaiseF", fullName: "Fold to Raise Flop", definition: "Fold ante un raise en flop.", color: "text-yellow-400", exampleValue: "40" },
        { id: "l6-3bet-flop-srp", shortName: "3BetFSRP", fullName: "3Bet Flop SRP", definition: "Re-raise en flop en botes Single Raised Pot.", color: "text-red-500", exampleValue: "3" },
        { id: "l6-f-after-cbet", shortName: "fAfterCb", fullName: "Fold After Cbet to Raise", definition: "Fold al raise rival después de haber hecho CBet.", color: "text-yellow-400", exampleValue: "45" },
        { id: "separator-l6", shortName: "|", fullName: "Separador", definition: "", color: "text-slate-300", exampleValue: "" },
        { id: "l6-cbet-turn", shortName: "CbetT", fullName: "CBet Turn", definition: "Frecuencia de CBet en turn.", color: "text-red-500", exampleValue: "45" },
        { id: "l6-f-r-probe", shortName: "fRProbe", fullName: "Fold to R Probe", definition: "Fold a la Probe Bet en river.", color: "text-yellow-400", exampleValue: "50" },
        { id: "l6-f-t-float", shortName: "fTFloat", fullName: "Fold to T Float", definition: "Fold a la apuesta Float en turn.", color: "text-yellow-400", exampleValue: "50" },
        { id: "l6-f-raise-turn", shortName: "fRaiseT", fullName: "Fold to Raise Turn", definition: "Fold ante raise en turn.", color: "text-yellow-400", exampleValue: "50" },
      ]
    },
    {
      id: 7,
      name: "Línea 7 - Preflop por Posición",
      stats: [
        { id: "l7-rf-ep", shortName: "RfEP", fullName: "Raise First EP", definition: "Apertura en Early Position.", color: "text-red-500", exampleValue: "20" },
        { id: "l7-f-3b-ep", shortName: "f3bEP", fullName: "Fold to 3Bet EP", definition: "Fold to 3Bet en EP.", color: "text-emerald-400", exampleValue: "75" },
        { id: "l7-4b-ep", shortName: "4bEP", fullName: "4Bet EP", definition: "4Bet en EP.", color: "text-red-500", exampleValue: "3" },
        { id: "l7-rf-co", shortName: "RfCO", fullName: "Raise First CO", definition: "Apertura en Cutoff.", color: "text-red-500", exampleValue: "28" },
        { id: "l7-f-3b-co", shortName: "f3bCO", fullName: "Fold to 3Bet CO", definition: "Fold to 3Bet en CO.", color: "text-emerald-400", exampleValue: "68" },
        { id: "l7-4b-co", shortName: "4bCO", fullName: "4Bet CO", definition: "4Bet en CO.", color: "text-red-500", exampleValue: "4" },
        { id: "l7-rf-btn", shortName: "RfBTN", fullName: "Raise First BTN", definition: "Apertura en Botón.", color: "text-red-500", exampleValue: "45" },
        { id: "l7-f-3b-btn", shortName: "f3bBTN", fullName: "Fold to 3Bet BTN", definition: "Fold to 3Bet en BTN.", color: "text-emerald-400", exampleValue: "70" },
        { id: "l7-4b-btn", shortName: "4bBTN", fullName: "4Bet BTN", definition: "4Bet en BTN.", color: "text-red-500", exampleValue: "6" },
        { id: "l7-rf-sb", shortName: "RfSB", fullName: "Raise First SB", definition: "Apertura en SB.", color: "text-red-500", exampleValue: "30" },
        { id: "l7-f-3b-sb", shortName: "f3bSB", fullName: "Fold to 3Bet SB", definition: "Fold to 3Bet en SB.", color: "text-emerald-400", exampleValue: "68" },
        { id: "l7-4b-sb", shortName: "4bSB", fullName: "4Bet SB", definition: "4Bet en SB.", color: "text-red-500", exampleValue: "4" },
        { id: "l7-limp", shortName: "Limp", fullName: "Preflop Limp", definition: "Preflop Limp.", color: "text-red-500", exampleValue: "5" },
        { id: "l7-limp-fold", shortName: "LimpF", fullName: "Limp Fold", definition: "Limp Fold.", color: "text-emerald-400", exampleValue: "50" },
        { id: "l7-limp-call", shortName: "LimpC", fullName: "Limp Call", definition: "Limp Call.", color: "text-emerald-400", exampleValue: "35" },
        { id: "l7-bet-flop-limp", shortName: "BetFLimp", fullName: "Bet Flop Limped Pot", definition: "Bet Flop en bote limpeado.", color: "text-red-500", exampleValue: "40" },
      ]
    }
  ]
};

async function seedHUDData() {
  console.log('Insertando datos del HUD Master en Supabase...');
  
  const { data, error } = await supabaseRanges
    .from('hud_profiles')
    .insert({
      name: HUD_DATA.name,
      description: HUD_DATA.description,
      lines: HUD_DATA.lines,
    })
    .select()
    .single();

  if (error) {
    console.error('Error al insertar datos:', error);
    return;
  }

  console.log('Datos insertados correctamente:', data.id);
}

seedHUDData();
