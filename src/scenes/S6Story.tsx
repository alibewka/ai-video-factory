import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, rgba } from "../theme";
import { Content, At, Pop, Mono, Card, Plate } from "../kit";
import { WifiIcon, PlaneIcon, CaseIcon } from "../icons";
import { rel, relSent } from "../timeline";
import { prog, EASE_OUT, shake } from "../utils";

export const S6Story: React.FC = () => {
  const f = useCurrentFrame();
  const tA = relSent(5, 0);
  const tB = relSent(5, 1);
  const tC = relSent(5, 2);
  const tPerth = rel(5, "Перта");
  const tMel = rel(5, "Мельбурна");
  const tAde = rel(5, "Аделаиды");
  const tV = relSent(5, 3);
  const slam = prog(f, tV + 2, 9, EASE_OUT);
  const sh = shake(f, tV + 2, 14, 10);
  return (
    <Content>
      <At x={0} y={0} w={920}>
        <Pop at={2}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Plate size={100} color={C.yellow}>2024</Plate>
            <div>
              <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 44, color: C.text }}>Австралия</div>
              <Mono size={24} color={C.danger}>РЕАЛЬНОЕ ДЕЛО</Mono>
            </div>
          </div>
        </Pop>
      </At>

      <At x={0} y={135} w={920}>
        <Pop at={Math.max(2, tA - 4)}>
          <Card border={C.accent} style={{ height: 118, padding: "0 28px", display: "flex", alignItems: "center", gap: 24 }}>
            <PlaneIcon size={64} color={C.text} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 34, color: C.text }}>Сотрудник авиакомпании</div>
              <Mono size={22}>в полёте заметил подозрительную сеть</Mono>
            </div>
            <WifiIcon size={56} color={C.danger} />
          </Card>
        </Pop>
      </At>
      <At x={0} y={272} w={920}>
        <Pop at={tB - 4}>
          <Card border={C.accent} style={{ height: 118, padding: "0 28px", display: "flex", alignItems: "center", gap: 24 }}>
            <CaseIcon size={64} color={C.text} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 34, color: C.text }}>Полиция Австралии</div>
              <Mono size={22}>оборудование для таких сетей — в чемодане</Mono>
            </div>
          </Card>
        </Pop>
      </At>

      <At x={0} y={410} w={920}>
        <Pop at={tC - 4}>
          <Mono size={22} color={C.danger}>ПОДДЕЛЬНЫЕ ТОЧКИ · ЛОГИНЫ ОТ ПОЧТЫ И СОЦСЕТЕЙ</Mono>
        </Pop>
        <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
          {[["ПЕРТ", tPerth], ["МЕЛЬБУРН", tMel], ["АДЕЛАИДА", tAde]].map(([n, at]) => (
            <Pop key={n as string} at={at as number} dur={10} style={{ flex: 1 }}>
              <div style={{ border: `2px solid ${C.danger}`, borderRadius: 20, background: rgba(C.danger, 0.1), padding: "14px 8px", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center" }}><WifiIcon size={50} color={C.danger} /></div>
                <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 27, color: C.text, marginTop: 4 }}>{n}</div>
              </div>
            </Pop>
          ))}
        </div>
        <Pop at={tAde + 8} style={{ marginTop: 12 }}>
          <Mono size={22} style={{ textAlign: "center" }}>+ внутренние рейсы</Mono>
        </Pop>
      </At>

      <At x={0} y={650} w={920}>
        <div style={{ opacity: Math.min(1, slam * 3), transform: `translate(${sh.x}px, ${sh.y}px) scale(${1.25 - 0.25 * slam})` }}>
          <Card border={C.danger} style={{ padding: "22px 30px", textAlign: "center", background: rgba(C.danger, 0.12) }}>
            <Mono size={24}>ПРИГОВОР</Mono>
            <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 92, color: C.danger, lineHeight: 1.05, marginTop: 8, whiteSpace: "nowrap" }}>7 ЛЕТ 4 МЕС.</div>
            <Mono size={22} color={C.text} style={{ marginTop: 8 }}>тюрьмы</Mono>
          </Card>
        </div>
      </At>
      <At x={0} y={880} w={920}>
        <Pop at={tV + 14}>
          <Mono size={18} style={{ textAlign: "center" }}>источники: SecurityWeek, Security Affairs</Mono>
        </Pop>
      </At>
    </Content>
  );
};
