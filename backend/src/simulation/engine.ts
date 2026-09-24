// ==============================================================================
// OceanSense — Master Simulation Engine
// Demonstrates: Scalable Multi-Node Digital Twin State Machine
// ==============================================================================

import { SonarNodeSimulator, SonarNodeState, NodeStatus } from './nodeSimulator.js';
import { fishEngine, FishSchool, SonarDetectionRecord } from './fishSimulator.js';
import { auvEngine, AUVState } from './auvSimulator.js';
import { notificationService } from '../services/notification.service.js';

export interface SimulationConfig {
  nodeCount: number;
  speedMultiplier: number;
  isRunning: boolean;
  sectorAreaKm2: number;
}

export class SimulationEngine {
  private nodes: Map<string, SonarNodeSimulator> = new Map();
  private config: SimulationConfig = {
    nodeCount: 4,
    speedMultiplier: 1.0,
    isRunning: true,
    sectorAreaKm2: 100,
  };
  private loopInterval: NodeJS.Timeout | null = null;
  private lastTickTime: number = Date.now();
  private deltaQueue: Partial<SonarNodeState>[] = [];

  constructor() {
    this.initializeGrid(4);
    this.start();
  }

  // 1. Programmatically Generate Nodes across 2D Grid (4 nodes with 3 km spacing across 10x10 km sector)
  initializeGrid(count: number = 4) {
    this.nodes.clear();
    this.config.nodeCount = count;
    const sideX = Math.max(2, Math.round(Math.sqrt(count)));
    const sideZ = Math.max(2, Math.ceil(count / sideX));

    // Calibrated seabed depths strictly under 300m for 4-node ocean network
    const calibratedDepths = [260.0, 262.0, 258.0, 264.0];

    for (let i = 1; i <= count; i++) {
      const id = `SN-${String(i).padStart(4, '0')}`;
      const col = (i - 1) % sideX;
      const row = Math.floor((i - 1) / sideX);

      // Clean 2D grid distribution centered with 3 km spacing across 10x10 km sector [Lat 10.200 to 10.290, Lon 80.100 to 80.190]
      const lat = +(10.200000 + ((row + 0.5) / sideZ) * 0.090).toFixed(6);
      const lon = +(80.100000 + ((col + 0.5) / sideX) * 0.090).toFixed(6);

      // Determine Zone and Gateway
      let zoneId = `ZONE-${String.fromCharCode(65 + ((i - 1) % 4))}`;
      let gatewayId = `GW-00${((i - 1) % 4) + 1}`;
      let depth_m = calibratedDepths[(i - 1) % calibratedDepths.length];

      let status: NodeStatus = 'ACTIVE';
      let battery_level = +(65.0 + Math.abs(Math.sin(i * 9.99)) * 34.0).toFixed(2);
      let power_source: any = 'PRIMARY_BATTERY';
      let charging_status: any = 'DISCHARGING';
      let tamper_status: any = 'SECURE';
      let tilt_angle_deg = +(Math.abs(Math.sin(i * 5.55)) * 3.5).toFixed(2);
      let health_score = +(92.0 + Math.abs(Math.cos(i * 8.88)) * 7.5).toFixed(2);

      // Node SN-0431: Capstone Scenario Pre-configured Tamper Target
      if (id === 'SN-0431') {
        status = 'THEFT_SUSPECTED';
        tamper_status = 'ALERT_ACTIVE';
        battery_level = 18.0;
        tilt_angle_deg = 44.5;
        depth_m = 142.0;
        health_score = 35.0;
      } else if (i === 45 || i === 112 || i === 532) {
        status = 'POWER_CRITICAL';
        battery_level = 13.5;
      } else if (i === 78 || i === 234 || i === 671) {
        power_source = 'BENTHIC_MICROBIAL';
        charging_status = 'TRICKLE_HARVESTING';
        battery_level = 88.0;
      } else if (i === 301) {
        status = 'OFFLINE';
        health_score = 40.0;
      }

      const initialNode: SonarNodeState = {
        id,
        zoneId,
        gatewayId,
        latitude: lat,
        longitude: lon,
        depth_m,
        installation_depth_m: depth_m,
        status,
        battery_level,
        battery_health: 98.0,
        charging_status: power_source === 'SOLAR_SURFACE_BUOY' ? 'TRICKLE_HARVESTING' : charging_status,
        power_source: power_source === 'PRIMARY_BATTERY' ? 'SOLAR_SURFACE_BUOY' : power_source,
        tilt_angle_deg,
        movement_detected: tamper_status !== 'SECURE',
        tamper_status,
        firmware_version: 'v3.4.1-rc2',
        health_score,
        node_type: 'ANCHORED_SURFACE_BUOY',
        mooring_depth_m: depth_m,
        transducer_depth_m: 10.0,
        horizontal_beam_deg: 360,
        vertical_beam_deg: 180,
        solar_charging: true,
        satellite_uplink: true,
        water_temp_c: 12.4,
        hydrostatic_pressure_bar: +(1.0 + depth_m / 10.0).toFixed(2),
        ambient_noise_db: 52.0,
        signal_strength_db: 74.5,
        snr_db: 22.5,
        fish_detection_count: 0,
        last_ping_at: new Date().toISOString(),
      };

      this.nodes.set(id, new SonarNodeSimulator(initialNode));
    }

    console.log(`[Simulation] Grid initialized with ${this.nodes.size} anchored surface buoy sonar nodes.`);
  }

  // 2. Continuous 60Hz Physics & Kinetics Loop
  start() {
    if (this.loopInterval) return;
    this.config.isRunning = true;
    this.lastTickTime = Date.now();

    this.loopInterval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - this.lastTickTime) / 1000.0;
      this.lastTickTime = now;

      if (!this.config.isRunning) return;

      const activeNodesList: { id: string; latitude: number; longitude: number; depth_m: number }[] = [];

      this.nodes.forEach((sim) => {
        const oldStatus = sim.node.status;
        const oldBattery = Math.floor(sim.node.battery_level);

        sim.tick(deltaSeconds, this.config.speedMultiplier);

        if (sim.node.status === 'ACTIVE' || sim.node.status === 'POWER_CONSERVING') {
          activeNodesList.push({
            id: sim.node.id,
            latitude: sim.node.latitude,
            longitude: sim.node.longitude,
            depth_m: sim.node.depth_m,
          });
        }

        // Track state deltas for WebSocket batching
        if (oldStatus !== sim.node.status || oldBattery !== Math.floor(sim.node.battery_level)) {
          this.deltaQueue.push({
            id: sim.node.id,
            status: sim.node.status,
            battery_level: +sim.node.battery_level.toFixed(1),
            snr_db: sim.node.snr_db,
            tamper_status: sim.node.tamper_status,
          });
        }
      });

      // Advance Fish Schools & Acoustic Triangulation
      fishEngine.tick(deltaSeconds, this.config.speedMultiplier, activeNodesList);

      // Advance Autonomous Drone Robotics & Intercept Kinematics
      auvEngine.tick(deltaSeconds, this.config.speedMultiplier);
    }, 100); // 10Hz batch tick for efficient CPU usage on laptops
  }

  pause() {
    this.config.isRunning = false;
  }

  resume() {
    this.config.isRunning = true;
    this.lastTickTime = Date.now();
  }

  setSpeed(multiplier: number) {
    this.config.speedMultiplier = Math.max(0.1, Math.min(10.0, multiplier));
  }

  setScale(count: number) {
    this.initializeGrid(count);
  }

  triggerTamper(nodeId?: string) {
    const targetId = (nodeId && this.nodes.has(nodeId)) ? nodeId : Array.from(this.nodes.keys())[0] || 'SN-0001';
    const sim = this.nodes.get(targetId);
    if (sim) {
      sim.triggerTamperEvent();
      this.deltaQueue.push({
        id: sim.node.id,
        status: sim.node.status,
        tamper_status: sim.node.tamper_status,
        tilt_angle_deg: sim.node.tilt_angle_deg,
        latitude: sim.node.latitude,
        longitude: sim.node.longitude,
      });
      console.log(`[Security Alert] TAMPER TRIGGERED on Node ${targetId}. Auto-dispatching security telemetry!`);

      // Dispatch live Twilio SMS and Brevo/Email security alerts
      notificationService.dispatchTamperSecurityAlert({
        nodeId: sim.node.id,
        tiltAngleDeg: sim.node.tilt_angle_deg,
        latitude: sim.node.latitude,
        longitude: sim.node.longitude,
        depthM: sim.node.depth_m,
        timestamp: new Date().toISOString(),
        alertType: 'TAMPER_CRITICAL',
      }).catch(err => console.error('[Notification:Tamper] Dispatch error:', err));

      return {
        node: sim.node,
      };
    }
    return null;
  }

  resetNode(nodeId?: string) {
    const targetId = (nodeId && this.nodes.has(nodeId)) ? nodeId : Array.from(this.nodes.keys())[0] || 'SN-0001';
    const sim = this.nodes.get(targetId);
    if (sim) {
      sim.resetToNominal();
      this.deltaQueue.push({
        id: sim.node.id,
        status: sim.node.status,
        tamper_status: sim.node.tamper_status,
        tilt_angle_deg: sim.node.tilt_angle_deg,
        latitude: sim.node.latitude,
        longitude: sim.node.longitude,
      });
      return sim.node;
    }
    return null;
  }

  // AUV and Fish Engine Accessors
  getFishSchools(): FishSchool[] {
    return fishEngine.getSchools();
  }

  getFishDetections(): SonarDetectionRecord[] {
    return fishEngine.getRecentDetections();
  }

  getAUVs(): AUVState[] {
    return auvEngine.getAUVs();
  }

  getAUV(id: string): AUVState | null {
    return auvEngine.getAUV(id);
  }

  dispatchAUV(auvId: string, targetLat: number, targetLon: number, targetDepth: number, targetId: string): AUVState | null {
    return auvEngine.dispatchAUV(auvId, {
      targetId,
      latitude: targetLat,
      longitude: targetLon,
      depth_m: targetDepth,
    });
  }

  returnAUVToDock(auvId: string): AUVState | null {
    return auvEngine.returnToDock(auvId);
  }

  // 3. Telemetry Queries & KPIs
  getNode(id: string): SonarNodeState | null {
    const sim = this.nodes.get(id);
    return sim ? sim.node : null;
  }

  getAllNodes(page: number = 1, limit: number = 100, filters?: { zoneId?: string; status?: string; minBattery?: number; maxBattery?: number }) {
    let list = Array.from(this.nodes.values()).map((s) => s.node);

    if (filters?.zoneId) {
      list = list.filter((n) => n.zoneId === filters.zoneId);
    }
    if (filters?.status) {
      list = list.filter((n) => n.status === filters.status);
    }
    if (filters?.minBattery !== undefined) {
      list = list.filter((n) => n.battery_level >= filters.minBattery!);
    }
    if (filters?.maxBattery !== undefined) {
      list = list.filter((n) => n.battery_level <= filters.maxBattery!);
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Fast direct 3D vertex buffer extraction (Instant 1,000 - 100,000 node coordinates for Three.js)
  getCompact3DInstances() {
    const buffer = new Float32Array(this.nodes.size * 5); // [x, y, z, statusByte, batteryByte]
    let offset = 0;
    this.nodes.forEach((sim) => {
      const n = sim.node;
      // Normalize lat/lon to 3D sector center: -5000 to +5000 meters
      const x = (n.longitude - 80.145) * 111000 * Math.cos(10.245 * (Math.PI / 180));
      const z = (n.latitude - 10.245) * 111000;
      const y = -n.depth_m; // Inverted underwater depth

      let statusCode = 1; // ACTIVE
      if (n.status === 'OFFLINE') statusCode = 0;
      else if (n.status === 'POWER_CONSERVING') statusCode = 2;
      else if (n.status === 'POWER_CRITICAL') statusCode = 3;
      else if (n.status === 'THEFT_SUSPECTED') statusCode = 4;

      buffer[offset] = x;
      buffer[offset + 1] = y;
      buffer[offset + 2] = z;
      buffer[offset + 3] = statusCode;
      buffer[offset + 4] = n.battery_level;
      offset += 5;
    });

    return Array.from(this.nodes.values()).map(s => s.node);
  }

  getAggregatedKPIs() {
    let active = 0;
    let offline = 0;
    let powerConserving = 0;
    let powerCritical = 0;
    let theftSuspected = 0;
    let totalBattery = 0;
    let totalSnr = 0;

    this.nodes.forEach((sim) => {
      const n = sim.node;
      if (n.status === 'ACTIVE') active++;
      else if (n.status === 'OFFLINE') offline++;
      else if (n.status === 'POWER_CONSERVING') powerConserving++;
      else if (n.status === 'POWER_CRITICAL') powerCritical++;
      else if (n.status === 'THEFT_SUSPECTED') theftSuspected++;

      totalBattery += n.battery_level;
      totalSnr += n.snr_db;
    });

    const total = this.nodes.size || 1;
    return {
      totalNodes: total,
      activeNodes: active,
      offlineNodes: offline,
      powerConservingNodes: powerConserving,
      powerCriticalNodes: powerCritical,
      theftSuspectedNodes: theftSuspected,
      avgBatteryPct: +(totalBattery / total).toFixed(1),
      avgSnrDb: +(totalSnr / total).toFixed(1),
      networkHealthPct: +(((active + powerConserving) / total) * 100).toFixed(1),
      config: this.config,
    };
  }

  consumeDeltas(): Partial<SonarNodeState>[] {
    const deltas = [...this.deltaQueue];
    this.deltaQueue = [];
    return deltas;
  }
}

export const simulationEngine = new SimulationEngine();
