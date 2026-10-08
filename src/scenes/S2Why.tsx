import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, rgba } from "../theme";
import { Content, At, Pop, Mono, Card, Hook, CrossIcon, CheckIcon } from "../kit";
import { WifiIcon, PhoneIcon, RouterIcon, KeyIcon } from "../icons";
import { rel, relSent, tw, sceneStartSec } from "../timeline";
import { prog, EASE_OUT } from "../utils";

const NETS = [
  ["Home_5G", false],
  ["Cafe_Free_WiFi", true],
  ["Airport_Free_WiFi", false],
  ["Office_Guest", false],
] as const;

export const S2Why: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = relSent(1, 0);
  const tName = rel(1, "название");
  const tAuto = relSent(1, 1);
  const tCheck = relSent(1, 2);
  const tBut = rel(1, "Но");
  const link = prog(f, tAuto + 6, 18, EASE_OUT);
  const broken = f >= tCheck;
  return (
    <Content>
      <At x={0} y={0}>
        <Pop at={2}><Mono size={24}>СОХРАНЁННЫЕ СЕТИ В ТЕЛЕФОНЕ</Mono></Pop>
      </At>
      <At x={0} y={40} w={920}>
        <Card border={C.accent} style={{ padding: "8px 0" }}>
          {NETS.map(([n, hot], i) => (
            <Pop key={n} at={Math.max(3, t1 + i * 6)} dur={10} y={10}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, height: 82, padding: "0 30px", background: hot ? rgba(C.yellow, 0.12) : "transparent", borderLeft: `6px solid ${hot ? C.yellow : "transparent"}` }}>
                <KeyIcon size={44} color={hot ? C.yellow : C.muted} />
                <div style={{ flex: 1, fontFamily: F.title, fontWeight: 800, fontSize: 38, color: hot ? C.text : C.muted }}>{n}</div>
                <Mono size={22} color={hot ? C.yellow : C.muted}>вход сам</Mono>
              </div>
            </Pop>
          ))}
        </Card>
      </At>

      <At x={0} y={410} w={920} style={{ display: "flex", gap: 16 }}>
        <Pop at={tName} style={{ flex: 1 }}>
          <div style={{ border: `2px solid ${C.yellow}`, borderRadius: 20, padding: "14px 18px", background: rgba(C.yellow, 0.08), display: "flex", alignItems: "center", gap: 14 }}>
            <CheckIcon size={44} color={C.yellow} />
            <div>
              <Mono size={18} color={C.yellow}>ПОМНИТ</Mono>
              <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 34, color: C.text }}>название</div>
            </div>
          </div>
        </Pop>
        <Pop at={tName + 12} style={{ flex: 1 }}>
          <div style={{ border: `2px solid ${C.danger}`, borderRadius: 20, padding: "14px 18px", background: rgba(C.danger, 0.08), display: "flex", alignItems: "center", gap: 14 }}>
            <CrossIcon size={44} />
            <div>
              <Mono size={18} color={C.danger}>НЕ ПОМНИТ</Mono>
              <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 34, color: C.text }}>сам роутер</div>
            </div>
          </div>
        </Pop>
      </At>

      {/* знакомое имя → подключился сам */}
      <At x={0} y={560} w={920}>
        <div style={{ position: "relative", height: 250 }}>
          <svg width={920} height={250} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={170} y1={110} x2={170 + 580 * link} y2={110} stroke={broken ? C.danger : C.yellow} strokeWidth={5} strokeDasharray="14 12" strokeDashoffset={-f * 2.2} strokeLinecap="round" />
          </svg>
          <Pop at={tAuto} style={{ position: "absolute", left: 40, top: 60 }}>
            <PhoneIcon size={100} color={C.text} />
          </Pop>
          <Pop at={tAuto + 4} style={{ position: "absolute", right: 40, top: 60 }}>
            <RouterIcon size={100} color={C.text} />
          </Pop>
          <Pop at={tAuto + 10} style={{ position: "absolute", left: 0, right: 0, top: 10, textAlign: "center" }}>
            <Mono size={26} color={C.yellow}>знакомое имя → подключился сам</Mono>
          </Pop>
          {broken && (
            <Pop at={tCheck} style={{ position: "absolute", left: 330, top: 62 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.ink, border: `3px solid ${C.danger}`, borderRadius: 22, padding: "10px 22px" }}>
                <CrossIcon size={52} />
                <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 30, color: C.text, lineHeight: 1.1 }}>проверить<br />роутер — нельзя</div>
              </div>
            </Pop>
          )}
        </div>
      </At>
      <Hook at={tBut}>КАК ЭТИМ ПОЛЬЗУЮТСЯ?</Hook>
    </Content>
  );
};
