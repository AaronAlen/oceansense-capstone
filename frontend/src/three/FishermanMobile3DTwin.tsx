// ==============================================================================
// OceanSense — Commercial Fisherman 3D Mobile Digital Twin
// Features:
// 1. Dynamic Simulated Forward Cruising (Boat sails towards fish school at 7.2 knots)
// 2. Visible Bathymetric Seabed Topography (Subsurface seafloor contour & trenches)
// 3. Realistic Scale Ratio (Boat reduced to 0.38 scale, expanded fish school spacing)
// 4. Zero Sonar Nodes Rendered (Strict Privacy Shielding for Commercial Fishermen)
// 5. Day & Night Ocean Lighting System with Active Navigational Beacons
// ==============================================================================

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useThemeStore } from '../stores/themeStore';
import { useFishSchoolStore, getFishSchool3DCoordinates, getFishSchoolVelocity, FishSchoolData } from '../stores/fishSchoolStore';
import { wsClient } from '../services/websocket';
import { BathymetryTerrain } from './BathymetryTerrain';
import { TacticalOceanVolumeBounds } from './TacticalOceanVolumeBounds';
import { Navigation, Compass, Fish, Waves, Anchor, Gauge, Clock, Fuel, Award, Sun, Moon } from 'lucide-react';

export interface LiveFishCluster {
  id: string;
  species: string;
  commonName: string;
  biomassTons: number;
  depth_m: number;
  latitude: number;
  longitude: number;
  directionHeadingDeg?: number;
  speedKnots?: number;
  bearingDeg: number;
  distanceNM: number;
  marketValueINR: string;
  recommendedNetDepth: string;
  color: string;
  x: number;
  y: number;
  z: number;
}

interface Props {
  schools?: any[];
  onSelectCluster?: (cluster: LiveFishCluster) => void;
}

// Compact Commercial Fishing Trawler Model (Reduced to realistic 0.38 scale)
function FishingBoatModel({
  boatGroupRef,
  isNight,
  isStationKeeping,
}: {
  boatGroupRef: React.RefObject<THREE.Group>;
  isNight: boolean;
  isStationKeeping: boolean;
}) {
  const wakeRef = useRef<THREE.Points>(null);

  // Wake particles behind boat
  const wakeParticles = useMemo(() => {
    const count = 40;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 1] = -0.05;
      pos[i * 3 + 2] = -Math.random() * 8.0;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (wakeRef.current) {
      const positions = wakeRef.current.geometry.attributes.position.array as Float32Array;
      const wakeSpeed = isStationKeeping ? 0.05 : 0.16;
      for (let i = 0; i < 40; i++) {
        positions[i * 3 + 2] -= wakeSpeed;
        if (positions[i * 3 + 2] < -12.0) {
          positions[i * 3 + 2] = -0.3;
        }
      }
      wakeRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={boatGroupRef} scale={[0.38, 0.38, 0.38]}>
      {/* Hull (Commercial Trawler V-Shape) */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.8, 0.9, 5.2]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Red Bottom Keel Anti-Fouling Line */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.75, 0.35, 5.1]} />
        <meshStandardMaterial color="#E11D48" roughness={0.6} />
      </mesh>

      {/* Bow Point */}
      <mesh position={[0, 0.4, 2.8]} rotation={[0, 0, 0]}>
        <coneGeometry args={[1.0, 1.4, 4]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Wheelhouse Cabin */}
      <mesh position={[0, 1.35, -0.4]}>
        <boxGeometry args={[1.5, 1.1, 1.8]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.2} metalness={0.4} />
      </mesh>

      {/* Cabin Navigation Windows */}
      <mesh position={[0, 1.5, 0.52]}>
        <boxGeometry args={[1.3, 0.45, 0.05]} />
        <meshStandardMaterial color="#00F2FE" roughness={0.1} metalness={0.9} transparent opacity={0.85} />
      </mesh>

      {/* Radar Mast */}
      <mesh position={[0, 2.3, -0.4]}>
        <cylinderGeometry args={[0.04, 0.06, 1.2]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.8} />
      </mesh>

      {/* Rotating Marine Radar Dome */}
      <mesh position={[0, 2.9, -0.4]}>
        <boxGeometry args={[0.6, 0.15, 0.25]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
      </mesh>

      {/* Aft Net Winch & Trawl Gantry Reel */}
      <mesh position={[0, 0.85, -2.0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 1.4, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* Active Navigational Safety Lights (Port Red, Starboard Green, Mast White) */}
      <pointLight position={[-0.95, 1.4, 0]} color="#EF4444" intensity={isNight ? 4.0 : 1.5} distance={10} />
      <pointLight position={[0.95, 1.4, 0]} color="#10B981" intensity={isNight ? 4.0 : 1.5} distance={10} />
      <pointLight position={[0, 3.2, -0.4]} color="#FFFFFF" intensity={isNight ? 5.0 : 2.0} distance={14} />

      {/* Long-Range Vertical Beacon Column (Visible from any zoom-out distance) */}
      <mesh position={[0, 16, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 32, 8]} />
        <meshBasicMaterial
          color={isStationKeeping ? '#00E699' : '#00F2FE'}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Permanent 3D Billboard Label for Boat */}
      <Html position={[0, 2.5, 0]} center zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(11, 19, 32, 0.94)',
          backdropFilter: 'blur(8px)',
          border: isStationKeeping ? '1px solid #00E699' : '1px solid #00F2FE',
          borderRadius: '5px',
          padding: '3px 8px',
          color: isStationKeeping ? '#00E699' : '#00F2FE',
          fontFamily: 'monospace',
          fontWeight: 800,
          fontSize: '11px',
          whiteSpace: 'nowrap',
          boxShadow: isStationKeeping ? '0 0 12px rgba(0, 230, 153, 0.6)' : '0 0 12px rgba(0, 242, 254, 0.6)',
        }}>
          ⛵ NORDIC RUNNER [{isStationKeeping ? '2.1 KTS // ESCORT' : '7.2 KTS'}]
        </div>
      </Html>

      {/* Stern Foaming Wake */}
      <points ref={wakeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[wakeParticles, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.45} color="#E0F2FE" transparent opacity={0.8} depthWrite={false} />
      </points>
    </group>
  );
}

// Swimming Fish Cluster in 3D with Expanding Acoustic Pulse Ring & HTML Marker
function FishCluster3D({
  cluster,
  clusterIndex,
  isSelected,
  onSelect,
}: {
  cluster: LiveFishCluster;
  clusterIndex: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const clusterGroupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Individual particle offsets (compact realistic pelagic school matching Desktop)
  const { offsets, phases, pos } = useMemo(() => {
    const count = 100;
    const off = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const p = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      off[i * 3] = (Math.random() - 0.5) * 2.2;
      off[i * 3 + 1] = (Math.random() - 0.5) * 0.35;
      off[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { offsets: off, phases: ph, pos: p };
  }, []);

  useFrame(() => {
    const t = Date.now() / 1000;
    // EXACT SAME dynamic swimming motion as the main desktop simulation
    const coords = getFishSchool3DCoordinates(cluster, clusterIndex, t);

    if (clusterGroupRef.current) {
      clusterGroupRef.current.position.set(coords.x, coords.y, coords.z);
    }

    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 100; i++) {
        const tailX = Math.sin(t * 7.0 + phases[i]) * 0.25;
        const tailY = Math.sin(t * 9.0 + phases[i]) * 0.18;
        const tailZ = Math.cos(t * 7.0 + phases[i]) * 0.25;

        positions[i * 3] = offsets[i * 3] + tailX;
        positions[i * 3 + 1] = offsets[i * 3 + 1] + tailY;
        positions[i * 3 + 2] = offsets[i * 3 + 2] + tailZ;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Expanding acoustic wavefront ring (matching Desktop)
    if (ringRef.current) {
      const scale = 1.0 + ((t * 1.5 + clusterIndex * 0.8) % 3.0);
      ringRef.current.scale.set(scale, scale, 1);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, 0.65 - (scale - 1) * 0.22);
      }
    }
  });

  return (
    <group ref={clusterGroupRef} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Swimming School Particles (relative to group) */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.8}
          color={cluster.color}
          transparent
          opacity={0.95}
          depthWrite={false}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Expanding Acoustic Sonar Ring Wavefront (Identical to Desktop) */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.45, 32]} />
        <meshBasicMaterial
          color={cluster.color}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Clickable interaction sphere */}
      <mesh>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial
          color={cluster.color}
          transparent
          opacity={isSelected ? 0.25 : 0.001}
          wireframe={isSelected}
        />
      </mesh>

      {/* Permanent 3D Billboard Badge for Fish School (Identical to Desktop) */}
      <Html position={[0, 1.1, 0]} center zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(5, 12, 26, 0.88)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1.5px solid ${cluster.color}`,
          borderRadius: '5px',
          padding: '3px 8px',
          color: '#FFF',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          boxShadow: `0 0 12px ${cluster.color}66`,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ color: cluster.color, fontSize: '11px' }}>🐟</span>
          <span style={{ fontWeight: 800, color: cluster.color }}>{cluster.commonName.toUpperCase()}</span>
          <span style={{ color: '#00F2FE', fontSize: '9px' }}>| {Math.round(cluster.depth_m)}m</span>
          <span style={{ color: '#FFB703', fontSize: '9px' }}>| {cluster.biomassTons}T</span>
        </div>
      </Html>
    </group>
  );
}

// Dynamic Animated Trajectory Course Line connecting moving boat to target
function DynamicNavigationRouteVector({
  boatPos,
  targetSchool,
  targetSchoolIndex,
  isStationKeeping,
}: {
  boatPos: THREE.Vector3;
  targetSchool: LiveFishCluster;
  targetSchoolIndex: number;
  isStationKeeping: boolean;
}) {
  const lineRef = useRef<THREE.Line>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRefAny = lineRef as any;

  useFrame(() => {
    const t = Date.now() / 1000;
    if (lineRef.current) {
      const points: THREE.Vector3[] = [];
      const count = 30;
      const schoolCoords = getFishSchool3DCoordinates(targetSchool, targetSchoolIndex, t);

      for (let i = 0; i <= count; i++) {
        const alpha = i / count;
        const x = boatPos.x + (schoolCoords.x - boatPos.x) * alpha;
        const z = boatPos.z + (schoolCoords.z - boatPos.z) * alpha;
        const y = boatPos.y + (schoolCoords.y - boatPos.y) * Math.pow(alpha, 1.8);
        points.push(new THREE.Vector3(x, y, z));
      }
      lineRef.current.geometry.setFromPoints(points);
    }
  });

  return (
    <line ref={lineRefAny}>
      <bufferGeometry />
      <lineDashedMaterial
        color={isStationKeeping ? '#00E699' : '#00F2FE'}
        dashSize={isStationKeeping ? 0.8 : 1.2}
        gapSize={0.6}
        linewidth={isStationKeeping ? 2 : 3}
        transparent
        opacity={isStationKeeping ? 0.6 : 0.85}
      />
    </line>
  );
}

// Ocean Water Surface with Wave Ripple
function OceanWaterSurface({ isNight, isGray }: { isNight: boolean; isGray: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 1.2) * 0.08;
    }
  });

  const waterColor = isNight ? '#040E1E' : isGray ? '#1E293B' : '#0369A1';
  const waterOpacity = isNight ? 0.72 : isGray ? 0.65 : 0.52;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[250, 250, 32, 32]} />
      <meshStandardMaterial
        color={waterColor}
        transparent
        opacity={waterOpacity}
        roughness={isNight ? 0.2 : 0.05}
        metalness={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Forward Cruising & Smooth Station-Keeping Physics Controller
function DynamicSceneController({
  boatPosRef,
  boatGroupRef,
  boatHeadingRef,
  targetSchool,
  targetSchoolIndex,
  cameraMode,
  controlsRef,
  onHudUpdate,
}: {
  boatPosRef: React.MutableRefObject<THREE.Vector3>;
  boatGroupRef: React.RefObject<THREE.Group>;
  boatHeadingRef: React.MutableRefObject<number>;
  targetSchool: LiveFishCluster;
  targetSchoolIndex: number;
  cameraMode: 'TACTICAL' | 'CHASE' | 'FISH' | 'TOP_DOWN';
  controlsRef: React.RefObject<any>;
  onHudUpdate: (distNM: number, bearingDeg: number, etaMin: number, isStation: boolean) => void;
}) {
  const isEscortingRef = useRef<boolean>(false);
  const currentTargetIdRef = useRef<string>(targetSchool.id);
  const lastHudRef = useRef<number>(0);

  // If user switches target fish school, reset escort state so vessel cruises to new target
  if (currentTargetIdRef.current !== targetSchool.id) {
    currentTargetIdRef.current = targetSchool.id;
    isEscortingRef.current = false;
  }

  useFrame(({ camera }) => {
    const t = Date.now() / 1000;
    const bPos = boatPosRef.current;

    // 1. Dynamic Swimming Location & Instantaneous Velocity of Target Fish School
    // (100% synchronized across desktop, mobile and radar views via shared epoch transformer)
    const schoolCoords = getFishSchool3DCoordinates(targetSchool, targetSchoolIndex, t);
    const { vx, vz, heading: schoolHeading } = getFishSchoolVelocity(targetSchoolIndex, t);

    // 2. Realistic Escort Standoff Station:
    // Position vessel ~3.8 units behind and 20° off-starboard of the swimming fish school
    const trailAngle = schoolHeading + Math.PI + 0.35;
    const escortStationX = schoolCoords.x + Math.sin(trailAngle) * 3.8;
    const escortStationZ = schoolCoords.z + Math.cos(trailAngle) * 3.8;

    const dx = escortStationX - bPos.x;
    const dz = escortStationZ - bPos.z;
    const distToStation = Math.sqrt(dx * dx + dz * dz);

    // 3. Robust Hysteresis Mode Switching (Guarantees zero flickering between cruising & escort)
    if (!isEscortingRef.current && distToStation <= 1.4) {
      isEscortingRef.current = true;
    } else if (isEscortingRef.current && distToStation > 5.0) {
      isEscortingRef.current = false;
    }

    let desiredHeading = boatHeadingRef.current;

    if (!isEscortingRef.current) {
      // Transit Cruising Mode: Sail smoothly towards the rendezvous escort station
      const targetAngle = Math.atan2(dx, dz);
      // Smooth deceleration as vessel approaches station
      const speed = Math.min(0.065, Math.max(0.018, distToStation * 0.035 + 0.012));
      bPos.x += Math.sin(targetAngle) * speed;
      bPos.z += Math.cos(targetAngle) * speed;
      desiredHeading = targetAngle;
    } else {
      // Escort / Station-Keeping Mode:
      // Vessel glides smoothly alongside/behind the fish school, perfectly matching its velocity
      // plus a gentle critically-damped spring to maintain exact station distance
      const dt = 0.0167; // approx 60fps frame time
      bPos.x += vx * dt + dx * 0.045;
      bPos.z += vz * dt + dz * 0.045;
      desiredHeading = schoolHeading; // Vessel bow points in the exact direction the school is swimming
    }

    // 4. Smooth Heading with Shortest-Arc Interpolation (Eliminates all snapping, spinning or sudden jumps)
    let diff = desiredHeading - boatHeadingRef.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    boatHeadingRef.current += diff * 0.045;

    // 5. Wave Hydrodynamics (Heave, Roll, Pitch)
    if (boatGroupRef.current) {
      const waveHeave = Math.sin(t * 1.8) * 0.06;
      boatGroupRef.current.position.set(bPos.x, 0.1 + waveHeave, bPos.z);
      boatGroupRef.current.rotation.y = boatHeadingRef.current;
      boatGroupRef.current.rotation.z = Math.sin(t * 1.4) * 0.028;
      boatGroupRef.current.rotation.x = Math.cos(t * 1.8) * 0.020;
    }

    // 6. Throttled HUD Update (Every 400ms to eliminate all number flickering and 60fps re-renders)
    if (t - lastHudRef.current > 0.4) {
      lastHudRef.current = t;
      const isEscort = isEscortingRef.current;
      const distNM = isEscort ? 0.0 : +(distToStation * 0.10).toFixed(1);
      const bearingDeg = Math.round(((boatHeadingRef.current * 180) / Math.PI + 360) % 360);
      const etaMin = isEscort ? 0 : Math.max(1, Math.round((distNM / 7.2) * 60));
      onHudUpdate(distNM, bearingDeg, etaMin, isEscort);
    }

    // 7. Smooth Camera Following
    if (cameraMode === 'CHASE') {
      const chaseX = bPos.x - Math.sin(boatHeadingRef.current) * 14.0;
      const chaseZ = bPos.z - Math.cos(boatHeadingRef.current) * 14.0;
      camera.position.lerp(new THREE.Vector3(chaseX, 6.5, chaseZ), 0.04);
      if (controlsRef.current) {
        controlsRef.current.target.set(bPos.x, 0.8, bPos.z);
        controlsRef.current.update();
      }
    } else if (cameraMode === 'FISH') {
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(schoolCoords.x, schoolCoords.y, schoolCoords.z), 0.04);
        controlsRef.current.update();
      }
    }
  });

  return null;
}

// Main 3D Component
export const FishermanMobile3DTwin: React.FC<Props> = ({ schools, onSelectCluster }) => {
  const { theme, setTheme } = useThemeStore();
  const storeSchools = useFishSchoolStore((state) => state.schools);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('SCHOOL-TUNA-01');
  const [cameraMode, setCameraMode] = useState<'TACTICAL' | 'CHASE' | 'FISH' | 'TOP_DOWN'>('TACTICAL');
  const controlsRef = useRef<any>(null);

  // Animated Forward Cruising Simulation
  const boatPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-12.0, 0.1, -14.0));
  const boatGroupRef = useRef<THREE.Group>(null);
  const boatHeadingRef = useRef<number>(0);
  const [liveDistanceNM, setLiveDistanceNM] = useState<number>(2.4);
  const [liveBearingDeg, setLiveBearingDeg] = useState<number>(95);
  const [liveEtaMin, setLiveEtaMin] = useState<number>(20);
  const [isStationKeeping, setIsStationKeeping] = useState<boolean>(false);

  // Initialize and synchronize with shared live store
  useEffect(() => {
    const unsub = useFishSchoolStore.getState().initialize();
    return unsub;
  }, []);

  const activeSchoolList = schools && schools.length > 0 ? schools : storeSchools;

  // Throttled HUD update callback (eliminates all number flickering and 60fps re-renders)
  const handleHudUpdate = React.useCallback(
    (distNM: number, bearingDeg: number, etaMin: number, isStation: boolean) => {
      setLiveDistanceNM(distNM);
      setLiveBearingDeg(bearingDeg);
      setLiveEtaMin(etaMin);
      setIsStationKeeping(isStation);
    },
    []
  );

  // Convert live fish schools into 3D space using the EXACT SAME coordinate space as the main desktop simulation
  const clusters: LiveFishCluster[] = useMemo(() => {
    const vesselLat = 10.245;
    const vesselLon = 80.145;

    return activeSchoolList.map((school, sIdx) => {
      // Use the canonical 3D coordinates (identical to OceanDigitalTwinCanvas / FishSchoolParticles)
      const coords = getFishSchool3DCoordinates(school, sIdx);

      // Real Nautical Miles & Bearing calculation from vessel
      const dLatNM = (school.latitude - vesselLat) * 60.0;
      const dLonNM = (school.longitude - vesselLon) * 60.0 * Math.cos(school.latitude * (Math.PI / 180.0));
      const distanceNM = +Math.sqrt(dLatNM * dLatNM + dLonNM * dLonNM).toFixed(1);
      const bearingRad = Math.atan2(dLonNM, dLatNM);
      const bearingDeg = Math.round(((bearingRad * 180.0) / Math.PI + 360.0) % 360.0);

      let color = '#00F2FE';
      let marketValueINR = '₹18.5 Lakhs ($22k)';
      let recommendedNetDepth = '50m - 75m Surface Driftnet';

      if (school.id.includes('TUNA') || school.species.toLowerCase().includes('thunnus')) {
        color = '#F72585';
        marketValueINR = `₹${(school.biomassTons * 1.05).toFixed(1)} Lakhs`;
        recommendedNetDepth = `${Math.round(school.depth_m - 10)}m - ${Math.round(school.depth_m + 15)}m Deep Purse Seine`;
      } else if (school.id.includes('MACK') || school.species.toLowerCase().includes('scomber')) {
        color = '#FFB703';
        marketValueINR = `₹${(school.biomassTons * 0.52).toFixed(1)} Lakhs`;
        recommendedNetDepth = `${Math.round(school.depth_m - 10)}m - ${Math.round(school.depth_m + 10)}m Midwater Trawl`;
      } else if (school.id.includes('SARD') || school.species.toLowerCase().includes('sardinops')) {
        color = '#00E699';
        marketValueINR = `₹${(school.biomassTons * 0.40).toFixed(1)} Lakhs`;
        recommendedNetDepth = `${Math.round(school.depth_m - 8)}m - ${Math.round(school.depth_m + 8)}m Surface Driftnet`;
      } else {
        color = '#38BDF8';
        marketValueINR = `₹${(school.biomassTons * 0.65).toFixed(1)} Lakhs`;
        recommendedNetDepth = `${Math.round(school.depth_m - 10)}m - ${Math.round(school.depth_m + 10)}m Midwater Trawl`;
      }

      return {
        id: school.id,
        species: school.species,
        commonName: school.commonName || school.species,
        biomassTons: school.biomassTons || 15.0,
        depth_m: Math.round(school.depth_m),
        latitude: school.latitude,
        longitude: school.longitude,
        directionHeadingDeg: school.directionHeadingDeg || 0,
        bearingDeg,
        distanceNM,
        marketValueINR,
        recommendedNetDepth,
        color,
        x: coords.x,
        y: coords.y,
        z: coords.z,
      };
    });
  }, [activeSchoolList]);

  const selectedIndex = clusters.findIndex(c => c.id === selectedClusterId);
  const selectedClusterIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const selectedCluster = clusters[selectedClusterIndex] || clusters[0];

  // Theme configuration: Day / Night / Grayish
  const isNight = theme === 'dark';
  const isGray = theme === 'grayish';

  const themeConfig = useMemo(() => {
    if (isNight) {
      return {
        bg: '#020617',
        fog: '#020617',
        fogNear: 80,
        fogFar: 500,
        ambientColor: '#1E293B',
        ambientIntensity: 0.6,
        sunColor: '#93C5FD',
        sunIntensity: 0.9,
        sunPos: [15, 30, 20] as [number, number, number],
      };
    }
    if (isGray) {
      return {
        bg: '#1E293B',
        fog: '#1E293B',
        fogNear: 85,
        fogFar: 550,
        ambientColor: '#94A3B8',
        ambientIntensity: 1.0,
        sunColor: '#F1F5F9',
        sunIntensity: 1.5,
        sunPos: [20, 35, 20] as [number, number, number],
      };
    }
    // Day mode (Sunlit bright Caribbean sea)
    return {
      bg: '#0284C7',
      fog: '#0284C7',
      fogNear: 90,
      fogFar: 600,
      ambientColor: '#BAE6FD',
      ambientIntensity: 1.3,
      sunColor: '#FFFBEB',
      sunIntensity: 2.5,
      sunPos: [25, 45, 20] as [number, number, number],
    };
  }, [isNight, isGray]);

  // Camera settings per mode
  const initialCameraPosition: [number, number, number] = useMemo(() => {
    switch (cameraMode) {
      case 'CHASE':
        return [-12, 8, -24];
      case 'FISH':
        return [selectedCluster.x + 12, selectedCluster.y + 6, selectedCluster.z + 12];
      case 'TOP_DOWN':
        return [0, 85, 0.1];
      default:
        return [-16, 22, 34];
    }
  }, [cameraMode, selectedCluster]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: themeConfig.bg, overflow: 'hidden' }}>
      {/* 3D WebGL Canvas with visible seabed bathymetry and infinite zoom-out clipping planes */}
      <Canvas
        camera={{ position: initialCameraPosition, fov: 48, near: 0.5, far: 1200 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={[themeConfig.bg]} />
        <fog attach="fog" args={[themeConfig.fog, themeConfig.fogNear, themeConfig.fogFar]} />

        {/* Ambient & Directional Sun/Moon Lighting */}
        <ambientLight intensity={themeConfig.ambientIntensity} color={themeConfig.ambientColor} />
        <directionalLight position={themeConfig.sunPos} intensity={themeConfig.sunIntensity} color={themeConfig.sunColor} />
        <pointLight position={[0, -4, 0]} intensity={1.2} color="#00F2FE" distance={70} />

        {/* Dynamic Forward Cruising & Camera Follower (Smooth Escort / Station-Keeping) */}
        <DynamicSceneController
          boatPosRef={boatPosRef}
          boatGroupRef={boatGroupRef}
          boatHeadingRef={boatHeadingRef}
          targetSchool={selectedCluster}
          targetSchoolIndex={selectedClusterIndex}
          cameraMode={cameraMode}
          controlsRef={controlsRef}
          onHudUpdate={handleHudUpdate}
        />

        {/* Visible Bathymetric Seabed Topography (Subsurface Trenches & Continental Shelf) */}
        <BathymetryTerrain visualMode={isNight ? 'NIGHT' : isGray ? 'GRAYISH' : 'DAY'} />

        {/* Calibrated 10km x 10km Ocean Boundary & Calibrated Depth Scale Ruler (<300m) */}
        <TacticalOceanVolumeBounds />

        {/* Ocean Surface Waves */}
        <OceanWaterSurface isNight={isNight} isGray={isGray} />

        {/* Cruising Fishing Boat Model (0.38 Scale) */}
        <FishingBoatModel
          boatGroupRef={boatGroupRef}
          isNight={isNight}
          isStationKeeping={isStationKeeping}
        />

        {/* Biological Fish Schools (Synchronized with exact same simulation data and 3D positions) */}
        {clusters.map((c, idx) => (
          <FishCluster3D
            key={c.id}
            cluster={c}
            clusterIndex={idx}
            isSelected={c.id === selectedClusterId}
            onSelect={() => {
              setSelectedClusterId(c.id);
              if (onSelectCluster) onSelectCluster(c);
            }}
          />
        ))}

        {/* Dynamic Course Vector connecting Moving Boat to Target */}
        <DynamicNavigationRouteVector
          boatPos={boatPosRef.current}
          targetSchool={selectedCluster}
          targetSchoolIndex={selectedClusterIndex}
          isStationKeeping={isStationKeeping}
        />

        {/* Touch & Mouse Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={250}
          maxPolarAngle={Math.PI / 2 + 0.35}
        />
      </Canvas>

      {/* Top Floating Fisherman HUD (Live Speed, Heading, Dynamic Distance & Real ETA) */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 20,
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(11, 19, 32, 0.94)',
          backdropFilter: 'blur(8px)',
          border: isStationKeeping ? '1px solid rgba(0, 230, 153, 0.45)' : '1px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: isStationKeeping ? '0 4px 16px rgba(0, 230, 153, 0.25)' : '0 4px 16px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.3s ease',
        }}>
          <div>
            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#94A3B8', letterSpacing: '0.05em' }}>
              VESSEL "NORDIC RUNNER" // SPEED: {isStationKeeping ? '2.1 KTS (MATCHING SCHOOL)' : '7.2 KTS (TRANSIT)'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: isStationKeeping ? '#00E699' : '#00F2FE', fontFamily: 'monospace' }}>
              {isStationKeeping ? `🟢 ESCORTING ${selectedCluster.commonName.toUpperCase()}` : `SAILING TO ${selectedCluster.commonName.toUpperCase()} // HDG ${liveBearingDeg}°`}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#94A3B8' }}>
              {isStationKeeping ? 'TACTICAL ESCORT' : 'DISTANCE & ESTIMATED ETA'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: isStationKeeping ? '#00E699' : '#00F2FE', fontFamily: 'monospace' }}>
              {isStationKeeping ? 'STATION HELD (0.0 NM)' : `${liveDistanceNM} NM (${liveEtaMin} MIN)`}
            </div>
          </div>
        </div>
      </div>

      {/* Top-Right Theme Selector & Camera Controls Widget */}
      <div style={{
        position: 'absolute',
        top: '64px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 20,
      }}>
        {/* Day / Night Theme Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(11, 19, 32, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--color-slate-border)',
          borderRadius: '6px',
          padding: '2px',
          gap: '2px',
        }}>
          <button
            onClick={() => setTheme('light')}
            title="Day Mode: Sunlit turquoise Caribbean sea"
            style={{
              padding: '4px 7px',
              fontSize: '10px',
              fontFamily: 'monospace',
              borderRadius: '4px',
              border: theme === 'light' ? '1px solid #FFB703' : '1px solid transparent',
              background: theme === 'light' ? 'rgba(255, 183, 3, 0.25)' : 'transparent',
              color: theme === 'light' ? '#FFB703' : '#94A3B8',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ☀️ DAY
          </button>
          <button
            onClick={() => setTheme('dark')}
            title="Night Mode: Bioluminescent night ocean"
            style={{
              padding: '4px 7px',
              fontSize: '10px',
              fontFamily: 'monospace',
              borderRadius: '4px',
              border: theme === 'dark' ? '1px solid #00F2FE' : '1px solid transparent',
              background: theme === 'dark' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              color: theme === 'dark' ? '#00F2FE' : '#94A3B8',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            🌙 NIGHT
          </button>
        </div>

        {/* Camera Presets */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          background: 'rgba(11, 19, 32, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--color-slate-border)',
          borderRadius: '6px',
          padding: '4px',
        }}>
          {[
            { id: 'TACTICAL', label: '🌐 3D SEA' },
            { id: 'CHASE', label: '⛵ BOAT' },
            { id: 'FISH', label: '🐟 FOCUS' },
            { id: 'TOP_DOWN', label: '⬇️ MAP' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setCameraMode(m.id as any)}
              style={{
                padding: '4px 8px',
                fontSize: '9px',
                fontFamily: 'monospace',
                borderRadius: '4px',
                border: cameraMode === m.id ? '1px solid #00F2FE' : '1px solid transparent',
                background: cameraMode === m.id ? 'rgba(0, 242, 254, 0.18)' : 'transparent',
                color: cameraMode === m.id ? '#00F2FE' : '#94A3B8',
                cursor: 'pointer',
                fontWeight: cameraMode === m.id ? 800 : 500,
                textAlign: 'left',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Floating Catch & Net Depth Advisory Card */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        right: '8px',
        background: 'rgba(11, 19, 32, 0.95)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${selectedCluster.color}`,
        borderRadius: '8px',
        padding: '8px 10px',
        zIndex: 20,
        boxShadow: `0 4px 20px ${selectedCluster.color}35`,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: selectedCluster.color,
              boxShadow: `0 0 8px ${selectedCluster.color}`,
            }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFFFFF' }}>
              {selectedCluster.commonName.toUpperCase()}
            </span>
          </div>

          <span style={{
            fontSize: '9px',
            fontFamily: 'monospace',
            color: selectedCluster.color,
            fontWeight: 700,
            background: `${selectedCluster.color}20`,
            padding: '2px 6px',
            borderRadius: '3px',
          }}>
            ~{selectedCluster.biomassTons} TONS
          </span>
        </div>

        {/* Detailed Fisherman Net Guidance */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '4px',
          fontSize: '9px',
          fontFamily: 'monospace',
          background: 'rgba(5, 10, 20, 0.7)',
          padding: '5px 8px',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div>
            <span style={{ color: '#94A3B8' }}>EST. VALUE: </span>
            <span style={{ color: '#00E699', fontWeight: 700 }}>{selectedCluster.marketValueINR}</span>
          </div>
          <div>
            <span style={{ color: '#94A3B8' }}>TARGET DEPTH: </span>
            <span style={{ color: '#00F2FE', fontWeight: 700 }}>{selectedCluster.depth_m}m</span>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#FFB703' }}>GEAR ADVISORY: </span>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{selectedCluster.recommendedNetDepth}</span>
          </div>
        </div>

        {/* Destination Target Selector Buttons */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
          {clusters.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedClusterId(c.id);
                if (onSelectCluster) onSelectCluster(c);
              }}
              style={{
                flex: 1,
                padding: '5px 3px',
                fontSize: '9px',
                fontFamily: 'monospace',
                fontWeight: 700,
                borderRadius: '4px',
                border: c.id === selectedClusterId ? `1px solid ${c.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                background: c.id === selectedClusterId ? `${c.color}25` : 'rgba(255, 255, 255, 0.04)',
                color: c.id === selectedClusterId ? c.color : '#94A3B8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {c.id.includes('TUNA') ? '🐟 TUNA' : c.id.includes('MACK') ? '🟡 MACKEREL' : '🟢 SARDINES'} ({c.biomassTons}t)
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
