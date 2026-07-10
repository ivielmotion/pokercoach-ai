import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { hasApiKey, OPENROUTER_MODEL, synthesizeStudyGuide } from "./src/server/syntexEngine";

// Carga primero .env.local (donde vive la API key de OpenRouter) y luego .env como fallback
dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Support parsing larger inputs, e.g., long transcriptions up to 10MB
app.use(express.json({ limit: "10mb" }));

// API endpoint to synthesize a study guide
app.post("/api/synthesize", async (req, res) => {
  try {
    const result = await synthesizeStudyGuide(req.body?.content, `http://localhost:${process.env.PORT || 5193}`);
    res.json({ result });
  } catch (error) {
    console.error("Synthesize error:", error);
    res.status(500).json({ error: error?.message || "Error interno del servidor" });
  }
});

// Server-side environment check endpoint
app.get("/api/config-check", (_req, res) => {
  res.json({
    hasApiKey: hasApiKey(),
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
