// ==============================================================================
// OceanSense — Simulation Routes
// ==============================================================================

import { Router } from 'express';
import { simulationController } from '../controllers/simulation.controller.js';

const router = Router();

router.get('/status', (req, res) => simulationController.getStatus(req, res));
router.post('/pause', (req, res) => simulationController.pause(req, res));
router.post('/resume', (req, res) => simulationController.resume(req, res));
router.post('/speed', (req, res) => simulationController.setSpeed(req, res));
router.post('/scale', (req, res) => simulationController.setScale(req, res));
router.post('/tamper', (req, res) => simulationController.triggerTamper(req, res));
router.post('/reset/:id', (req, res) => simulationController.resetTamper(req, res));
router.post('/reset', (req, res) => simulationController.resetTamper(req, res));

export default router;
