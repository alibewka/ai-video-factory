import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, rgba } from "../theme";
import { Content, At, Pop, Mono, Card, Hook, CheckIcon, CrossIcon } from "../kit";
import { LockIcon, EyeIcon, PhoneIcon } from "../icons";
import { relSent, rel } from "../timeline";

const Chip: React.FC<{ t: string; color: string; bg?: string }> = ({ t, color, bg }) => (
  <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 28, color, background: bg ?? "rgba(255,255,255,0.05)", border: `2px solid ${color}`, borderRadius: 14, padding: "8px 18px", whiteSpace: "nowrap" }}>{t}</div>
);

export const S5Lock: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = relSent(4, 0);
  const t2 = relSent(4, 1);
  const t3 = relSent(4, 2);
  const tBut = rel(4, "теперь", 0);
  const tReal = relSent(4, 3);
  const glyph = "x9#Qz!8@k2";
  const scr = glyph.split("").map((c, i) => glyph[(i + Math.floor(f / 3)) % glyph.length]).join("");
  return (
    <Content>
      {/* 1. подслушивание */}
      <Pop at={Math.max(2, t1 - 4)}>
        <Card border={C.mint} style={{ padding: "18px 26px", height: 330 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Mono size={22} color={C.mint}>ПОДСЛУШИВАНИЕ</Mono>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckIcon size={40} color={C.mint} />
              <span style={{ fontFamily: F.title, fontWeight: 900, fontSize: 30, color: C.mint }}>ЗАЩИЩЕНО</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 40 }}>
            <PhoneIcon size={90} color={C.text} />
            <Chip t="пароль: 12345" color={C.text} />
            <LockIcon size={90} color={C.mint} />
            <Chip t={scr} color={C.muted} />
            <EyeIcon size={80} color={C.danger} />
          </div>
          <Mono size={22} style={{ marginTop: 36, textAlign: "center" }} color={C.text}>подслушивающий видит только кашу</Mono>
        </Card>
      </Pop>

      {/* 2. обман */}
      <At x={0} y={360} w={920}>
        <Pop at={t2 - 4}>
          <Card border={C.danger} style={{ padding: "18px 26px", height: 340 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Mono size={22} color={C.danger}>ОБМАН</Mono>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CrossIcon size={40} />
                <span style={{ fontFamily: F.title, fontWeight: 900, fontSize: 30, color: C.danger }}>НЕ ПОМОЖЕТ</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 40 }}>
              <PhoneIcon size={90} color={C.text} />
              <Chip t="пароль: 12345" color={C.yellow} />
              <div style={{ position: "relative", width: 90, height: 90 }}>
                <LockIcon size={90} color={C.mint} />
              </div>
              <div style={{ border: `2px solid ${C.danger}`, borderRadius: 16, padding: "10px 18px", fontFamily: F.title, fontWeight: 800, fontSize: 26, color: C.danger, lineHeight: 1.1, textAlign: "center" }}>фальшивая<br />страница</div>
            </div>
            <Mono size={22} style={{ marginTop: 34, textAlign: "center" }} color={C.text}>шифрование есть — но данные идут прямо вору</Mono>
          </Card>
        </Pop>
      </At>

      <At x={0} y={730} w={920} style={{ textAlign: "center" }}>
        <Pop at={t3}>
          <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 36, color: C.text }}>
            замочек: от <span style={{ color: C.mint }}>слежки</span> — да, от <span style={{ color: C.danger }}>обмана</span> — нет
          </div>
        </Pop>
      </At>
      <Hook at={tReal} lead="А">ТЕПЕРЬ — РЕАЛЬНЫЙ СЛУЧАЙ</Hook>
    </Content>
  );
};
