// ==============================================================================
// OceanSense — Autonomous Underwater Vehicle (AUV) Swarm & Robotics Engine
// Demonstrates: Week 11 Advanced Autonomous Robotics, Target Intercept & Optical Feed
// ==============================================================================

export type AUVStatus = 'DOCKED' | 'PATROLLING' | 'DISPATCHED_INTERCEPT' | 'INVESTIGATING_TAMPER' | 'RETURNING_TO_DOCK';

export interface AUVTarget {
  targetId: string;
  latitude: number;
  longitude: number;
  depth_m: number;
}

export interface OpticalInspection {
  targetId: string;
  confidence: number;
  tamperDetected: boolean;
  tamperType?: 'UNAUTHORIZED_TRAWLER_CABLE' | 'PHYSICAL_DISLODGEMENT' | 'HYDROPHONE_CUT';
  description: string;
  timestamp: string;
  evidenceFrameUrl: string;
}

export interface AUVState {
  id: string;
  name: string;
  zoneId: string;
  dockId: string;
  status: AUVStatus;
  latitude: number;
  longitude: number;
  depth_m: number;
  x: number;
  y: number;
  z: number;
  headingDeg: number;
  speedKnots: number;
  batteryPct: number;
  cameraStatus: 'STANDBY' | 'RECORDING_OPTICAL' | 'THERMAL_SONAR';
  target?: AUVTarget;
  etaSeconds?: number;
  distanceToTargetMeters?: number;
  lastInspection?: OpticalInspection;
}

export class AUVSimulationEngine {
  private auvs: Map<string, AUVState> = new Map();

  constructor() {
    this.initializeFleet();
  }

  private initializeFleet() {
    // 4 AUVs stationed at 4 docking stations across 4 zones
    const fleet: AUVState[] = [
      {
        id: 'AUV-01',
        name: 'Orca-1 Deep Hunter',
        zoneId: 'ZONE-A',
        dockId: 'DOCK-ALPHA',
        status: 'DOCKED',
        latitude: 10.225000,
        longitude: 80.125000,
        depth_m: 110.0,
        x: -2220,
        y: -110,
        z: -2220,
        headingDeg: 45.0,
        speedKnots: 0.0,
        batteryPct: 98.5,
        cameraStatus: 'STANDBY',
      },
      {
        id: 'AUV-02',
        name: 'Nautilus-2 Interceptor',
        zoneId: 'ZONE-B',
        dockId: 'DOCK-BRAVO',
        status: 'PATROLLING',
        latitude: 10.265000,
        longitude: 80.125000,
        depth_m: 145.0,
        x: -2220,
        y: -145,
        z: 2220,
        headingDeg: 120.0,
        speedKnots: 2.5,
        batteryPct: 84.0,
        cameraStatus: 'RECORDING_OPTICAL',
      },
      {
        id: 'AUV-03',
        name: 'Leviathan-3 Sentinel',
        zoneId: 'ZONE-C',
        dockId: 'DOCK-CHARLIE',
        status: 'DOCKED',
        latitude: 10.225000,
        longitude: 80.165000,
        depth_m: 95.0,
        x: 2220,
        y: -95,
        z: -2220,
        headingDeg: 270.0,
        speedKnots: 0.0,
        batteryPct: 95.2,
        cameraStatus: 'STANDBY',
      },
      {
        id: 'AUV-04',
        name: 'Trident-4 Rapid Responder',
        zoneId: 'ZONE-D',
        dockId: 'DOCK-DELTA',
        status: 'DOCKED',
        latitude: 10.265000,
        longitude: 80.165000,
        depth_m: 160.0,
        x: 2220,
        y: -160,
        z: 2220,
        headingDeg: 180.0,
        speedKnots: 0.0,
        batteryPct: 99.0,
        cameraStatus: 'STANDBY',
      }
    ];

    fleet.forEach(auv => this.auvs.set(auv.id, auv));
  }

  // Update robotics kinematics loop
  tick(deltaSeconds: number, speedMultiplier: number = 1.0) {
    const dt = deltaSeconds * speedMultiplier;

    this.auvs.forEach((auv) => {
      // 1. If Intercepting or Patrolling towards a target
      if ((auv.status === 'DISPATCHED_INTERCEPT' || auv.status === 'RETURNING_TO_DOCK') && auv.target) {
        const dLatM = (auv.target.latitude - auv.latitude) * 111000.0;
        const dLonM = (auv.target.longitude - auv.longitude) * (111000.0 * Math.cos(auv.latitude * (Math.PI / 180.0)));
        const dDepthM = auv.target.depth_m - auv.depth_m;
        const distHorizontalM = Math.sqrt(dLatM * dLatM + dLonM * dLonM);
        const totalDistM = Math.sqrt(distHorizontalM * distHorizontalM + dDepthM * dDepthM);

        auv.distanceToTargetMeters = +totalDistM.toFixed(1);

        // Calculate heading to target
        const targetHeadingRad = Math.atan2(dLonM, dLatM);
        auv.headingDeg = +(((targetHeadingRad * 180.0) / Math.PI + 360) % 360).toFixed(1);

        // Speed: 5.0 knots (~ 2.57 m/s)
        auv.speedKnots = 5.0;
        const speedMs = auv.speedKnots * 0.514;
        auv.etaSeconds = Math.max(1, Math.round(totalDistM / speedMs));

        const moveStepM = speedMs * dt;

        if (totalDistM <= moveStepM || totalDistM < 25.0) {
          // Reached target! Hover at individual tactical standoff distance to prevent collision
          const auvIndex = parseInt(auv.id.replace(/\D/g, '') || '1', 10);
          const standoffRadiusM = 25.0 + (auvIndex * 12.0); // 37m, 49m, etc.
          const standoffAngleRad = ((auvIndex * 90.0) * Math.PI) / 180.0;
          const offsetLat = (Math.cos(standoffAngleRad) * standoffRadiusM) / 111000.0;
          const offsetLon = (Math.sin(standoffAngleRad) * standoffRadiusM) / (111000.0 * Math.cos(auv.latitude * (Math.PI / 180.0)));

          auv.latitude = auv.target.latitude + offsetLat;
          auv.longitude = auv.target.longitude + offsetLon;
          auv.depth_m = Math.max(10.0, auv.target.depth_m - (auvIndex * 3.5)); // Tiered depth separation
          auv.speedKnots = 0.5; // Tactical Hover
          auv.distanceToTargetMeters = +standoffRadiusM.toFixed(1);
          auv.etaSeconds = 0;

          if (auv.status === 'DISPATCHED_INTERCEPT') {
            auv.status = 'INVESTIGATING_TAMPER';
            auv.cameraStatus = 'RECORDING_OPTICAL';
            auv.lastInspection = {
              targetId: auv.target.targetId,
              confidence: 0.98,
              tamperDetected: true,
              tamperType: 'UNAUTHORIZED_TRAWLER_CABLE',
              description: `Optical inspection of ${auv.target.targetId} confirmed illicit physical contact. Steel recovery cable attached to mooring bracket.`,
              timestamp: new Date().toISOString(),
              evidenceFrameUrl: '/api/auvs/evidence/frame-sn0431.jpg',
            };
          } else if (auv.status === 'RETURNING_TO_DOCK') {
            auv.status = 'DOCKED';
            auv.cameraStatus = 'STANDBY';
            auv.target = undefined;
          }
        } else {
          // Move towards target
          const ratio = moveStepM / totalDistM;
          auv.latitude += (dLatM * ratio) / 111000.0;
          auv.longitude += (dLonM * ratio) / (111000.0 * Math.cos(auv.latitude * (Math.PI / 180.0)));
          auv.depth_m += dDepthM * ratio;
        }

        // Discharge battery while moving
        auv.batteryPct = Math.max(5.0, +(auv.batteryPct - (0.005 * dt)).toFixed(2));
      } else if (auv.status === 'PATROLLING') {
        // Slow patrol circle
        const patrolSpeedMs = auv.speedKnots * 0.514;
        auv.headingDeg = (auv.headingDeg + 1.2 * dt) % 360;
        const rad = (auv.headingDeg * Math.PI) / 180.0;
        const dXM = Math.sin(rad) * patrolSpeedMs * dt;
        const dZM = Math.cos(rad) * patrolSpeedMs * dt;
        auv.latitude += dZM / 111000.0;
        auv.longitude += dXM / (111000.0 * Math.cos(auv.latitude * (Math.PI / 180.0)));
        auv.batteryPct = Math.max(5.0, +(auv.batteryPct - (0.002 * dt)).toFixed(2));
      } else if (auv.status === 'DOCKED') {
        // Recharge battery while docked at inductive cradle
        if (auv.batteryPct < 100.0) {
          auv.batteryPct = Math.min(100.0, +(auv.batteryPct + (0.02 * dt)).toFixed(2));
        }
      }

      // Sync 3D local sector coordinates: center is (10.245, 80.145)
      auv.x = +((auv.longitude - 80.145) * 111000.0 * Math.cos(10.245 * (Math.PI / 180.0))).toFixed(1);
      auv.z = +((auv.latitude - 10.245) * 111000.0).toFixed(1);
      auv.y = +-auv.depth_m.toFixed(1);
    });

    // 4. Subsea TCAS Anti-Collision Pass (Prevent any two AUVs from colliding)
    const auvList = Array.from(this.auvs.values());
    for (let i = 0; i < auvList.length; i++) {
      for (let j = i + 1; j < auvList.length; j++) {
        const a1 = auvList[i];
        const a2 = auvList[j];
        const dLat = (a1.latitude - a2.latitude) * 111000.0;
        const dLon = (a1.longitude - a2.longitude) * 111000.0;
        const dDepth = a1.depth_m - a2.depth_m;
        const distM = Math.sqrt(dLat * dLat + dLon * dLon + dDepth * dDepth);
        const MIN_SAFE_DIST_M = 35.0; // 35 meter separation bubble

        if (distM < MIN_SAFE_DIST_M) {
          const overlap = (MIN_SAFE_DIST_M - distM) * 0.5;
          const pushAngle = distM > 0.1 ? Math.atan2(dLon, dLat) : (i * Math.PI) / 2;
          const pushLat = (Math.cos(pushAngle) * overlap) / 111000.0;
          const pushLon = (Math.sin(pushAngle) * overlap) / 111000.0;

          a1.latitude += pushLat;
          a1.longitude += pushLon;
          a2.latitude -= pushLat;
          a2.longitude -= pushLon;
          if (Math.abs(dDepth) < 4.0) {
            a1.depth_m -= 3.0;
            a2.depth_m += 3.0;
          }
        }
      }
    }
  }

  dispatchAUV(auvId: string, target: AUVTarget): AUVState | null {
    const auv = this.auvs.get(auvId);
    if (!auv) return null;

    auv.status = 'DISPATCHED_INTERCEPT';
    auv.cameraStatus = 'RECORDING_OPTICAL';
    auv.target = target;
    return auv;
  }

  dispatchNearestToTamper(targetLat: number, targetLon: number, targetDepth: number, targetId: string): AUVState {
    let bestAUV = Array.from(this.auvs.values())[0];
    let minDistance = Infinity;

    this.auvs.forEach((auv) => {
      // Prefer DOCKED or PATROLLING AUVs
      if (auv.status === 'DOCKED' || auv.status === 'PATROLLING') {
        const dLatM = (targetLat - auv.latitude) * 111000.0;
        const dLonM = (targetLon - auv.longitude) * 111000.0;
        const dist = Math.sqrt(dLatM * dLatM + dLonM * dLonM);
        if (dist < minDistance) {
          minDistance = dist;
          bestAUV = auv;
        }
      }
    });

    return this.dispatchAUV(bestAUV.id, {
      targetId,
      latitude: targetLat,
      longitude: targetLon,
      depth_m: targetDepth,
    })!;
  }

  returnToDock(auvId: string): AUVState | null {
    const auv = this.auvs.get(auvId);
    if (!auv) return null;

    // Reset target to its home dock coordinates
    const dockCoords: Record<string, { lat: number; lon: number; depth: number }> = {
      'DOCK-ALPHA': { lat: 10.225000, lon: 80.125000, depth: 110.0 },
      'DOCK-BRAVO': { lat: 10.265000, lon: 80.125000, depth: 145.0 },
      'DOCK-CHARLIE': { lat: 10.225000, lon: 80.165000, depth: 95.0 },
      'DOCK-DELTA': { lat: 10.265000, lon: 80.165000, depth: 160.0 },
    };

    const home = dockCoords[auv.dockId] || { lat: 10.225, lon: 80.125, depth: 110 };
    auv.status = 'RETURNING_TO_DOCK';
    auv.target = {
      targetId: auv.dockId,
      latitude: home.lat,
      longitude: home.lon,
      depth_m: home.depth,
    };
    return auv;
  }

  getAUVs(): AUVState[] {
    return Array.from(this.auvs.values());
  }

  getAUV(id: string): AUVState | null {
    return this.auvs.get(id) || null;
  }
}

export const auvEngine = new AUVSimulationEngine();
