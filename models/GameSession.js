const mongoose = require("mongoose");

const GameSessionSchema = new mongoose.Schema(
    {
        player1: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 32,
        },
        player2: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 32,
        },
        rounds: {
            type: [
                {
                    winner: {
                        type: String,
                        trim: true,
                        maxlength: 32,
                    },
                },
            ],
            // Hard cap at the schema level as a second line of defence
            validate: {
                validator: (rounds) => rounds.length <= 100,
                message: "A session cannot have more than 100 rounds.",
            },
        },
        stats: {
            player1Wins: { type: Number, default: 0, min: 0 },
            player2Wins: { type: Number, default: 0, min: 0 },
            draws:       { type: Number, default: 0, min: 0 },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Index for faster sorted queries
GameSessionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("GameSession", GameSessionSchema);
