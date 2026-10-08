import React from "react";
import { AbsoluteFill } from "remotion";
import "@fontsource/montserrat/cyrillic-900.css";
import "@fontsource/montserrat/latin-900.css";
import "@fontsource/ibm-plex-mono/cyrillic-500.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/cyrillic-700.css";
import "@fontsource/ibm-plex-mono/latin-700.css";
import { C, F, rgba } from "./theme";
import { Background } from "./Background";
import { AvatarLogo } from "./AvatarLogo";

// Баннер YouTube 2048×1152. Безопасная зона для телефона/ТВ-обрезки: центральная 1235×338
// (x 406..1641, y 407..745) — весь важный текст и талисман лежат внутри неё.
const TOKENS = [
  { t: "токен", x: 90, y: 150, r: -6 }, { t: "ИИ", x: 230, y: 330, r: 5 }, { t: "хакер", x: 60, y: 560, r: -4 },
  { t: "пароль", x: 200, y: 800, r: 6 }, { t: "GPT", x: 110, y: 980, r: -5 }, { t: "фишинг", x: 1740, y: 160, r: 5 },
  { t: "сеть", x: 1880, y: 360, r: -6 }, { t: "угадай →", x: 1720, y: 580, r: 4 }, { t: "взлом", x: 1850, y: 800, r: -5 },
  { t: "модель", x: 1700, y: 990, r: 6 }, { t: "защита", x: 520, y: 70, r: -3 }, { t: "?", x: 1500, y: 1040, r: 4 },
];

export const Banner: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <div style={{ position: "absolute", inset: 0, transform: "scale(1.9)", transformOrigin: "center" }}>
      <Background />
    </div>
    {/* токены-«мусор» по краям, вне безопасной зоны */}
    {TOKENS.map((k) => (
      <div
        key={k.t + k.x}
        style={{
          position: "absolute",
          left: k.x,
          top: k.y,
          transform: `rotate(${k.r}deg)`,
          fontFamily: F.mono,
          fontWeight: 700,
          fontSize: 42,
          color: rgba(C.accent, 0.55),
          border: `2px solid ${rgba(C.accent, 0.35)}`,
          borderRadius: 14,
          padding: "6px 22px",
          background: rgba(C.accent, 0.07),
        }}
      >
        {k.t}
      </div>
    ))}
    {/* центр: талисман + название */}
    <div style={{ position: "absolute", left: 436, top: 400, display: "flex", alignItems: "center", gap: 64 }}>
      <div style={{ width: 340, height: 340, borderRadius: 170, overflow: "hidden", position: "relative", boxShadow: `0 0 0 8px ${rgba(C.yellow, 0.25)}, 0 0 90px ${rgba(C.yellow, 0.35)}`, flexShrink: 0 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 800, height: 800, transform: "scale(0.425)", transformOrigin: "top left" }}>
          <AvatarLogo />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 168, lineHeight: 1, color: C.text, letterSpacing: -3 }}>
          Alibek<span style={{ color: C.yellow }}>.</span>
        </div>
        <div style={{ marginTop: 22, display: "inline-block", background: C.yellow, color: C.ink, fontFamily: F.title, fontWeight: 900, fontSize: 60, padding: "6px 26px", borderRadius: 16 }}>
          КИБЕРБЕЗ И ИИ
        </div>
        <div style={{ marginTop: 18, fontFamily: F.mono, fontWeight: 500, fontSize: 36, color: C.muted }}>простыми словами · за 2 минуты</div>
      </div>
    </div>
  </AbsoluteFill>
);
