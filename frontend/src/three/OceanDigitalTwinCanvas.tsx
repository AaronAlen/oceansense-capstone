// ==============================================================================
// OceanSense — Master 3D Ocean Digital Twin Canvas
// Demonstrates: WebGL Shading, Volumetric Underwater Lighting & Camera Controls
// ==============================================================================

import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { BathymetryTerrain } from './BathymetryTerrain';
import { OceanSurface } from './OceanSurface';
import { SonarNodeInstances, Node3DData } from './SonarNodeInstances';
import { GatewayBuoys } from './GatewayBuoys';
import { DockingStationModels } from './DockingStationModels';
import { FishSchoolParticles } from './FishSchoolParticles';
import { AUVDroneModels, AUVState } from './AUVDroneModels';
import { TacticalOceanVolumeBounds } from './TacticalOceanVolumeBounds';

export type VisualLightingMode = 'DAY' | 'NIGHT' | 'GRAYISH';
export type CameraPreset = 'OVERVIEW' | 'SURFACE_BUOYS' | 'SEABED_LEVEL' | 'TARGET_NODE' | 'FISH_CLUSTER' | 'TOP_DOWN';

interface Props {
  nodes: Node3DData[];
  onSelectNode: (node: Node3DData) => void;
  selectedNodeId: string | null;
  auvs?: AUVState[];
  onSelectAUV?: (auv: AUVState) => void;
  fishSchools?: any[];
  onSelectSchool?: (school: any) => void;
  selectedSchoolId?: string | null;
  targetSchool?: any | null;
  visualMode?: VisualLightingMode;
  cameraPreset?: CameraPreset;
}

// Helper component inside Canvas to handle dynamic camera preset animation
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
      // Elevated tactical 3D isometric perspective showing the 10km x 10km grid and 280m depth clearly
      camera.position.set(30, 16, 38);
      controlsRef.current.target.set(0, -1.4, 0);
    } else if (preset === 'SURFACE_BUOYS') {
      // Waterline surface camera viewing floating buoys and downward tethers
      camera.position.set(18, 4.5, 22);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'SEABED_LEVEL') {
      // Low-angle benthic flyover camera directly above the seafloor anchors (<300m)
      camera.position.set(-15, -1.8, 15);
      controlsRef.current.target.set(0, -2.6, 0);
    } else if (preset === 'TARGET_NODE') {
      // Focused on Surface Buoy Node SN-0001 and its downward acoustic blade beam
      camera.position.set(-8, 3, -8);
      controlsRef.current.target.set(-15, -0.4, -15);
    } else if (preset === 'FISH_CLUSTER') {
      // Focused on swimming pelagic Atlantic Bluefin Tuna cluster (142m depth)
      camera.position.set(-4, -0.4, -6);
      controlsRef.current.target.set(-8.5, -1.42, -10.5);
    } else if (preset === 'TOP_DOWN') {
      // Nautical bird's-eye bathymetric chart view: clean 2x2 square grid (3km spacing)
      camera.position.set(0, 56, 0.1);
      controlsRef.current.target.set(0, 0, 0);
    }
    controlsRef.current.update();
  }, [preset, camera, controlsRef]);

  return null;
}

export function OceanDigitalTwinCanvas({
  nodes,
  onSelectNode,
  selectedNodeId,
  auvs,
  onSelectAUV,
  fishSchools,
  onSelectSchool,
  selectedSchoolId,
  targetSchool,
  visualMode = 'NIGHT',
  cameraPreset = 'OVERVIEW',
}: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Lighting & Fog settings based on visual mode
  const bgConfig = {
    DAY: {
      bg: '#6E889C', // Sunlit grayish-blue coastal water
      fogNear: 35,
      fogFar: 190,
      ambientIntensity: 1.3,
      ambientColor: '#FFFFFF',
      dirIntensity: 1.8,
      dirPos: [45, 80, 40] as [number, number, number],
      dirColor: '#FFF7ED',
      pointIntensity: 0.8,
      pointColor: '#38BDF8',
    },
    GRAYISH: {
      bg: '#475569', // High-contrast neutral technical slate-gray
      fogNear: 40,
      fogFar: 200,
      ambientIntensity: 1.4,
      ambientColor: '#E2E8F0',
      dirIntensity: 1.6,
      dirPos: [35, 80, 45] as [number, number, number],
      dirColor: '#FFFFFF',
      pointIntensity: 0.6,
      pointColor: '#60A5FA',
    },
    NIGHT: {
      bg: '#0A1322', // Deep tactical navy
      fogNear: 30,
      fogFar: 140,
      ambientIntensity: 0.8,
      ambientColor: '#1E3A5F',
      dirIntensity: 0.9,
      dirPos: [40, 60, 30] as [number, number, number],
      dirColor: '#A5F3FC',
      pointIntensity: 0.5,
      pointColor: '#00F2FE',
    },
  }[visualMode];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [34, 30, 44], fov: 46, near: 0.5, far: 300 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[bgConfig.bg]} />
        
        {/* Volumetric Underwater Fog */}
        <fog attach="fog" args={[bgConfig.bg, bgConfig.fogNear, bgConfig.fogFar]} />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={bgConfig.ambientIntensity} color={bgConfig.ambientColor} />
        <directionalLight position={bgConfig.dirPos} intensity={bgConfig.dirIntensity} color={bgConfig.dirColor} />
        <pointLight position={[0, -10, 0]} intensity={bgConfig.pointIntensity} color={bgConfig.pointColor} distance={80} />

        <Suspense fallback={null}>
          {/* Surface & Subsurface Environment */}
          <OceanSurface />
          <BathymetryTerrain visualMode={visualMode} />

          {/* Calibrated 10km x 10km Boundary & Depth Scale Ruler (<300m) */}
          <TacticalOceanVolumeBounds />

          {/* Biological Fish Schools Swimming Through Sector */}
          <FishSchoolParticles
            schools={fishSchools}
            onSelectSchool={onSelectSchool}
            selectedSchoolId={selectedSchoolId}
          />

          {/* Anchored Surface Sonar Buoy Array with 360° Rotating Acoustic Fan Blade Beam (0-300m Seabed Reach) */}
          <SonarNodeInstances
            nodes={nodes}
            onSelectNode={onSelectNode}
            selectedNodeId={selectedNodeId}
          />

          <CameraController preset={cameraPreset} controlsRef={controlsRef} />
        </Suspense>

        {/* Restrained Tactical Orbit Controls (Prevent camera clipping beneath deep seabed) */}
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
