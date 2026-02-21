import React, { memo } from "react";
import "./DynamicWallpaper.css";
// Existing
// Existing
import SunsetTheme from "./themes/SunsetTheme";
import HyperTheme from "./themes/HyperTheme";
import GridTheme from "./themes/GridTheme";
import MatrixTheme from "./themes/MatrixTheme";
import ParticlesTheme from "./themes/ParticlesTheme";
import WavesTheme from "./themes/WavesTheme";
// New (Nature)
import CircuitTwoTheme from "./themes/CircuitTwoTheme";
import SnowTheme from "./themes/SnowTheme";
import CloudsTheme from "./themes/CloudsTheme";
import FirefliesTheme from "./themes/FirefliesTheme";
import StarZoomTheme from "./themes/StarZoomTheme";
// New (Sci-Fi)
import CircuitTheme from "./themes/CircuitTheme";
import DNATheme from "./themes/DNATheme";
import WormholeTheme from "./themes/WormholeTheme";
// New (Abstract)
import PlasmaTheme from "./themes/PlasmaTheme";
import LavaTheme from "./themes/LavaTheme";
import FogTheme from "./themes/FogTheme";
// New (Geometric)
import HexagonsTheme from "./themes/HexagonsTheme";
import CubesTheme from "./themes/CubesTheme";
import TunnelTheme from "./themes/TunnelTheme";
import NetTheme from "./themes/NetTheme";
import GlobeTheme from "./themes/GlobeTheme";

interface DynamicWallpaperProps {
  theme: string;
}

const DynamicWallpaper: React.FC<DynamicWallpaperProps> = memo(({ theme }) => {
  const renderThemeContent = () => {
    switch (theme) {
      // Existing
      case "sunset":
        return <SunsetTheme />;
      case "hyper":
        return <HyperTheme />;
      case "grid":
        return <GridTheme />;
      case "matrix":
        return <MatrixTheme />;
      case "particles":
        return <ParticlesTheme />;
      case "waves":
        return <WavesTheme />;

      // Nature
      case "circuit-2":
        return <CircuitTwoTheme />;
      case "snow":
        return <SnowTheme />;
      case "clouds":
        return <CloudsTheme />;
      case "fireflies":
        return <FirefliesTheme />;
      case "star-zoom":
        return <StarZoomTheme />;

      // Sci-Fi
      case "circuit":
        return <CircuitTheme />;
      case "dna":
        return <DNATheme />;
      case "wormhole":
        return <WormholeTheme />;

      // Abstract
      case "plasma":
        return <PlasmaTheme />;
      case "lava":
        return <LavaTheme />;
      case "fog":
        return <FogTheme />;

      // Geometric
      case "hexagons":
        return <HexagonsTheme />;
      case "cubes":
        return <CubesTheme />;
      case "tunnel":
        return <TunnelTheme />;
      case "net":
        return <NetTheme />;
      case "globe":
        return <GlobeTheme />;

      default:
        return null;
    }
  };

  return (
    <div className="dynamic-wallpaper-container">
      <div className={`dynamic-wallpaper ${theme}`}>{renderThemeContent()}</div>
    </div>
  );
});

export default DynamicWallpaper;
