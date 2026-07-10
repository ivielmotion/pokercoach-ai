import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Carga primero .env.local (donde vive la API key de OpenRouter) y luego .env como fallback
dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Support parsing larger inputs, e.g., long transcriptions up to 10MB
app.use(express.json({ limit: "10mb" }));

// Modelo más barato de Gemini disponible en OpenRouter
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Lazy-loaded OpenRouter key
let cachedApiKey: string | null = null;

function getApiKey(): string {
  if (cachedApiKey !== null) return cachedApiKey;
  const key = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "";
  cachedApiKey = key;
  return key;
}

async function readJsonResponse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`OpenRouter respondio vacio (${response.status} ${response.statusText}).`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`OpenRouter no devolvio JSON valido: ${text.slice(0, 500)}`);
  }
}

function buildSystemInstruction(): string {
  return `Actúas como un asistente experto en análisis, síntesis y estructuración de información para estudio de cualquier tema científico, técnico, académico o profesional.

Tu tarea es transformar cualquier texto, documento TXT, transcripción, nota, clase o tema que recibas en una guía de estudio de ALTA PRECISIÓN, MUY COMPACTA y perfectamente estructurada.

Tu máxima prioridad es ser DIRECTO, CLARO Y SIN REDUNDANCIAS, yendo directamente al grano en cada definición o explicación.

REGLAS DE EXPLICACIÓN DIRECTA:
- **Sin palabras de relleno contextual**: No uses términos redundantes que ya se entienden por el contexto del tema o del título. Ve directamente a los atributos esenciales del concepto.
- **Sin introducciones de conceptos**: Evita frases de enlace como "Este concepto se refiere a...", "Es un proceso que consiste en...", "Se define como...". Ve directamente a la definición técnica concreta.

REGLA DE CARACTERES OBLIGATORIA (LÍMITE DE LONGITUD):
- La parte de la 'Explicación' (el texto que va después de los dos puntos del concepto) debe tener **OBLIGATORIAMENTE entre 30 y 55 caracteres de longitud** (incluyendo espacios). No debe medir menos de 30 caracteres ni más de 55 caracteres bajo ninguna circunstancia.
- Para lograr esto de forma directa, debes ser sumamente asertivo: condensa la información clave de forma súper sintética, eliminando cualquier rodeo pero cubriendo el significado exacto para que mida entre 30 y 55 caracteres.
- Usa estilo compacto pero explicativo: definición breve, útil y con matiz cuando sea necesario. Puedes usar punto y coma para compactar relaciones clave.
- **PROHIBIDO INCLUIR LA CUENTA DE CARACTERES**: No agregues textos como "(71 caracteres)", "(XX caracteres)" o similares en el resultado final. El cálculo de caracteres se hace de manera interna; el texto final no debe mostrar este conteo bajo ninguna circunstancia.

REGLAS DE ESTRUCTURA Y FORMATO:
- **Título principal**: Usa un solo título corto y directo en formato H1 (# Título del Tema).
- **Secciones principales inteligentes**: Divide el contenido solo en ejes principales reales usando H2 numerados (## 1. Nombre de la sección). No crees una sección nueva por cada subtópico, métrica, ejemplo o detalle menor.
- **Agrupación obligatoria**: Si varias ideas pertenecen al mismo eje central, agrúpalas dentro de la misma sección como conceptos de lista. Conserva todos los conceptos importantes, pero reduce la cantidad de secciones.
- **Sin introducciones de sección**: No escribas resumen, frase introductoria ni texto suelto debajo de cada H2. Después de un H2 deben venir directamente conceptos o, si es imprescindible, un H3.
- **Subcategorías mínimas**: Usa H3 solo cuando haya un grupo claramente necesario dentro de una sección grande. Si no es imprescindible, evita H3 y usa directamente viñetas.
- **Conceptos clave en viñetas**: Usa viñetas (* **Concepto:** Explicación) para definiciones directas. Cada viñeta debe comenzar con el término técnico en negrita, seguido de dos puntos y la Explicación que cumpla estrictamente con la regla de 30-55 caracteres.
- **Líneas de texto independientes**: Si hay una definición o descripción general que no lleva viñeta, usa formato de texto normal destacando el término en negrita (ej. "**Indicador Principal:** Mide el cambio clave del sistema evaluado"). La explicación/descripción de estas líneas independientes también debe cumplir obligatoriamente con la regla de longitud de entre 30 y 55 caracteres.
- **Estilo de ficha útil**: No empieces con frases largas como "Jugador que", "Porcentaje de", "Concepto que", "Se refiere a" o "Es cuando". Ve directo al rasgo, función o efecto principal.
- **Compacto pero no vacío**: La definición debe servir para estudiar o jugar. No la reduzcas a una etiqueta vaga; conserva el matiz clave en pocas palabras.
- **Eliminación de Ejemplos en Conceptos**: Debes eliminar por completo todos los ejemplos o casos prácticos de la definición/explicación de los conceptos. Las definiciones de los conceptos NO deben incluir ejemplos de ningún tipo (ej. quita menciones como "por ejemplo", "como cuando...", ejemplos prácticos, etc., de las descripciones).
- **Ejemplos y Datos independientes**: Conserva ejemplos o datos solo si son esenciales para entender el concepto. Si son secundarios, elimínalos. Nunca los metas dentro de la definición del concepto.
- **No fragmentar**: Evita secciones con uno o dos conceptos salvo que sean ejes centrales inevitables. Fusiona secciones pequeñas dentro de una sección principal relacionada.
- **No dividir conceptos compuestos**: Si el documento usa nombres de varias palabras o con guion, mantenlos completos como un solo concepto. No conviertas "Riesgo Operativo", "Costo-Beneficio" o "Tasa de Conversión" en palabras sueltas.

EJEMPLO DE LA ESTRUCTURA DIRECTA Y LONGITUD (30-55 caracteres por explicación, sin mostrar la cuenta):
## 2. Clasificación Principal
* **Riesgo Operativo:** Fallos internos; afectan continuidad y control.
* **Riesgo Financiero:** Exposición que altera liquidez o margen.

## 3. Indicadores Clave
* **Tasa de Conversión:** Usuarios que completan la acción objetivo.
* **Costo de Adquisición:** Inversión media para captar un cliente.

REGLAS DE ESTILO:
- Escribe siempre en español.
- No agregues texto introductorio ("Aquí tienes la guía...", "Espero que te sirva"). Devuelve ÚNICAMENTE el código Markdown de la guía.
- Elimina todo el relleno verbal, repeticiones de ideas, muletillas de transcripción o comentarios casuales del autor/profesor.
- Mantén las explicaciones en una sola línea siempre que sea posible para máxima facilidad de repaso visual.
- Prioriza que el resultado se lea rápido de un vistazo, con pocas secciones fuertes y conceptos importantes completos.
- No sacrifiques conceptos importantes por compactar; compacta eliminando relleno, repeticiones, ejemplos secundarios y divisiones innecesarias.`;
}

// API endpoint to synthesize a study guide
app.post("/api/synthesize", async (req, res) => {
  try {
    const content = req.body?.content;
    const hasContent = content && typeof content === "string" && content.trim().length > 0;

    if (!hasContent) {
      return res.status(400).json({ error: "El contenido a procesar no puede estar vacío." });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is missing. Configúrala en .env.local (key sk-or-v1-...).");
    }

    const systemInstruction = buildSystemInstruction();

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": `http://localhost:${process.env.PORT || 5193}`,
        "X-Title": "SINTEX Asistente de Estudio",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Aquí está el contenido a transformar en guía de estudio:\n\n${content}` },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Error OpenRouter ${response.status}: ${detail || response.statusText}`);
    }

    const data = await readJsonResponse(response);
    const resultText = data?.choices?.[0]?.message?.content;

    if (!resultText) {
      throw new Error("No se pudo generar la guía. La respuesta de la IA está vacía.");
    }

    res.json({ result: resultText });
  } catch (error) {
    console.error("Synthesize error:", error);
    res.status(500).json({ error: error?.message || "Error interno del servidor" });
  }
});

// Server-side environment check endpoint
app.get("/api/config-check", (_req, res) => {
  res.json({
    hasApiKey: !!getApiKey(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.resolve(__dirname),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 5193;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Using OpenRouter model: ${OPENROUTER_MODEL}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
