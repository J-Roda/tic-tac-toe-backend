const express = require("express");
const {
  createSession,
  createRound,
  createEndSession,
  reactivateSession,
  getAllSessions,
  deleteSession,
} = require("../controller/sessionController");
const { writeLimiter, readLimiter } = require("../middleware/security");

const router = express.Router();

// Health check
router.get("/", (req, res) => res.json({ status: "ok" }));

// Create session
router.post("/create", writeLimiter, createSession);

// List all sessions (supports ?page=1&limit=20)
router.get("/all", readLimiter, getAllSessions);

// Play a round
router.post("/:id/round", writeLimiter, createRound);

// End session (idempotent — safe to call even if already ended)
router.post("/:id/stop", writeLimiter, createEndSession);

// Reactivate a session stopped by page refresh — called on Resume
router.post("/:id/reactivate", writeLimiter, reactivateSession);

// Delete session
router.delete("/:id", writeLimiter, deleteSession);

module.exports = router;
