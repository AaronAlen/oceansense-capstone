// ==============================================================================
// OceanSense — Tactical Ocean Volume Bounds & Calibrated Depth Scale Ruler
// Demonstrates: Authentic 10km x 10km x 280m (<300m) Volumetric Visual Reference
// Physics Scale: 1 scene unit = 100 meters horizontally & vertically
// ==============================================================================

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export function TacticalOceanVolumeBounds() {
  // Depth levels in scene units (1 unit = 100m)
  const surfaceY = 0.0;
  const seabedY = -2.75; // 275m depth (<300m)
  const tunaDepthY = -1.42; // 142m fish school depth
  const boundMin = -48.0; // 10km sector boundary
  const boundMax = 48.0;

  // Corner bounding pillars and perimeter box lines
  const boundingLinesGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const corners = [
      [-48, -48],
      [48, -48],
      [48, 48],
      [-48, 48],
    ];

    // 4 vertical corner boundary pillars (Surface to Seabed)
    corners.forEach(([cx, cz]) => {
      points.push(new THREE.Vector3(cx, surfaceY + 0.1, cz));
      points.push(new THREE.Vector3(cx, seabedY, cz));
    });

    // Surface 10km x 10km boundary rectangle
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = corners[i];
      const [x2, z2] = corners[(i + 1) % 4];
      points.push(new THREE.Vector3(x1, surfaceY + 0.05, z1));
      points.push(new THREE.Vector3(x2, surfaceY + 0.05, z2));
    }

    // Seabed 10km x 10km boundary rectangle
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = corners[i];
      const [x2, z2] = corners[(i + 1) % 4];
      points.push(new THREE.Vector3(x1, seabedY + 0.05, z1));
      points.push(new THREE.Vector3(x2, seabedY + 0.05, z2));
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [surfaceY, seabedY]);

  return (
    <group>
      {/* 1. Wireframe Boundary Box for the 10km x 10km x 275m Ocean Volume */}
      <lineSegments geometry={boundingLinesGeometry}>
        <lineBasicMaterial color="#00F2FE" transparent opacity={0.25} depthWrite={false} />
      </lineSegments>

      {/* 3. Tactical Calibrated Vertical Depth Ruler Post (At Front Corner [-35, -35]) */}
      <group position={[-36, 0, -36]}>
        {/* Vertical Ruler Spine Cylinder */}
        <mesh position={[0, (surfaceY + seabedY) / 2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, Math.abs(surfaceY - seabedY), 12]} />
          <meshBasicMaterial color="#00F2FE" transparent opacity={0.6} />
        </mesh>

        {/* Depth Ticks and Interactive Tactical Labels */}
        {[
          { label: '0m // SEA SURFACE', y: 0.0, color: '#00F2FE' },
          { label: '50m // SURFACE MIXED LAYER', y: -0.50, color: '#38BDF8' },
          { label: '100m // THERMOCLINE', y: -1.00, color: '#00E699' },
          { label: '142m // TUNA BIOMASS LAYER', y: tunaDepthY, color: '#FFB703' },
          { label: '200m // MESOPELAGIC ZONE', y: -2.00, color: '#38BDF8' },
          { label: '260m // SEABED FLOOR (<300m)', y: seabedY, color: '#00F2FE' },
        ].map((tick) => (
          <group key={tick.label} position={[0, tick.y, 0]}>
            {/* Horizontal graduation tick */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
              <meshBasicMaterial color={tick.color} />
            </mesh>

            {/* Depth readout tag (Constant Readable Size & Safe Z-Index) */}
            <Html position={[1.4, 0, 0]} zIndexRange={[15, 0]}>
              <div style={{
                background: 'rgba(5, 12, 24, 0.92)',
                border: `1px solid ${tick.color}`,
                borderRadius: '3px',
                padding: '1px 6px',
                color: tick.color,
                fontFamily: 'monospace',
                fontSize: '9px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: `0 0 10px ${tick.color}44`,
                userSelect: 'none',
                pointerEvents: 'none',
              }}>
                {tick.label}
              </div>
            </Html>
          </group>
        ))}
      </group>

      {/* 4. Translucent Volumetric Water Block (Shows 10km x 10km x 275m Pure Ocean Volume) */}
      <mesh position={[0, (surfaceY + seabedY) / 2, 0]}>
        <boxGeometry args={[96, Math.abs(surfaceY - seabedY), 96]} />
        <meshStandardMaterial
          color="#021B33"
          transparent
          opacity={0.08}
          roughness={0.1}
          metalness={0.9}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
