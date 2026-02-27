const express = require("express");
const {
    createSession,
    createRound,
    createEndSession,
    getAllSessions,
    deleteSession,
} = require("../controller/sessionController");

const router = express.Router();

// Health check
router.get("/", (req, res) => res.json({ status: "ok" }));

// Create session
router.post("/create", createSession);

// List all sessions (supports ?page=1&limit=20)
router.get("/all", getAllSessions);

// Play a round
router.post("/:id/round", createRound);

// End session
router.post("/:id/stop", createEndSession);

// Delete session
router.delete("/:id", deleteSession);

module.exports = router;
