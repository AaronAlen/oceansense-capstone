// ==============================================================================
// OceanSense — 3D Node Engineering & Safety Simulation Studio
// Interactive 3D WebGL Studio demonstrating:
// 1. Boat Collision & Propeller Avoidance (Duck-under elastomer keel)
// 2. Net Entanglement Defense (Slick Teflon spar & taut mooring)
// 3. Full Underwater Vertical Architecture (Surface to 35m seabed)
// 4. Internal X-Ray Cutaway (LiFePO4 battery, ESP32, Viton seals, Zinc anodes)
// 5. Data Uplink Pipeline (Sonar echo -> Edge FFT -> LoRa/4G beam to Cloud)
// 6. Mobile Telemetry Downlink (Cloud -> Vessel -> Fisherman Mobile 3D Twin)
// ==============================================================================

import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Layers,
  Radio,
  Wifi,
  Smartphone,
  Anchor,
  Sparkles,
  X,
  Compass,
  CheckCircle,
  AlertTriangle,
  Film,
} from 'lucide-react';

export type ScenarioType =
  | 'BOAT_COLLISION'
  | 'NET_DEFENSE'
  | 'UNDERWATER_FULL'
  | 'INTERNAL_XRAY'
  | 'DATA_UPLINK'
  | 'MOBILE_DOWNLINK';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialScenario?: ScenarioType;
}

// ------------------------------------------------------------------------------
// SCENARIO 1: BOAT COLLISION & DUCK-UNDER PHYSICS
// ------------------------------------------------------------------------------
function BoatCollisionScene({ playTime }: { playTime: number }) {
  const buoyRef = useRef<THREE.Group>(null);
  const boatRef = useRef<THREE.Group>(null);
  const propRef = useRef<THREE.Mesh>(null);

  // 25s loop cycle
  const cycle = (playTime % 20) / 20; // 0 to 1
  // Boat moves from -16 to +16 in Z
  const boatZ = -14 + cycle * 28;

  // Collision happens when boatZ is between -3 and +4
  // Buoy ducks under between -2.5 and +3.5
  let duckAngle = 0;
  if (boatZ >= -3.5 && boatZ <= 3.5) {
    const p = (boatZ + 3.5) / 7.0; // 0 to 1
    duckAngle = Math.sin(p * Math.PI) * 1.35; // tilts up to ~77 degrees
  }

  useFrame(() => {
    if (buoyRef.current) {
      buoyRef.current.rotation.x = duckAngle;
      buoyRef.current.position.y = -Math.abs(duckAngle) * 0.9; // dips underwater
    }
    if (boatRef.current) {
      boatRef.current.position.z = boatZ;
    }
    if (propRef.current) {
      propRef.current.rotation.z += 0.35;
    }
  });

  return (
    <group>
      {/* Ocean Water Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#034B75" transparent opacity={0.65} roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Commercial Fishing Trawler */}
      <group ref={boatRef} position={[0, 0.45, boatZ]}>
        {/* Hull */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[3.2, 1.4, 8.5]} />
          <meshStandardMaterial color="#1E293B" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Bow Wedge */}
        <mesh position={[0, 0.3, 4.6]} rotation={[0, 0, 0]}>
          <coneGeometry args={[1.6, 2.2, 4]} />
          <meshStandardMaterial color="#881337" roughness={0.4} />
        </mesh>
        {/* Red Keel Bottom */}
        <mesh position={[0, -0.6, 0]}>
          <boxGeometry args={[2.9, 0.5, 8.2]} />
          <meshStandardMaterial color="#DC2626" roughness={0.6} />
        </mesh>
        {/* Spinning Bronze Propeller */}
        <group position={[0, -0.6, -4.3]}>
          <mesh ref={propRef}>
            <cylinderGeometry args={[0.65, 0.65, 0.08, 4]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.1, 1.2, 0.7]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      </group>

      {/* OceanSense Yellow Spar Buoy with Self-Righting Elastomer Keel */}
      <group ref={buoyRef} position={[0, 0.1, 0]}>
        {/* Propeller Deflector Ring (Top Mast) */}
        <mesh position={[0, 2.4, 0]}>
          <torusGeometry args={[0.85, 0.05, 8, 24]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} />
        </mesh>
        {/* Amber Flashing Navigational Strobe */}
        <mesh position={[0, 2.7, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial color="#FFB703" />
        </mesh>
        {/* Yellow Rotomolded Spar Body */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.45, 0.85, 2.4, 24]} />
          <meshStandardMaterial color="#FACC15" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Articulated Black Elastomer Bellows / Hinge */}
        <mesh position={[0, -0.9, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.8, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.9} />
        </mesh>
        {/* Heavy 30kg Low-Center-of-Gravity Keel Ballast */}
        <mesh position={[0, -1.8, 0]}>
          <cylinderGeometry args={[0.3, 0.55, 1.0, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Taut Mooring Cable (going down) */}
        <mesh position={[0, -5.0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 6.0, 8]} />
          <meshBasicMaterial color="#00F2FE" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Telemetry Annotation Billboard */}
      <Html position={[2.5, 2.0, 0]} center zIndexRange={[15, 0]}>
        <div style={{
          background: 'rgba(5, 12, 26, 0.92)',
          border: '1.5px solid #FFB703',
          padding: '8px 12px',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#FFF',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 16px rgba(255, 183, 3, 0.4)',
        }}>
          <div style={{ color: '#FFB703', fontWeight: 800 }}>⚡ COLLISION SURVIVAL MODE</div>
          <div>BOAT PROXIMITY: <span style={{ color: '#00F2FE' }}>{Math.abs(boatZ).toFixed(1)}m</span></div>
          <div>ELASTOMER TILT: <span style={{ color: duckAngle > 0.2 ? '#FF3B30' : '#00E699' }}>{Math.round((duckAngle * 180) / Math.PI)}° DUCK-UNDER</span></div>
          <div>PROPELLER DEFLECTOR: <span style={{ color: '#00E699' }}>CLEAR (SAFE)</span></div>
        </div>
      </Html>
    </group>
  );
}

// ------------------------------------------------------------------------------
// SCENARIO 2: NET ENTANGLEMENT DEFENSE (SLICK SPAR & TAUT CABLE)
// ------------------------------------------------------------------------------
function NetEntanglementScene({ playTime }: { playTime: number }) {
  const netRef = useRef<THREE.Group>(null);
  const cycle = (playTime % 18) / 18;
  const netX = -12 + cycle * 24;

  useFrame(() => {
    if (netRef.current) {
      netRef.current.position.x = netX;
    }
  });

  return (
    <group>
      {/* Water Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0284C7" transparent opacity={0.6} roughness={0.1} />
      </mesh>

      {/* OceanSense Smooth Spar Buoy */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.55, 0.65, 2.2, 24]} />
          <meshStandardMaterial color="#FACC15" roughness={0.1} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.8, 0]}>
          <sphereGeometry args={[0.55, 24, 16]} />
          <meshStandardMaterial color="#FACC15" roughness={0.1} />
        </mesh>
        {/* Vertically Taut Armored Mooring Line */}
        <mesh position={[0, -6, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 12, 8]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} />
        </mesh>
      </group>

      {/* Sweeping Commercial Fishing Driftnet */}
      <group ref={netRef} position={[netX, 0, 0]}>
        {/* Floating Cork Top Line */}
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 14, 8]} />
          <meshStandardMaterial color="#EA580C" />
        </mesh>
        {/* Net Mesh Grid (semi-transparent green curtain) */}
        <mesh position={[0, -3.0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[14, 6, 20, 12]} />
          <meshBasicMaterial color="#10B981" wireframe transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <Html position={[2.5, 1.5, 0]} center zIndexRange={[15, 0]}>
        <div style={{
          background: 'rgba(5, 12, 26, 0.92)',
          border: '1.5px solid #00E699',
          padding: '8px 12px',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#FFF',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 16px rgba(0, 230, 153, 0.4)',
        }}>
          <div style={{ color: '#00E699', fontWeight: 800 }}>🛡️ ANTI-SNAG TEFLON COATING</div>
          <div>SURFACE FRICTION: <span style={{ color: '#00F2FE' }}>0.04 (ULTRA-SLICK)</span></div>
          <div>NET CONTACT: <span style={{ color: Math.abs(netX) < 1.5 ? '#FFB703' : '#00E699' }}>
            {Math.abs(netX) < 1.5 ? 'SLIDING HARMLESSLY OVER SPAR' : 'CLEAR OF DRIFTNET'}
          </span></div>
          <div>TETHER TENSION: <span style={{ color: '#00E699' }}>420 N (NOMINAL)</span></div>
        </div>
      </Html>
    </group>
  );
}

// ------------------------------------------------------------------------------
// SCENARIO 3: FULL UNDERWATER ARCHITECTURE (SURFACE TO 35M SEABED)
// ------------------------------------------------------------------------------
function UnderwaterFullArchitectureScene({ playTime }: { playTime: number }) {
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (pulseRef.current) {
      const scale = 1.0 + ((playTime * 1.5) % 4.0);
      pulseRef.current.scale.set(scale, scale, scale);
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0, 0.6 - (scale - 1) * 0.15);
    }
  });

  return (
    <group position={[0, 4, 0]}>
      {/* Ocean Surface Level (0m) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0284C7" transparent opacity={0.5} roughness={0.1} />
      </mesh>
      {/* Surface Yellow Spar Buoy */}
      <group position={[0, 0.4, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.7, 1.8, 16]} />
          <meshStandardMaterial color="#FACC15" roughness={0.2} />
        </mesh>
        <Html position={[1.5, 0.5, 0]} center>
          <span style={{ background: '#0F172A', color: '#FACC15', padding: '2px 6px', fontSize: '10px', fontFamily: 'monospace', borderRadius: '3px' }}>
            0m: SURFACE TELEMETRY BUOY
          </span>
        </Html>
      </group>

      {/* Vertically Taut Armored Mooring Cable */}
      <mesh position={[0, -8, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 16, 8]} />
        <meshStandardMaterial color="#64748B" metalness={0.9} />
      </mesh>

      {/* Subsurface Acoustic Sensor Pod (Clamped at 15m Depth) */}
      <group position={[0, -6.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.55, 0.55, 1.4, 16]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Dual Zinc Sacrificial Anodes */}
        <mesh position={[-0.6, 0, 0]}>
          <boxGeometry args={[0.2, 0.4, 0.3]} />
          <meshStandardMaterial color="#94A3B8" roughness={0.6} />
        </mesh>
        <mesh position={[0.6, 0, 0]}>
          <boxGeometry args={[0.2, 0.4, 0.3]} />
          <meshStandardMaterial color="#94A3B8" roughness={0.6} />
        </mesh>
        {/* Acoustic Sonar Radial Wave Pulse */}
        <mesh ref={pulseRef}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#00F2FE" wireframe transparent opacity={0.35} />
        </mesh>
        <Html position={[1.8, 0, 0]} center>
          <span style={{ background: '#0F172A', color: '#00F2FE', padding: '2px 6px', fontSize: '10px', fontFamily: 'monospace', borderRadius: '3px' }}>
            15m: DUAL-FREQ SONAR POD (50/200 kHz)
          </span>
        </Html>
      </group>

      {/* Seabed Concrete Sinker Anchor (at 35m Depth) */}
      <group position={[0, -15, 0]}>
        <mesh>
          <boxGeometry args={[2.5, 1.0, 2.5]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        <Html position={[2.2, 0, 0]} center>
          <span style={{ background: '#0F172A', color: '#CBD5E1', padding: '2px 6px', fontSize: '10px', fontFamily: 'monospace', borderRadius: '3px' }}>
            35m: 45kg BENTHIC SINKER ANCHOR
          </span>
        </Html>
      </group>

      {/* Sandy Seabed Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -15.5, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#D97706" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------------------
// SCENARIO 4: INTERNAL X-RAY CUTAWAY & COMPONENT EXPLODED VIEW
// ------------------------------------------------------------------------------
function InternalXrayCutawayScene({ playTime }: { playTime: number }) {
  const explodeOffset = Math.sin(playTime * 0.8) * 0.5 + 0.5; // 0 to 1

  return (
    <group rotation={[0, playTime * 0.2, 0]}>
      {/* Outer Shell Left Half (Explodes outward) */}
      <mesh position={[-0.8 - explodeOffset * 0.8, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 2.0, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#FACC15" transparent opacity={0.65} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Outer Shell Right Half */}
      <mesh position={[0.8 + explodeOffset * 0.8, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 2.0, 16, 1, false, Math.PI, Math.PI]} />
        <meshStandardMaterial color="#FACC15" transparent opacity={0.65} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Core Internal Electronics Stack */}
      <group position={[0, 0, 0]}>
        {/* LiFePO4 Cylindrical Battery Pack */}
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.8, 16]} />
          <meshStandardMaterial color="#2563EB" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Double Red Viton O-Ring Gaskets */}
        <mesh position={[0, 0.1, 0]}>
          <torusGeometry args={[0.55, 0.04, 8, 24]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <torusGeometry args={[0.55, 0.04, 8, 24]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
        {/* ESP32-S3 & DSP Processor Green Circuit Board */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.55, 0.65, 0.06]} />
          <meshStandardMaterial color="#15803D" roughness={0.4} />
        </mesh>
        {/* Microcontroller Processor Chip */}
        <mesh position={[0, 0.55, 0.04]}>
          <boxGeometry args={[0.2, 0.2, 0.02]} />
          <meshStandardMaterial color="#0F172A" metalness={0.9} />
        </mesh>
      </group>

      <Html position={[1.8, 0.8, 0]} center zIndexRange={[15, 0]}>
        <div style={{
          background: 'rgba(5, 12, 26, 0.94)',
          border: '1px solid #00F2FE',
          padding: '6px 10px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#FFF',
          whiteSpace: 'nowrap',
        }}>
          <div>🔋 LiFePO4 Battery Pack (8-Year Life)</div>
          <div>🛡️ Double Viton O-Rings (10 Bar Pressure)</div>
          <div>💻 ESP32-S3 + ARM Cortex DSP Brain</div>
          <div>⚡ Sacrificial Zinc Anodes (₹550 Replacement)</div>
        </div>
      </Html>
    </group>
  );
}

// ------------------------------------------------------------------------------
// SCENARIO 5: DATA UPLINK TRANSMISSION (ACOUSTIC -> LORA/4G TO CLOUD)
// ------------------------------------------------------------------------------
function DataUplinkScene({ playTime }: { playTime: number }) {
  const radioRingsRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (radioRingsRef.current) {
      radioRingsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const progress = ((playTime * 1.8 + i * 0.4) % 2.0) / 2.0;
        mesh.scale.set(progress * 3.5, progress * 3.5, progress * 3.5);
        mesh.position.y = 2.0 + progress * 4.0;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = Math.max(0, 0.8 - progress * 0.8);
      });
    }
  });

  return (
    <group>
      {/* Ocean Water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0B132B" transparent opacity={0.7} />
      </mesh>

      {/* Surface Buoy */}
      <group position={[0, 0.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.8, 1.8, 16]} />
          <meshStandardMaterial color="#FACC15" />
        </mesh>
        {/* Antenna Mast */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.9} />
        </mesh>
      </group>

      {/* Radiating LoRaWAN / 4G Electromagnetic Waves */}
      <group ref={radioRingsRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.75, 32]} />
            <meshBasicMaterial color="#00F2FE" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Cloud Network Target */}
      <group position={[0, 7.5, 0]}>
        <mesh>
          <sphereGeometry args={[1.0, 16, 16]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} />
        </mesh>
        <Html position={[0, 1.4, 0]} center>
          <span style={{ background: '#0F172A', color: '#00F2FE', padding: '3px 8px', fontSize: '11px', fontFamily: 'monospace', borderRadius: '4px', border: '1px solid #00F2FE' }}>
            ☁️ OCEAN SENSE CLOUD API (POSTGRESQL + WEBSOCKETS)
          </span>
        </Html>
      </group>
    </group>
  );
}

// ------------------------------------------------------------------------------
// SCENARIO 6: MOBILE DOWNLINK TO FISHERMAN AT SEA
// ------------------------------------------------------------------------------
function MobileDownlinkScene({ playTime }: { playTime: number }) {
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = 0.4 + Math.sin(playTime * 5.0) * 0.2;
    }
  });

  return (
    <group>
      {/* Ocean Water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0369A1" transparent opacity={0.6} />
      </mesh>

      {/* Commercial Fishing Trawler */}
      <group position={[0, 0.4, 0]}>
        <mesh>
          <boxGeometry args={[3.0, 1.2, 7.5]} />
          <meshStandardMaterial color="#1E293B" />
        </mesh>
        <mesh position={[0, 1.4, -0.6]}>
          <boxGeometry args={[2.2, 1.4, 2.4]} />
          <meshStandardMaterial color="#F8FAFC" />
        </mesh>
      </group>

      {/* Downlink Light Beam from Satellite/Cloud to Vessel */}
      <mesh ref={beamRef} position={[0, 6.0, 0]}>
        <cylinderGeometry args={[0.2, 2.5, 12, 16]} />
        <meshBasicMaterial color="#00F2FE" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Giant Floating Mobile Phone UI Screen Displaying Tactical Feed */}
      <Html position={[0, 2.8, 1.5]} center zIndexRange={[15, 0]}>
        <div style={{
          background: 'rgba(5, 12, 26, 0.95)',
          border: '2px solid #00F2FE',
          borderRadius: '10px',
          padding: '10px',
          width: '260px',
          fontFamily: 'monospace',
          color: '#FFF',
          boxShadow: '0 0 24px rgba(0, 242, 254, 0.5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '4px', fontSize: '9px', color: '#00F2FE' }}>
            <span>📱 FISHERMAN PWA</span>
            <span>⚡ LIVE WS FEED</span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: 800 }}>
            🐟 TARGET: ATLANTIC BLUEFIN TUNA
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8' }}>
            DEPTH: <strong style={{ color: '#00F2FE' }}>145m</strong> | BIOMASS: <strong style={{ color: '#FFB703' }}>18.5T</strong>
          </div>
          <div style={{ fontSize: '9px', color: '#00E699', marginTop: '4px' }}>
            ✓ FUEL SAVING COURSE VECTOR LOCKED
          </div>
        </div>
      </Html>
    </group>
  );
}

// ==============================================================================
// MAIN STUDIO COMPONENT
// ==============================================================================
export const NodeSafetyStudioModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialScenario = 'BOAT_COLLISION',
}) => {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(initialScenario);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simTime, setSimTime] = useState<number>(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());

  React.useEffect(() => {
    let running = isPlaying;
    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      if (running) {
        setSimTime((prev) => prev + dt);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying]);

  if (!isOpen) return null;

  const scenarios: { id: ScenarioType; label: string; icon: string; desc: string }[] = [
    {
      id: 'BOAT_COLLISION',
      label: '1. Boat Collision & Propeller Avoidance',
      icon: '🚢',
      desc: 'Demonstrates the self-righting duck-under elastomer keel pivoting 90° under boat hull, avoiding propeller strike.',
    },
    {
      id: 'NET_DEFENSE',
      label: '2. Net Entanglement Defense',
      icon: '🪢',
      desc: 'Shows commercial driftnets sliding smoothly over the slick Teflon HDPE spar hull without snagging.',
    },
    {
      id: 'UNDERWATER_FULL',
      label: '3. Full Underwater Architecture',
      icon: '🌊',
      desc: 'Wide-angle vertical ocean column from surface buoy down to 15m acoustic pod and 35m seabed sinker anchor.',
    },
    {
      id: 'INTERNAL_XRAY',
      label: '4. Internal X-Ray Cutaway',
      icon: '🔬',
      desc: 'Exploded engineering view of LiFePO4 battery, ESP32 DSP microcontroller, double Viton O-rings, and zinc anodes.',
    },
    {
      id: 'DATA_UPLINK',
      label: '5. Data Uplink Pipeline',
      icon: '📡',
      desc: 'Shows acoustic pings converted to 48-byte packets and transmitted over LoRa/4G radio waves to the Cloud.',
    },
    {
      id: 'MOBILE_DOWNLINK',
      label: '6. Fisherman Mobile Downlink',
      icon: '📱',
      desc: 'Real-time WebSocket stream delivering 2D tactical radar and 3D digital twin to commercial fishermen at sea.',
    },
  ];

  const currentScenarioMeta = scenarios.find((s) => s.id === activeScenario)!;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2, 6, 23, 0.88)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1180px',
        height: '92vh',
        background: '#0B132B',
        border: '1px solid #1E3A5F',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
      }}>
        {/* Top Header */}
        <div style={{
          padding: '12px 18px',
          background: 'linear-gradient(90deg, #070B19, #0F1D36)',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#00F2FE', letterSpacing: '1px' }}>
              OCEANSENSE // 3D HARDWARE ENGINEERING & SAFETY STUDIO
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFF' }}>
              {currentScenarioMeta.icon} {currentScenarioMeta.label}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Play/Pause & Reset */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background: isPlaying ? 'rgba(247, 37, 133, 0.2)' : 'rgba(0, 230, 153, 0.2)',
                border: isPlaying ? '1px solid #F72585' : '1px solid #00E699',
                color: isPlaying ? '#F72585' : '#00E699',
                borderRadius: '5px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'PAUSE (30s LOOP)' : 'RESUME'}</span>
            </button>

            <button
              onClick={() => setSimTime(0)}
              style={{
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #334155',
                color: '#CBD5E1',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                padding: '6px',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Scenario Switcher Sidebar */}
          <div style={{
            width: '310px',
            background: '#070E1E',
            borderRight: '1px solid #1E293B',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
          }}>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B', letterSpacing: '0.5px' }}>
              SELECT CINEMATIC 3D SIMULATION:
            </div>

            {scenarios.map((sc) => {
              const active = activeScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    setActiveScenario(sc.id);
                    setSimTime(0);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: active ? 'linear-gradient(90deg, rgba(0, 242, 254, 0.15), rgba(0, 242, 254, 0.03))' : 'rgba(255, 255, 255, 0.02)',
                    border: active ? '1px solid #00F2FE' : '1px solid #1E293B',
                    color: active ? '#FFF' : '#94A3B8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: active ? '#00F2FE' : '#E2E8F0' }}>
                    <span>{sc.icon}</span>
                    <span>{sc.label}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px', lineHeight: 1.35 }}>
                    {sc.desc}
                  </div>
                </button>
              );
            })}

            {/* Simulation Timeline Indicator */}
            <div style={{
              marginTop: 'auto',
              padding: '10px',
              background: '#0B1626',
              borderRadius: '6px',
              border: '1px solid #1E293B',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}>
              <div style={{ color: '#00F2FE', display: 'flex', justifyContent: 'space-between' }}>
                <span>PLAYBACK TIMELINE:</span>
                <span>{(simTime % 20).toFixed(1)}s / 20.0s</span>
              </div>
              <div style={{ height: '4px', background: '#1E293B', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((simTime % 20) / 20) * 100}%`,
                  background: 'linear-gradient(90deg, #00F2FE, #00E699)',
                }} />
              </div>
            </div>
          </div>

          {/* 3D WebGL Canvas Viewport */}
          <div style={{ flex: 1, position: 'relative', background: '#020617' }}>
            <Canvas
              camera={{ position: [0, 4, 12], fov: 46 }}
              style={{ width: '100%', height: '100%' }}
            >
              <color attach="background" args={['#030C1C']} />
              <ambientLight intensity={1.2} />
              <directionalLight position={[10, 20, 15]} intensity={1.8} />
              <pointLight position={[-10, -5, -5]} intensity={0.6} color="#00F2FE" />

              {/* Render Selected 3D Scenario */}
              {activeScenario === 'BOAT_COLLISION' && <BoatCollisionScene playTime={simTime} />}
              {activeScenario === 'NET_DEFENSE' && <NetEntanglementScene playTime={simTime} />}
              {activeScenario === 'UNDERWATER_FULL' && <UnderwaterFullArchitectureScene playTime={simTime} />}
              {activeScenario === 'INTERNAL_XRAY' && <InternalXrayCutawayScene playTime={simTime} />}
              {activeScenario === 'DATA_UPLINK' && <DataUplinkScene playTime={simTime} />}
              {activeScenario === 'MOBILE_DOWNLINK' && <MobileDownlinkScene playTime={simTime} />}

              <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.08}
                minDistance={3}
                maxDistance={40}
              />
            </Canvas>

            {/* Orbit Helper Tip */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              background: 'rgba(5, 12, 26, 0.85)',
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #1E293B',
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#94A3B8',
              pointerEvents: 'none',
            }}>
              🖱️ LEFT CLICK + DRAG: ORBIT 360° | SCROLL: ZOOM
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
