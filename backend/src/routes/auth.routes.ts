// ==============================================================================
// OceanSense — Authentication Routes
// ==============================================================================

import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/login', (req, res) => authController.login(req, res));
router.get('/demo-accounts', (req, res) => authController.getDemoAccounts(req, res));

// Protected routes
router.get('/me', authenticateToken, (req, res) => authController.me(req as any, res));

export default router;
