// ==============================================================================
// OceanSense — Node Controller
// Demonstrates: Week 6 RBAC Data Filtering & Week 10 Pagination
// ==============================================================================

import { Request, Response } from 'express';
import { simulationEngine } from '../simulation/engine.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sonarRawDataService } from '../services/sonarRawData.service.js';

export class NodeController {
  // GET /api/nodes
  getNodes(req: AuthenticatedRequest, res: Response) {
    const isSubscriber = req.user?.roles.includes('SUBSCRIBER');
    if (isSubscriber) {
      return res.status(403).json({
        error: 'RESTRICTED_ACCESS',
        message: 'Subscribers are restricted from viewing internal sonar node infrastructure.',
      });
    }

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '50', 10);
    const zoneId = req.query.zoneId as string;
    const status = req.query.status as string;
    const minBattery = req.query.minBattery ? parseFloat(req.query.minBattery as string) : undefined;
    const maxBattery = req.query.maxBattery ? parseFloat(req.query.maxBattery as string) : undefined;

    const result = simulationEngine.getAllNodes(page, limit, {
      zoneId,
      status,
      minBattery,
      maxBattery,
    });

    return res.json({
      success: true,
      data: result,
    });
  }

  // GET /api/nodes/instances-3d (High-Speed Compact 3D Viewport Payload)
  get3DInstances(req: Request, res: Response) {
    const nodes = simulationEngine.getCompact3DInstances();
    return res.json({
      success: true,
      count: nodes.length,
      data: nodes,
    });
  }

  // GET /api/nodes/kpis
  getKPIs(req: Request, res: Response) {
    const kpis = simulationEngine.getAggregatedKPIs();
    return res.json({
      success: true,
      data: kpis,
    });
  }

  // GET /api/nodes/:id
  getNodeById(req: AuthenticatedRequest, res: Response) {
    const isSubscriber = req.user?.roles.includes('SUBSCRIBER');
    if (isSubscriber) {
      return res.status(403).json({
        error: 'RESTRICTED_ACCESS',
        message: 'Subscribers are restricted from viewing internal node telemetry.',
      });
    }

    const { id } = req.params;
    const node = simulationEngine.getNode(id);
    if (!node) {
      return res.status(404).json({ error: 'NOT_FOUND', message: `Node ${id} not found` });
    }

    return res.json({
      success: true,
      data: node,
    });
  }

  // PATCH /api/nodes/:id/tamper (Simulate Tamper / Theft scenario)
  triggerTamper(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const updated = simulationEngine.triggerTamper(id);
    if (!updated) {
      return res.status(404).json({ error: 'NOT_FOUND', message: `Node ${id} not found` });
    }

    return res.json({
      success: true,
      message: `Tamper alert generated on node ${id}`,
      data: updated,
    });
  }

  // POST /api/nodes/:id/reset
  resetNode(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const updated = simulationEngine.resetNode(id);
    if (!updated) {
      return res.status(404).json({ error: 'NOT_FOUND', message: `Node ${id} not found` });
    }

    return res.json({
      success: true,
      message: `Node ${id} reset to nominal active state`,
      data: updated,
    });
  }

  // GET /api/nodes/:id/raw-sonar
  getRawSonarStream(req: Request, res: Response) {
    const { id } = req.params;
    const history = sonarRawDataService.getRecentPings(id);
    const latest = sonarRawDataService.getLatestPing(id);
    return res.json({
      success: true,
      nodeId: id,
      latest,
      historyCount: history.length,
      history,
    });
  }

  // POST /api/nodes/:id/ingest-raw-sonar
  ingestRawSonarPing(req: Request, res: Response) {
    const { id } = req.params;
    const pingData = req.body;
    const ingested = sonarRawDataService.ingestExternalPing(id, pingData);
    return res.json({
      success: true,
      message: `Raw sonar packet ingested for node ${id}`,
      data: ingested,
    });
  }
}

export const nodeController = new NodeController();
