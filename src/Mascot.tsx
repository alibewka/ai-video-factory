import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "./theme";

export type Mood = "curious" | "shock" | "smug" | "happy";

// Талисман канала: голова-щит с антенной. Лаймовый «значок» вокруг, чтобы голова читалась на тёмном фоне.
export const Mascot: React.FC<{ size: number; mood?: Mood; bg?: string; bob?: boolean }> = ({ size, mood = "curious", bg = C.yellow, bob = true }) => {
  const f = useCurrentFrame();
  const dy = bob ? Math.sin(f / 9) * 5 : 0;
  const face = C.yellow;
  const ink = C.ink;
  const head = "M250 300 Q250 230 330 230 H470 Q550 230 550 300 V455 C550 560 480 620 400 665 C320 620 250 560 250 455 Z";
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", background: bg, flexShrink: 0, boxShadow: `0 0 0 ${Math.max(3, size / 40)}px rgba(46,184,255,0.3)` }}>
      <svg width={size} height={size} viewBox="0 0 800 800">
        <g transform={`translate(400 ${400 + dy}) scale(1.15) translate(-405 -392)`}>
          <line x1="400" y1="150" x2="400" y2="215" stroke={ink} strokeWidth={22} strokeLinecap="round" />
          <circle cx="400" cy="130" r="34" fill={ink} />
          <circle cx="400" cy="130" r="13" fill={mood === "shock" ? C.danger : face} />
          <path d={head} transform="translate(26 26)" fill={C.accent} />
          <path d={head} fill={ink} />
          {mood === "curious" && (
            <>
              <ellipse cx="337" cy="388" rx="46" ry="54" fill={face} />
              <ellipse cx="463" cy="388" rx="46" ry="54" fill={face} />
              <circle cx="352" cy="374" r="24" fill={ink} />
              <circle cx="478" cy="374" r="24" fill={ink} />
              <circle cx="361" cy="364" r="9" fill="#fff" />
              <circle cx="487" cy="364" r="9" fill="#fff" />
              <path d="M290 318 Q335 292 380 312" fill="none" stroke={face} strokeWidth={14} strokeLinecap="round" />
              <path d="M422 322 Q463 310 508 326" fill="none" stroke={face} strokeWidth={14} strokeLinecap="round" />
              <path d="M350 488 Q400 538 450 488" fill="none" stroke={face} strokeWidth={16} strokeLinecap="round" />
            </>
          )}
          {mood === "shock" && (
            <>
              <ellipse cx="337" cy="390" rx="54" ry="64" fill={face} />
              <ellipse cx="463" cy="390" rx="54" ry="64" fill={face} />
              <circle cx="337" cy="396" r="14" fill={ink} />
              <circle cx="463" cy="396" r="14" fill={ink} />
              <path d="M285 300 Q335 262 385 296" fill="none" stroke={face} strokeWidth={14} strokeLinecap="round" />
              <path d="M415 296 Q465 262 515 300" fill="none" stroke={face} strokeWidth={14} strokeLinecap="round" />
              <ellipse cx="400" cy="520" rx="30" ry="40" fill={face} />
            </>
          )}
          {mood === "smug" && (
            <>
              <path d="M291 388 A46 54 0 0 0 383 388 Z" fill={face} />
              <path d="M417 388 A46 54 0 0 0 509 388 Z" fill={face} />
              <circle cx="352" cy="408" r="20" fill={ink} />
              <circle cx="478" cy="408" r="20" fill={ink} />
              <path d="M285 352 L388 366" fill="none" stroke={face} strokeWidth={14} strokeLinecap="round" />
              <path d="M418 340 Q463 316 512 332" fill="none" stroke={face} strokeWidth={14} strokeLinecap="round" />
              <path d="M345 500 Q410 528 468 478" fill="none" stroke={face} strokeWidth={16} strokeLinecap="round" />
            </>
          )}
          {mood === "happy" && (
            <>
              <path d="M293 398 Q337 340 381 398" fill="none" stroke={face} strokeWidth={18} strokeLinecap="round" />
              <path d="M419 398 Q463 340 507 398" fill="none" stroke={face} strokeWidth={18} strokeLinecap="round" />
              <path d="M335 478 Q400 580 465 478 Z" fill={face} />
            </>
          )}
        </g>
      </svg>
    </div>
  );
};
