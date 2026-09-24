// ==============================================================================
// OceanSense — Master 3D Digital Twin Canvas (Hardware Telemetry Driven)
// Zero Artificial Flocking Fish: Strictly Renders Acoustic Contacts via WebSocket Pings
// ==============================================================================

import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { BathymetryTerrain } from './BathymetryTerrain';
import { OceanSurface } from './OceanSurface';
import { SonarNodeInstances, Node3DData } from './SonarNodeInstances';
import { TacticalOceanVolumeBounds } from './TacticalOceanVolumeBounds';
import { RawPingFishRenderer, PingFishContact } from './RawPingFishRenderer';

export type VisualLightingMode = 'DAY' | 'NIGHT' | 'GRAYISH';
export type CameraPreset = 'OVERVIEW' | 'SURFACE_BUOYS' | 'SEABED_LEVEL' | 'TARGET_NODE' | 'FISH_CLUSTER' | 'TOP_DOWN';

interface Props {
  nodes: Node3DData[];
  onSelectNode: (node: Node3DData) => void;
  selectedNodeId: string | null;
  onPingReceived?: (ping: any) => void;
  selectedContact?: PingFishContact | null;
  onSelectContact?: (contact: PingFishContact) => void;
  visualMode?: VisualLightingMode;
  cameraPreset?: CameraPreset;
}

function CameraController({
  preset,
  controlsRef,
}: {
  preset?: CameraPreset;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!preset || !controlsRef.current) return;

    if (preset === 'OVERVIEW') {
      camera.position.set(30, 16, 38);
      controlsRef.current.target.set(0, -1.4, 0);
    } else if (preset === 'SURFACE_BUOYS') {
      camera.position.set(18, 4.5, 22);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'SEABED_LEVEL') {
      camera.position.set(-15, -1.8, 15);
      controlsRef.current.target.set(0, -2.6, 0);
    } else if (preset === 'TARGET_NODE') {
      camera.position.set(-8, 3, -8);
      controlsRef.current.target.set(-15, -0.4, -15);
    } else if (preset === 'FISH_CLUSTER') {
      camera.position.set(-6, 2, -6);
      controlsRef.current.target.set(-9, -14.2, -9);
    } else if (preset === 'TOP_DOWN') {
      camera.position.set(0, 56, 0.1);
      controlsRef.current.target.set(0, 0, 0);
    }
    controlsRef.current.update();
  }, [preset, camera, controlsRef]);

  return null;
}

export function RawPingDigitalTwinCanvas({
  nodes,
  onSelectNode,
  selectedNodeId,
  onPingReceived,
  selectedContact,
  onSelectContact,
  visualMode = 'NIGHT',
  cameraPreset = 'OVERVIEW',
}: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const bgConfig = {
    DAY: {
      bg: '#6E889C',
      fogNear: 35,
      fogFar: 140,
      ambientColor: '#E2E8F0',
      ambientIntensity: 0.9,
      dirColor: '#FFFFFF',
      dirIntensity: 1.4,
      dirPos: [20, 40, 20] as [number, number, number],
      pointColor: '#BAE6FD',
      pointIntensity: 1.0,
    },
    GRAYISH: {
      bg: '#1E293B',
      fogNear: 30,
      fogFar: 120,
      ambientColor: '#64748B',
      ambientIntensity: 0.6,
      dirColor: '#94A3B8',
      dirIntensity: 1.0,
      dirPos: [15, 30, 15] as [number, number, number],
      pointColor: '#00F2FE',
      pointIntensity: 1.2,
    },
    NIGHT: {
      bg: '#030816',
      fogNear: 25,
      fogFar: 110,
      ambientColor: '#071529',
      ambientIntensity: 0.5,
      dirColor: '#00F2FE',
      dirIntensity: 0.7,
      dirPos: [10, 25, 10] as [number, number, number],
      pointColor: '#00E699',
      pointIntensity: 1.5,
    },
  }[visualMode];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [30, 16, 38], fov: 45, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[bgConfig.bg]} />
        <fog attach="fog" args={[bgConfig.bg, bgConfig.fogNear, bgConfig.fogFar]} />

        <ambientLight intensity={bgConfig.ambientIntensity} color={bgConfig.ambientColor} />
        <directionalLight position={bgConfig.dirPos} intensity={bgConfig.dirIntensity} color={bgConfig.dirColor} />
        <pointLight position={[0, -10, 0]} intensity={bgConfig.pointIntensity} color={bgConfig.pointColor} distance={80} />

        <Suspense fallback={null}>
          <OceanSurface />
          <BathymetryTerrain visualMode={visualMode} />
          <TacticalOceanVolumeBounds />

          {/* Pure Hardware WebSocket Telemetry-Driven Fish Renderer (Zero Artificial Fish) */}
          <RawPingFishRenderer
            onPingReceived={onPingReceived}
            selectedContactId={selectedContact?.id}
            onSelectContact={onSelectContact}
          />

          {/* 4 Physical Sonar Buoys with 360° Rotating Acoustic Blade Beams */}
          <SonarNodeInstances
            nodes={nodes}
            onSelectNode={onSelectNode}
            selectedNodeId={selectedNodeId}
          />

          <CameraController preset={cameraPreset} controlsRef={controlsRef} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={4}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2 + 0.08}
          target={[0, -1.4, 0]}
        />
      </Canvas>
    </div>
  );
}
