import { Router } from 'express';
import { traceAcousticRoute, getMeshSummary } from '../controllers/topology.controller.js';

const router = Router();

router.get('/mesh-summary', getMeshSummary);
router.get('/route/:nodeId', traceAcousticRoute);

export default router;
