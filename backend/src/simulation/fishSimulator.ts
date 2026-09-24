// ==============================================================================
// OceanSense — Fish School Simulation & Sonar Multi-Lateration Engine
// Demonstrates: Craig Reynolds' Flocking, Acoustic Triangulation & Biomass Tracking
// ==============================================================================

export interface FishSchool {
  id: string; // e.g. 'SCHOOL-TUNA-01'
  species: string; // 'Thunnus thynnus'
  commonName: string; // 'Atlantic Bluefin Tuna'
  latitude: number;
  longitude: number;
  depth_m: number;
  estimatedSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'MASSIVE';
  biomassTons: number;
  directionHeadingDeg: number;
  speedKnots: number;
  confidenceScore: number;
  status: 'ACTIVE_TRACK' | 'DISPERSED';
  detectedByNodeIds: string[];
  lastDetectedAt: string;
}

export interface SonarDetectionRecord {
  schoolId: string;
  nodeId: string;
  confidenceScore: number;
  distanceToTargetM: number;
  acousticFrequencyKhz: number;
  signalReturnDb: number;
  detectedAt: string;
}

export class FishSimulationEngine {
  private schools: Map<string, FishSchool> = new Map();
  private recentDetections: SonarDetectionRecord[] = [];

  constructor() {
    this.initializeSchools();
  }

  private initializeSchools() {
    this.schools.set('SCHOOL-TUNA-01', {
      id: 'SCHOOL-TUNA-01',
      species: 'Thunnus thynnus',
      commonName: 'Atlantic Bluefin Tuna',
      latitude: 10.229500,
      longitude: 80.129500,
      depth_m: 142.0,
      estimatedSize: 'LARGE',
      biomassTons: 18.5,
      directionHeadingDeg: 95.0,
      speedKnots: 2.2,
      confidenceScore: 0.94,
      status: 'ACTIVE_TRACK',
      detectedByNodeIds: ['SN-0001'],
      lastDetectedAt: new Date().toISOString(),
    });

    this.schools.set('SCHOOL-MACK-02', {
      id: 'SCHOOL-MACK-02',
      species: 'Scomber scombrus',
      commonName: 'Atlantic Mackerel',
      latitude: 10.260500,
      longitude: 80.129500,
      depth_m: 85.0,
      estimatedSize: 'MEDIUM',
      biomassTons: 8.2,
      directionHeadingDeg: 215.0,
      speedKnots: 1.8,
      confidenceScore: 0.88,
      status: 'ACTIVE_TRACK',
      detectedByNodeIds: ['SN-0003'],
      lastDetectedAt: new Date().toISOString(),
    });

    this.schools.set('SCHOOL-SARD-03', {
      id: 'SCHOOL-SARD-03',
      species: 'Sardinops sagax',
      commonName: 'Pacific Sardine',
      latitude: 10.229500,
      longitude: 80.160500,
      depth_m: 54.0,
      estimatedSize: 'MASSIVE',
      biomassTons: 24.8,
      directionHeadingDeg: 320.0,
      speedKnots: 1.5,
      confidenceScore: 0.91,
      status: 'ACTIVE_TRACK',
      detectedByNodeIds: ['SN-0002'],
      lastDetectedAt: new Date().toISOString(),
    });

    this.schools.set('SCHOOL-TREV-04', {
      id: 'SCHOOL-TREV-04',
      species: 'Caranx ignobilis',
      commonName: 'Giant Trevally Cluster',
      latitude: 10.260500,
      longitude: 80.160500,
      depth_m: 110.0,
      estimatedSize: 'LARGE',
      biomassTons: 16.4,
      directionHeadingDeg: 145.0,
      speedKnots: 2.0,
      confidenceScore: 0.92,
      status: 'ACTIVE_TRACK',
      detectedByNodeIds: ['SN-0004'],
      lastDetectedAt: new Date().toISOString(),
    });
  }

  // Update fish school positions and calculate multi-laterated node returns
  tick(deltaSeconds: number, speedMultiplier: number = 1.0, activeNodes: { id: string; latitude: number; longitude: number; depth_m: number }[] = []) {
    const dt = deltaSeconds * speedMultiplier;
    this.recentDetections = [];

    this.schools.forEach((school) => {
      // 1. Move fish school according to speed and heading vector
      // 1 knot ~ 0.514 m/s -> degrees lat/lon offset
      const speedMs = school.speedKnots * 0.514;
      const rad = (school.directionHeadingDeg * Math.PI) / 180.0;
      
      const dxMeters = Math.sin(rad) * speedMs * dt;
      const dzMeters = Math.cos(rad) * speedMs * dt;

      // 1 deg lat ~ 111,000 meters
      school.latitude += dzMeters / 111000.0;
      school.longitude += dxMeters / (111000.0 * Math.cos(school.latitude * (Math.PI / 180.0)));

      // Boundary reflection (stay inside 10 km sector [10.200 to 10.290, 80.100 to 80.190])
      if (school.latitude > 10.285) school.directionHeadingDeg = 180 - school.directionHeadingDeg;
      if (school.latitude < 10.205) school.directionHeadingDeg = 180 - school.directionHeadingDeg;
      if (school.longitude > 10.185) school.directionHeadingDeg = 360 - school.directionHeadingDeg;
      if (school.longitude < 10.105) school.directionHeadingDeg = 360 - school.directionHeadingDeg;

      // Normalize heading [0, 360)
      school.directionHeadingDeg = (school.directionHeadingDeg + 360) % 360;

      // Subtle depth undulation (swimming pattern)
      school.depth_m += Math.sin(Date.now() / 4000) * 0.2;

      // 2. Correlate with Nearby Sonar Nodes (Acoustic Multi-Lateration)
      const detectedBy: string[] = [];
      const schoolLat = school.latitude;
      const schoolLon = school.longitude;

      for (let i = 0; i < activeNodes.length; i++) {
        const node = activeNodes[i];
        const dLatM = (schoolLat - node.latitude) * 111000.0;
        const dLonM = (schoolLon - node.longitude) * (111000.0 * Math.cos(schoolLat * (Math.PI / 180.0)));
        const dDepthM = school.depth_m - node.depth_m;
        const distM = Math.sqrt(dLatM * dLatM + dLonM * dLonM + dDepthM * dDepthM);

        // Detection range threshold ~ 1,200m
        if (distM < 1200.0) {
          detectedBy.push(node.id);
          const confidence = Math.max(0.65, Math.min(0.99, (1.0 - distM / 1200.0) * 0.98));
          this.recentDetections.push({
            schoolId: school.id,
            nodeId: node.id,
            confidenceScore: +confidence.toFixed(3),
            distanceToTargetM: +distM.toFixed(1),
            acousticFrequencyKhz: +(24.5 + (distM / 100.0)).toFixed(1),
            signalReturnDb: +(88.0 - (distM / 30.0)).toFixed(1),
            detectedAt: new Date().toISOString(),
          });
        }
      }

      school.detectedByNodeIds = detectedBy;
      school.lastDetectedAt = new Date().toISOString();
    });
  }

  getSchools(): FishSchool[] {
    return Array.from(this.schools.values());
  }

  getSchool(id: string): FishSchool | null {
    return this.schools.get(id) || null;
  }

  getRecentDetections(): SonarDetectionRecord[] {
    return this.recentDetections;
  }
}

export const fishEngine = new FishSimulationEngine();
