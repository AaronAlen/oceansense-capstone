import { Router } from 'express';
import { calculateGridPlan, applyGridScale, getGridConfig, saveGridConfig } from '../controllers/deployment.controller.js';

const router = Router();

router.get('/config', getGridConfig);
router.post('/save-config', saveGridConfig);
router.post('/calculate-plan', calculateGridPlan);
router.post('/apply-scale', applyGridScale);

export default router;
