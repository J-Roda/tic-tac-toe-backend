const express = require("express");
const {
    createSession,
    createRound,
    createEndSession,
    getAllSessions,
    deleteSession,
} = require("../controller/sessionController");
const router = express.Router();

// Create session
router.post("/create", createSession);

// List all sessions
router.get("/all", getAllSessions);

// Play a round
router.post("/:id/round", createRound);

// End session
router.post("/:id/stop", createEndSession);

// DELETE a session by ID
router.delete("/:id", deleteSession);

router.get("/", (req, res) => {
    res.send("Backend is running!");
});

module.exports = router;
