// ==============================================================================
// OceanSense — Unified Live Fish School Store
// Ensures Desktop & Mobile 3D Digital Twins use the EXACT same simulation data
// and identical 3D coordinate space.
// ==============================================================================

import { create } from 'zustand';
import { wsClient } from '../services/websocket';

export interface FishSchoolData {
  id: string;
  species: string;
  commonName: string;
  latitude: number;
  longitude: number;
  depth_m: number;
  estimatedSize?: string;
  biomassTons: number;
  directionHeadingDeg: number;
  speedKnots?: number;
  confidenceScore: number;
  status: string;
  detectedByNodeIds?: string[];
  lastDetectedAt?: string;
}

interface FishSchoolState {
  schools: FishSchoolData[];
  selectedSchoolId: string | null;
  isLoading: boolean;
  setSchools: (schools: FishSchoolData[]) => void;
  setSelectedSchoolId: (id: string | null) => void;
  initialize: () => () => void;
}

// Canonical Fallback Data matching Backend Seed exactly
export const CANONICAL_FALLBACK_SCHOOLS: FishSchoolData[] = [
  {
    id: 'SCHOOL-TUNA-01',
    species: 'Thunnus thynnus',
    commonName: 'Atlantic Bluefin Tuna',
    latitude: 10.235000,
    longitude: 80.138000,
    depth_m: 142.0,
    estimatedSize: 'LARGE',
    biomassTons: 18.5,
    directionHeadingDeg: 95.0,
    speedKnots: 3.8,
    confidenceScore: 0.94,
    status: 'ACTIVE_TRACK',
  },
  {
    id: 'SCHOOL-MACK-02',
    species: 'Scomber scombrus',
    commonName: 'Atlantic Mackerel',
    latitude: 10.262000,
    longitude: 80.120000,
    depth_m: 85.0,
    estimatedSize: 'MEDIUM',
    biomassTons: 8.2,
    directionHeadingDeg: 215.0,
    speedKnots: 2.6,
    confidenceScore: 0.88,
    status: 'ACTIVE_TRACK',
  },
  {
    id: 'SCHOOL-SARD-03',
    species: 'Sardinops sagax',
    commonName: 'Pacific Sardine',
    latitude: 10.218000,
    longitude: 80.168000,
    depth_m: 54.0,
    estimatedSize: 'MASSIVE',
    biomassTons: 24.8,
    directionHeadingDeg: 320.0,
    speedKnots: 1.8,
    confidenceScore: 0.91,
    status: 'ACTIVE_TRACK',
  },
  {
    id: 'SCHOOL-TREV-04',
    species: 'Caranx ignobilis',
    commonName: 'Giant Trevally Cluster',
    latitude: 10.260500,
    longitude: 80.160500,
    depth_m: 110.0,
    estimatedSize: 'LARGE',
    biomassTons: 16.4,
    directionHeadingDeg: 145.0,
    speedKnots: 2.4,
    confidenceScore: 0.92,
    status: 'ACTIVE_TRACK',
  },
];

// Unified 3D Coordinate Transformer (Shared across ALL 3D Digital Twin Canvases)
// Uses synchronized epoch time so desktop and mobile views are 100.00% spatially identical at all times
export function getFishSchool3DCoordinates(
  school: { latitude: number; longitude: number; depth_m: number; id?: string },
  index: number = 0,
  timeSec?: number
): { x: number; y: number; z: number } {
  // Deterministic canonical school index derived from school.id
  // Guarantees 100.00% identical positions across Desktop, Mobile, and Sonar views
  let canonicalIndex = index;
  if (school && school.id) {
    if (school.id.includes('TUNA') || school.id === 'SCHOOL-TUNA-01') canonicalIndex = 0;
    else if (school.id.includes('MACK') || school.id === 'SCHOOL-MACK-02') canonicalIndex = 1;
    else if (school.id.includes('SARD') || school.id === 'SCHOOL-SARD-03') canonicalIndex = 2;
    else if (school.id.includes('TREV') || school.id === 'SCHOOL-TREV-04') canonicalIndex = 3;
  }

  // Calibrated depth mapping: 1 scene unit = 100m depth (<300m = ~2.8 units max)
  const baseCy = -(school.depth_m / 100.0);

  // Position fish schools in 10x10 km sector (nodes at [-15,-15], [+15,-15], [-15,+15], [+15,+15])
  // Each node has 1.5 km (15 units) radius; place schools inside these active sonar sectors
  let baseCx = 0;
  let baseCz = 0;
  if (canonicalIndex === 0) {
    // Atlantic Bluefin Tuna (142m depth) inside SN-0001 sector (-15, -15)
    baseCx = -8.5;
    baseCz = -10.5;
  } else if (canonicalIndex === 1) {
    // Atlantic Mackerel (85m depth) inside SN-0003 sector (-15, +15)
    baseCx = -10.0;
    baseCz = 8.5;
  } else if (canonicalIndex === 2) {
    // Pacific Sardine (54m depth) inside SN-0002 sector (+15, -15)
    baseCx = 8.5;
    baseCz = -9.5;
  } else {
    // Pelagic school inside SN-0004 sector (+15, +15)
    baseCx = 9.0;
    baseCz = 9.5;
  }

  // Globally synchronized wall-clock epoch time
  const t = typeof timeSec === 'number' && timeSec > 0 ? timeSec : (Date.now() / 1000);

  // Oceanic cruising orbit synchronized across all viewports
  const speed = canonicalIndex === 0 ? 0.22 : 0.18;
  const radius = canonicalIndex === 0 ? 3.8 : 3.2;
  const curX = baseCx + Math.sin(t * speed + canonicalIndex * 2.0) * radius;
  const curZ = baseCz + Math.cos(t * speed + canonicalIndex * 2.0) * radius;
  const curY = baseCy + Math.sin(t * 0.4 + canonicalIndex) * 0.12;

  return { x: curX, y: curY, z: curZ };
}

// Canonical swimming velocity vector & heading for smooth boat escort / tracking
export function getFishSchoolVelocity(
  index: number = 0,
  timeSec?: number,
  schoolId?: string
): { vx: number; vz: number; speed: number; heading: number } {
  let canonicalIndex = index;
  if (schoolId) {
    if (schoolId.includes('TUNA')) canonicalIndex = 0;
    else if (schoolId.includes('MACK')) canonicalIndex = 1;
    else if (schoolId.includes('SARD')) canonicalIndex = 2;
    else if (schoolId.includes('TREV')) canonicalIndex = 3;
  }
  const t = typeof timeSec === 'number' && timeSec > 0 ? timeSec : (Date.now() / 1000);
  const speed = canonicalIndex === 0 ? 0.22 : 0.18;
  const radius = canonicalIndex === 0 ? 3.8 : 3.2;
  // Derivatives of the parametric orbit equations:
  // curX' = cos(...) * speed * radius
  // curZ' = -sin(...) * speed * radius
  const vx = Math.cos(t * speed + canonicalIndex * 2.0) * speed * radius;
  const vz = -Math.sin(t * speed + canonicalIndex * 2.0) * speed * radius;
  const speedMag = Math.sqrt(vx * vx + vz * vz);
  const heading = Math.atan2(vx, vz);
  return { vx, vz, speed: speedMag, heading };
}

export const useFishSchoolStore = create<FishSchoolState>((set) => ({
  schools: CANONICAL_FALLBACK_SCHOOLS,
  selectedSchoolId: 'SCHOOL-TUNA-01',
  isLoading: false,

  setSchools: (schools) => set({ schools }),
  setSelectedSchoolId: (selectedSchoolId) => set({ selectedSchoolId }),

  initialize: () => {
    // 1. Initial REST API Fetch from Simulation Backend
    fetch('/api/fish-schools/schools')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.schools || []);
        if (list.length) {
          set({ schools: list });
        }
      })
      .catch((err) => console.warn('[FishSchoolStore] REST fetch waiting:', err));

    // 2. Real-Time WebSocket Telemetry Synchronizer
    wsClient.connect();
    const unsubFish = wsClient.on('FISH_TRACK_UPDATE', (payload: any) => {
      const list = Array.isArray(payload) ? payload : (payload?.schools || []);
      if (list.length) {
        set({ schools: list });
      }
    });

    return () => {
      unsubFish();
    };
  },
}));
