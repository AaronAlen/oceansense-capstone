// ==============================================================================
// OceanSense — User & RBAC Model
// Demonstrates: Week 6 JWT, RBAC Type Definitions
// ==============================================================================

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'OPERATIONS_MANAGER' 
  | 'MARINE_ENGINEER' 
  | 'ANALYST' 
  | 'VIEWER' 
  | 'SUBSCRIBER';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  roles: UserRole[];
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

export interface AuthTokenPayload {
  sub: string; // user id
  email: string;
  roles: UserRole[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}
