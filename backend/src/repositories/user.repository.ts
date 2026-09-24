// ==============================================================================
// OceanSense — User Repository (PostgreSQL + In-Memory Fallback)
// Demonstrates: Week 10 Complex JOINs & Aggregations for RBAC
// ==============================================================================

import { User, UserRole } from '../models/user.model.js';
import { pgPool, getPostgresStatus } from '../config/database.js';

// Pre-seeded accounts (Matching database/seeds/seed_initial_data.sql)
// Real bcrypt hash for 'Password123!': $2b$10$vagMs9VKs2laGVehCFh6UOIUoxHHN6yiMjo9nK3KQ22AFBSFeBC7m
const DEMO_BCRYPT_HASH = '$2b$10$vagMs9VKs2laGVehCFh6UOIUoxHHN6yiMjo9nK3KQ22AFBSFeBC7m';

const IN_MEMORY_USERS: User[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@oceansense.io',
    password_hash: DEMO_BCRYPT_HASH,
    first_name: 'Marcus',
    last_name: 'Vance',
    roles: ['SUPER_ADMIN'],
    permissions: ['nodes:read', 'nodes:write', 'deployment:manage', 'security:manage', 'auv:control', 'maintenance:manage', 'analytics:read', 'subscriber:read'],
    is_active: true,
    created_at: '2026-09-22T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'operator@oceansense.io',
    password_hash: DEMO_BCRYPT_HASH,
    first_name: 'Elena',
    last_name: 'Rostova',
    roles: ['OPERATIONS_MANAGER'],
    permissions: ['nodes:read', 'security:manage', 'auv:control', 'analytics:read'],
    is_active: true,
    created_at: '2026-09-22T00:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'engineer@oceansense.io',
    password_hash: DEMO_BCRYPT_HASH,
    first_name: 'Chen',
    last_name: 'Wei',
    roles: ['MARINE_ENGINEER'],
    permissions: ['nodes:read', 'nodes:write', 'deployment:manage', 'maintenance:manage'],
    is_active: true,
    created_at: '2026-09-22T00:00:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'analyst@oceansense.io',
    password_hash: DEMO_BCRYPT_HASH,
    first_name: 'Aria',
    last_name: 'Nakamura',
    roles: ['ANALYST'],
    permissions: ['analytics:read'],
    is_active: true,
    created_at: '2026-09-22T00:00:00Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'subscriber@pacificatrawlers.com',
    password_hash: DEMO_BCRYPT_HASH,
    first_name: 'Sean',
    last_name: 'Callahan',
    roles: ['SUBSCRIBER'],
    permissions: ['subscriber:read'],
    is_active: true,
    created_at: '2026-09-22T00:00:00Z',
  },
];

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    if (getPostgresStatus().connected) {
      try {
        const queryText = `
          SELECT 
            u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_active, u.created_at,
            ARRAY_AGG(DISTINCT r.name) AS roles,
            ARRAY_AGG(DISTINCT p.slug) FILTER (WHERE p.slug IS NOT NULL) AS permissions
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          LEFT JOIN roles r ON ur.role_id = r.id
          LEFT JOIN role_permissions rp ON r.id = rp.role_id
          LEFT JOIN permissions p ON rp.permission_id = p.id
          WHERE u.email = $1 AND u.is_active = TRUE
          GROUP BY u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_active, u.created_at;
        `;
        const res = await pgPool.query(queryText, [email.toLowerCase().trim()]);
        if (res.rows.length > 0) {
          return res.rows[0] as User;
        }
      } catch (err) {
        // Fallback to in-memory store
      }
    }

    const found = IN_MEMORY_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.is_active
    );
    return found || null;
  }

  async findById(id: string): Promise<User | null> {
    if (getPostgresStatus().connected) {
      try {
        const queryText = `
          SELECT 
            u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_active, u.created_at,
            ARRAY_AGG(DISTINCT r.name) AS roles,
            ARRAY_AGG(DISTINCT p.slug) FILTER (WHERE p.slug IS NOT NULL) AS permissions
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          LEFT JOIN roles r ON ur.role_id = r.id
          LEFT JOIN role_permissions rp ON r.id = rp.role_id
          LEFT JOIN permissions p ON rp.permission_id = p.id
          WHERE u.id = $1 AND u.is_active = TRUE
          GROUP BY u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_active, u.created_at;
        `;
        const res = await pgPool.query(queryText, [id]);
        if (res.rows.length > 0) {
          return res.rows[0] as User;
        }
      } catch (err) {
        // Fallback
      }
    }

    const found = IN_MEMORY_USERS.find((u) => u.id === id && u.is_active);
    return found || null;
  }

  getAllDemoUsers(): User[] {
    return IN_MEMORY_USERS;
  }
}

export const userRepository = new UserRepository();
