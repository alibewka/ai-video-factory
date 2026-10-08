import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import "@fontsource/montserrat/cyrillic-800.css";
import "@fontsource/montserrat/latin-800.css";
import "@fontsource/montserrat/cyrillic-900.css";
import "@fontsource/montserrat/latin-900.css";
import "@fontsource/ibm-plex-mono/cyrillic-500.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/cyrillic-700.css";
import "@fontsource/ibm-plex-mono/latin-700.css";
import { C } from "./theme";
import { SCENES, TOTAL } from "./timeline";
import { Background } from "./Background";
import { Captions } from "./Captions";
import { Header, Watermark } from "./Header";
import { clamp, EASE_OUT } from "./utils";
import { S1Hook } from "./scenes/S1Hook";
import { S2Why } from "./scenes/S2Why";
import { S3Trick } from "./scenes/S3Trick";
import { S4Fake } from "./scenes/S4Fake";
import { S5Lock } from "./scenes/S5Lock";
import { S6Story } from "./scenes/S6Story";
import { S7Fix } from "./scenes/S7Fix";
import { S8Outro } from "./scenes/S8Outro";

const COMPONENTS: Record<string, React.FC> = {
  hook: S1Hook,
  why: S2Why,
  trick: S3Trick,
  fake: S4Fake,
  lock: S5Lock,
  story: S6Story,
  fix: S7Fix,
  outro: S8Outro,
};

const OUT = 8; // перекрытие сцен (мягкий переход)

const SceneShell: React.FC<{ dur: number; first: boolean; last: boolean; children: React.ReactNode }> = ({
  dur,
  first,
  last,
  children,
}) => {
  const f = useCurrentFrame();
  const a = first ? 1 : clamp(f / 8);
  const b = last ? 1 : 1 - clamp((f - dur) / OUT);
  const inP = first ? 1 : EASE_OUT(clamp(f / 12));
  return (
    <AbsoluteFill style={{ opacity: Math.min(a, b), transform: `translateY(${(1 - inP) * 18}px)` }}>{children}</AbsoluteFill>
  );
};

const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load("900 40px Montserrat", "Аб1"),
      document.fonts.load("800 40px Montserrat", "Аб1"),
      document.fonts.load("500 40px 'IBM Plex Mono'", "Аб1"),
      document.fonts.load("700 40px 'IBM Plex Mono'", "Аб1"),
    ])
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
  return <>{children}</>;
};

const FadeOut: React.FC = () => {
  const f = useCurrentFrame();
  const o = clamp((f - (TOTAL - 22)) / 22);
  return <AbsoluteFill style={{ background: "#000", opacity: o }} />;
};

export const ExplainVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <FontGate>
      <Background />
      <Header />
      {SCENES.map((sc, i) => {
        const Comp = COMPONENTS[sc.id];
        const last = i === SCENES.length - 1;
        return (
          <Sequence key={sc.id} from={sc.from} durationInFrames={last ? sc.dur : sc.dur + OUT}>
            <SceneShell dur={sc.dur} first={i === 0} last={last}>
              <Comp />
            </SceneShell>
          </Sequence>
        );
      })}
      <Watermark />
      <Captions />
      <FadeOut />
      <Audio src={staticFile("voice.mp3")} volume={1} />
    </FontGate>
  </AbsoluteFill>
);
