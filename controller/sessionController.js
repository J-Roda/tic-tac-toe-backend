const GameSession = require("../models/GameSession");

const createSession = async (req, res) => {
    const { player1, player2 } = req.body;
    const session = new GameSession({ player1, player2 });
    await session.save();
    res.json(session);
};

const createRound = async (req, res) => {
    const { board, winner } = req.body;
    const session = await GameSession.findById(req.params.id);

    if (!session || !session.isActive) {
        return res.status(400).json({ error: "Session ended or not found" });
    }

    session.rounds.push({ board, winner });

    if (winner === session.player1) session.stats.player1Wins++;
    else if (winner === session.player2) session.stats.player2Wins++;
    else session.stats.draws++;

    await session.save();
    res.json(session);
};

const createEndSession = async (req, res) => {
    const session = await GameSession.findById(req.params.id);
    session.isActive = false;
    await session.save();
    res.json(session);
};

const getAllSessions = async (req, res) => {
    const sessions = await GameSession.find().sort({ createdAt: -1 });
    res.json(sessions);
};

module.exports = {
    createSession,
    createRound,
    createEndSession,
    getAllSessions,
};
