const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
require("dotenv").config();

const sessionRoutes = require("./routes/session");

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — only allow your frontend origin ────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server / curl requests (no origin) only in dev
      if (!origin && process.env.NODE_ENV !== "production") return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }),
);

// ── Body parsing — cap payload at 10 kb to prevent large-body attacks ─────────
app.use(express.json({ limit: "10kb" }));

// ── Strip $ and . from req.body/query/params to block NoSQL injection ─────────
app.use(mongoSanitize());

// ── Read limiter — GET routes polled by the frontend (health + archive) ───────
// 300 req / 15 min per IP (~20 req/min — comfortably covers all polling intervals)
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/session/all", readLimiter);
app.use("/api/session/", readLimiter);

// ── Write limiter — mutation routes only ──────────────────────────────────────
// 60 req / 15 min per IP — tight enough to stop spam, loose enough for normal play
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many write requests, slow down." },
});
app.use("/api/session/create", writeLimiter);
app.use("/api/session/:id/round", writeLimiter);
app.use("/api/session/:id/stop", writeLimiter);
app.use("/api/session/:id", writeLimiter); // covers DELETE

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/session", sessionRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  res.status(status).json({ error: message });
});

// ── Database + server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.set({ strictQuery: true });
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
