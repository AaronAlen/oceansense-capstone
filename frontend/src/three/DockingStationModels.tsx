// ==============================================================================
// OceanSense — Seabed Inductive Charging Docking Stations
// Demonstrates: Resonant Inductive Wireless Power Transfer Model (Section 15)
// ==============================================================================

import React from 'react';
import { getSeabedElevation } from './BathymetryTerrain';

const DOCKS_DATA = [
  { id: 'DOCK-ALPHA', name: 'Dock Alpha (Deep Trench)', x: -18, z: -18 },
  { id: 'DOCK-BRAVO', name: 'Dock Bravo (Shelf)', x: 18, z: -14 },
];

export function DockingStationModels() {
  return (
    <group>
      {DOCKS_DATA.map((dock) => {
        const y = getSeabedElevation(dock.x, dock.z);
        return (
          <group key={dock.id} position={[dock.x, y, dock.z]}>
          {/* Heavy Concrete Mooring Base */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[4.5, 0.8, 3.5]} />
            <meshStandardMaterial color="#1E293B" roughness={0.9} />
          </mesh>

          {/* Resonant Inductive Wireless Power Transfer Cradle */}
          <mesh position={[0, 1.0, 0]}>
            <cylinderGeometry args={[1.5, 1.8, 0.4, 16]} />
            <meshStandardMaterial color="#0F172A" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Glowing Inductive Magnetic Flux Emitter (Cyan Ring) */}
          <mesh position={[0, 1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1.4, 24]} />
            <meshBasicMaterial color="#00E699" side={2} transparent opacity={0.8} />
          </mesh>

          {/* Status Guide Beacons */}
          <mesh position={[-1.8, 1.5, -1.3]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#00F2FE" />
          </mesh>
          <mesh position={[1.8, 1.5, -1.3]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#00F2FE" />
          </mesh>
        </group>
        );
      })}
    </group>
  );
}
