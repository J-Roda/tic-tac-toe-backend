const GameSession = require("../models/GameSession");

// ── Helpers ───────────────────────────────────────────────────────────────────

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

const sanitizeString = (str) =>
    typeof str === "string" ? str.trim().slice(0, 32) : null;

// ── Controllers ───────────────────────────────────────────────────────────────

const createSession = async (req, res, next) => {
    try {
        const player1 = sanitizeString(req.body.player1);
        const player2 = sanitizeString(req.body.player2);

        if (!player1 || !player2) {
            return res
                .status(400)
                .json({ error: "player1 and player2 are required." });
        }

        if (player1 === player2) {
            return res
                .status(400)
                .json({ error: "Players must have different names." });
        }

        const session = new GameSession({ player1, player2 });
        await session.save();
        res.status(201).json(session);
    } catch (err) {
        next(err);
    }
};

const createRound = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid session ID." });
        }

        const winner = sanitizeString(req.body.winner);

        if (!winner) {
            return res.status(400).json({ error: "winner is required." });
        }

        const session = await GameSession.findById(id);

        if (!session) {
            return res.status(404).json({ error: "Session not found." });
        }

        if (!session.isActive) {
            return res.status(400).json({ error: "Session has already ended." });
        }

        // Enforce max rounds per session to prevent infinite spam
        if (session.rounds.length >= 100) {
            return res
                .status(400)
                .json({ error: "Maximum rounds reached for this session." });
        }

        // Winner must be a known player or 'draw'
        const validWinners = [session.player1, session.player2, "draw"];
        if (!validWinners.includes(winner)) {
            return res.status(400).json({ error: "Invalid winner value." });
        }

        session.rounds.push({ winner });

        if (winner === session.player1) session.stats.player1Wins++;
        else if (winner === session.player2) session.stats.player2Wins++;
        else session.stats.draws++;

        await session.save();
        res.json(session);
    } catch (err) {
        next(err);
    }
};

const createEndSession = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid session ID." });
        }

        const session = await GameSession.findById(id);

        if (!session) {
            return res.status(404).json({ error: "Session not found." });
        }

        if (!session.isActive) {
            return res.status(400).json({ error: "Session is already ended." });
        }

        session.isActive = false;
        await session.save();
        res.json(session);
    } catch (err) {
        next(err);
    }
};

const getAllSessions = async (req, res, next) => {
    try {
        // Paginate to prevent dumping the entire collection
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip  = (page - 1) * limit;

        const [sessions, total] = await Promise.all([
            GameSession.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            GameSession.countDocuments(),
        ]);

        res.json({
            sessions,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        next(err);
    }
};

const deleteSession = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid session ID." });
        }

        const deleted = await GameSession.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ error: "Session not found." });
        }

        res.json({ message: "Session deleted successfully." });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createSession,
    createRound,
    createEndSession,
    getAllSessions,
    deleteSession,
};
