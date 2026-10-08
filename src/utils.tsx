import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { C, F } from "./theme";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_SOFT = Easing.bezier(0.33, 1, 0.68, 1);

export const prog = (
  f: number,
  start: number,
  dur: number,
  fn: (t: number) => number = EASE_OUT,
) => fn(clamp((f - start) / dur));

export const fmt = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Мягкое появление снизу
export const Reveal: React.FC<{
  at: number;
  y?: number;
  dur?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, y = 30, dur = 22, style, children }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur, EASE_OUT);
  const o = prog(f, at, Math.round(dur * 0.5), EASE_SOFT);
  return (
    <div style={{ opacity: o, transform: `translateY(${(1 - p) * y}px)`, ...style }}>
      {children}
    </div>
  );
};

// «Удар» штампа: крупно -> на место, быстро
export const Slam: React.FC<{
  at: number;
  rot?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, rot = -8, style, children }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 9, EASE_OUT);
  const o = prog(f, at, 3, EASE_SOFT);
  return (
    <div
      style={{
        opacity: o,
        transform: `rotate(${rot}deg) scale(${2.1 - 1.1 * p})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Окно (браузер/терминал)
export const Win: React.FC<{
  title: string;
  style?: React.CSSProperties;
  border?: string;
  children: React.ReactNode;
}> = ({ title, style, border = C.cardLine, children }) => (
  <div
    style={{
      background: C.card,
      border: `3px solid ${border}`,
      borderRadius: 30,
      boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      boxSizing: "border-box",
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 22px",
        background: "rgba(255,255,255,0.05)",
      }}
    >
      {[C.danger, C.yellow, C.mint].map((c) => (
        <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
      ))}
      <div style={{ marginLeft: 14, fontFamily: F.mono, fontWeight: 500, fontSize: 24, color: C.muted }}>
        {title}
      </div>
    </div>
    <div style={{ padding: 26 }}>{children}</div>
  </div>
);

export const Check: React.FC<{ size?: number; p?: number; color?: string }> = ({
  size = 44,
  p = 1,
  color = C.ink,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path
      d="M8 25 L19 36 L41 12"
      fill="none"
      stroke={color}
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={60}
      strokeDashoffset={60 * (1 - p)}
    />
  </svg>
);

export const Cross: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = C.muted,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M10 10 L38 38 M38 10 L10 38" stroke={color} strokeWidth={7} strokeLinecap="round" />
  </svg>
);

export const Down: React.FC<{ color?: string }> = ({ color = C.yellow }) => (
  <svg width={36} height={44} viewBox="0 0 36 44">
    <path d="M18 2 V34 M6 22 L18 36 L30 22" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Тряска экрана: амплитуда затухает
export const shake = (f: number, at: number, dur: number, amp: number) => {
  const t = f - at;
  if (t < 0 || t > dur) return { x: 0, y: 0 };
  const k = 1 - t / dur;
  return { x: Math.sin(t * 2.7) * amp * k, y: Math.cos(t * 3.3) * amp * 0.6 * k };
};
