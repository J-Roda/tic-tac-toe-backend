const mongoose = require("mongoose");

const GameSessionSchema = new mongoose.Schema(
    {
        player1: String,
        player2: String,
        rounds: [
            {
                board: [[String]],
                winner: String,
            },
        ],
        stats: {
            player1Wins: { type: Number, default: 0 },
            player2Wins: { type: Number, default: 0 },
            draws: { type: Number, default: 0 },
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("GameSession", GameSessionSchema);
