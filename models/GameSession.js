const mongoose = require("mongoose");

const GameSessionSchema = new mongoose.Schema(
    {
        player1: { type: String, required: true },
        player2: { type: String, required: true },
        roundsPlayed: Number,
        stats: {
            player1Wins: { type: Number, default: 0 },
            player2Wins: { type: Number, default: 0 },
            draws: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("GameSession", GameSessionSchema);
