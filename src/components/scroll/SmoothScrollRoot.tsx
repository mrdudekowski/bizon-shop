"use client";

import { useEffect, useState } from "react";
import { ReactLenis } from "lenis/react";
import { shouldMountLenis } from "./shouldMountLenis";

export function SmoothScrollRoot() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setMounted(shouldMountLenis(media.matches));
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  if (!mounted) return null;
  return (
    <ReactLenis
      root
      options={{
        allowNestedScroll: true,
        anchors: true,
        autoRaf: true,
        lerp: 0.085,
        respectReducedMotion: true,
        stopInertiaOnNavigate: true,
      }}
    />
  );
}
