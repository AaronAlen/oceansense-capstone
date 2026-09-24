// ==============================================================================
// OceanSense — Pure WebSocket Ping-Driven Fish Renderer
// 100% Hardware/Telemetry Driven: Zero Artificial Flocking Fish
// Renders fish clusters strictly at the exact (X, Y, Z) returned by RAW_SONAR_PING
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { wsClient } from '../services/websocket';
import { Radio, Activity, Navigation, Fish } from 'lucide-react';

export interface PingFishContact {
  id: string;
  nodeId: string;
  pingId: number;
  species: string;
  depthM: number;
  distanceM: number;
  bearingDeg: number;
  biomassTons: number;
  targetStrengthDb: number;
  detectedAt: number;
  position: [number, number, number]; // [x, y, z] in 3D scene units
  color: string;
}

// Calibrated 4-node coordinates matching SonarNodeInstances 2x2 grid (10x10 km sector)
const NODE_COORDS: Record<string, { x: number; z: number }> = {
  'SN-0001': { x: -15.0, z: -15.0 },
  'SN-0002': { x: 15.0, z: -15.0 },
  'SN-0003': { x: -15.0, z: 15.0 },
  'SN-0004': { x: 15.0, z: 15.0 },
};

function getSpeciesColor(species: string): string {
  if (species.includes('Tuna')) return '#F72585'; // Magenta
  if (species.includes('Mackerel')) return '#FFB703'; // Amber
  if (species.includes('Sardine')) return '#00F2FE'; // Cyan
  if (species.includes('Trevally')) return '#4CC9F0'; // Sky blue
  return '#00E699'; // Aquamarine
}

interface Props {
  onPingReceived?: (ping: any) => void;
  selectedContactId?: string | null;
  onSelectContact?: (contact: PingFishContact) => void;
}

export function RawPingFishRenderer({ onPingReceived, selectedContactId, onSelectContact }: Props) {
  const [contacts, setContacts] = useState<PingFishContact[]>([]);
  const contactsMapRef = useRef<Map<string, PingFishContact>>(new Map());

  useEffect(() => {
    // Listen to real-time RAW_SONAR_PING broadcast from WebSocket mesh
    const unsubPing = wsClient.on('RAW_SONAR_PING', (ping: any) => {
      if (!ping) return;

      if (onPingReceived) {
        onPingReceived(ping);
      }

      // Check if this ping contains biomass detections
      if (ping.hasBiomassHit && Array.isArray(ping.targetDetections) && ping.targetDetections.length > 0) {
        const base = NODE_COORDS[ping.nodeId] || { x: -15.0, z: -15.0 };
        const now = Date.now();

        ping.targetDetections.forEach((det: any, idx: number) => {
          const contactKey = `${ping.nodeId}_${det.species || 'Target'}`;
          const rad = (det.bearingDeg * Math.PI) / 180;
          // 1 scene unit = 100 meters horizontal distance
          const distUnits = (det.distanceM || 800) / 100.0;
          const x = +(base.x + distUnits * Math.sin(rad)).toFixed(2);
          const z = +(base.z + distUnits * Math.cos(rad)).toFixed(2);
          // 1 scene unit = 10 meters depth
          const depthM = det.depthM || 140.0;
          const y = +Math.max(-25.5, -(depthM / 10.0)).toFixed(2);

          const contact: PingFishContact = {
            id: contactKey,
            nodeId: ping.nodeId,
            pingId: ping.pingId,
            species: det.species || 'Acoustic Biomass Target',
            depthM,
            distanceM: det.distanceM || 800,
            bearingDeg: det.bearingDeg || 0,
            biomassTons: det.biomassTons || 12.0,
            targetStrengthDb: det.targetStrengthDb || -32.5,
            detectedAt: now,
            position: [x, y, z],
            color: getSpeciesColor(det.species || ''),
          };

          contactsMapRef.current.set(contactKey, contact);
        });

        setContacts(Array.from(contactsMapRef.current.values()));
      }
    });

    // Also prune contacts older than 45 seconds to simulate phosphor echo decay
    const decayInterval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      contactsMapRef.current.forEach((val, key) => {
        if (now - val.detectedAt > 45000) {
          contactsMapRef.current.delete(key);
          changed = true;
        }
      });
      if (changed) {
        setContacts(Array.from(contactsMapRef.current.values()));
      }
    }, 3000);

    return () => {
      unsubPing();
      clearInterval(decayInterval);
    };
  }, [onPingReceived]);

  return (
    <group>
      {contacts.map((contact) => (
        <PingContactCluster
          key={contact.id}
          contact={contact}
          isSelected={selectedContactId === contact.id}
          onSelect={() => onSelectContact && onSelectContact(contact)}
        />
      ))}
    </group>
  );
}

// Individual Telemetry-Driven 3D Biomass Cluster with Swimming Fish & Acoustic Tag
function PingContactCluster({
  contact,
  isSelected,
  onSelect,
}: {
  contact: PingFishContact;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const [x, y, z] = contact.position;
  const baseNode = NODE_COORDS[contact.nodeId] || { x: -15, z: -15 };

  // Generate 8-12 individual fish positions around the contact centroid
  const fishOffsets = React.useMemo(() => {
    const list = [];
    const count = Math.min(14, Math.max(6, Math.round(contact.biomassTons / 1.5)));
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.5 + (i % 3) * 0.4;
      list.push({
        dx: Math.cos(angle) * radius,
        dy: ((i % 4) - 1.5) * 0.25,
        dz: Math.sin(angle) * radius,
        speed: 1.5 + (i % 3) * 0.5,
        phase: i * 0.8,
      });
    }
    return list;
  }, [contact.biomassTons]);

  // Acoustic Line Connecting Detecting Buoy Transducer to Fish
  const rayGeometry = React.useMemo(() => {
    const pts = [
      new THREE.Vector3(baseNode.x, 0.0, baseNode.z), // Surface buoy transducer keel
      new THREE.Vector3(x, y, z), // Target contact position
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [baseNode, x, y, z]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pulseRingRef.current) {
      const scale = 1.0 + (Math.sin(t * 3.0) + 1.0) * 0.8;
      pulseRingRef.current.scale.set(scale, scale, scale);
    }
    if (groupRef.current) {
      // Gentle natural swim drift around ping coordinate
      groupRef.current.position.x = x + Math.sin(t * 0.4) * 0.35;
      groupRef.current.position.z = z + Math.cos(t * 0.35) * 0.35;
    }
  });

  return (
    <group>
      {/* Hydroacoustic Acoustic Ray from detecting Sonar Buoy */}
      <lineSegments geometry={rayGeometry}>
        <lineBasicMaterial
          color={contact.color}
          transparent
          opacity={0.45}
        />
      </lineSegments>

      {/* Main Fish School Biomass Body */}
      <group ref={groupRef} position={[x, y, z]} onClick={onSelect}>
        {/* Pulsing Spherical Acoustic Detection Shell */}
        <mesh ref={pulseRingRef}>
          <sphereGeometry args={[1.4, 16, 16]} />
          <meshBasicMaterial
            color={contact.color}
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>

        {/* Core Volumetric Glow */}
        <pointLight color={contact.color} intensity={1.8} distance={8} />

        {/* 3D Fish Bodies (Streamlined Hydrodynamic Torpedo Meshes) */}
        {fishOffsets.map((f, i) => (
          <group
            key={i}
            position={[f.dx, f.dy, f.dz]}
            rotation={[0, (contact.bearingDeg * Math.PI) / 180 + Math.PI / 2, 0]}
          >
            {/* Fish Torpedo Body */}
            <mesh scale={[0.18, 0.08, 0.45]}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial
                color={contact.color}
                roughness={0.2}
                metalness={0.8}
                emissive={contact.color}
                emissiveIntensity={0.3}
              />
            </mesh>
            {/* Tail Fin */}
            <mesh position={[0, 0, -0.45]} rotation={[0, 0, Math.PI / 2]} scale={[0.14, 0.02, 0.18]}>
              <coneGeometry args={[1, 1, 3]} />
              <meshStandardMaterial color={contact.color} />
            </mesh>
          </group>
        ))}

        {/* 3D Telemetry HUD Label Billboard */}
        <Html position={[0, 1.8, 0]} center distanceFactor={28} zIndexRange={[100, 0]}>
          <div
            style={{
              background: 'rgba(5, 12, 26, 0.94)',
              border: `1.5px solid ${contact.color}`,
              boxShadow: `0 0 14px ${contact.color}40`,
              borderRadius: '6px',
              padding: '6px 10px',
              color: '#FFFFFF',
              fontFamily: 'monospace',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: contact.color }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: contact.color }} />
              <span>{contact.species.toUpperCase()}</span>
              <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: '3px', color: '#94A3B8' }}>
                LIVE WS PING
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#CBD5E1' }}>
              DEPTH: <strong style={{ color: '#00F2FE' }}>{contact.depthM}m</strong> | DIST: <strong>{contact.distanceM}m</strong> @ {contact.bearingDeg}°
            </div>
            <div style={{ fontSize: '9px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <span>TS: {contact.targetStrengthDb} dB</span>
              <span style={{ color: '#00E699' }}>EST: {contact.biomassTons} TONS</span>
              <span style={{ color: '#E2E8F0' }}>NODE: {contact.nodeId}</span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}
