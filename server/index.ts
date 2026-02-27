import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDatabase, closeDatabase } from "./database";
import authRoutes from "./routes/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
  });

  // Inicializar base de dados
  try {
    await initializeDatabase();
    console.log("✓ Base de dados inicializada com sucesso");
  } catch (error) {
    console.error("✗ Erro ao inicializar base de dados:", error);
    process.exit(1);
  }

  // Rotas de API
  app.use("/api/auth", authRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Servidor a correr" });
  });

  // Servir ficheiros estáticos
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`✓ Servidor a correr em http://localhost:${port}/`);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n✓ Encerrando servidor...");
    await closeDatabase();
    process.exit(0);
  });
}

startServer().catch(console.error);
