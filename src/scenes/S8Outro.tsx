import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, rgba } from "../theme";
import { HANDLE } from "../config";
import { Content, At, Pop, Mono, Card } from "../kit";
import { Mascot } from "../Mascot";
import { relSent } from "../timeline";
import { EASE_OUT, clamp, prog } from "../utils";

export const S8Outro: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = relSent(7, 0);
  const t2 = relSent(7, 1);
  const tSub = relSent(7, 2);
  const recap = 1 - clamp((f - (tSub - 4)) / 12);
  const endP = prog(f, tSub + 2, 16, EASE_OUT);
  const pulse = 1 + 0.035 * Math.sin(f / 6);
  return (
    <Content>
      <div style={{ opacity: recap, transform: `scale(${0.96 + 0.04 * recap})` }}>
        <At x={0} y={0} w={920}>
          <Pop at={2}><Mono size={24} color={C.yellow}>ЗАПОМНИ</Mono></Pop>
        </At>
        <At x={0} y={50} w={920}>
          <Pop at={Math.max(3, t1 - 4)} dur={14}>
            <Card border={C.accent} style={{ padding: "30px 34px", height: 300 }}>
              <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 58, color: C.text, lineHeight: 1.12 }}>
                Телефон узнаёт сеть по <span style={{ background: C.yellow, color: C.ink, borderRadius: 12, padding: "0 14px" }}>названию</span>
              </div>
              <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 40, color: C.danger, marginTop: 22 }}>а название можно подделать</div>
            </Card>
          </Pop>
        </At>
        <At x={0} y={390} w={920}>
          <Pop at={t2 - 4} dur={14}>
            <Card border={C.mint} style={{ padding: "30px 34px", height: 300 }}>
              <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 58, color: C.text, lineHeight: 1.12 }}>
                Замочек защищает от <span style={{ color: C.mint }}>слежки</span>
              </div>
              <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 40, color: C.danger, marginTop: 22 }}>но не от обмана</div>
            </Card>
          </Pop>
        </At>
        <At x={640} y={740}>
          <Pop at={t2}><Mascot size={170} mood="smug" /></Pop>
        </At>
      </div>
      <div style={{ opacity: endP, transform: `translateY(${(1 - endP) * 30}px)` }}>
        <At x={0} y={80} w={920} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Mascot size={330} mood="happy" />
          <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 72, color: C.text, marginTop: 36 }}>{HANDLE}</div>
          <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 30, color: C.muted, marginTop: 10 }}>Кибербез и ИИ простыми словами</div>
          <div style={{ marginTop: 52, transform: `scale(${pulse})`, background: C.yellow, color: C.ink, fontFamily: F.title, fontWeight: 900, fontSize: 64, padding: "20px 64px", borderRadius: 60 }}>ПОДПИСАТЬСЯ</div>
        </At>
      </div>
    </Content>
  );
};
