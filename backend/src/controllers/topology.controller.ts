import { Request, Response } from 'express';
import { simulationEngine } from '../simulation/engine.js';

export const traceAcousticRoute = async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const node = simulationEngine.getNode(nodeId);

    if (!node) {
      return res.status(404).json({ error: `Node ${nodeId} not found` });
    }

    // Determine gateway and intermediate acoustic relays based on zone
    const gatewayMapping: Record<string, { id: string; name: string; lat: number; lon: number }> = {
      'ZONE-A': { id: 'GW-BUOY-01', name: 'Gateway Buoy Alpha', lat: 10.225, lon: 80.125 },
      'ZONE-B': { id: 'GW-BUOY-02', name: 'Gateway Buoy Bravo', lat: 10.265, lon: 80.125 },
      'ZONE-C': { id: 'GW-BUOY-03', name: 'Gateway Buoy Charlie', lat: 10.225, lon: 80.165 },
      'ZONE-D': { id: 'GW-BUOY-04', name: 'Gateway Buoy Delta', lat: 10.265, lon: 80.165 },
    };

    const gw = gatewayMapping[node.zoneId] || gatewayMapping['ZONE-A'];

    // Multi-hop path calculation
    const hops = [
      {
        hopIndex: 1,
        sourceType: 'SEABED_SONAR_NODE',
        sourceId: node.id,
        targetType: 'INTERMEDIATE_ACOUSTIC_RELAY',
        targetId: `RELAY-${node.zoneId}-01`,
        transmissionMedium: 'UNDERWATER_ACOUSTIC',
        frequencyKhz: 26.5,
        latencyMs: +(180 + Math.random() * 40).toFixed(1),
        snrDb: node.snr_db,
        packetLossPct: +(0.5 + Math.random() * 1.5).toFixed(2),
        soundSpeedMs: 1512.4,
      },
      {
        hopIndex: 2,
        sourceType: 'INTERMEDIATE_ACOUSTIC_RELAY',
        sourceId: `RELAY-${node.zoneId}-01`,
        targetType: 'SURFACE_GATEWAY_BUOY',
        targetId: gw.id,
        transmissionMedium: 'ACOUSTIC_VERTICAL_COLUMN',
        frequencyKhz: 32.0,
        latencyMs: +(210 + Math.random() * 30).toFixed(1),
        snrDb: +(node.snr_db - 3.2).toFixed(1),
        packetLossPct: +(0.8 + Math.random() * 1.2).toFixed(2),
        soundSpeedMs: 1528.1,
      },
      {
        hopIndex: 3,
        sourceType: 'SURFACE_GATEWAY_BUOY',
        sourceId: gw.id,
        targetType: 'SHORE_LAND_GATEWAY',
        targetId: 'LAND-TERMINAL-01',
        transmissionMedium: 'ARMORED_SUBSEA_FIBER_CABLE',
        frequencyKhz: 0,
        latencyMs: 14.2,
        snrDb: 48.0,
        packetLossPct: 0.01,
        soundSpeedMs: 200000000, // Speed of light in fiber
      }
    ];

    const totalLatency = hops.reduce((acc, h) => acc + h.latencyMs, 0);

    res.json({
      status: 'SUCCESS',
      queryNodeId: nodeId,
      originZone: node.zoneId,
      gateway: gw,
      totalHops: hops.length,
      cumulativeLatencyMs: +totalLatency.toFixed(1),
      transmissionMode: 'HYBRID_ACOUSTIC_CABLED',
      hops,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMeshSummary = async (req: Request, res: Response) => {
  try {
    const kpis = simulationEngine.getAggregatedKPIs();
    res.json({
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      activeNodes: kpis.activeNodes,
      averageSnrDb: kpis.avgSnrDb,
      networkEfficiencyPct: 98.4,
      acousticCarriers: [
        { band: 'LF-Acoustic (12-18 kHz)', rangeKm: 8.5, bitRateBps: 2400, purpose: 'Long-Range Deep Telemetry' },
        { band: 'MF-Acoustic (24-36 kHz)', rangeKm: 3.2, bitRateBps: 9600, purpose: 'Standard Node Mesh Grid' },
        { band: 'HF-Optical/Acoustic (50-80 kHz)', rangeKm: 0.8, bitRateBps: 64000, purpose: 'High-Density Cluster Uplink' }
      ],
      gateways: [
        { id: 'GW-BUOY-01', zone: 'ZONE-A', status: 'ONLINE', connectedNodes: 248, packetRateHz: 12.4 },
        { id: 'GW-BUOY-02', zone: 'ZONE-B', status: 'ONLINE', connectedNodes: 242, packetRateHz: 11.9 },
        { id: 'GW-BUOY-03', zone: 'ZONE-C', status: 'ONLINE', connectedNodes: 255, packetRateHz: 13.1 },
        { id: 'GW-BUOY-04', zone: 'ZONE-D', status: 'ONLINE', connectedNodes: 245, packetRateHz: 12.8 },
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
