import React from "react";
import { AbsoluteFill } from "remotion";
import "@fontsource/montserrat/cyrillic-900.css";
import "@fontsource/montserrat/latin-900.css";
import "@fontsource/montserrat/cyrillic-800.css";
import "@fontsource/ibm-plex-mono/cyrillic-500.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/cyrillic-700.css";
import "@fontsource/ibm-plex-mono/latin-700.css";
import { C, F, rgba } from "./theme";
import { Background } from "./Background";
import { Plate } from "./kit";
import { Avatar } from "./Header";
import { HANDLE } from "./config";

// Обложка: всё важное в центральной зоне (видно и в сетке 3:4, и в квадрате)
export const Cover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Background />
    <div style={{ position: "absolute", left: 70, right: 110, top: 520 }}>
      <Plate size={170}>ChatGPT</Plate>
      <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 104, color: C.text, lineHeight: 1.08, marginTop: 36 }}>
        ПРОСТО <span style={{ color: C.yellow }}>УГАДЫВАЕТ</span>
        <br />
        СЛОВО?
      </div>
      <div style={{ marginTop: 56, border: `2px solid ${C.accent}`, borderRadius: 28, padding: "26px 34px", background: rgba(C.accent, 0.1), fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: C.text, display: "flex", alignItems: "center", gap: 16, whiteSpace: "nowrap" }}>
        столица Казахстана —
        <span style={{ background: C.yellow, color: C.ink, borderRadius: 14, padding: "4px 20px" }}>Астана</span>
        <span style={{ color: C.yellow, fontSize: 38 }}>92%</span>
      </div>
      <div style={{ marginTop: 40, fontFamily: F.mono, fontWeight: 500, fontSize: 34, color: C.muted }}>как нейросеть пишет ответ · за 2 минуты</div>
    </div>
    <div style={{ position: "absolute", left: 70, top: 1470, display: "flex", alignItems: "center", gap: 22 }}>
      <Avatar size={84} />
      <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 40, color: C.text }}>{HANDLE}</div>
    </div>
  </AbsoluteFill>
);
