// ==============================================================================
// OceanSense — Zone & Gateway Routes
// ==============================================================================

import { Router } from 'express';
import { zoneController } from '../controllers/zone.controller.js';

const router = Router();

router.get('/', (req, res) => zoneController.getZones(req, res));
router.get('/gateways', (req, res) => zoneController.getGateways(req, res));

export default router;
