// ==============================================================================
// OceanSense — 3D Fish School Particles & Sonar Detection Pulses
// Demonstrates: Volumetric Biological Target Simulation in WebGL / Three.js
// ==============================================================================

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useFishSchoolStore, getFishSchool3DCoordinates, FishSchoolData } from '../stores/fishSchoolStore';
import { wsClient } from '../services/websocket';

interface FishSchoolParticlesProps {
  schools?: FishSchoolData[];
  onSelectSchool?: (school: FishSchoolData) => void;
  selectedSchoolId?: string | null;
}

export const FishSchoolParticles: React.FC<FishSchoolParticlesProps> = ({
  schools,
  onSelectSchool,
  selectedSchoolId,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const pulseGroupRef = useRef<THREE.Group>(null);
  const [hoveredSchoolId, setHoveredSchoolId] = React.useState<string | null>(null);

  // Live WebSocket Sonar Ping Intercept State
  const [lastSonarHits, setLastSonarHits] = React.useState<Map<string, {
    nodeId: string;
    timestamp: number;
    depthM: number;
    targetStrengthDb: number;
    distanceM: number;
  }>>(new Map());

  // Initialize and synchronize with shared live store
  const storeSchools = useFishSchoolStore((state) => state.schools);
  useEffect(() => {
    const unsub = useFishSchoolStore.getState().initialize();
    return unsub;
  }, []);

  const activeSchools = schools && schools.length > 0 ? schools : storeSchools;

  // Real-Time WebSocket Sonar Ping Detection Listener
  useEffect(() => {
    wsClient.connect();
    const unsubPing = wsClient.on('RAW_SONAR_PING', (payload: any) => {
      const ping = payload?.data;
      if (ping?.hasBiomassHit && ping.targetDetections && ping.targetDetections.length > 0) {
        setLastSonarHits((prev) => {
          const next = new Map(prev);
          for (const det of ping.targetDetections) {
            const matched = activeSchools.find((s) =>
              s.commonName.toLowerCase().includes(det.species.toLowerCase()) ||
              det.species.toLowerCase().includes(s.commonName.toLowerCase()) ||
              (det.species.includes('Tuna') && s.id.includes('TUNA')) ||
              (det.species.includes('Mackerel') && s.id.includes('MACK')) ||
              (det.species.includes('Sardine') && s.id.includes('SARD'))
            );
            const targetSchoolId = matched ? matched.id : activeSchools[0]?.id || 'SCHOOL-TUNA-01';
            next.set(targetSchoolId, {
              nodeId: ping.nodeId,
              timestamp: Date.now(),
              depthM: det.depthM,
              targetStrengthDb: det.targetStrengthDb,
              distanceM: det.distanceM,
            });
          }
          return next;
        });
      }
    });

    return () => {
      unsubPing();
    };
  }, [activeSchools]);

  // Particle individual offsets and swimming phases
  const particleData = useMemo(() => {
    const particleCount = activeSchools.length * 200;
    const offsets = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    let idx = 0;
    activeSchools.forEach((school, sIdx) => {
      let cIdx = sIdx;
      if (school.id.includes('TUNA')) cIdx = 0;
      else if (school.id.includes('MACK')) cIdx = 1;
      else if (school.id.includes('SARD')) cIdx = 2;
      else if (school.id.includes('TREV')) cIdx = 3;

      let r = 0.22, g = 0.74, b = 0.97; // Sky blue for Trevally (#38BDF8)
      if (cIdx === 0) { r = 0.97; g = 0.15; b = 0.52; } // Magenta for Tuna (#F72585)
      else if (cIdx === 1) { r = 1.0; g = 0.72; b = 0.01; } // Amber for Mackerel (#FFB703)
      else if (cIdx === 2) { r = 0.0; g = 0.90; b = 0.60; } // Emerald for Sardine (#00E699)

      for (let p = 0; p < 200; p++) {
        // Dispersal around school centroid (compact realistic pelagic school in <300m ocean)
        const spreadX = (Math.random() - 0.5) * 2.2;
        const spreadZ = (Math.random() - 0.5) * 2.2;
        const spreadY = (Math.random() - 0.5) * 0.35;

        offsets[idx * 3] = spreadX;
        offsets[idx * 3 + 1] = spreadY;
        offsets[idx * 3 + 2] = spreadZ;
        phases[idx] = Math.random() * Math.PI * 2;

        col[idx * 3] = r;
        col[idx * 3 + 1] = g;
        col[idx * 3 + 2] = b;
        idx++;
      }
    });

    return { offsets, phases, pos, col };
  }, [activeSchools]);

  // Current animated centroid positions for schools
  const schoolCenters = useRef<{ x: number; y: number; z: number }[]>(
    activeSchools.map((s, idx) => getFishSchool3DCoordinates(s, idx))
  );

  // Active continuous 3D swimming animation synchronized across all viewports
  useFrame(() => {
    const t = Date.now() / 1000;

    // 1. Update school centroid cruising paths using the unified coordinate formula
    activeSchools.forEach((s, sIdx) => {
      const cur = getFishSchool3DCoordinates(s, sIdx, t);
      schoolCenters.current[sIdx] = cur;

      // Update pulse group positions
      if (pulseGroupRef.current && pulseGroupRef.current.children[sIdx]) {
        const grp = pulseGroupRef.current.children[sIdx];
        grp.position.set(cur.x, cur.y, cur.z);
      }
    });

    // 2. Animate individual fish particle undulations and tail wiggles
    if (pointsRef.current) {
      const geom = pointsRef.current.geometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      if (posAttr) {
        const posArray = posAttr.array as Float32Array;
        let idx = 0;

        activeSchools.forEach((_, sIdx) => {
          const center = schoolCenters.current[sIdx] || { x: 0, y: 0, z: 0 };
          for (let p = 0; p < 200; p++) {
            const ox = particleData.offsets[idx * 3];
            const oy = particleData.offsets[idx * 3 + 1];
            const oz = particleData.offsets[idx * 3 + 2];
            const ph = particleData.phases[idx];

            // Lateral and vertical swimming wave
            const tailWiggleX = Math.sin(t * 7.0 + ph) * 0.25;
            const tailWiggleY = Math.sin(t * 9.0 + ph) * 0.18;
            const tailWiggleZ = Math.cos(t * 7.0 + ph) * 0.25;

            posArray[idx * 3] = center.x + ox + tailWiggleX;
            posArray[idx * 3 + 1] = center.y + oy + tailWiggleY;
            posArray[idx * 3 + 2] = center.z + oz + tailWiggleZ;
            idx++;
          }
        });
        posAttr.needsUpdate = true;
      }
    }

    // 3. Expanding acoustic sonar rings
    if (pulseGroupRef.current) {
      pulseGroupRef.current.children.forEach((child, i) => {
        const scale = 1.0 + ((t * 1.5 + i * 0.8) % 3.0);
        const ringMesh = (child as any).isMesh ? (child as THREE.Mesh) : (child.children?.[0] as THREE.Mesh);
        if (ringMesh && ringMesh.material) {
          ringMesh.scale.set(scale, 1, scale);
          const mat = ringMesh.material as THREE.MeshBasicMaterial;
          if (mat && typeof mat.opacity === 'number') {
            mat.opacity = Math.max(0, 0.6 - (scale - 1) * 0.2);
          }
        }
      });
    }
  });

  return (
    <group>
      {/* Biological School Particle Clouds */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.pos, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleData.col, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.6}
          vertexColors
          transparent
          opacity={0.95}
          sizeAttenuation
          depthWrite={false}
          fog={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Interactive Sonar Multi-lateration acoustic rings, Volumetric Halo & 3D Tactical Markers */}
      <group ref={pulseGroupRef}>
        {activeSchools.map((s, idx) => {
          const initCoords = getFishSchool3DCoordinates(s, idx);
          const isSelected = selectedSchoolId === s.id;
          const isHovered = hoveredSchoolId === s.id;
          const lastHit = lastSonarHits.get(s.id);
          const isSonarHit = !!lastHit && (Date.now() - lastHit.timestamp < 3200);
          let cIdx = idx;
          if (s.id.includes('TUNA')) cIdx = 0;
          else if (s.id.includes('MACK')) cIdx = 1;
          else if (s.id.includes('SARD')) cIdx = 2;
          else if (s.id.includes('TREV')) cIdx = 3;

          const defaultColor = cIdx === 0 ? '#F72585' : cIdx === 1 ? '#FFB703' : cIdx === 2 ? '#00E699' : '#38BDF8';
          const ringColor = isSonarHit ? '#FFB703' : defaultColor;

          return (
            <group key={s.id} position={[initCoords.x, initCoords.y, initCoords.z]}>
              {/* Luminous Volumetric Bioluminescent Halo (Pulsates and expands upon active Sonar Ping Hit) */}
              <mesh>
                <sphereGeometry args={[isSonarHit ? 1.6 : 1.1, 16, 16]} />
                <meshBasicMaterial
                  color={isSonarHit ? '#FFB703' : ringColor}
                  transparent
                  opacity={isSonarHit ? 0.38 : 0.16}
                  depthWrite={false}
                  fog={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>

              {/* Expanding Acoustic Sonar Ring Wavefront */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[isSonarHit ? 1.2 : 0.8, isSonarHit ? 1.4 : 1.0, 32]} />
                <meshBasicMaterial
                  color={isSonarHit ? '#FFB703' : ringColor}
                  transparent
                  opacity={isSonarHit ? 0.95 : isSelected ? 0.9 : 0.65}
                  side={THREE.DoubleSide}
                  fog={false}
                />
              </mesh>

              {/* Tactical Target Wireframe Circle when hovered or selected or hit by ping */}
              {(isHovered || isSelected || isSonarHit) && (
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[1.3, 1.45, 32]} />
                  <meshBasicMaterial
                    color={isSonarHit ? '#FFB703' : ringColor}
                    transparent
                    opacity={0.9}
                    side={THREE.DoubleSide}
                    fog={false}
                  />
                </mesh>
              )}

              {/* Clickable Interaction Sphere */}
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSchool?.(s);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredSchoolId(s.id);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  setHoveredSchoolId(null);
                  document.body.style.cursor = 'auto';
                }}
              >
                <sphereGeometry args={[1.6, 16, 16]} />
                <meshBasicMaterial
                  color={ringColor}
                  transparent
                  opacity={isHovered ? 0.2 : isSelected ? 0.25 : 0.001}
                  wireframe={isHovered || isSelected}
                />
              </mesh>

              {/* Tactical Marker Badge: ONLY shown when clicked/selected or hovered */}
              {(isHovered || isSelected) && (
                <Html position={[0, 1.1, 0]} center zIndexRange={[15, 0]}>
                  <div
                    onMouseEnter={() => setHoveredSchoolId(s.id)}
                    onMouseLeave={() => setHoveredSchoolId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSchool?.(s);
                    }}
                    style={{
                      background: isSonarHit ? 'rgba(20, 15, 5, 0.92)' : 'rgba(5, 12, 26, 0.88)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: `1.5px solid ${isSonarHit ? '#FFB703' : ringColor}`,
                      borderRadius: '5px',
                      padding: '3px 8px',
                      color: '#FFF',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      boxShadow: isSonarHit ? '0 0 16px rgba(255, 183, 3, 0.6)' : `0 0 12px ${ringColor}66`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      userSelect: 'none',
                      pointerEvents: 'auto',
                    }}
                  >
                    {isSonarHit && lastHit ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#FFB703', fontWeight: 900, fontSize: '10px' }}>⚡ SONAR PING INTERCEPT [{lastHit.nodeId}]</span>
                          <span style={{ color: '#00F2FE', fontSize: '9px' }}>TS: {lastHit.targetStrengthDb} dB</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, color: '#FFF' }}>🐟 {s.commonName.toUpperCase()}</span>
                          <span style={{ color: '#00E699', fontSize: '9px' }}>| {lastHit.depthM}m DEPTH</span>
                          <span style={{ color: '#38BDF8', fontSize: '9px' }}>| {lastHit.distanceM}m RANGE</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span style={{ color: ringColor, fontSize: '11px' }}>🐟</span>
                        <span style={{ fontWeight: 800, color: ringColor }}>{s.commonName.toUpperCase()}</span>
                        <span style={{ color: '#00F2FE', fontSize: '9px' }}>| {Math.round(s.depth_m)}m</span>
                        <span style={{ color: '#FFB703', fontSize: '9px' }}>| {s.biomassTons}T</span>
                      </>
                    )}
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
};
