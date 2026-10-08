import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "./theme";
import { CHUNKS } from "./timeline";
import { EASE_OUT, clamp } from "./utils";

// ЦВЕТА СУБТИТРОВ: белый текст + максимум одна плашка на фразу.
//  голубая плашка — ключевое понятие; оранжевая плашка — угроза/обман. Другие цвета не используем.
const THREAT = ["крадёт", "ловушк", "мошенник", "чужого", "чужой", "обман", "подделать", "поддельн", "фальшив", "приговор", "тюрьм", "слежк", "вор,", "пароли"];
const KEYS = [
  "названи", "запоминает", "подключился", "замочек", "подслушив", "шифрован", "двухфактор", "мобильн",
  "подписывайся", "запомни", "защититься", "автоподключ", "половина", "реальн", "роутер", "сигнал",
];
const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");
const isThreat = (w: string) => { const c = norm(w); return THREAT.some((k) => c.startsWith(norm(k))); };
const isKey = (w: string) => { const c = norm(w); return c === "но" || KEYS.some((k) => c.startsWith(k)); };

export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const ch = CHUNKS.find((c) => t >= c.from && t < c.to);
  if (!ch) return null;
  const start = ch.from * fps;
  const p = EASE_OUT(clamp((f - start) / 5));
  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        right: 110,
        top: 1300,
        height: 170,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          columnGap: 20,
          rowGap: 8,
          transform: `scale(${0.9 + 0.1 * p})`,
          opacity: clamp((f - start) / 2),
        }}
      >
        {ch.words.map((w, i) => {
          const threat = isThreat(w.t);
          const key = threat || isKey(w.t);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontFamily: F.title,
                fontWeight: 900,
                fontSize: 62,
                lineHeight: 1.1,
                textTransform: "uppercase",
                color: key ? C.ink : C.text,
                background: threat ? C.danger : key ? C.yellow : "transparent",
                padding: key ? "4px 16px" : 0,
                borderRadius: 14,
                textShadow: key ? "none" : "0 4px 18px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)",
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </div>
  );
};
