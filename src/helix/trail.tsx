import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import * as THREE from "three";

function makeLine(color: string, lineWidth: number) {
  const geom = new LineGeometry();
  geom.setPositions([0, 0, 0, 0.01, 0, 0]);
  const mat = new LineMaterial({
    color,
    linewidth: lineWidth,
    transparent: true,
    toneMapped: false,
    depthTest: true,
  });
  const line = new Line2(geom, mat);
  line.frustumCulled = false;
  return line;
}

export function CurveTrail({
  getPoint,
  getT,
  segments = 420,
  color = "#e24b4a",
  lineWidth = 2.4,
}: {
  getPoint: (t: number, target: THREE.Vector3) => void;
  getT: () => number;
  segments?: number;
  color?: string;
  lineWidth?: number;
}) {
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const buf = useMemo(() => new Float32Array((segments + 1) * 3), [segments]);
  const line = useMemo(() => makeLine(color, lineWidth), [color, lineWidth]);

  useLayoutEffect(() => {
    return () => {
      line.geometry.dispose();
      line.material.dispose();
    };
  }, [line]);

  useFrame((state) => {
    const T = Math.max(getT(), 1e-4);
    const n = segments;
    for (let i = 0; i <= n; i++) {
      getPoint((i / n) * T, tmp);
      const o = i * 3;
      buf[o] = tmp.x;
      buf[o + 1] = tmp.y;
      buf[o + 2] = tmp.z;
    }
    line.geometry.setPositions(buf);
    line.computeLineDistances();
    line.material.resolution.set(state.gl.domElement.width, state.gl.domElement.height);
    line.material.linewidth = lineWidth;
  });

  return <primitive object={line} />;
}

export function Segment({
  getA,
  getB,
  color,
  lineWidth = 1.4,
}: {
  getA: (v: THREE.Vector3) => void;
  getB: (v: THREE.Vector3) => void;
  color: string;
  lineWidth?: number;
}) {
  const va = useMemo(() => new THREE.Vector3(), []);
  const vb = useMemo(() => new THREE.Vector3(), []);
  const buf = useMemo(() => new Float32Array(6), []);
  const line = useMemo(() => makeLine(color, lineWidth), [color, lineWidth]);

  useLayoutEffect(() => {
    return () => {
      line.geometry.dispose();
      line.material.dispose();
    };
  }, [line]);

  useFrame((state) => {
    getA(va);
    getB(vb);
    buf[0] = va.x;
    buf[1] = va.y;
    buf[2] = va.z;
    buf[3] = vb.x;
    buf[4] = vb.y;
    buf[5] = vb.z;
    line.geometry.setPositions(buf);
    line.material.resolution.set(state.gl.domElement.width, state.gl.domElement.height);
    line.material.linewidth = lineWidth;
  });

  return <primitive object={line} />;
}

export function CircleRing({
  radius,
  color,
  lineWidth = 1.5,
  dashed = false,
  segments = 96,
}: {
  radius: number;
  color: string;
  lineWidth?: number;
  dashed?: boolean;
  segments?: number;
}) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push([radius * Math.cos(a), radius * Math.sin(a), 0]);
    }
    return pts;
  }, [radius, segments]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      dashed={dashed}
      dashSize={0.09}
      gapSize={0.07}
      toneMapped={false}
    />
  );
}

export function RedPoint({
  getPos,
  radius = 0.085,
}: {
  getPos: (v: THREE.Vector3) => void;
  radius?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!ref.current) return;
    getPos(tmp);
    ref.current.position.copy(tmp);
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[radius, 28, 28]} />
        <meshStandardMaterial
          color="#e24b4a"
          emissive="#e24b4a"
          emissiveIntensity={0.85}
          roughness={0.28}
          metalness={0.04}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 2.1, 20, 20]} />
        <meshBasicMaterial color="#e24b4a" transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight color="#ff6b68" intensity={3.2} distance={5} decay={2} />
    </group>
  );
}

export function DotTrail({
  getPoint,
  getT,
  maxT,
  count = 320,
  radius = 0.038,
}: {
  getPoint: (t: number, target: THREE.Vector3) => void;
  getT: () => number;
  maxT: number;
  count?: number;
  radius?: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const T = Math.max(getT(), 1e-4);
    const n = Math.max(2, Math.min(count, Math.ceil((T / maxT) * count)));
    for (let i = 0; i < n; i++) {
      getPoint((i / (n - 1)) * T, tmp);
      dummy.position.copy(tmp);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[radius, 10, 10]} />
      <meshStandardMaterial
        color="#e24b4a"
        emissive="#e24b4a"
        emissiveIntensity={0.75}
        roughness={0.3}
        metalness={0.04}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
