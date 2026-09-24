// ==============================================================================
// OceanSense — Simulation Controller
// Demonstrates: Dynamic Simulation Speed & Multi-Scale Grid Orchestration
// ==============================================================================

import { Request, Response } from 'express';
import { simulationEngine } from '../simulation/engine.js';
import { wsServer } from '../websocket/server.js';
import { activeGridConfig } from './deployment.controller.js';

export class SimulationController {
  getStatus(req: Request, res: Response) {
    const kpis = simulationEngine.getAggregatedKPIs();
    return res.json({
      success: true,
      data: kpis,
    });
  }

  pause(req: Request, res: Response) {
    simulationEngine.pause();
    return res.json({ success: true, message: 'Simulation paused' });
  }

  resume(req: Request, res: Response) {
    simulationEngine.resume();
    return res.json({ success: true, message: 'Simulation resumed' });
  }

  setSpeed(req: Request, res: Response) {
    const speed = parseFloat(req.body.speed || '1.0');
    simulationEngine.setSpeed(speed);
    return res.json({ success: true, message: `Speed set to ${speed}x` });
  }

  setScale(req: Request, res: Response) {
    const count = parseInt(req.body.count || '1000', 10);
    simulationEngine.setScale(count);

    // Keep active grid config and node spacing in sync
    activeGridConfig.selectedScale = count;
    const side = Math.ceil(Math.sqrt(count));
    activeGridConfig.nodeSpacingM = count === 4 || count === 9 ? 3000 : Math.round(10000 / side);

    // Broadcast instant update across all connected WebSocket clients
    const kpis = simulationEngine.getAggregatedKPIs();
    wsServer.broadcast({
      type: 'KPI_TELEMETRY_TICK',
      timestamp: Date.now(),
      data: kpis,
    });
    wsServer.broadcast({
      type: 'GRID_CONFIG_UPDATED',
      timestamp: Date.now(),
      data: {
        config: activeGridConfig,
        totalNodes: count,
      },
    });

    return res.json({ success: true, message: `Grid scaled to ${count} nodes`, config: activeGridConfig, kpis });
  }

  triggerTamper(req: Request, res: Response) {
    const nodeId = req.body.nodeId || 'SN-0431';
    const result = simulationEngine.triggerTamper(nodeId);
    return res.json({
      success: true,
      message: `Tamper triggered on ${nodeId}`,
      data: result,
    });
  }

  resetTamper(req: Request, res: Response) {
    const nodeId = req.params.id || req.body.nodeId || 'SN-0431';
    const result = simulationEngine.resetNode(nodeId);
    return res.json({
      success: true,
      message: `Tamper alarm for ${nodeId} reset to nominal SECURE state`,
      data: result,
    });
  }
}

export const simulationController = new SimulationController();
