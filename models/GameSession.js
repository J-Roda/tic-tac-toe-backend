const mongoose = require('mongoose');

const TTL_DAYS = 3;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;

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
        message: 'A session cannot have more than 100 rounds.',
      },
    },
    stats: {
      player1Wins: { type: Number, default: 0, min: 0 },
      player2Wins: { type: Number, default: 0, min: 0 },
      draws: { type: Number, default: 0, min: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Index for faster sorted queries
GameSessionSchema.index({ createdAt: -1 });

// TTL index — MongoDB automatically deletes documents 3 days after createdAt.
// The background task runs roughly every 60 seconds, so deletion may lag slightly.
GameSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: TTL_SECONDS });

module.exports = mongoose.model('GameSession', GameSessionSchema);
