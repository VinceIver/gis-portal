import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import adminAuthRoutes from "./routes/adminAuth.route.js";
import requestRoutes from "./routes/request.routes.js";
import trainingRoutes from "./routes/training.routes.js";
import resourceRoutes from "./routes/resource.routes.js";

dotenv.config();

// --- ESM dirname fix ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- CORS ---
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// --- Body parser ---
app.use(express.json());

// --- STATIC FILES (IMPORTANT FIX) ---
// This maps http://localhost:5000/uploads/... → backend/uploads/...
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"))
);

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// --- Routes ---
app.use("/api/admin", adminAuthRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/trainings", trainingRoutes);
app.use("/api/resources", resourceRoutes);

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});