import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  kind: { type: String, enum: ['mcq', 'estimate'], required: true },
  body: { type: String, required: true },
  options: { type: [mongoose.Schema.Types.Mixed] },
  correctIndex: { type: Number },
  correctValue: { type: Number },
  timeMs: { type: Number, default: 10000 },
}, { timestamps: true });

export const Question = mongoose.model('Question', QuestionSchema);
