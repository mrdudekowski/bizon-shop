"use client";

import { ReactLenis } from "lenis/react";

export function SmoothScrollRoot() {
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
