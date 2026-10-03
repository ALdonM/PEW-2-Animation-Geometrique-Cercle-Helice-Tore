import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { activeChapter, type Chapter } from "./math";
import { CameraRig, Driver, SceneHelix, SceneSinus, SceneTorus } from "./scenes";
import { anim, useHelix } from "./store";

export default function Viewport() {
  const mode = useHelix((s) => s.mode);
  const [chapter, setChapter] = useState<Chapter>(() => activeChapter(mode, anim.tour));

  useEffect(() => {
    setChapter(activeChapter(mode, anim.tour));
    const id = window.setInterval(() => {
      const m = useHelix.getState().mode;
      setChapter((prev) => {
        const next = activeChapter(m, anim.tour);
        return next === prev ? prev : next;
      });
    }, 70);
    return () => window.clearInterval(id);
  }, [mode]);

  return (
    <div className="absolute inset-0 bg-bg" style={{ touchAction: "none" }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [4.35, 2.7, 4.35], fov: 36, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#09090b");
        }}
      >
        <color attach="background" args={["#09090b"]} />
        <ambientLight intensity={0.82} />
        <hemisphereLight args={["#dfe3ea", "#121214", 0.55]} />
        <directionalLight position={[5, 9, 4]} intensity={1.35} />
        <directionalLight position={[-5, 3, -6]} intensity={0.4} />
        <Driver />
        <CameraRig chapter={chapter} />
        {chapter === "sinus" ? <SceneSinus /> : null}
        {chapter === "helix" ? <SceneHelix /> : null}
        {chapter === "torus" ? <SceneTorus /> : null}
      </Canvas>
    </div>
  );
}
