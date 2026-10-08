import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, rgba } from "../theme";
import { Content, At, Pop, Mono, Card, Hook } from "../kit";
import { WifiIcon, LockIcon } from "../icons";
import { Mascot } from "../Mascot";
import { relSent } from "../timeline";
import { clamp, shake } from "../utils";

const TITLE: React.CSSProperties = { fontFamily: F.title, fontWeight: 900, color: C.text, lineHeight: 1.08 };

const Net: React.FC<{ name: string; sub: string; lock?: boolean; hot?: boolean; dim?: boolean; dx?: number; at: number }> = ({ name, sub, lock, hot, dim, dx = 0, at }) => (
  <Pop at={at} dur={8} y={10}>
    <div
      style={{
        transform: `translateX(${dx}px)`,
        height: 104,
        margin: "0 18px 12px",
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 26px",
        borderRadius: 22,
        border: `2.5px solid ${hot ? C.yellow : "transparent"}`,
        background: hot ? rgba(C.yellow, 0.12) : "rgba(255,255,255,0.04)",
        boxShadow: hot ? `0 0 34px ${rgba(C.yellow, 0.4)}` : "none",
        opacity: dim ? 0.5 : 1,
      }}
    >
      <WifiIcon size={60} color={C.text} bars={3} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 40, color: C.text }}>{name}</div>
        <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 22, color: C.muted, marginTop: 2 }}>{sub}</div>
      </div>
      {lock ? <LockIcon size={40} color={C.muted} /> : <div style={{ fontFamily: F.mono, fontSize: 30, color: C.muted }}>ⓘ</div>}
    </div>
  </Pop>
);

export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();
  const tK = relSent(0, 2); // «Какая?»
  const tG = relSent(0, 3); // «Ты не угадаешь»
  const tP = relSent(0, 4); // «И телефон тоже»
  const tEnd = relSent(0, 5); // «А в конце — реальное дело»
  const flashing = f >= tK && f < tG;
  const hot = flashing ? Math.floor((f - tK) / 6) % 2 : -1;
  const sh = shake(f, tG, 16, 9);
  const same = f >= tG;
  return (
    <Content>
      {/* заголовок виден с первого кадра */}
      <At x={0} y={0} w={920}>
        <div style={{ ...TITLE, fontSize: 76 }}>КАКАЯ ИЗ ДВУХ</div>
        <div style={{ ...TITLE, fontSize: 76, marginTop: 4 }}>СЕТЕЙ —</div>
        <div style={{ ...TITLE, fontSize: 76, marginTop: 4 }}>
          <span style={{ background: C.danger, color: C.ink, borderRadius: 18, padding: "0 20px" }}>ЛОВУШКА?</span>
        </div>
      </At>
      <At x={750} y={-6}>
        <Mascot size={160} mood={same ? "smug" : "curious"} />
      </At>

      <At x={0} y={296} w={920}>
        <Card border={C.accent} style={{ paddingBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 34px 12px" }}>
            <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 44, color: C.text }}>Wi-Fi</div>
            <div style={{ width: 84, height: 46, borderRadius: 23, background: C.yellow, position: "relative" }}>
              <div style={{ position: "absolute", right: 5, top: 5, width: 36, height: 36, borderRadius: 18, background: C.ink }} />
            </div>
          </div>
          <Mono size={20} style={{ padding: "0 34px 10px" }}>СЕТИ РЯДОМ</Mono>
          <Net at={4} name="Home_5G" sub="Защищённая сеть" lock dim />
          <Net at={9} name="Cafe_Free_WiFi" sub="Открытая сеть" hot={hot === 0 || (same && f % 24 < 12)} dx={same ? sh.x : 0} />
          <Net at={14} name="Cafe_Free_WiFi" sub="Открытая сеть" hot={hot === 1 || (same && f % 24 >= 12)} dx={same ? -sh.x : 0} />
        </Card>
      </At>

      {/* «?» над строками на время вопроса */}
      {flashing && (
        <At x={640} y={470}>
          <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 150, color: C.yellow, opacity: 0.85, transform: `rotate(${Math.sin(f / 3) * 6}deg)` }}>?</div>
        </At>
      )}

      <At x={0} y={800} w={920} style={{ textAlign: "center" }}>
        <Pop at={tG}>
          <Mono size={26} color={C.yellow}>ИМЯ · ЗНАЧОК · СИГНАЛ — ВСЁ ОДИНАКОВО</Mono>
        </Pop>
        <Pop at={tP} style={{ marginTop: 10 }}>
          <Mono size={26} color={C.text}>телефон тоже не отличит</Mono>
        </Pop>
      </At>
      <Hook at={tEnd} lead="В КОНЦЕ">РЕАЛЬНОЕ ДЕЛО</Hook>
    </Content>
  );
};
