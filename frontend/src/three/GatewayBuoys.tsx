// ==============================================================================
// OceanSense — Surface Gateway Buoys & Mooring Cables
// Demonstrates: Cabled Buoys to Seabed (Section 3 & 14 Requirement)
// ==============================================================================

import React, { useMemo } from 'react';
import * as THREE from 'three';

const GATEWAYS_DATA = [
  { id: 'GW-001', name: 'GW-001', x: -24, z: -24, depth: -28 },
  { id: 'GW-002', name: 'GW-002', x: -24, z: 24, depth: -20 },
  { id: 'GW-003', name: 'GW-003', x: 24, z: -24, depth: -16 },
  { id: 'GW-004', name: 'GW-004', x: 24, z: 24, depth: -12 },
];

export function GatewayBuoys() {
  const tetherLines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    GATEWAYS_DATA.forEach((gw) => {
      // Surface buoy position
      points.push(new THREE.Vector3(gw.x, 0.2, gw.z));
      // Anchor on seabed
      points.push(new THREE.Vector3(gw.x, gw.depth, gw.z));
    });
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <group>
      {/* 4 Surface Gateway Buoy Models */}
      {GATEWAYS_DATA.map((gw) => (
        <group key={gw.id} position={[gw.x, 0.2, gw.z]}>
          {/* Buoy Hull (Yellow Marine Float) */}
          <mesh>
            <cylinderGeometry args={[1.2, 0.9, 1.4, 16]} />
            <meshStandardMaterial color="#FFD166" roughness={0.3} metalness={0.4} />
          </mesh>

          {/* Mast & Terrestrial Radio Transceiver */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 2.0, 8]} />
            <meshStandardMaterial color="#E2E8F0" />
          </mesh>

          {/* Flashing Navigational Warning Beacon */}
          <mesh position={[0, 2.6, 0]}>
            <sphereGeometry args={[0.25, 12, 12]} />
            <meshBasicMaterial color="#00F2FE" />
          </mesh>
        </group>
      ))}

      {/* Armored Electro-Mechanical Mooring Cables (Down to Seabed) */}
      <lineSegments geometry={tetherLines}>
        <lineBasicMaterial color="#FFD166" transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}
