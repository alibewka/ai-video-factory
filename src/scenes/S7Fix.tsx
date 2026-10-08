import React from "react";
import { C, F, rgba } from "../theme";
import { Content, At, Pop, Mono, Card, Plate, CrossIcon, CheckIcon } from "../kit";
import { KeyIcon } from "../icons";
import { relSent } from "../timeline";

const Row: React.FC<{ y: number; at: number; n: string; title: string; sub: string; color?: string; right: React.ReactNode }> = ({ y, at, n, title, sub, color = C.yellow, right }) => (
  <At x={0} y={y} w={920}>
    <Pop at={at} dur={12}>
      <Card border={color} style={{ height: 168, padding: "0 28px", display: "flex", alignItems: "center", gap: 24, background: rgba(color, 0.07) }}>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: color, color: C.ink, fontFamily: F.title, fontWeight: 900, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 36, color: C.text, lineHeight: 1.12 }}>{title}</div>
          <Mono size={22} style={{ marginTop: 8 }}>{sub}</Mono>
        </div>
        {right}
      </Card>
    </Pop>
  </At>
);

const Toggle: React.FC = () => (
  <div style={{ width: 96, height: 52, borderRadius: 26, background: "rgba(143,180,234,0.3)", position: "relative", flexShrink: 0 }}>
    <div style={{ position: "absolute", left: 6, top: 6, width: 40, height: 40, borderRadius: 20, background: C.text }} />
  </div>
);

export const S7Fix: React.FC = () => {
  const t1 = relSent(6, 1);
  const t2 = relSent(6, 2);
  const t3 = relSent(6, 4);
  const t4 = relSent(6, 5);
  return (
    <Content>
      <At x={0} y={0}>
        <Pop at={2}><Plate size={58}>КАК ЗАЩИТИТЬСЯ</Plate></Pop>
      </At>
      <Row y={90} at={t1 - 4} n="1" title="Выключи автоподключение" sub="к открытым сетям" right={<Toggle />} />
      <Row y={278} at={t2 - 4} n="2" title="Вход в Wi-Fi не просит почту" sub="просит пароль — закрывай" color={C.danger} right={<CrossIcon size={60} />} />
      <Row y={466} at={t3 - 4} n="3" title="Для банка — мобильный интернет" sub="не кафе-сеть" color={C.yellow} right={<div style={{ fontFamily: F.title, fontWeight: 900, fontSize: 38, color: C.accent, border: `3px solid ${C.accent}`, borderRadius: 14, padding: "4px 14px" }}>5G</div>} />
      <Row y={654} at={t4 - 4} n="4" title="Двухфакторная защита" sub="у вора — только половина ключа" color={C.yellow} right={<KeyIcon size={70} color={C.mint} />} />
    </Content>
  );
};
