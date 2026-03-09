const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const sessionRoutes = require('./routes/session');
const { purgeExpiredSessions } = require('./utils/purge');
const { globalLimiter } = require('./middleware/security');

const app = express();

// Trust Render's reverse proxy so express-rate-limit reads the real client IP
// from X-Forwarded-For instead of the proxy's internal IP
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS || 'http://localhost:5173',
  }),
);

// ── Body parsing — cap payload at 10 kb to prevent large-body attacks ─────────
app.use(express.json({ limit: '10kb' }));

// ── Strip $ and . from req.body/query/params to block NoSQL injection ─────────
app.use(mongoSanitize());

app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/session', sessionRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(status).json({ error: message });
});

// ── Database + server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.set({ strictQuery: true });
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await purgeExpiredSessions();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
