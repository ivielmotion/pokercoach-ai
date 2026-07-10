export interface PokerConcept {
  id: string;
  term: string;
  definition: string;
  shortDefinition: string;
  category: string;
  sourceId?: string;
  sourceTitle?: string;
  examples?: string[];
  mistakes?: string[];
  applications?: string[];
}

export interface PathQuestion {
  question: string;
  options: string[];
  answer: string;
  concept: string;
}

export interface TrueFalseQuestion {
  statement: string;
  answer: boolean;
  concept: string;
}

export interface MultipleChoiceQuestion {
  question: string;
  options: string[];
  answer: string;
  concept: string;
  points?: number;
}

export interface GameConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  time: number;
}

export const pokerKnowledgeBase = {
  topic: "Poker Estratégico",
  concepts: [
    { id: 'rango', term: 'Rango de Manos', definition: 'Conjunto de manos que un jugador puede tener en una situación determinada según su posición y acciones previas.', shortDefinition: 'Manos posibles en una situación', category: 'Fundamento' },
    { id: 'posicion', term: 'Posición en la Mesa', definition: 'Tu ubicación relativa al dealer. Más tarde actúas, más información tienes de los oponentes.', shortDefinition: 'Actuar último = ventaja', category: 'Fundamento' },
    { id: '3bet', term: '3-Bet', definition: 'Tercera apuesta en una ronda. Generalmente una resubida preflop tras una subida inicial.', shortDefinition: 'Re-raise preflop', category: 'Agresividad' },
    { id: 'cbet', term: 'Continuation Bet (C-Bet)', definition: 'Apuesta en el flop hecha por el agresor preflop. Usada para mantener la iniciativa.', shortDefinition: 'Apuesta del agresor en flop', category: 'Postflop' },
    { id: 'equity', term: 'Equity', definition: 'Porcentaje de veces que tu mano ganaría si se revelaran todas las cartas restantes.', shortDefinition: '% de probabilidad de ganar', category: 'Matemáticas' },
    { id: 'odds', term: 'Pot Odds', definition: 'Relación entre el tamaño de la apuesta a llamar y el dinero total en el bote. Te dice si una llamada es rentable.', shortDefinition: 'Apuesta vs bote total', category: 'Matemáticas' },
    { id: 'tellt', term: 'Tell', definition: 'Pista física o de comportamiento que revela información sobre la mano de un oponente.', shortDefinition: 'Pista que revela la mano', category: 'Psicología' },
    { id: 'bluff', term: 'Farol (Bluff)', definition: 'Apuesta o subida con una mano débil para forzar el fold de manos mejores.', shortDefinition: 'Apostar débil para ganar', category: 'Psicología' },
    { id: 'blockers', term: 'Blockers', definition: 'Cartas en tu mano que reduce la probabilidad de que el oponente tenga ciertas manos fuertes.', shortDefinition: 'Cartas que bloquean manos rivales', category: 'Avanzado' },
    { id: 'spr', term: 'Stack-to-Pot Ratio (SPR)', definition: 'Relación entre tu stack restante y el bote. Determina la jugabilidad de tu mano postflop.', shortDefinition: 'Stack ÷ Bote', category: 'Avanzado' },
    { id: 'implied', term: 'Implied Odds', definition: 'Potenciales ganancias futuras si completas tu proyecto, más allá del bote actual.', shortDefinition: 'Ganancia futura esperada', category: 'Matemáticas' },
    { id: 'gto', term: 'GTO (Game Theory Optimal)', definition: 'Estrategia matemáticamente inexpugnable donde el oponente no puede explotarte sin arriesgarse a ser explotado.', shortDefinition: 'Estrategia inexpugnable', category: 'Teoría' }
  ] as PokerConcept[],
  pathQuestions: [
    { question: '¿Qué manos deberías abrir desde UTG en una mesa 6-max?', options: ['Todas las parejas y suited connectors', 'Solo manos premium (AA, KK, QQ, AK)'], answer: 'Solo manos premium (AA, KK, QQ, AK)', concept: 'rango' },
    { question: '¿En qué posición actúas último postflop?', options: ['UTG', 'Botón (BTN)'], answer: 'Botón (BTN)', concept: 'posicion' },
    { question: '¿Cuándo es más efectivo un C-Bet?', options: ['En un flop seco con una sola carta alta', 'En un flop muy conectado y draw-heavy'], answer: 'En un flop seco con una sola carta alta', concept: 'cbet' },
    { question: '¿Qué odds mínimas necesitas para un flush draw en el turn?', options: ['4:1', '2:1'], answer: '4:1', concept: 'odds' }
  ] as PathQuestion[],
  trueFalseQuestions: [
    { statement: 'Un 3-bet siempre debe ser con manos premium.', answer: false, concept: '3bet' },
    { statement: 'La posición del botón es la más ventajosa porque actúas último.', answer: true, concept: 'posicion' },
    { statement: 'El farol funciona mejor contra múltiples oponentes.', answer: false, concept: 'bluff' },
    { statement: 'Conocer tus blockers ayuda a decidir si farolear o no.', answer: true, concept: 'blockers' },
    { statement: 'Un SPR bajo (< 3) favorece el all-in con manos medianas.', answer: true, concept: 'spr' },
    { statement: 'Las implied odds son irrelevantes cuando tienes un proyecto.', answer: false, concept: 'implied' }
  ] as TrueFalseQuestion[]
};

export function generateAllConceptQuestions(kb: typeof pokerKnowledgeBase) {
  return kb.concepts.map(concept => {
    const incorrectOptions = kb.concepts
      .filter(c => c.id !== concept.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(c => c.shortDefinition || c.definition);
    const answer = concept.shortDefinition || concept.definition;
    const options = [answer, ...incorrectOptions].sort(() => 0.5 - Math.random());
    return {
      question: concept.term,
      options,
      answer,
      concept: concept.id,
      points: Math.floor(Math.random() * 3) + 1
    };
  });
}

export const gamesData: GameConfig[] = [
  { id: 'multiple-choice', title: 'Opción Múltiple', description: 'Elige la respuesta correcta.', icon: 'fa-list-ul', color: 'green', time: 15 },
  { id: 'true-false', title: 'Verdadero o Falso', description: 'Decide si la afirmación es correcta.', icon: 'fa-check-double', color: 'emerald', time: 15 },
  { id: 'quick-sort', title: 'Categorización', description: 'Arrastra el concepto a su categoría.', icon: 'fa-layer-group', color: 'rose', time: 15 },
  { id: 'unscramble', title: 'Descifra', description: 'Ordena los fragmentos del texto.', icon: 'fa-puzzle-piece', color: 'amber', time: 15 },
  { id: 'correct-path', title: 'Camino Correcto', description: 'Sigue la secuencia correcta.', icon: 'fa-route', color: 'lime', time: 15 },
  { id: 'adventure-path', title: 'Aventura', description: 'Avanza en el mapa respondiendo.', icon: 'fa-map-signs', color: 'indigo', time: 20 },
  { id: 'memory-match', title: 'Memoria', description: 'Encuentra los pares de término y definición.', icon: 'fa-clone', color: 'cyan', time: 45 },
  { id: 'connect-ideas', title: 'Conecta Ideas', description: 'Une cada término con su definición.', icon: 'fa-link', color: 'gold', time: 30 }
];
