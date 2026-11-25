import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
export const Debug: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#334" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 40, position: [0, 0, 5] }}>
        <ambientLight intensity={1} />
        <mesh rotation={[0.4, f * 0.05, 0]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="red" /></mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
