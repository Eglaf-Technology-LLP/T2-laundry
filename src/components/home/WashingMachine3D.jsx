import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Float, ContactShadows, MeshDistortMaterial, useTexture } from "@react-three/drei";
import logoUrl from "@/assets/logo.jpg";

const NAVY = "#0E2346";
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#E5C578";
const CERULEAN = "#3B82F6";

function LogoPlate({ position, rotationY, size = 0.85 }) {
  const texture = useTexture(logoUrl);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Gold bezel */}
      <mesh>
        <planeGeometry args={[size + 0.08, size + 0.08]} />
        <meshStandardMaterial color={GOLD} metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Logo */}
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Tumble({ radius, speed, color, offset }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 1.7) * radius * 0.5, Math.sin(t) * radius);
    ref.current.rotation.x = t * 1.3;
    ref.current.rotation.y = t * 0.8;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.34, 0.34, 0.34]} />
      <MeshDistortMaterial color={color} distort={0.25} speed={2} roughness={0.6} />
    </mesh>
  );
}

function Machine() {
  const group = useRef();
  const drum = useRef();

  useFrame((_, delta) => {
    group.current.rotation.y += delta * 0.15;
    drum.current.rotation.z += delta * 0.4;
  });

  return (
    <group ref={group}>
      {/* Cabinet */}
      <RoundedBox args={[2.3, 2.7, 2.1]} radius={0.18} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color="#FDFEFF" metalness={0.15} roughness={0.45} />
      </RoundedBox>

      {/* Control panel strip */}
      <mesh position={[0, 1.18, 1.06]}>
        <boxGeometry args={[1.9, 0.28, 0.05]} />
        <meshStandardMaterial color={NAVY} metalness={0.5} roughness={0.4} />
      </mesh>
      {[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 1.18, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.05, 24]} />
          <meshStandardMaterial color={GOLD_LIGHT} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}

      {/* Door ring */}
      <group ref={drum} position={[0, -0.15, 1.08]}>
        <mesh>
          <torusGeometry args={[0.78, 0.09, 24, 48]} />
          <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Glass */}
        <mesh position={[0, 0, 0.03]}>
          <circleGeometry args={[0.7, 48]} />
          <meshPhysicalMaterial color={NAVY} metalness={0.2} roughness={0.05} clearcoat={1} transparent opacity={0.85} />
        </mesh>
        {/* Tumbling garments seen through the glass */}
        <group position={[0, 0, 0.15]}>
          <Tumble radius={0.32} speed={1.1} color={GOLD_LIGHT} offset={0} />
          <Tumble radius={0.3} speed={0.9} color={CERULEAN} offset={2} />
          <Tumble radius={0.28} speed={1.3} color="#ffffff" offset={4} />
        </group>
      </group>

      {/* Logo plates on every side except the front (door/controls already live there) */}
      <LogoPlate position={[1.17, 0.1, 0]} rotationY={Math.PI / 2} />
      <LogoPlate position={[-1.17, 0.1, 0]} rotationY={-Math.PI / 2} />
      <LogoPlate position={[0, 0.1, -1.07]} rotationY={Math.PI} />

      {/* Feet */}
      {[[-0.95, -1.4, 0.85], [0.95, -1.4, 0.85], [-0.95, -1.4, -0.85], [0.95, -1.4, -0.85]].map((p, i) => (
        <mesh key={i} position={p}>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Bubble({ position, scale }) {
  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1.4}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.28} roughness={0} metalness={0} clearcoat={1} />
      </mesh>
    </Float>
  );
}

export default function WashingMachine3D() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [3.2, 1.4, 4.2], fov: 38 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 5, 3]} intensity={0.7} color={GOLD_LIGHT} />
      <pointLight position={[-3, 1, -2]} intensity={0.6} color={CERULEAN} />
      <hemisphereLight args={["#ffffff", "#0E2346", 0.4]} />

      <Suspense fallback={null}>
        <Machine />
        <Bubble position={[1.7, 1.2, 0.4]} scale={0.16} />
        <Bubble position={[-1.6, 0.6, 0.8]} scale={0.11} />
        <Bubble position={[1.3, -0.6, 1.2]} scale={0.08} />
        <Bubble position={[-1.2, 1.6, -0.6]} scale={0.13} />
        <ContactShadows position={[0, -1.52, 0]} opacity={0.35} scale={6} blur={2.4} far={2} />
      </Suspense>
    </Canvas>
  );
}
