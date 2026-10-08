import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, rgba } from "../theme";
import { Content, At, Pop, Mono, Card, Hook, Cursor } from "../kit";
import { LaptopIcon } from "../icons";
import { Mascot } from "../Mascot";
import { rel, relSent } from "../timeline";
import { clamp, prog, EASE_OUT } from "../utils";

export const S4Fake: React.FC = () => {
  const f = useCurrentFrame();
  const tPage = relSent(3, 0, 0.2);
  const tReal = relSent(3, 1);
  const tType = rel(3, "вводишь");
  const tSteal = rel(3, "чужого");
  const tBut = rel(3, "Но");
  const pw = Math.floor(clamp((f - tType) / 28) * 9);
  const packet = prog(f, tSteal - 14, 18, EASE_OUT);
  const stolen = f >= tSteal;
  return (
    <Content>
      <At x={0} y={0} w={920}>
        <Pop at={Math.max(2, tPage - 6)} dur={14}>
          <Card border={C.accent} style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ height: 58, background: rgba(C.accent, 0.14), display: "flex", alignItems: "center", gap: 12, padding: "0 22px" }}>
              {[C.muted, C.muted, C.muted].map((c) => (
                <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
              ))}
              <Mono size={22} style={{ marginLeft: 10 }}>Cafe_Free_WiFi · вход в сеть</Mono>
            </div>
            <div style={{ padding: "26px 34px 30px" }}>
              <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 48, color: C.text }}>Добро пожаловать!</div>
              <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: 30, color: C.muted, marginTop: 6 }}>Войдите, чтобы получить интернет</div>
              <div style={{ display: "flex", gap: 14, marginTop: 20 }}>
                {["Войти через почту", "Войти через соцсеть"].map((b) => (
                  <div key={b} style={{ flex: 1, textAlign: "center", padding: "14px 0", borderRadius: 16, background: C.text, color: C.ink, fontFamily: F.title, fontWeight: 800, fontSize: 28 }}>{b}</div>
                ))}
              </div>
              <div style={{ marginTop: 18, border: `2px solid ${C.cardLine}`, borderRadius: 14, padding: "14px 20px", fontFamily: F.mono, fontSize: 28, color: C.muted }}>user@mail.com</div>
              <div style={{ marginTop: 12, border: `2px solid ${f >= tType ? C.yellow : C.cardLine}`, borderRadius: 14, padding: "14px 20px", fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.text, minHeight: 40 }}>
                {"•".repeat(pw)}
                {f >= tType && pw < 9 && <Cursor size={30} />}
                {f < tType && <span style={{ color: C.muted, fontWeight: 500 }}>пароль</span>}
              </div>
            </div>
          </Card>
        </Pop>
      </At>
      <Pop at={tReal} style={{ position: "absolute", left: 600, top: 92 }}>
        <div style={{ background: C.yellow, color: C.ink, fontFamily: F.title, fontWeight: 900, fontSize: 30, borderRadius: 16, padding: "6px 18px", transform: "rotate(5deg)" }}>как настоящая</div>
      </Pop>
      <At x={760} y={470}>
        {stolen && <Mascot size={150} mood="shock" />}
      </At>

      {/* пакет данных летит к «ноутбуку мошенника» */}
      <At x={0} y={560} w={920}>
        <div style={{ position: "relative", height: 280 }}>
          {f >= tType + 20 && (
            <div style={{ position: "absolute", left: 460 - 20 + Math.sin(packet * 3) * 4, top: -20 + packet * 100, opacity: 1 - packet * 0.3, fontFamily: F.mono, fontWeight: 700, fontSize: 28, color: C.danger }}>
              ↓ ↓ ↓
            </div>
          )}
          <Pop at={tSteal - 8} style={{ position: "absolute", left: 0, top: 70, width: 740 }}>
            <Card border={stolen ? C.danger : C.cardLine} style={{ padding: "18px 26px", background: "rgba(4,17,43,0.8)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <LaptopIcon size={44} color={C.danger} />
                <Mono size={22} color={C.danger}>НОУТБУК МОШЕННИКА</Mono>
              </div>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 28, color: C.yellow, marginTop: 12, lineHeight: 1.5 }}>
                {stolen ? "> логин получен ✓" : "> ожидание…"}
                <br />
                {stolen ? "> пароль: ••••••••• ✓" : <Cursor size={26} />}
              </div>
            </Card>
          </Pop>
        </div>
      </At>
      <Hook at={tBut}>ЗАМОЧЕК ЗАЩИТИТ?</Hook>
    </Content>
  );
};
