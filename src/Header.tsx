import React from "react";
import { useCurrentFrame } from "remotion";
import { Img, staticFile } from "remotion";
import { C, F, rgba } from "./theme";
import { HANDLE, SUBTITLE, AVATAR } from "./config";
import { SCENES, STAGES } from "./timeline";
import { clamp } from "./utils";
import { Mascot } from "./Mascot";

export const Avatar: React.FC<{ size: number }> = ({ size }) =>
  AVATAR ? (
    <Mascot size={size} bob={false} />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: `linear-gradient(135deg, ${C.accent}, ${C.yellow})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: F.title,
        fontWeight: 900,
        fontSize: size * 0.5,
        color: C.ink,
        boxShadow: `0 0 0 4px ${rgba(C.accent, 0.35)}`,
      }}
    >
      A
    </div>
  );

export const Header: React.FC = () => {
  const f = useCurrentFrame();
  let cur = 0;
  SCENES.forEach((sc, i) => {
    if (f >= sc.from) cur = i;
  });
  const sc = SCENES[cur];
  const inSc = clamp((f - sc.from) / sc.dur);
  return (
    <div style={{ position: "absolute", left: 60, right: 100, top: 92 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Avatar size={80} />
          <div>
            <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 34, color: C.text }}>{HANDLE}</div>
            <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 22, color: C.muted, marginTop: 2 }}>{SUBTITLE}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 20, color: C.muted }}>
            этап {String(cur + 1).padStart(2, "0")}/{String(SCENES.length).padStart(2, "0")}
          </div>
          <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 34, color: C.accent, textTransform: "uppercase" }}>
            {STAGES[cur]}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
        {SCENES.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(143,180,234,0.25)", overflow: "hidden" }}>
            <div
              style={{
                width: `${i < cur ? 100 : i === cur ? inSc * 100 : 0}%`,
                height: "100%",
                background: C.accent,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// водяной знак с иконкой — каждые ~5 секунд перепрыгивает в новое место
export const Watermark: React.FC = () => {
  const f = useCurrentFrame();
  const POS = [
    { left: 60, top: 1560 },
    { left: 640, top: 1560 },
    { left: 60, top: 1636 },
    { left: 640, top: 1636 },
  ];
  const period = 150;
  const k = Math.floor(f / period) % POS.length;
  const lf = f % period;
  const o = Math.min(clamp(lf / 10), clamp((period - lf) / 10)) * 0.5;
  const drift = (lf / period) * 14;
  return (
    <div style={{ position: "absolute", ...POS[k], display: "flex", alignItems: "center", gap: 12, opacity: o, transform: `translateX(${drift}px)` }}>
      <svg width={34} height={34} viewBox="0 0 34 34">
        <path d="M17 2 L30 7 V17 C30 25 24 30 17 32 C10 30 4 25 4 17 V7 Z" fill="none" stroke={C.yellow} strokeWidth={2.6} strokeLinejoin="round" />
        <path d="M11 17 L15.5 21.5 L23 12.5" fill="none" stroke={C.yellow} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 26, color: C.text }}>{HANDLE}</span>
    </div>
  );
};
