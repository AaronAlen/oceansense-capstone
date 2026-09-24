// ==============================================================================
// OceanSense — 3D Autonomous Underwater Vehicle (AUV) Drone Swarm
// Demonstrates: Three.js Submarine Meshes, Spotlight Cones & Intercept Vectors
// ==============================================================================

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getFishSchool3DCoordinates } from '../stores/fishSchoolStore';

export interface AUVState {
  id: string;
  name: string;
  zoneId: string;
  dockId: string;
  status: string;
  latitude: number;
  longitude: number;
  depth_m: number;
  x: number;
  y: number;
  z: number;
  headingDeg: number;
  speedKnots: number;
  batteryPct: number;
  cameraStatus: string;
  target?: {
    targetId: string;
    latitude: number;
    longitude: number;
    depth_m: number;
  };
}

interface AUVDroneModelsProps {
  auvs?: AUVState[];
  onSelectAUV?: (auv: AUVState) => void;
  targetSchool?: any | null;
}

export const AUVDroneModels: React.FC<AUVDroneModelsProps> = ({
  auvs = [],
  onSelectAUV,
  targetSchool,
}) => {
  const defaultAUVs: AUVState[] = [
    {
      id: 'AUV-01',
      name: 'Orca-1 Deep Hunter',
      zoneId: 'ZONE-A',
      dockId: 'DOCK-ALPHA',
      status: 'DISPATCHED_INTERCEPT',
      latitude: 10.231,
      longitude: 80.132,
      depth_m: 135,
      x: -1450,
      y: -135,
      z: -1550,
      headingDeg: 62.0,
      speedKnots: 5.0,
      batteryPct: 96.5,
      cameraStatus: 'RECORDING_OPTICAL',
      target: { targetId: 'SN-0431', latitude: 10.235, longitude: 80.138, depth_m: 142 },
    },
    {
      id: 'AUV-02',
      name: 'Nautilus-2 Interceptor',
      zoneId: 'ZONE-B',
      dockId: 'DOCK-BRAVO',
      status: 'PATROLLING',
      latitude: 10.265,
      longitude: 80.125,
      depth_m: 145,
      x: -2220,
      y: -145,
      z: 2220,
      headingDeg: 120.0,
      speedKnots: 2.5,
      batteryPct: 84.0,
      cameraStatus: 'RECORDING_OPTICAL',
    },
    {
      id: 'AUV-03',
      name: 'Leviathan-3 Sentinel',
      zoneId: 'ZONE-C',
      dockId: 'DOCK-CHARLIE',
      status: 'DOCKED',
      latitude: 10.225,
      longitude: 80.165,
      depth_m: 95,
      x: 2220,
      y: -95,
      z: -2220,
      headingDeg: 270.0,
      speedKnots: 0.0,
      batteryPct: 95.2,
      cameraStatus: 'STANDBY',
    },
    {
      id: 'AUV-04',
      name: 'Trident-4 Rapid Responder',
      zoneId: 'ZONE-D',
      dockId: 'DOCK-DELTA',
      status: 'DOCKED',
      latitude: 10.265,
      longitude: 80.165,
      depth_m: 160,
      x: 2220,
      y: -160,
      z: 2220,
      headingDeg: 180.0,
      speedKnots: 0.0,
      batteryPct: 99.0,
      cameraStatus: 'STANDBY',
    }
  ];

  const fleet = auvs.length > 0 ? auvs : defaultAUVs;
  const strobeRef = useRef<THREE.PointLight[]>([]);
  const groupRefs = useRef<Map<string, THREE.Group>>(new Map());
  const auv2Pos = useRef<THREE.Vector3>(new THREE.Vector3(-22, -11, 22));

  // Subtle propeller / strobe animation & dynamic approach towards targeted fish school
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    strobeRef.current.forEach((light) => {
      if (light) {
        light.intensity = Math.sin(t * 8) > 0.2 ? 3.5 : 0.2;
      }
    });

    // If targetSchool is active, navigate AUV-02 close to the moving fish school
    if (targetSchool) {
      const curCoords = getFishSchool3DCoordinates(targetSchool, 0);

      // Position AUV-02 tracking slightly behind and above the school
      const offsetDistance = 4.5;
      const trailX = curCoords.x - Math.cos((Date.now() / 1000) * 0.22) * offsetDistance;
      const trailZ = curCoords.z + Math.sin((Date.now() / 1000) * 0.22) * offsetDistance;
      const targetVec = new THREE.Vector3(trailX, curCoords.y + 1.8, trailZ);

      // Smoothly glide towards school
      auv2Pos.current.lerp(targetVec, 0.045);

      const auv2Group = groupRefs.current.get('AUV-02');
      if (auv2Group) {
        auv2Group.position.copy(auv2Pos.current);
        const headingAngle = Math.atan2(curCoords.x - auv2Pos.current.x, curCoords.z - auv2Pos.current.z);
        auv2Group.rotation.y = -headingAngle + Math.PI / 2;
      }
    }

    // Instantaneous 3D TCAS Anti-Collision Pass: Guarantee drones never collide or touch
    const entries = Array.from(groupRefs.current.entries());
    const MIN_SEPARATION = 6.5; // Minimum 6.5 units 3D physical buffer
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [, g1] = entries[i];
        const [, g2] = entries[j];
        if (!g1 || !g2) continue;

        const dist = g1.position.distanceTo(g2.position);
        if (dist < MIN_SEPARATION) {
          const diff = new THREE.Vector3().subVectors(g1.position, g2.position);
          if (diff.lengthSq() < 0.0001) {
            diff.set(Math.cos(i * 1.2), 0.4, Math.sin(i * 1.2));
          }
          diff.normalize();
          const pushAmount = (MIN_SEPARATION - dist) * 0.5;
          g1.position.addScaledVector(diff, pushAmount);
          g2.position.addScaledVector(diff, -pushAmount);
        }
      }
    }
  });

  return (
    <group>
      {fleet.map((auv, idx) => {
        const rad = ((auv.headingDeg || 0) * Math.PI) / 180;
        const isIntercepting = auv.status === 'DISPATCHED_INTERCEPT' || auv.status === 'INVESTIGATING_TAMPER';
        const beaconColor = isIntercepting ? '#FF3B30' : '#00E699';

        // Normalized 3D position in scene with individual vertical tiering to prevent collisions
        const sx = ((auv.longitude - 80.145) / 0.045) * 48.0;
        const sz = ((auv.latitude - 10.245) / 0.045) * 48.0;
        // Distinct vertical tier separation for each AUV: e.g. AUV-01 lower, AUV-02 higher
        const tierOffset = (idx * 2.8) - 1.4;
        const sy = -(auv.depth_m / 390.0) * 30.0 + tierOffset;

        return (
          <group
            key={auv.id}
            ref={(el) => {
              if (el) groupRefs.current.set(auv.id, el);
              else groupRefs.current.delete(auv.id);
            }}
            position={[sx, sy, sz]}
            rotation={[0, -rad + Math.PI / 2, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectAUV?.(auv);
            }}
          >
            {/* Torpedo/Submarine Hull (Streamlined cylinder) */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.3, 0.35, 2.2, 16]} />
              <meshStandardMaterial
                color="#E2E8F0"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Nose Cone */}
            <mesh position={[1.4, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.3, 0.6, 16]} />
              <meshStandardMaterial
                color="#00F2FE"
                metalness={0.6}
                roughness={0.3}
              />
            </mesh>

            {/* Stabilizer Fins */}
            <mesh position={[-0.9, 0.4, 0]}>
              <boxGeometry args={[0.6, 0.6, 0.05]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[-0.9, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <boxGeometry args={[0.6, 0.6, 0.05]} />
              <meshStandardMaterial color="#334155" />
            </mesh>

            {/* Optical Camera Turret / Forward Sensor Dome */}
            <mesh position={[1.6, -0.05, 0]}>
              <sphereGeometry args={[0.15, 12, 12]} />
              <meshStandardMaterial
                color="#000000"
                roughness={0.1}
                metalness={0.9}
              />
            </mesh>

            {/* Forward Optical Searchlight Cone */}
            <mesh position={[2.8, -0.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[1.2, 2.8, 16, 1, true]} />
              <meshBasicMaterial
                color={isIntercepting ? '#FFB703' : '#00F2FE'}
                transparent
                opacity={0.22}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Strobe Navigation Beacon Light */}
            <pointLight
              ref={(el) => { if (el) strobeRef.current[idx] = el; }}
              color={beaconColor}
              distance={6}
              intensity={2.5}
              position={[0, 0.5, 0]}
            />
          </group>
        );
      })}
    </group>
  );
};
