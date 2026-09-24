// ==============================================================================
// OceanSense — Node Routes
// ==============================================================================

import { Router } from 'express';
import { nodeController } from '../controllers/node.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, (req, res) => nodeController.getNodes(req as any, res));
router.get('/instances-3d', (req, res) => nodeController.get3DInstances(req, res));
router.get('/kpis', (req, res) => nodeController.getKPIs(req, res));
router.get('/:id', authenticateToken, (req, res) => nodeController.getNodeById(req as any, res));
router.patch('/:id/tamper', authenticateToken, (req, res) => nodeController.triggerTamper(req as any, res));
router.post('/:id/reset', authenticateToken, (req, res) => nodeController.resetNode(req as any, res));
router.get('/:id/raw-sonar', (req, res) => nodeController.getRawSonarStream(req, res));
router.post('/:id/ingest-raw-sonar', (req, res) => nodeController.ingestRawSonarPing(req, res));

export default router;
