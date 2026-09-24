// ==============================================================================
// OceanSense — Anchored Surface Telemetry Buoy Array & 360°x180° Acoustic Sonar Dome
// Demonstrates: Real Marine Floating Buoys, Solar Decks, Subsea Mooring Cables,
//               Heavy Seabed Sinker Anchors, and 360° Horizontal x 180° Vertical Sonar Domes
// ==============================================================================

import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

import { getSeabedElevation } from './BathymetryTerrain';

export interface Node3DData {
  id: string;
  zoneId: string;
  gatewayId: string;
  latitude: number;
  longitude: number;
  depth_m: number;
  status: string;
  battery_level: number;
  snr_db: number;
  tamper_status: string;
  tilt_angle_deg: number;
  charging_status?: string;
  power_source?: string;
  node_type?: string;
  mooring_depth_m?: number;
  transducer_depth_m?: number;
  horizontal_beam_deg?: number;
  vertical_beam_deg?: number;
  solar_charging?: boolean;
}

interface Props {
  nodes: Node3DData[];
  onSelectNode: (node: Node3DData) => void;
  selectedNodeId: string | null;
}

// Subcomponent for 360° Rotating Acoustic Sonar Blade Fan Beam
// Reaches from surface buoy (0m) down to seabed (<300m) and 1.5 km horizontal radius (3 km diameter)
function AcousticSonarBladeBeam({
  item,
  isSelected = false,
  offsetPhase = 0,
}: {
  item: { x: number; z: number; surfaceY: number; seabedY: number; node: Node3DData };
  isSelected?: boolean;
  offsetPhase?: number;
}) {
  const bladeGroupRef = useRef<THREE.Group>(null);
  const rippleRingsRef = useRef<THREE.Group>(null);

  const depthSpan = Math.abs(item.surfaceY - item.seabedY);
  const rangeRadius = 15.0; // 1.5km horizontal range in scene units (1 unit = 100m)

  // Create planar blade geometry: vertical fan plane from buoy keel to seabed
  const bladeGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    // 2 triangles forming vertical acoustic blade curtain
    const vertices = new Float32Array([
      0, 0, 0,
      rangeRadius, 0, 0,
      rangeRadius, -depthSpan, 0,

      0, 0, 0,
      rangeRadius, -depthSpan, 0,
      0, -depthSpan, 0,
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }, [depthSpan, rangeRadius]);

  // Seafloor swath line geometry where the blade touches the seabed
  const swathCurveGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    points.push(new THREE.Vector3(0, -depthSpan + 0.05, 0));
    points.push(new THREE.Vector3(rangeRadius, -depthSpan + 0.05, 0));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [depthSpan, rangeRadius]);

  // Rotate blade smoothly 360° continuously matching real scanning sonar (2.0 RPM = 0.2094 rad/s)
  useFrame(({ clock }) => {
    if (bladeGroupRef.current) {
      const time = Date.now() / 1000;
      // 2.0 RPM = 0.2094 rad/s (12 deg/s) + node phase offset (globally synchronized)
      bladeGroupRef.current.rotation.y = (time * 0.2094 + offsetPhase) % (Math.PI * 2);
    }

    // Ripple concentric acoustic waves outward along the blade
    if (rippleRingsRef.current) {
      const time = clock.getElapsedTime();
      rippleRingsRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        if (mesh && mesh.material) {
          const progress = ((time * 0.6 + idx * 0.25) % 1.0);
          const currentScale = 0.05 + progress * rangeRadius;
          mesh.scale.set(currentScale, currentScale * (depthSpan / rangeRadius), 1);
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, (1.0 - progress) * (isSelected ? 0.45 : 0.25));
        }
      });
    }
  });

  return (
    <group position={[item.x, item.surfaceY - 0.4, item.z ?? 0]}>
      {/* 360° Rotating Acoustic Blade Assembly */}
      <group ref={bladeGroupRef}>
        {/* Main Acoustic Blade Curtain (Vertical Planar Fan) */}
        <mesh geometry={bladeGeometry}>
          <meshBasicMaterial
            color={isSelected ? '#00F2FE' : '#00C2D1'}
            transparent
            opacity={isSelected ? 0.24 : 0.14}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Second blade layer for energy core */}
        <mesh geometry={bladeGeometry} scale={[0.98, 0.98, 1]}>
          <meshBasicMaterial
            color="#00E699"
            transparent
            opacity={isSelected ? 0.14 : 0.07}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Seafloor Swath Contact Line on the Seabed (<300m) */}
        <lineSegments geometry={swathCurveGeometry}>
          <lineBasicMaterial color={isSelected ? '#FFB703' : '#38BDF8'} transparent opacity={isSelected ? 0.9 : 0.6} />
        </lineSegments>

        {/* Glowing Contact Patch on Seabed */}
        <mesh position={[rangeRadius * 0.5, -depthSpan + 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[rangeRadius, 1.2]} />
          <meshBasicMaterial
            color={isSelected ? '#00F2FE' : '#0284C7'}
            transparent
            opacity={isSelected ? 0.32 : 0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Outward Travelling Acoustic Pulse Wave Arcs along the Blade */}
        <group ref={rippleRingsRef}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, 0, 0]}>
              <ringGeometry args={[0.95, 1.0, 32, 1, 0, Math.PI / 2]} />
              <meshBasicMaterial
                color="#00F2FE"
                transparent
                opacity={isSelected ? 0.4 : 0.2}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* 1.5km Horizontal Sonar Radius (3km Diameter) Footprint Perimeter Ring on Seafloor */}
      <mesh position={[0, -depthSpan + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[rangeRadius * 0.98, rangeRadius, 64]} />
        <meshBasicMaterial
          color={isSelected ? '#00F2FE' : '#0284C7'}
          transparent
          opacity={isSelected ? 0.28 : 0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function SonarNodeInstances({ nodes, onSelectNode, selectedNodeId }: Props) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute 2D coordinates across the 10x10 km sector [-38 to +38 in 3D units]
  // Ensures clean 2D distribution across both X and Z dimensions (NEVER a 1D line)
  const nodePositions = useMemo(() => {
    const total = nodes.length;
    return nodes.map((n, idx) => {
      let x = 0;
      let z = 0;

      if (total === 4) {
        // Exact 4-node 2x2 grid with 3 km spacing (30 scene units) in 10x10 km sector
        // SN-0001: [-15, -15], SN-0002: [+15, -15], SN-0003: [-15, +15], SN-0004: [+15, +15]
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        x = col === 0 ? -15.0 : 15.0;
        z = row === 0 ? -15.0 : 15.0;
      } else if (n.longitude && n.latitude) {
        x = ((n.longitude - 80.145) / 0.045) * 30.0;
        z = ((n.latitude - 10.245) / 0.045) * 30.0;
      } else {
        const sideX = Math.max(2, Math.round(Math.sqrt(total)));
        const sideZ = Math.max(2, Math.ceil(total / sideX));
        const col = idx % sideX;
        const row = Math.floor(idx / sideX);
        x = -30 + ((col + 0.5) / sideX) * 60;
        z = -30 + ((row + 0.5) / sideZ) * 60;
      }

      // Exact seabed floor elevation at (x, z) strictly < 300m (around -26.0 units)
      const seabedY = getSeabedElevation(x, z);
      const surfaceY = 0.35; // Floating on ocean surface
      return { x, z, surfaceY, seabedY, node: n };
    });
  }, [nodes]);

  // Find currently selected node
  const activeSelectedNode = useMemo(() => {
    return nodePositions.find((item) => item.node.id === selectedNodeId) || null;
  }, [nodePositions, selectedNodeId]);

  // Armored mooring cables connecting every surface buoy to its seabed anchor
  const mooringCablesGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    nodePositions.forEach((item) => {
      // Keel beneath surface buoy
      points.push(new THREE.Vector3(item.x, item.surfaceY - 0.4, item.z));
      // Benthic sinker anchor on seabed
      points.push(new THREE.Vector3(item.x, item.seabedY + 0.2, item.z));
    });
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [nodePositions]);

  // Horizontal inter-buoy telemetry mesh network links
  const meshLinkGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const count = nodePositions.length;
    if (count <= 1) return new THREE.BufferGeometry();

    const limit = Math.min(count, 50);
    for (let i = 0; i < limit; i++) {
      const p1 = nodePositions[i];
      for (let j = i + 1; j < limit; j++) {
        const p2 = nodePositions[j];
        const dx = p1.x - p2.x;
        const dz = p1.z - p2.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Link neighboring buoys within 3km square range
        if (dist <= 30) {
          points.push(new THREE.Vector3(p1.x, p1.surfaceY, p1.z));
          points.push(new THREE.Vector3(p2.x, p2.surfaceY, p2.z));
        }
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [nodePositions]);

  return (
    <group>
      {/* 1. Armored Mooring Cables (Surface Buoy to Seabed Anchor) */}
      <lineSegments geometry={mooringCablesGeometry}>
        <lineBasicMaterial color="#00F2FE" transparent opacity={0.35} depthWrite={false} />
      </lineSegments>

      {/* 2. Inter-Buoy Telemetry Mesh Network Links */}
      <lineSegments geometry={meshLinkGeometry}>
        <lineBasicMaterial color="#00E699" transparent opacity={0.2} depthWrite={false} />
      </lineSegments>

      {/* 3. Render Every Anchored Surface Buoy & Seabed Anchor in 2D Space */}
      {nodePositions.map((item) => {
        const isTampered = item.node.status === 'THEFT_SUSPECTED';
        const isSelected = item.node.id === selectedNodeId;
        // Proportionally calibrated scale for 10km x 10km grid with 280m (<300m) depth
        const isSmallScale = nodePositions.length <= 9;
        const buoyScale = isSmallScale ? 0.42 : isSelected ? 0.38 : 0.30;

        return (
          <group key={item.node.id} position={[item.x, 0, item.z ?? 0]}>
            {/* --- SEABED HEAVY SINKER ANCHOR BLOCK (<300m DEPTH) --- */}
            <mesh position={[0, item.seabedY + 0.08, 0]}>
              <boxGeometry args={[0.7 * buoyScale, 0.25 * buoyScale, 0.7 * buoyScale]} />
              <meshStandardMaterial color="#1E293B" roughness={0.9} metalness={0.6} />
            </mesh>
            {/* Anchor Eye Shackle */}
            <mesh position={[0, item.seabedY + 0.18, 0]}>
              <torusGeometry args={[0.12 * buoyScale, 0.03 * buoyScale, 8, 16]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.8} />
            </mesh>

            {/* --- SURFACE OCEANOGRAPHIC TELEMETRY BUOY (Floating at Water Surface) --- */}
            <group
              position={[isTampered ? 1.0 : 0, item.surfaceY, isTampered ? 0.8 : 0]}
              rotation={[isTampered ? 0.45 : 0, 0, isTampered ? 0.25 : 0]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(item.node);
              }}
            >
              {/* Buoy Toroidal Flotation Collar (Marine Safety Yellow) */}
              <mesh>
                <cylinderGeometry args={[0.65 * buoyScale, 0.5 * buoyScale, 0.7 * buoyScale, 20]} />
                <meshStandardMaterial
                  color={isTampered ? '#FF3B30' : '#FFB703'}
                  roughness={0.3}
                  metalness={0.2}
                />
              </mesh>

              {/* Status Indicator Band / Electric Trim */}
              <mesh position={[0, -0.05 * buoyScale, 0]}>
                <cylinderGeometry args={[0.67 * buoyScale, 0.62 * buoyScale, 0.22 * buoyScale, 20]} />
                <meshStandardMaterial
                  color={isTampered ? '#FF3B30' : '#00F2FE'}
                  emissive={isTampered ? '#880000' : '#004455'}
                  roughness={0.2}
                />
              </mesh>

              {/* Solar Photovoltaic Top Deck (Monocrystalline Dark Blue / Black) */}
              <mesh position={[0, 0.37 * buoyScale, 0]}>
                <cylinderGeometry args={[0.62 * buoyScale, 0.62 * buoyScale, 0.08 * buoyScale, 20]} />
                <meshStandardMaterial color="#0B132B" roughness={0.1} metalness={0.9} />
              </mesh>

              {/* Sub-surface Keel Acoustic Transducer Pod (-10m Keel Mount beneath water) */}
              <mesh position={[0, -0.75 * buoyScale, 0]}>
                <cylinderGeometry args={[0.18 * buoyScale, 0.24 * buoyScale, 0.45 * buoyScale, 16]} />
                <meshStandardMaterial color="#0284C7" metalness={0.8} roughness={0.3} />
              </mesh>

              {/* Daymark Lattice Mast */}
              <mesh position={[0, 1.05 * buoyScale, 0]}>
                <cylinderGeometry args={[0.06 * buoyScale, 0.08 * buoyScale, 1.3 * buoyScale, 8]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.7} />
              </mesh>

              {/* GPS & 4G/Satellite Uplink Radome Dome */}
              <mesh position={[0, 1.75 * buoyScale, 0]}>
                <sphereGeometry args={[0.22 * buoyScale, 16, 16]} />
                <meshStandardMaterial color="#F8FAFC" roughness={0.1} />
              </mesh>

              {/* Navigational Flashing Beacon LED Light */}
              <mesh position={[0, 2.05 * buoyScale, 0]}>
                <sphereGeometry args={[0.14 * buoyScale, 14, 14]} />
                <meshBasicMaterial color={isTampered ? '#FF3B30' : '#00F2FE'} />
              </mesh>

              {/* Luminous Glow Halo */}
              <mesh position={[0, 2.05 * buoyScale, 0]}>
                <sphereGeometry args={[0.26 * buoyScale, 10, 10]} />
                <meshBasicMaterial
                  color={isTampered ? '#FF3B30' : '#00F2FE'}
                  transparent
                  opacity={0.35}
                  depthWrite={false}
                />
              </mesh>

              {/* Enlarged Invisible 3D Click & Hover Hit Sphere for effortless buoy selection */}
              <mesh
                position={[0, 0.2, 0]}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(item.node);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredNodeId(item.node.id);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  setHoveredNodeId((curr) => (curr === item.node.id ? null : curr));
                  document.body.style.cursor = 'auto';
                }}
              >
                <sphereGeometry args={[2.0, 14, 14]} />
                <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
              </mesh>

              {/* Floating Tactical Interactive Badge: ONLY rendered when hovered or clicked/selected */}
              {(isSelected || hoveredNodeId === item.node.id) && (
                <Html position={[0, 2.5 * buoyScale + 0.35, 0]} center zIndexRange={[15, 0]}>
                  <div
                    onMouseEnter={() => setHoveredNodeId(item.node.id)}
                    onMouseLeave={() => setHoveredNodeId((curr) => (curr === item.node.id ? null : curr))}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNode(item.node);
                    }}
                    style={{
                      background: isSelected ? 'rgba(7, 15, 30, 0.94)' : 'rgba(11, 22, 40, 0.90)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: `1.5px solid ${isSelected ? '#00F2FE' : isTampered ? '#FF3B30' : '#38BDF8'}`,
                      borderRadius: '6px',
                      padding: '4px 9px',
                      color: '#FFF',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      boxShadow: isSelected ? '0 0 16px rgba(0, 242, 254, 0.5)' : '0 2px 8px rgba(0,0,0,0.5)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      pointerEvents: 'auto',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ color: isSelected ? '#00F2FE' : isTampered ? '#FF3B30' : '#38BDF8', fontWeight: 800, fontSize: '11px', letterSpacing: '0.5px' }}>
                      ⚓ {item.node.id} {isSelected ? '● ACTIVE' : '▶ SCAN'}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '9px', marginTop: '1px' }}>
                      {item.node.depth_m ? `${item.node.depth_m.toFixed(0)}m` : '260m'} DEPTH • 1.5km RAD
                    </div>
                  </div>
                </Html>
              )}
            </group>
          </group>
        );
      })}

      {/* 4. VISIBLE 360° Rotating Acoustic Sonar Blade Fan Beam on ALL Active Nodes */}
      {nodePositions.map((item, idx) => {
        const isSelected = item.node.id === selectedNodeId || (!selectedNodeId && idx === 0);
        return (
          <AcousticSonarBladeBeam
            key={`blade-${item.node.id}`}
            item={item}
            isSelected={isSelected}
            offsetPhase={idx * (Math.PI / 2)}
          />
        );
      })}
    </group>
  );
}
