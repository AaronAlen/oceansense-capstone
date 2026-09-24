import { Request, Response } from 'express';
import { simulationEngine } from '../simulation/engine.js';

export const getAUVs = async (req: Request, res: Response) => {
  try {
    const auvs = simulationEngine.getAUVs();
    res.json({
      status: 'SUCCESS',
      count: auvs.length,
      timestamp: new Date().toISOString(),
      auvs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAUVById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const auv = simulationEngine.getAUV(id);
    if (!auv) {
      return res.status(404).json({ error: `AUV ${id} not found` });
    }
    res.json({ status: 'SUCCESS', auv });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const dispatchAUV = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetLat, targetLon, targetDepth, targetId } = req.body;

    if (!targetLat || !targetLon) {
      return res.status(400).json({ error: 'targetLat and targetLon are required' });
    }

    const auv = simulationEngine.dispatchAUV(
      id,
      parseFloat(targetLat),
      parseFloat(targetLon),
      targetDepth ? parseFloat(targetDepth) : 100.0,
      targetId || 'OPERATIONAL_TARGET'
    );

    if (!auv) {
      return res.status(404).json({ error: `AUV ${id} not found` });
    }

    res.json({
      status: 'SUCCESS',
      message: `AUV ${id} dispatched to (${targetLat}, ${targetLon})`,
      auv,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const returnAUVToDock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const auv = simulationEngine.returnAUVToDock(id);
    if (!auv) {
      return res.status(404).json({ error: `AUV ${id} not found` });
    }
    res.json({
      status: 'SUCCESS',
      message: `AUV ${id} ordered to return to dock ${auv.dockId}`,
      auv,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSecurityIncidents = async (req: Request, res: Response) => {
  try {
    const auvs = simulationEngine.getAUVs();
    const tamperedNode = simulationEngine.getNode('SN-0431');

    const incidents = [];
    if (tamperedNode && tamperedNode.tamper_status !== 'SECURE') {
      const investigatingAUV = auvs.find(a => a.target?.targetId === 'SN-0431' || a.lastInspection?.targetId === 'SN-0431');
      incidents.push({
        id: 'INC-2026-0431',
        nodeId: 'SN-0431',
        zoneId: 'ZONE-A',
        severity: 'CRITICAL',
        status: investigatingAUV?.status === 'INVESTIGATING_TAMPER' ? 'CONFIRMED_THEFT' : 'THEFT_SUSPECTED',
        tiltAngleDeg: tamperedNode.tilt_angle_deg,
        accelerometerDisplacementG: 2.85,
        reportedAt: '2026-09-22T04:45:00.000Z',
        assignedDroneId: investigatingAUV?.id || 'AUV-01',
        inspectionDetails: investigatingAUV?.lastInspection || {
          summary: 'High acceleration transient and angular tilt deviation > 45° detected. Intercept drone deployed.',
        }
      });
    }

    res.json({
      status: 'SUCCESS',
      count: incidents.length,
      incidents,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
