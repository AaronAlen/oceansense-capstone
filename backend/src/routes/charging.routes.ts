import { Router } from 'express';
import { getChargingDiagnostics } from '../controllers/charging.controller.js';

const router = Router();

router.get('/diagnostics', getChargingDiagnostics);

export default router;
