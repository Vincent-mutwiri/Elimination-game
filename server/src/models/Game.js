import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const PlayerSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(8), required: true },
  socketId: { type: String, required: true },
  name: { type: String, required: true },
  isAlive: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now },
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  eliminatedAt: { type: Date },
}, { _id: false });

const RoundSchema = new mongoose.Schema({
    index: Number,
    question: mongoose.Schema.Types.Mixed,
    startedAt: Date,
    deadlineAt: Date,
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const GameSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['lobby', 'live', 'ended'], default: 'lobby' },
  config: {
    cutMode: { type: String, default: 'sudden' },
    cutParam: { type: Number, default: 0.2 },
    graceMs: { type: Number, default: 300 },
  },
  players: [PlayerSchema],
  hostSocketId: { type: String },
  roundIndex: { type: Number, default: -1 },
  currentRound: { type: RoundSchema },
  pot: { type: Number, default: 0 },
  questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  winner: { id: String, name: String },
}, { timestamps: true });

export const Game = mongoose.model('Game', GameSchema);
