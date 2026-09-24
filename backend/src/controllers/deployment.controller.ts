import { Request, Response } from 'express';
import { simulationEngine } from '../simulation/engine.js';
import { wsServer } from '../websocket/server.js';

export const calculateGridPlan = async (req: Request, res: Response) => {
  try {
    const { sectorWidthKm = 10, sectorHeightKm = 10, nodeSpacingM = 316, transducerRangeM = 600 } = req.body;

    const widthM = sectorWidthKm * 1000;
    const heightM = sectorHeightKm * 1000;
    const cols = Math.max(1, Math.floor(widthM / nodeSpacingM));
    const rows = Math.max(1, Math.floor(heightM / nodeSpacingM));
    const recommendedNodes = cols * rows;

    // Hemispherical acoustic coverage area on the ocean floor and water column:
    // 360° horizontal azimuth x 180° downward vertical hemisphere
    const nodeCoverageAreaM2 = Math.PI * transducerRangeM * transducerRangeM;
    const totalSectorAreaM2 = widthM * heightM;
    const theoreticalOverlapFactor = (recommendedNodes * nodeCoverageAreaM2) / totalSectorAreaM2;

    res.json({
      status: 'SUCCESS',
      architecture: 'ANCHORED_SURFACE_BUOY_ARRAY',
      sectorAreaKm2: sectorWidthKm * sectorHeightKm,
      nodeSpacingMeters: nodeSpacingM,
      transducerRangeMeters: transducerRangeM,
      mooringDepthMeters: 300,
      transducerDepthMeters: 10,
      beamAperture: {
        horizontalDeg: 360,
        verticalDeg: 180,
        pattern: 'DOWNWARD_HEMISPHERE',
      },
      recommendedGrid: {
        columns: cols,
        rows: rows,
        totalNodes: recommendedNodes,
        acousticOverlapFactor: +theoreticalOverlapFactor.toFixed(2),
        estimatedBlindSpotPct: theoreticalOverlapFactor > 1.2 ? 0.2 : +(Math.max(0.1, (2.0 - theoreticalOverlapFactor) * 4.5)).toFixed(1),
        zonesDistribution: {
          'ZONE-A': Math.round(recommendedNodes / 4),
          'ZONE-B': Math.round(recommendedNodes / 4),
          'ZONE-C': Math.round(recommendedNodes / 4),
          'ZONE-D': Math.round(recommendedNodes / 4),
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export let activeGridConfig = {
  gridType: 'ANCHORED_SURFACE_BUOY_ARRAY',
  nodeSpacingM: 316,
  transducerRangeM: 600,
  mooringDepthM: 300,
  transducerDepthM: 10,
  horizontalBeamDeg: 360,
  verticalBeamDeg: 180,
  selectedScale: 1000,
};

export const getGridConfig = async (req: Request, res: Response) => {
  res.json({
    status: 'SUCCESS',
    config: activeGridConfig,
  });
};

export const saveGridConfig = async (req: Request, res: Response) => {
  try {
    const { nodeSpacingM, transducerRangeM, selectedScale } = req.body;
    if (nodeSpacingM) activeGridConfig.nodeSpacingM = Number(nodeSpacingM);
    if (transducerRangeM) activeGridConfig.transducerRangeM = Number(transducerRangeM);
    if (selectedScale) {
      activeGridConfig.selectedScale = Number(selectedScale);
      simulationEngine.setScale(Number(selectedScale));
    }

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
        totalNodes: activeGridConfig.selectedScale,
      },
    });

    res.json({
      status: 'SUCCESS',
      message: 'Anchored Buoy Grid configuration persisted and deployed successfully',
      config: activeGridConfig,
      kpis,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const applyGridScale = async (req: Request, res: Response) => {
  try {
    const { count } = req.body;
    const nodeCount = parseInt(count);
    if (isNaN(nodeCount) || nodeCount < 4 || nodeCount > 100000) {
      return res.status(400).json({ error: 'Node count must be between 4 and 100,000' });
    }

    activeGridConfig.selectedScale = nodeCount;
    // Auto-adjust spacing to approximate the node count
    const side = Math.ceil(Math.sqrt(nodeCount));
    activeGridConfig.nodeSpacingM = Math.min(5000, Math.round(10000 / side));

    simulationEngine.setScale(nodeCount);

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
        totalNodes: nodeCount,
      },
    });

    res.json({
      status: 'SUCCESS',
      message: `Anchored Buoy Grid scaled to ${nodeCount} active nodes in 10x10 km sector`,
      config: activeGridConfig,
      kpis,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
