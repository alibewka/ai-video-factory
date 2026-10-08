import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, rgba } from "./theme";

// фон: тёмный градиент, точечная сетка и два медленно плывущих «светящихся пятна»
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const a = f / 240;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg2} 0%, ${C.bg} 55%, #030816 100%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, ${rgba(C.accent, 0.28)} 2px, transparent 2.5px)`,
          backgroundSize: "54px 54px",
          backgroundPosition: "27px 27px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 120 + Math.sin(a) * 160,
          top: 330 + Math.cos(a * 0.8) * 120,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${rgba(C.accent, 0.2)} 0%, transparent 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 380 + Math.cos(a * 0.9) * 180,
          top: 860 + Math.sin(a * 0.7) * 160,
          width: 640,
          height: 640,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${rgba(C.yellow, 0.07)} 0%, transparent 68%)`,
        }}
      />
    </AbsoluteFill>
  );
};
