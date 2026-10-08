import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "./theme";

// Аватарка-талисман: голова-щит с лицом «>_» (командная строка) на кислотном фоне.
// Яркий сплошной фон выделяется в ленте, где почти все аватарки тёмные/синие.
const Mascot: React.FC<{ bg: string; shadow: string; face: string }> = ({ bg, shadow, face }) => (
  <AbsoluteFill style={{ background: bg }}>
    <svg width={800} height={800} viewBox="0 0 800 800">
    <g transform="translate(400 400) scale(1.15) translate(-405 -392)">
      {/* антенна */}
      <line x1="400" y1="150" x2="400" y2="215" stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
      <circle cx="400" cy="130" r="34" fill={C.ink} />
      <circle cx="400" cy="130" r="13" fill={face} />
      {/* жёсткая тень (стикер-эффект) */}
      <path d="M250 300 Q250 230 330 230 H470 Q550 230 550 300 V455 C550 560 480 620 400 665 C320 620 250 560 250 455 Z" transform="translate(26 26)" fill={shadow} />
      {/* голова-щит */}
      <path d="M250 300 Q250 230 330 230 H470 Q550 230 550 300 V455 C550 560 480 620 400 665 C320 620 250 560 250 455 Z" fill={C.ink} />
      {/* живое лицо: большие глаза, любопытный взгляд, улыбка */}
      <ellipse cx="337" cy="388" rx="46" ry="54" fill={face} />
      <ellipse cx="463" cy="388" rx="46" ry="54" fill={face} />
      <circle cx="352" cy="374" r="24" fill={C.ink} />
      <circle cx="478" cy="374" r="24" fill={C.ink} />
      <circle cx="361" cy="364" r="9" fill="#fff" />
      <circle cx="487" cy="364" r="9" fill="#fff" />
      {/* брови: левая приподнята */}
      <path d="M290 318 Q335 292 380 312" fill="none" stroke={face} strokeWidth={14} strokeLinecap="round" />
      <path d="M422 322 Q463 310 508 326" fill="none" stroke={face} strokeWidth={14} strokeLinecap="round" />
      {/* улыбка */}
      <path d="M350 488 Q400 538 450 488" fill="none" stroke={face} strokeWidth={16} strokeLinecap="round" />
      {/* «ушки»-болты */}
      <circle cx="250" cy="395" r="0" fill={face} />
    </g>
    </svg>
  </AbsoluteFill>
);

export const AvatarLogo: React.FC = () => <Mascot bg={C.yellow} shadow={C.accent} face={C.yellow} />;
export const AvatarLogoB: React.FC = () => <Mascot bg={C.accent} shadow={C.ink} face={C.yellow} />;
