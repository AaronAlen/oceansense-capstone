// ==============================================================================
// OceanSense — Authentication & RBAC Middleware
// Demonstrates: Week 6 JWT Verification, Role Guard & Granular Permissions
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload, UserRole } from '../models/user.model.js';
import { ENV } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Access denied. Bearer token missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Invalid, expired, or tampered JWT token.',
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({
        error: 'INSUFFICIENT_ROLE',
        message: `Forbidden. Requires one of roles: [${allowedRoles.join(', ')}]. Current roles: [${req.user.roles.join(', ')}]`,
      });
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const hasPermission = requiredPermissions.every((p) =>
      req.user?.permissions?.includes(p)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Forbidden. Missing required permissions: [${requiredPermissions.join(', ')}]`,
      });
    }

    next();
  };
}
