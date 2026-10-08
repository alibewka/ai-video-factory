import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, rgba } from "./theme";
import { EASE_OUT, EASE_SOFT, clamp, prog } from "./utils";

// область контента: x 60..980, y 262..1272 (координаты внутри — от левого верхнего угла); субтитры ниже, ~y1300..1470
export const YS = React.createContext(1);
export const Content: React.FC<{ ys?: number; children: React.ReactNode }> = ({ ys = 1, children }) => (
  <YS.Provider value={ys}>
    <div style={{ position: "absolute", left: 60, top: 262, width: 920, height: 1010 }}>{children}</div>
  </YS.Provider>
);

export const At: React.FC<{ x: number; y: number; w?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  x,
  y,
  w,
  style,
  children,
}) => {
  const ys = React.useContext(YS);
  return <div style={{ position: "absolute", left: x, top: y * ys, width: w, ...style }}>{children}</div>;
};

// плавное появление: от кадра at
export const Pop: React.FC<{ at: number; y?: number; dur?: number; scale?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  at,
  y = 24,
  dur = 16,
  scale = 0.96,
  style,
  children,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur, EASE_OUT);
  const o = prog(f, at, Math.round(dur * 0.5), EASE_SOFT);
  return (
    <div style={{ opacity: o, transform: `translateY(${(1 - p) * y}px) scale(${scale + (1 - scale) * p})`, ...style }}>{children}</div>
  );
};

export const Plate: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  color = C.accent,
  size = 60,
  style,
}) => (
  <span
    style={{
      display: "inline-block",
      background: color,
      color: C.ink,
      fontFamily: F.title,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1.1,
      padding: `${size * 0.05}px ${size * 0.25}px`,
      borderRadius: size * 0.22,
      ...style,
    }}
  >
    {children}
  </span>
);

export const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  size = 22,
  color = C.muted,
  style,
}) => (
  <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: size, color, letterSpacing: 0.5, ...style }}>{children}</div>
);

export const Card: React.FC<{ style?: React.CSSProperties; border?: string; children: React.ReactNode }> = ({
  style,
  border = C.cardLine,
  children,
}) => (
  <div
    style={{
      background: "rgba(255,255,255,0.035)",
      border: `2px solid ${border}`,
      borderRadius: 24,
      boxSizing: "border-box",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Token: React.FC<{
  text: string;
  color?: string;
  bg?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ text, color = C.text, bg = "rgba(79,134,255,0.14)", size = 40, style }) => (
  <div
    style={{
      display: "inline-block",
      fontFamily: F.mono,
      fontWeight: 500,
      fontSize: size,
      color,
      background: bg,
      border: `2px solid ${C.accent}`,
      borderRadius: size * 0.28,
      padding: `${size * 0.12}px ${size * 0.34}px`,
      whiteSpace: "pre",
      ...style,
    }}
  >
    {text}
  </div>
);

export const CheckIcon: React.FC<{ size?: number; color?: string; p?: number }> = ({ size = 48, color = C.mint, p = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill={color} />
    <path d="M13 25 L21 33 L36 16" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={40} strokeDashoffset={40 * (1 - p)} />
  </svg>
);

export const CrossIcon: React.FC<{ size?: number; color?: string }> = ({ size = 48, color = C.danger }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill={color} />
    <path d="M15 15 L33 33 M33 15 L15 33" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
  </svg>
);

export const Cursor: React.FC<{ size?: number }> = ({ size = 40 }) => {
  const f = useCurrentFrame();
  return (
    <span
      style={{
        display: "inline-block",
        width: size * 0.14,
        height: size,
        background: C.accent,
        marginLeft: 6,
        verticalAlign: "middle",
        opacity: Math.floor(f / 10) % 2 === 0 ? 1 : 0.15,
      }}
    />
  );
};

export const Arrow: React.FC<{ len?: number; color?: string; p?: number }> = ({ len = 70, color = C.accent, p = 1 }) => (
  <svg width={44} height={len} viewBox={`0 0 44 ${len}`}>
    <path d={`M22 2 V${len - 14} M8 ${len - 26} L22 ${len - 10} L36 ${len - 26}`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={p} />
  </svg>
);

// анимированный счётчик
export const Counter: React.FC<{ at: number; dur: number; to: number; fmtFn?: (n: number) => string; style?: React.CSSProperties }> = ({
  at,
  dur,
  to,
  fmtFn,
  style,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur, (t) => 1 - Math.pow(1 - t, 3));
  const n = to * p;
  const out = fmtFn ? fmtFn(n) : Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return <span style={style}>{out}</span>;
};

export { clamp };


// «но…» — крючок в конце блока
export const Hook: React.FC<{ at: number; lead?: string; children: string }> = ({ at, lead = "НО", children }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 12, EASE_OUT);
  const o = prog(f, at, 6, EASE_SOFT);
  const glow = 0.5 + 0.5 * Math.sin((f - at) / 5);
  return (
    <div style={{ position: "absolute", left: 0, top: 880, width: 920, display: "flex", justifyContent: "center", opacity: o, transform: `translateY(${(1 - p) * 30}px) scale(${0.92 + 0.08 * p})` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          border: `3px solid ${C.yellow}`,
          borderRadius: 30,
          padding: "16px 32px",
          background: rgba(C.yellow, 0.08 + 0.05 * glow),
          boxShadow: `0 0 ${20 + 24 * glow}px ${rgba(C.yellow, 0.25)}`,
          whiteSpace: "nowrap",
        }}
      >
        <Plate size={54} color={C.yellow}>{lead}</Plate>
        <span style={{ fontFamily: F.title, fontWeight: 900, fontSize: 50, color: C.text }}>{children}</span>
      </div>
    </div>
  );
};

// тонкий узел схемы
export const Node: React.FC<{ label: string; sub?: string; on?: boolean; color?: string; w?: number; h?: number; size?: number }> = ({
  label,
  sub,
  on = false,
  color = C.accent,
  w = 250,
  h = 110,
  size = 34,
}) => (
  <div
    style={{
      width: w,
      height: h,
      boxSizing: "border-box",
      border: `2px solid ${on ? color : C.cardLine}`,
      background: on ? rgba(color, 0.14) : "rgba(255,255,255,0.02)",
      borderRadius: 22,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: on ? `0 0 28px ${rgba(color, 0.35)}` : "none",
    }}
  >
    <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: size, color: on ? C.text : C.muted, textAlign: "center", lineHeight: 1.1 }}>{label}</div>
    {sub && <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 20, color: on ? color : C.muted, marginTop: 6 }}>{sub}</div>}
  </div>
);

// тонкая горизонтальная стрелка
export const HArrow: React.FC<{ w?: number; color?: string; p?: number }> = ({ w = 60, color = C.accent, p = 1 }) => (
  <svg width={w} height={30} viewBox={`0 0 ${w} 30`} style={{ opacity: p }}>
    <path d={`M2 15 H${w - 6} M${w - 20} 4 L${w - 4} 15 L${w - 20} 26`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
