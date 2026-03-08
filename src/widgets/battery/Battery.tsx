import { memo, useCallback, useEffect, useState } from "react";
import "./Battery.css";
import laptopIcon from "./laptop.svg";
import Translation from "../../locale/Translation";

interface BatteryState {
  level: number;
  charging: boolean;
}

const getArcColor = (level: number, charging: boolean): string => {
  if (charging) return "#34C759"; // Green when charging
  if (level > 0.2) return "#FFD60A"; // Yellow/amber like macOS
  if (level > 0.1) return "#FF9F0A"; // Orange
  return "#FF453A"; // Red when critically low
};

const Battery = memo(function Battery() {
  const [battery, setBattery] = useState<BatteryState | null>(null);
  const [supported, setSupported] = useState(true);

  const updateBatteryInfo = useCallback((bat: any) => {
    setBattery({
      level: bat.level,
      charging: bat.charging,
    });
  }, []);

  useEffect(() => {
    let bat: any = null;

    const setup = async () => {
      try {
        if (!("getBattery" in navigator)) {
          setSupported(false);
          return;
        }
        bat = await (navigator as any).getBattery();
        updateBatteryInfo(bat);

        const onUpdate = () => updateBatteryInfo(bat);
        bat.addEventListener("levelchange", onUpdate);
        bat.addEventListener("chargingchange", onUpdate);

        return () => {
          bat.removeEventListener("levelchange", onUpdate);
          bat.removeEventListener("chargingchange", onUpdate);
        };
      } catch {
        setSupported(false);
      }
    };

    let cleanup: (() => void) | undefined;
    setup().then((c) => {
      cleanup = c;
    });

    return () => {
      cleanup?.();
    };
  }, [updateBatteryInfo]);

  if (!supported) {
    return (
      <div className="battery-widget battery-widget--unavailable">
        <span className="battery-widget__unavailable-text">🔋 --</span>
      </div>
    );
  }

  if (!battery) {
    return (
      <div className="battery-widget battery-widget--loading">
        <span className="battery-widget__unavailable-text">🔋 ...</span>
      </div>
    );
  }

  const percentage = Math.round(battery.level * 100);
  const arcColor = getArcColor(battery.level, battery.charging);

  // SVG arc calculations
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - battery.level * circumference;

  return (
    <div className="battery-widget">
      <div className="battery-widget__arc-container">
        <svg className="battery-widget__arc-svg" viewBox="0 0 64 64">
          <circle
            className="battery-widget__arc-bg"
            cx="32"
            cy="32"
            r={radius}
          />
          <circle
            className="battery-widget__arc-fill"
            cx="32"
            cy="32"
            r={radius}
            stroke={arcColor}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <span className="battery-widget__icon">
          <img src={laptopIcon} alt="" width="32" height="32" />
        </span>
      </div>
      <div className="battery-widget__info">
        <span className="battery-widget__percentage">{percentage}%</span>
        <span className="battery-widget__status">
          {battery.charging ? (
            <Translation value="battery_charging" />
          ) : (
            <Translation value="battery_label" />
          )}
        </span>
      </div>
    </div>
  );
});

export default Battery;
