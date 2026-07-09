"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";

function GlassObject() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (!meshRef.current) return;
    // Subtle rotation following mouse position
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      pointer.y * 0.3,
      0.05
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      pointer.x * 0.3,
      0.05
    );
  });

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        transmission: 0.92,
        roughness: 0.05,
        thickness: 1.5,
        ior: 1.5,
        chromaticAberration: 0.02,
        color: new THREE.Color("#ffffff"),
        transparent: true,
        opacity: 0.9,
      } as THREE.MeshPhysicalMaterialParameters),
    []
  );

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} material={material}>
        <icosahedronGeometry args={[1.8, 1]} />
      </mesh>
    </Float>
  );
}

function Lights({ isDark }: { isDark: boolean }) {
  return (
    <>
      <ambientLight intensity={isDark ? 0.3 : 0.5} />
      <pointLight
        position={[5, 5, 5]}
        intensity={isDark ? 0.8 : 1.2}
        color={isDark ? "#4f9cf7" : "#f59e0b"}
      />
      <pointLight
        position={[-5, -3, 3]}
        intensity={isDark ? 0.4 : 0.6}
        color={isDark ? "#06b6d4" : "#fbbf24"}
      />
    </>
  );
}

interface HeroSceneProps {
  isDark: boolean;
}

export default function HeroScene({ isDark }: HeroSceneProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <Lights isDark={isDark} />
      <GlassObject />
      <Environment preset={isDark ? "night" : "sunset"} />
    </Canvas>
  );
}
