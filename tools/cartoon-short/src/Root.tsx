import React from "react";
import { Composition } from "remotion";
import { Debug } from "./Debug";
import { CasinoShortV4, CASINO_V4_FRAMES } from "./videos/casino_v4/Bridge";
import { NintendoShort, NINTENDO_FRAMES } from "./videos/nintendo/Bridge";

export const Root: React.FC = () => (
  <>
  <Composition id="Debug" component={Debug} durationInFrames={30} fps={30} width={1080} height={1920} />
  <Composition id="CasinoShortV4" component={CasinoShortV4} durationInFrames={CASINO_V4_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="NintendoShort" component={NintendoShort} durationInFrames={NINTENDO_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
