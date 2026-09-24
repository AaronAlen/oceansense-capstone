// ==============================================================================
// OceanSense — Translucent Ocean Surface Mesh
// ==============================================================================

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function OceanSurface() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Subtle ambient ocean surface heave
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[130, 130, 16, 16]} />
      <meshStandardMaterial
        color="#002B49"
        transparent
        opacity={0.3}
        roughness={0.1}
        metalness={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
