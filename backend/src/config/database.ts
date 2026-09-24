import pg from 'pg';
import { ENV } from './env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool, Client } = pg;

export let pgPool = new Pool({
  connectionString: ENV.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3500,
});

let isPostgresConnected = false;

async function runMigrationsIfPending(client: pg.PoolClient) {
  try {
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'sonar_nodes';
    `);

    if (tableCheck.rows.length === 0) {
      console.log('[Database] Database tables not found. Applying migrations and initial seed data...');
      
      const candidatePaths = [
        path.resolve(process.cwd(), 'database'),
        path.resolve(process.cwd(), '../database'),
        path.resolve(__dirname, '../../../database')
      ];
      
      let baseDbDir = candidatePaths.find(p => fs.existsSync(p));
      if (!baseDbDir) {
        console.warn('[Database] Could not locate database/ directory for migrations.');
        return;
      }

      const files = [
        path.join(baseDbDir, 'migrations', '001_initial_schema.sql'),
        path.join(baseDbDir, 'migrations', '002_indexes_and_performance.sql'),
        path.join(baseDbDir, 'migrations', '003_views_and_procedures.sql'),
        path.join(baseDbDir, 'migrations', '004_triggers_and_audit.sql'),
        path.join(baseDbDir, 'seeds', 'seed_initial_data.sql')
      ];

      for (const file of files) {
        if (fs.existsSync(file)) {
          const sql = fs.readFileSync(file, 'utf8');
          await client.query(sql);
          console.log(`[Database] Executed migration: ${path.basename(file)}`);
        }
      }
      console.log('[Database] All migrations & seed data applied successfully!');
    } else {
      console.log('[Database] Schema already initialized (table sonar_nodes verified).');
    }
  } catch (migErr: any) {
    console.warn(`[Database] Migration notice: ${migErr.message}`);
  }
}

export async function initDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pgPool.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`[Database] PostgreSQL Connected successfully. Server time: ${res.rows[0].now}`);
    await runMigrationsIfPending(client);
    client.release();
    isPostgresConnected = true;
    return true;
  } catch (err: any) {
    // If database does not exist (error 3D000), try auto-creating it on postgres maintenance DB
    if (err?.code === '3D000') {
      try {
        console.log(`[Database] Database 'oceansense_db' does not exist yet. Attempting auto-creation on postgres server...`);
        const maintenanceUrl = ENV.DATABASE_URL.replace(/\/oceansense_db(\?.*)?$/, '/postgres$1');
        const maintenanceClient = new Client({ connectionString: maintenanceUrl, connectionTimeoutMillis: 3000 });
        await maintenanceClient.connect();
        await maintenanceClient.query('CREATE DATABASE oceansense_db;');
        await maintenanceClient.end();
        console.log(`[Database] 'oceansense_db' database created successfully! Reconnecting...`);

        // Reconnect pool
        pgPool = new Pool({
          connectionString: ENV.DATABASE_URL,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 3500,
        });
        const client = await pgPool.connect();
        await runMigrationsIfPending(client);
        client.release();
        isPostgresConnected = true;
        console.log(`[Database] PostgreSQL 'oceansense_db' Connected successfully!`);
        return true;
      } catch (createErr: any) {
        console.warn(`[Database] Could not auto-create database: ${createErr.message}`);
      }
    }

    isPostgresConnected = false;
    console.warn(`[Database] PostgreSQL not currently reachable at ${ENV.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}. Reason: ${err?.message}. Using high-performance in-memory simulation repository fallback.`);
    return false;
  }
}

export function getPostgresStatus(): { connected: boolean; url: string } {
  return {
    connected: isPostgresConnected,
    url: ENV.DATABASE_URL.replace(/:[^:@]+@/, ':****@'),
  };
}

export async function getDatabaseTables(): Promise<Array<{ table_name: string; row_count: number }>> {
  if (!isPostgresConnected) {
    return [];
  }
  const client = await pgPool.connect();
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    const tables: Array<{ table_name: string; row_count: number }> = [];
    for (const row of res.rows) {
      try {
        const countRes = await client.query(`SELECT COUNT(*)::int as count FROM "${row.table_name}";`);
        tables.push({
          table_name: row.table_name,
          row_count: countRes.rows[0].count
        });
      } catch {
        tables.push({
          table_name: row.table_name,
          row_count: -1
        });
      }
    }
    return tables;
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]) {
  if (!isPostgresConnected) {
    throw new Error('PostgreSQL is not connected');
  }
  return pgPool.query(text, params);
}
