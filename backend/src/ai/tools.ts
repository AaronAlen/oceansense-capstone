// ==============================================================================
// OceanSense — Maritime Operations AI Assistant Tools Catalog
// Demonstrates: Week 7 & 15 Function Calling & Multi-Step Maritime Tool Execution
// ==============================================================================

import { simulationEngine } from '../simulation/engine.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
  execute: (args: any) => Promise<any> | any;
}

export const MARITIME_TOOLS: Record<string, ToolDefinition> = {
  get_node_telemetry: {
    name: 'get_node_telemetry',
    description: 'Retrieve complete physical, acoustic and battery telemetry for a specific sonar node ID (e.g. SN-0431).',
    parameters: {
      type: 'object',
      properties: {
        nodeId: { type: 'string', description: 'The sonar node identifier, e.g. SN-0431' },
      },
      required: ['nodeId'],
    },
    execute: (args) => {
      const node = simulationEngine.getNode(args.nodeId);
      if (!node) return { error: `Sonar node ${args.nodeId} not found` };
      return {
        id: node.id,
        zone: node.zoneId,
        status: node.status,
        battery_pct: node.battery_level,
        tamper_status: node.tamper_status,
        tilt_angle_deg: node.tilt_angle_deg,
        depth_m: node.depth_m,
        hydrostatic_pressure_bar: node.hydrostatic_pressure_bar,
        snr_db: node.snr_db,
        water_temp_c: node.water_temp_c,
      };
    },
  },

  trigger_node_tamper_test: {
    name: 'trigger_node_tamper_test',
    description: 'Inject a simulated physical tilt/acceleration tamper event on a node to test security alerts and AUV response.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: { type: 'string', description: 'Node ID to tamper, e.g. SN-0431' },
      },
      required: ['nodeId'],
    },
    execute: (args) => {
      const res = simulationEngine.triggerTamper(args.nodeId || 'SN-0431');
      return {
        success: true,
        message: `Tamper alert injected on ${args.nodeId}. Intercept drone dispatched automatically.`,
        details: res,
      };
    },
  },

  reset_node_tamper_alarm: {
    name: 'reset_node_tamper_alarm',
    description: 'Reset a node after tamper inspection back to SECURE nominal status.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: { type: 'string', description: 'Node ID to reset' },
      },
      required: ['nodeId'],
    },
    execute: (args) => {
      const res = simulationEngine.resetNode(args.nodeId);
      return {
        success: true,
        message: `Node ${args.nodeId} reset to nominal SECURE status.`,
        node: res,
      };
    },
  },

  get_zone_health_summary: {
    name: 'get_zone_health_summary',
    description: 'Get total aggregate node counts, battery averages, and health percentages across the 10x10 km sector.',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: () => {
      return simulationEngine.getAggregatedKPIs();
    },
  },

  dispatch_auv_to_coordinates: {
    name: 'dispatch_auv_to_coordinates',
    description: 'Deploy an Autonomous Underwater Vehicle (AUV-01 to AUV-04) to specific sector latitude, longitude, and depth coordinates.',
    parameters: {
      type: 'object',
      properties: {
        auvId: { type: 'string', description: 'AUV ID (e.g. AUV-01)' },
        latitude: { type: 'number', description: 'Target latitude' },
        longitude: { type: 'number', description: 'Target longitude' },
        depth_m: { type: 'number', description: 'Target depth in meters' },
        targetId: { type: 'string', description: 'Target node or mission identifier' },
      },
      required: ['auvId', 'latitude', 'longitude'],
    },
    execute: (args) => {
      const res = simulationEngine.dispatchAUV(
        args.auvId,
        args.latitude,
        args.longitude,
        args.depth_m || 100,
        args.targetId || 'OPS_VECTOR'
      );
      return res ? { success: true, auv: res } : { error: `AUV ${args.auvId} not found` };
    },
  },

  return_auv_to_dock: {
    name: 'return_auv_to_dock',
    description: 'Command an AUV to terminate current mission and return to its home inductive charging dock.',
    parameters: {
      type: 'object',
      properties: {
        auvId: { type: 'string', description: 'AUV ID (e.g. AUV-01)' },
      },
      required: ['auvId'],
    },
    execute: (args) => {
      const res = simulationEngine.returnAUVToDock(args.auvId);
      return res ? { success: true, auv: res } : { error: `AUV ${args.auvId} not found` };
    },
  },

  get_fish_school_intelligence: {
    name: 'get_fish_school_intelligence',
    description: 'Retrieve real-time fish school tracking vectors, biomass estimates in metric tons, and sonar multi-laterating nodes.',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: () => {
      return {
        activeSchools: simulationEngine.getFishSchools(),
        recentDetections: simulationEngine.getFishDetections().slice(0, 10),
      };
    },
  },

  get_battery_critical_nodes: {
    name: 'get_battery_critical_nodes',
    description: 'List all nodes currently below 15% battery level requiring maintenance or benthic recharging.',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: () => {
      const res = simulationEngine.getAllNodes(1, 20, { maxBattery: 20 });
      return {
        criticalCount: res.total,
        nodes: res.items.map(n => ({ id: n.id, zone: n.zoneId, battery: n.battery_level, status: n.status })),
      };
    },
  },

  query_security_incidents: {
    name: 'query_security_incidents',
    description: 'List all active physical tamper and anti-theft security incidents in the ocean sector.',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: () => {
      const auvs = simulationEngine.getAUVs();
      const node = simulationEngine.getNode('SN-0431');
      if (node && node.tamper_status !== 'SECURE') {
        const drone = auvs.find(a => a.target?.targetId === 'SN-0431');
        return [
          {
            incidentId: 'INC-2026-0431',
            nodeId: 'SN-0431',
            status: drone?.status === 'INVESTIGATING_TAMPER' ? 'CONFIRMED_THEFT' : 'THEFT_SUSPECTED',
            tiltDeg: node.tilt_angle_deg,
            assignedAUV: drone?.id || 'AUV-01',
            opticalEvidenceReady: drone?.status === 'INVESTIGATING_TAMPER',
          }
        ];
      }
      return [];
    },
  },
};
