import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { anim, useHelix } from "./store";
import {
  HELIX,
  MAX_THETA,
  OMEGA,
  SINUS,
  TOUR_DURATION,
  TORUS,
  type Chapter,
  cylHelix,
  sinusCircle,
  sinusWave,
  torusHelix,
} from "./math";
import { CircleRing, CurveTrail, DotTrail, RedPoint, Segment } from "./trail";

export function Driver() {
  const playing = useHelix((s) => s.playing);
  const speed = useHelix((s) => s.speed);
  const mode = useHelix((s) => s.mode);

  useFrame((_, dt0) => {
    if (!playing) return;
    const dt = Math.min(dt0, 0.1) * speed;

    if (mode === "tour") {
      anim.tour += dt / TOUR_DURATION;
      if (anim.tour >= 1) anim.tour -= 1;
      const t = anim.tour;
      if (t < 0.27) {
        anim.theta = Math.min(t / 0.24, 1) * MAX_THETA.sinus;
      } else if (t < 0.52) {
        anim.theta = Math.min((t - 0.27) / 0.22, 1) * MAX_THETA.helix;
      } else {
        anim.theta = Math.min((t - 0.52) / 0.4, 1) * MAX_THETA.torus;
      }
      return;
    }

    const omega = OMEGA[mode];
    const max = MAX_THETA[mode];
    if (anim.theta >= max) {
      anim.hold += dt;
      anim.theta = max;
      if (anim.hold > 0.55) {
        anim.theta = 0;
        anim.hold = 0;
      }
    } else {
      anim.theta += dt * omega;
      if (anim.theta > max) anim.theta = max;
    }
  });

  return null;
}

export function CameraRig({ chapter }: { chapter: Chapter }) {
  const mode = useHelix((s) => s.mode);
  const controlsRef = useRef<{
    target: THREE.Vector3;
    enabled: boolean;
  } | null>(null);
  const look = useMemo(() => new THREE.Vector3(), []);
  const lookGoal = useMemo(() => new THREE.Vector3(), []);
  const posGoal = useMemo(() => new THREE.Vector3(), []);
  const dragging = useRef(false);
  const snapUntil = useRef(0);
  const { camera } = useThree();

  useEffect(() => {
    dragging.current = false;
    snapUntil.current = performance.now() + 1300;
  }, [chapter, mode]);

  useFrame((_, dt0) => {
    const dt = Math.min(dt0, 0.1);
    const k = 1 - Math.exp(-3.4 * dt);
    if (chapter === "sinus") {
      posGoal.set(0.4, 0.04, 9.4);
      lookGoal.set(0.4, 0, 0);
    } else if (chapter === "helix") {
      posGoal.set(4.5, 2.5, 6.6);
      lookGoal.set(0, 0, 1.5);
    } else {
      posGoal.set(4.35, 2.7, 4.35);
      lookGoal.set(0, 0, 0);
    }

    const snap =
      mode === "tour" ||
      chapter === "sinus" ||
      performance.now() < snapUntil.current;
    if (snap) {
      camera.position.lerp(posGoal, k);
      look.lerp(lookGoal, k);
      camera.lookAt(look);
      controlsRef.current?.target.lerp(lookGoal, k);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef as never}
      enabled={chapter !== "sinus"}
      enablePan={false}
      enableRotate={chapter !== "sinus"}
      minDistance={3}
      maxDistance={16}
      enableDamping
      dampingFactor={0.08}
      autoRotate={chapter !== "sinus" && mode !== "tour"}
      autoRotateSpeed={0.55}
      onStart={() => {
        dragging.current = true;
      }}
    />
  );
}

function StaticAxis({
  from,
  to,
  color = "#3f4248",
}: {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
}) {
  return (
    <Line
      points={[from, to]}
      color={color}
      lineWidth={1}
      dashed
      dashSize={0.08}
      gapSize={0.06}
      toneMapped={false}
    />
  );
}

export function SceneSinus() {
  const center = useMemo(() => new THREE.Vector3(SINUS.cx, 0, 0), []);

  return (
    <group>
      <group position={[SINUS.cx, 0, 0]}>
        <CircleRing radius={SINUS.r} color="#d0d5de" lineWidth={2} />
      </group>
      <StaticAxis
        from={[SINUS.cx - SINUS.r - 0.45, 0, 0]}
        to={[SINUS.cx + SINUS.r + SINUS.xScale * MAX_THETA.sinus + 0.4, 0, 0]}
      />
      <StaticAxis from={[SINUS.cx, -SINUS.r - 0.4, 0]} to={[SINUS.cx, SINUS.r + 0.4, 0]} />
      <Segment
        getA={(v) => v.copy(center)}
        getB={(v) => sinusCircle(anim.theta, v)}
        color="#9aa1ac"
        lineWidth={1.3}
      />
      <Segment
        getA={(v) => sinusCircle(anim.theta, v)}
        getB={(v) => sinusWave(anim.theta, v)}
        color="#e24b4a"
        lineWidth={1.35}
      />
      <CurveTrail
        getPoint={(t, v) => sinusWave(t, v)}
        getT={() => anim.theta}
        segments={360}
        color="#e24b4a"
        lineWidth={3.2}
      />
      <DotTrail
        getPoint={(t, v) => sinusWave(t, v)}
        getT={() => anim.theta}
        maxT={MAX_THETA.sinus}
        count={220}
        radius={0.048}
      />
      <RedPoint getPos={(v) => sinusCircle(anim.theta, v)} radius={0.09} />
    </group>
  );
}

export function SceneHelix() {
  const zAxisEnd = HELIX.pitch * MAX_THETA.helix + 0.4;
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.z = HELIX.pitch * anim.theta;
    }
  });

  return (
    <group>
      <group position={[0, 0, 0]}>
        <CircleRing radius={HELIX.r} color="#5c616a" lineWidth={1.2} dashed />
      </group>
      <group ref={groupRef}>
        <CircleRing radius={HELIX.r} color="#d0d5de" lineWidth={2} />
      </group>
      <StaticAxis from={[0, 0, -0.4]} to={[0, 0, zAxisEnd]} />
      <CurveTrail
        getPoint={(t, v) => cylHelix(t, v)}
        getT={() => anim.theta}
        segments={480}
        color="#e24b4a"
        lineWidth={3}
      />
      <DotTrail
        getPoint={(t, v) => cylHelix(t, v)}
        getT={() => anim.theta}
        maxT={MAX_THETA.helix}
        count={280}
        radius={0.042}
      />
      <RedPoint getPos={(v) => cylHelix(anim.theta, v)} radius={0.09} />
    </group>
  );
}

function Meridian() {
  const ref = useRef<THREE.Group>(null);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const zAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const th = anim.theta;
    g.position.set(TORUS.R * Math.cos(th), 0, TORUS.R * Math.sin(th));
    tangent.set(-Math.sin(th), 0, Math.cos(th)).normalize();
    q.setFromUnitVectors(zAxis, tangent);
    g.quaternion.copy(q);
  });

  return (
    <group ref={ref}>
      <CircleRing radius={TORUS.r} color="#e8eaee" lineWidth={1.9} />
      <CircleRing radius={TORUS.r * 1.2} color="#7c828c" lineWidth={1.05} dashed />
      <CurveTrail
        getPoint={(t, v) => {
          const rad = TORUS.r * 1.2;
          v.set(rad * Math.cos(t), rad * Math.sin(t), 0);
        }}
        getT={() => Math.min(anim.theta / 2, Math.PI)}
        segments={40}
        color="#c8ccd4"
        lineWidth={2.5}
      />
    </group>
  );
}

export function SceneTorus() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[TORUS.R, TORUS.r, 36, 128]} />
        <meshStandardMaterial
          color="#c5ccd6"
          transparent
          opacity={0.22}
          roughness={0.38}
          metalness={0.12}
          emissive="#9aa3b0"
          emissiveIntensity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[TORUS.R, TORUS.r, 12, 48]} />
        <meshBasicMaterial color="#8b929c" wireframe transparent opacity={0.22} toneMapped={false} />
      </mesh>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <CircleRing radius={TORUS.R} color="#d7dbe3" lineWidth={2.1} />
      </group>
      <Meridian />
      <CurveTrail
        getPoint={(t, v) => torusHelix(t, v)}
        getT={() => anim.theta}
        segments={640}
        color="#e24b4a"
        lineWidth={3.2}
      />
      <DotTrail
        getPoint={(t, v) => torusHelix(t, v)}
        getT={() => anim.theta}
        maxT={MAX_THETA.torus}
        count={380}
        radius={0.04}
      />
      <RedPoint getPos={(v) => torusHelix(anim.theta, v)} radius={0.075} />
    </group>
  );
}
