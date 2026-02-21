import React, { memo } from "react";
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
import SpaceGlobesTheme from "./interactive-themes/SpaceGlobesTheme";
import TunnelTheme from "./interactive-themes/TunnelTheme";
import BreakoutTheme from "./interactive-themes/BreakoutTheme";

interface InteractiveWallpaperProps {
  theme: string;
}

const InteractiveWallpaper: React.FC<InteractiveWallpaperProps> = memo(
  ({ theme }) => {
    const renderThemeContent = () => {
      switch (theme) {
        case "particles":
          return <ParticlesInteractiveTheme />;
        case "hexagon":
          return <HexagonGridTheme />;
        case "waves":
          return <WavesInteractiveTheme />;
        case "fluid":
          return <FluidTheme />;
        case "constellation":
          return <ConstellationTheme />;
        case "globe":
          return <GlobeTheme />;
        case "net":
          return <NetTheme />;
        case "snowfall":
          return <SnowfallTheme />;
        case "fireworks":
          return <FireworksTheme />;
        case "ripples":
          return <RipplesTheme />;
        case "tunnel":
          return <TunnelTheme />;
        case "space-globes":
          return <SpaceGlobesTheme />;
        case "breakout":
          return <BreakoutTheme />;
        default:
          return <ParticlesInteractiveTheme />;
      }
    };

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          overflow: "hidden",
        }}
      >
        {renderThemeContent()}
      </div>
    );
  },
);

export default InteractiveWallpaper;
