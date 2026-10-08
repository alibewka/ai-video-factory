import React from "react";
import { Composition } from "remotion";
import { ExplainVideo } from "./Video";
import { FPS, HEIGHT, WIDTH } from "./config";
import { TOTAL } from "./timeline";
import { Cover } from "./Cover";
import { AvatarLogo, AvatarLogoB } from "./AvatarLogo";
import { Banner } from "./Banner";

export const Root: React.FC = () => (
  <>
  <Composition id="Avatar" component={AvatarLogo} durationInFrames={1} fps={FPS} width={800} height={800} />
  <Composition id="AvatarB" component={AvatarLogoB} durationInFrames={1} fps={FPS} width={800} height={800} />
  <Composition id="Banner" component={Banner} durationInFrames={1} fps={FPS} width={2048} height={1152} />
  <Composition id="Cover" component={Cover} durationInFrames={1} fps={FPS} width={WIDTH} height={HEIGHT} />
  <Composition
    id="Password"
    component={ExplainVideo}
    durationInFrames={TOTAL}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
  </>
);
