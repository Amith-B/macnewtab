import React, { memo, useMemo } from "react";
import "./DynamicWallpaper.css";
import SunsetTheme from "./themes/SunsetTheme";
import HyperTheme from "./themes/HyperTheme";
import GridTheme from "./themes/GridTheme";
import MatrixTheme from "./themes/MatrixTheme";
import ParticlesTheme from "./themes/ParticlesTheme";
import WavesTheme from "./themes/WavesTheme";
import CircuitTwoTheme from "./themes/CircuitTwoTheme";
import SnowTheme from "./themes/SnowTheme";
import CloudsTheme from "./themes/CloudsTheme";
import FirefliesTheme from "./themes/FirefliesTheme";
import StarZoomTheme from "./themes/StarZoomTheme";
import CircuitTheme from "./themes/CircuitTheme";
import DNATheme from "./themes/DNATheme";
import WormholeTheme from "./themes/WormholeTheme";
import PlasmaTheme from "./themes/PlasmaTheme";
import LavaTheme from "./themes/LavaTheme";
import FogTheme from "./themes/FogTheme";
import HexagonsTheme from "./themes/HexagonsTheme";
import CubesTheme from "./themes/CubesTheme";
import TunnelTheme from "./themes/TunnelTheme";
import NetTheme from "./themes/NetTheme";
import GlobeTheme from "./themes/GlobeTheme";

// Map them
const themeComponents: Record<string, React.FC> = {
  // Existing
  sunset: SunsetTheme,
  hyper: HyperTheme,
  grid: GridTheme,
  matrix: MatrixTheme,
  particles: ParticlesTheme,
  waves: WavesTheme,

  // Nature
  "circuit-2": CircuitTwoTheme,
  snow: SnowTheme,
  clouds: CloudsTheme,
  fireflies: FirefliesTheme,
  "star-zoom": StarZoomTheme,

  // Sci-Fi
  circuit: CircuitTheme,
  dna: DNATheme,
  wormhole: WormholeTheme,

  // Abstract
  plasma: PlasmaTheme,
  lava: LavaTheme,
  fog: FogTheme,

  // Geometric
  hexagons: HexagonsTheme,
  cubes: CubesTheme,
  tunnel: TunnelTheme,
  net: NetTheme,
  globe: GlobeTheme,
};

// Default fallback theme key
const DEFAULT_THEME = "sunset";

interface DynamicWallpaperProps {
  theme: string;
}

const DynamicWallpaper: React.FC<DynamicWallpaperProps> = memo(({ theme }) => {
  const ThemeComponent = useMemo(
    () => themeComponents[theme] || themeComponents[DEFAULT_THEME],
    [theme],
  );

  return (
    <div className="dynamic-wallpaper-container">
      <div className={`dynamic-wallpaper ${theme}`}>
        {ThemeComponent && <ThemeComponent />}
      </div>
    </div>
  );
});

export default DynamicWallpaper;
