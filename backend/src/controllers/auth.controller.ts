// ==============================================================================
// OceanSense — Authentication Controller
// Demonstrates: Week 6 Zod Validation & Request Orchestration
// ==============================================================================

import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const LoginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: parsed.error.errors.map((e) => e.message),
        });
      }

      const { email, password } = parsed.data;
      const result = await authService.login(email, password);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(401).json({
        error: 'AUTH_FAILED',
        message: err.message || 'Authentication failed',
      });
    }
  }

  async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
      }
      const user = await authService.getCurrentUser(req.user.sub);
      return res.json({
        success: true,
        data: user,
      });
    } catch (err: any) {
      return res.status(404).json({ error: 'NOT_FOUND', message: err.message });
    }
  }

  async getDemoAccounts(req: Request, res: Response) {
    const demoAccounts = userRepository.getAllDemoUsers().map((u) => ({
      id: u.id,
      email: u.email,
      name: `${u.first_name} ${u.last_name}`,
      roles: u.roles,
      demoPassword: 'Password123!',
    }));
    return res.json({
      success: true,
      data: demoAccounts,
    });
  }
}

export const authController = new AuthController();
