import React, { memo, useMemo } from "react";
import ParticlesInteractiveTheme from "./interactive-themes/ParticlesInteractiveTheme";
import HexagonGridTheme from "./interactive-themes/HexagonGridTheme";
import WavesInteractiveTheme from "./interactive-themes/WavesInteractiveTheme";
import FluidTheme from "./interactive-themes/FluidTheme";
import ConstellationTheme from "./interactive-themes/ConstellationTheme";
import GlobeTheme from "./interactive-themes/GlobeTheme";
import NetTheme from "./interactive-themes/NetTheme";
import SnowfallTheme from "./interactive-themes/SnowfallTheme";
import FireworksTheme from "./interactive-themes/FireworksTheme";
import RipplesTheme from "./interactive-themes/RipplesTheme";
import TunnelTheme from "./interactive-themes/TunnelTheme";
import SpaceGlobesTheme from "./interactive-themes/SpaceGlobesTheme";
import BreakoutTheme from "./interactive-themes/BreakoutTheme";

const themeComponents: Record<string, React.FC> = {
  particles: ParticlesInteractiveTheme,
  hexagon: HexagonGridTheme,
  waves: WavesInteractiveTheme,
  fluid: FluidTheme,
  constellation: ConstellationTheme,
  globe: GlobeTheme,
  net: NetTheme,
  snowfall: SnowfallTheme,
  fireworks: FireworksTheme,
  ripples: RipplesTheme,
  tunnel: TunnelTheme,
  "space-globes": SpaceGlobesTheme,
  breakout: BreakoutTheme,
};

// Default fallback theme key
const DEFAULT_THEME = "particles";

interface InteractiveWallpaperProps {
  theme: string;
}

const InteractiveWallpaper: React.FC<InteractiveWallpaperProps> = memo(
  ({ theme }) => {
    const ThemeComponent = useMemo(
      () => themeComponents[theme] || themeComponents[DEFAULT_THEME],
      [theme],
    );

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          overflow: "hidden",
        }}
      >
        <ThemeComponent />
      </div>
    );
  },
);

export default InteractiveWallpaper;
