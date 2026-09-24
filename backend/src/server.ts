import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { ENV } from './config/env.js';
import { initDatabaseConnection, getPostgresStatus, getDatabaseTables } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import nodeRoutes from './routes/node.routes.js';
import zoneRoutes from './routes/zone.routes.js';
import simulationRoutes from './routes/simulation.routes.js';
import fishRoutes from './routes/fish.routes.js';
import auvRoutes from './routes/auv.routes.js';
import topologyRoutes from './routes/topology.routes.js';
import deploymentRoutes from './routes/deployment.routes.js';
import chargingRoutes from './routes/charging.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import aiRoutes from './routes/ai.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';

const app = express();
const server = http.createServer(app);

// Security & Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/fish-schools', fishRoutes);
app.use('/api/auvs', auvRoutes);
app.use('/api/topology', topologyRoutes);
app.use('/api/deployment', deploymentRoutes);
app.use('/api/charging', chargingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Database Tables Inspection Endpoint
app.get('/api/database/tables', async (req: Request, res: Response) => {
  try {
    const status = getPostgresStatus();
    if (!status.connected) {
      return res.status(503).json({
        success: false,
        message: 'PostgreSQL database is currently not connected.',
        database_status: status
      });
    }
    const tables = await getDatabaseTables();
    return res.json({
      success: true,
      database: 'oceansense_db',
      total_tables: tables.length,
      tables
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Observability & Health Endpoint (Week 11 Production Readiness)
app.get('/health', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'HEALTHY',
    service: 'OceanSense Core Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    database: getPostgresStatus(),
    simulation: {
      active_nodes_target: ENV.SIMULATION_DEFAULT_NODES,
      area_km2: ENV.SIMULATION_AREA_KM * ENV.SIMULATION_AREA_KM,
      tick_rate_hz: ENV.SIMULATION_TICK_HZ,
      mode: 'SIMULATED_DIGITAL_TWIN',
    },
    memory: {
      rss_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
    }
  });
});

// Root metadata endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'OceanSense Underwater Sonar Digital Twin API',
    description: 'Maritime telemetry, acoustic mesh simulation, anti-theft security and ocean intelligence platform',
    documentation: '/docs',
    health: '/health',
    status: 'OPERATIONAL'
  });
});

import { wsServer } from './websocket/server.js';
import { sonarRawDataService } from './services/sonarRawData.service.js';

// Initialize server
async function startServer() {
  await initDatabaseConnection();
  wsServer.initialize(server);
  sonarRawDataService.startLivePingGenerator();
  server.listen(ENV.PORT, () => {
    console.log(`=======================================================`);
    console.log(`  OCEANSENSE COMMAND BACKEND INITIALIZED`);
    console.log(`  Port: ${ENV.PORT} | Environment: ${ENV.NODE_ENV}`);
    console.log(`  Health Check: http://localhost:${ENV.PORT}/health`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal] Backend failed to start:', err);
  process.exit(1);
});

export { app, server };
