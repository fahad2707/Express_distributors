'use client';

import React, { forwardRef, useMemo } from 'react';
import * as THREE from 'three';
import { GroupProps } from '@react-three/fiber';

type GlassStarProps = GroupProps;

const GlassStar = forwardRef<THREE.Group, GlassStarProps>((props, ref) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const spikes = 5;
    const outerRadius = 1.4;
    const innerRadius = 0.6;
    const step = Math.PI / spikes;

    shape.moveTo(0, outerRadius);
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.sin(i * step) * radius;
      const y = Math.cos(i * step) * radius;
      shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.7,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.25,
      bevelSegments: 24,
      steps: 2,
      curveSegments: 64,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }, []);

  return (
    <group ref={ref} {...props}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          transmission={1} // full glass
          thickness={1}
          roughness={0.02}
          metalness={0}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.2}
          color="#cfe9ff"
          transparent
        />
      </mesh>
    </group>
  );
});

GlassStar.displayName = 'GlassStar';

export default GlassStar;

