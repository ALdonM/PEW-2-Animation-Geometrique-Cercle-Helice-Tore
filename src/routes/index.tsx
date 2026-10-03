import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { Hud } from "@/helix/hud";

const Viewport = lazy(() => import("@/helix/viewport"));

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Splash() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-bg text-fg">
      <p className="font-display text-5xl tracking-tight">4π³</p>
      <p className="mt-3 text-sm text-muted">Hélice toroïdale</p>
    </div>
  );
}

function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <Splash />;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <Suspense fallback={<Splash />}>
        <Viewport />
      </Suspense>
      <Hud />
    </main>
  );
}
