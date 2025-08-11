import { Router } from 'express';
import { Question } from '../models/Question.js';

const router = Router();

router.get('/questions', async (_req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.post('/questions', async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create question' });
  }
});

router.put('/questions/:id', async (req, res) => {
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedQuestion);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router;
