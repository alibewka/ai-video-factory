import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, rgba } from "../theme";
import { Content, At, Pop, Mono, Card, Hook } from "../kit";
import { WifiIcon, PhoneIcon, RouterIcon, LaptopIcon } from "../icons";
import { rel, relSent } from "../timeline";
import { prog, EASE_OUT } from "../utils";

const R = { x: 140, y: 170 }; // роутер кафе
const P = { x: 450, y: 500 }; // телефон
const L = { x: 740, y: 330 }; // ноутбук мошенника

const Rings: React.FC<{ x: number; y: number; color: string; speed: number; n?: number; max: number }> = ({ x, y, color, speed, n = 3, max }) => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const ph = ((f * speed) / 60 + i / n) % 1;
        return <circle key={i} cx={x} cy={y} r={20 + ph * max} fill="none" stroke={color} strokeWidth={4} opacity={(1 - ph) * 0.7} />;
      })}
    </>
  );
};

const Bar: React.FC<{ label: string; n: number; color: string; at: number }> = ({ label, n, color, at }) => (
  <Pop at={at} dur={10}>
    <div style={{ display: "flex", alignItems: "center", gap: 18, height: 62 }}>
      <div style={{ width: 360, fontFamily: F.mono, fontWeight: 500, fontSize: 24, color: C.muted }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: 54, height: 18 + i * 6, alignSelf: "flex-end", borderRadius: 6, background: i <= n ? color : "rgba(143,180,234,0.2)" }} />
        ))}
      </div>
    </div>
  </Pop>
);

export const S3Trick: React.FC = () => {
  const f = useCurrentFrame();
  const tLap = relSent(2, 0);
  const tName = relSent(2, 1);
  const tCloser = relSent(2, 2);
  const tPick = rel(2, "выбирает");
  const tBut = rel(2, "Но");
  const line = prog(f, tPick, 14, EASE_OUT);
  return (
    <Content>
      <svg width={920} height={640} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Rings x={R.x} y={R.y} color={C.accent} speed={0.8} max={250} />
        {f >= tCloser && <Rings x={L.x} y={L.y} color={C.danger} speed={1.3} max={300} n={4} />}
        <line x1={R.x} y1={R.y} x2={P.x} y2={P.y} stroke={rgba(C.accent, 0.35)} strokeWidth={3} strokeDasharray="6 10" />
        {f >= tCloser && <line x1={L.x} y1={L.y} x2={P.x} y2={P.y} stroke={rgba(C.danger, 0.3)} strokeWidth={3} strokeDasharray="6 10" />}
        {f >= tPick && (
          <line x1={P.x} y1={P.y} x2={P.x + (L.x - P.x) * line} y2={P.y + (L.y - P.y) * line} stroke={C.danger} strokeWidth={7} strokeLinecap="round" strokeDasharray="16 10" strokeDashoffset={-f * 2.5} />
        )}
      </svg>

      <Pop at={4} style={{ position: "absolute", left: R.x - 60, top: R.y - 60 }}>
        <RouterIcon size={120} color={C.text} />
      </Pop>
      <Pop at={8} style={{ position: "absolute", left: R.x - 110, top: R.y + 70 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: rgba(C.accent, 0.16), border: `2px solid ${C.accent}`, borderRadius: 14, padding: "6px 16px", whiteSpace: "nowrap" }}>
          <WifiIcon size={30} color={C.text} />
          <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, color: C.text }}>Cafe_Free_WiFi</span>
        </div>
      </Pop>
      <Pop at={12} style={{ position: "absolute", left: R.x - 80, top: R.y - 100 }}>
        <Mono size={22}>роутер кафе</Mono>
      </Pop>

      <Pop at={Math.max(4, tLap)} style={{ position: "absolute", left: L.x - 60, top: L.y - 60 }}>
        <LaptopIcon size={120} color={C.danger} />
      </Pop>
      <Pop at={Math.max(6, tLap + 6)} style={{ position: "absolute", left: L.x - 90, top: L.y - 112 }}>
        <Mono size={22} color={C.danger}>ноутбук мошенника</Mono>
      </Pop>
      <Pop at={tName} style={{ position: "absolute", left: L.x - 160, top: L.y + 70 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: rgba(C.danger, 0.16), border: `2px solid ${C.danger}`, borderRadius: 14, padding: "6px 16px", whiteSpace: "nowrap" }}>
          <WifiIcon size={30} color={C.text} />
          <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, color: C.text }}>Cafe_Free_WiFi</span>
        </div>
      </Pop>

      <Pop at={6} style={{ position: "absolute", left: P.x - 55, top: P.y - 55 }}>
        <PhoneIcon size={110} color={C.text} />
      </Pop>

      <At x={0} y={640} w={920}>
        <Card style={{ padding: "12px 28px" }}>
          <Bar at={tCloser + 4} label="роутер кафе · далеко" n={2} color={C.accent} />
          <Bar at={tCloser + 10} label="ноутбук рядом · ближе" n={4} color={C.danger} />
        </Card>
      </At>
      <Hook at={tBut}>ДАЛЬШЕ — ХУЖЕ</Hook>
    </Content>
  );
};
