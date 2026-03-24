'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import GlassStar from './GlassStar';
import BackgroundText from './BackgroundText';

gsap.registerPlugin(ScrollTrigger);

interface HeroCanvasProps {
  className?: string;
}

function Scene({ isMobile }: { isMobile: boolean }) {
  const starRef = useRef<THREE.Group>(null);
  const bgTextRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (starRef.current) {
      starRef.current.rotation.y += delta * 0.15;
      starRef.current.rotation.x = THREE.MathUtils.lerp(
        starRef.current.rotation.x,
        0.25,
        0.05
      );
    }
  });

  return (
    <>
      {/* Soft studio lighting */}
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.55} />
      <directionalLight
        intensity={1.1}
        position={[4, 6, 6]}
        castShadow
      />
      <directionalLight intensity={0.5} position={[-5, -3, -5]} />

      <Environment preset="city" resolution={512} />

      {/* Background text behind the star */}
      <BackgroundText ref={bgTextRef} position={[0, 0, -4]} rotation={[0, 0, 0]} />

      {/* Glass star in center */}
      <GlassStar ref={starRef} position={[0, 0, 0]} scale={1.4} />

      {/* Slight, almost locked orbit controls for subtle parallax */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={!isMobile}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 1.8}
      />

      {/* Postprocessing kept subtle, reduced on mobile */}
      <EffectComposer>
        <Bloom
          intensity={isMobile ? 0.15 : 0.3}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.6}
          radius={0.7}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={isMobile ? [0.0005, 0.0005] : [0.0015, 0.0015]}
        />
        <Vignette
          eskil={false}
          offset={0.2}
          darkness={0.75}
        />
      </EffectComposer>

      {/* Scroll-driven motion */}
      <ScrollAnimation
        starRef={starRef}
        bgTextRef={bgTextRef}
        camera={camera}
      />
    </>
  );
}

interface ScrollAnimationProps {
  starRef: React.RefObject<THREE.Group>;
  bgTextRef: React.RefObject<THREE.Group>;
  camera: THREE.Camera;
}

function ScrollAnimation({ starRef, bgTextRef, camera }: ScrollAnimationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      if (starRef.current) {
        tl.to(
          starRef.current.rotation,
          { y: '+=' + Math.PI * 2 },
          0
        ).to(
          starRef.current.scale,
          { x: 1.2, y: 1.2, z: 1.2 },
          0
        );
      }

      tl.to(
        camera.position,
        { z: 4.2 },
        0
      );

      if (bgTextRef.current) {
        tl.to(
          bgTextRef.current.scale,
          { x: 1.1, y: 1.1, z: 1 },
          0
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [camera, starRef, bgTextRef]);

  return <div ref={containerRef} className="pointer-events-none absolute inset-0" />;
}

const HeroCanvas: React.FC<HeroCanvasProps> = ({ className }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className={className ?? 'h-full w-full'}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.8]}
        gl={{
          antialias: true,
        }}
      >
        <Suspense fallback={null}>
          <Scene isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HeroCanvas;

