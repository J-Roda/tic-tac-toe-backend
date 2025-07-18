const express = require("express");
const {
    createSession,
    createRound,
    createEndSession,
    getAllSessions,
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

router.get("/", (req, res) => {
    res.send("Backend is running!");
});

module.exports = router;
