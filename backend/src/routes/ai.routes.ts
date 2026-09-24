import { Router } from 'express';
import { handleAIChat, handleSonarClassification } from '../controllers/ai.controller.js';

const router = Router();

router.post('/chat', handleAIChat);
router.post('/classify-sonar', handleSonarClassification);

export default router;
