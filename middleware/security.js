const rateLimit = require('express-rate-limit');

// ── Read limiter — GET routes polled by the frontend (health + archive) ───────
// 300 req / 15 min per IP (~20 req/min — comfortably covers all polling intervals)
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// ── Write limiter — mutation routes only ──────────────────────────────────────
// 30 req / 15 min per IP — tight enough to stop spam, loose enough for normal play
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, slow down.' },
});
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

module.exports = {
  readLimiter,
  writeLimiter,
  globalLimiter,
};
