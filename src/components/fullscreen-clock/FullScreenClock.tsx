import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import { FlipCard } from "./FlipCard";
import "./FullScreenClock.css";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";
import Translation from "../../locale/Translation";

interface FullScreenClockProps {
  date: Date;
  onClose: () => void;
}

const BG_COLOR_PRESETS = [
  // First row: 4 Dark colors
  { name: "Pure Black", value: "#000000", isLight: false },
  { name: "Deep Navy", value: "#1e3a8a", isLight: false },
  { name: "Forest Green", value: "#065f46", isLight: false },
  { name: "Deep Wine", value: "#4a044e", isLight: false },

  // Second row: 4 Light colors (distinct contrasting hues)
  { name: "Pure White", value: "#ffffff", isLight: true },
  { name: "Warm Peach", value: "#fed7aa", isLight: true },
  { name: "Mint Sage", value: "#d1fae5", isLight: true },
  { name: "Sky Blue", value: "#bae6fd", isLight: true },
];

export const FullScreenClock: React.FC<FullScreenClockProps> = ({
  date,
  onClose,
}) => {
  const [is24Hour, setIs24Hour] = useState(() => {
    return localStorage.getItem("fullscreen_clock_is_24h") === "true";
  });
  const [keepAwake, setKeepAwake] = useState(() => {
    return localStorage.getItem("fullscreen_clock_keep_awake") !== "false";
  });
  const [bgColor, setBgColor] = useState(() => {
    return localStorage.getItem("fullscreen_clock_bg_color") || "#000000";
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement | null>(null);
  const paletteOpenRef = useRef(paletteOpen);
  paletteOpenRef.current = paletteOpen;

  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockSentinelRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator && keepAwake) {
      try {
        if (
          !wakeLockSentinelRef.current ||
          wakeLockSentinelRef.current.released
        ) {
          wakeLockSentinelRef.current = await (
            navigator as any
          ).wakeLock.request("screen");
        }
      } catch (err) {
        // Gracefully ignore if wake lock request is rejected
      }
    }
  }, [keepAwake]);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockSentinelRef.current) {
      try {
        wakeLockSentinelRef.current.release();
      } catch (err) {}
      wakeLockSentinelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (keepAwake) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && keepAwake) {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, [keepAwake, requestWakeLock, releaseWakeLock]);

  // Idle timer to hide controls after 3s of inactivity (paused when palette is open)
  const resetIdleTimer = useCallback(() => {
    setControlsVisible(true);
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    if (!paletteOpen) {
      idleTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [paletteOpen]);

  // Keep controls visible while palette popover is open
  useEffect(() => {
    if (paletteOpen) {
      setControlsVisible(true);
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    }
  }, [paletteOpen]);

  // Prevent background scrolling while fullscreen overlay is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    resetIdleTimer();
    const handleActivity = () => resetIdleTimer();
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("touchstart", handleActivity, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [resetIdleTimer]);

  // Click-outside listener to close palette popover
  useEffect(() => {
    if (!paletteOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        paletteRef.current &&
        !paletteRef.current.contains(e.target as Node)
      ) {
        setPaletteOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [paletteOpen]);

  const mountTimeRef = useRef(Date.now());
  const enteredNativeFullscreen = useRef(Boolean(document.fullscreenElement));

  const handleClose = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [onClose]);

  // Handle native Fullscreen exit & Escape key (close palette first if open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (paletteOpenRef.current) {
          e.preventDefault();
          e.stopPropagation();
          setPaletteOpen(false);
          return;
        }
        handleClose();
      }
    };

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        enteredNativeFullscreen.current = true;
      } else if (enteredNativeFullscreen.current) {
        // If native fullscreen was entered and subsequently exited, close overlay
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [handleClose, onClose]);

  const toggle24Hour = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIs24Hour((prev) => {
      const next = !prev;
      localStorage.setItem("fullscreen_clock_is_24h", String(next));
      return next;
    });
  };

  const toggleKeepAwake = (e: React.MouseEvent) => {
    e.stopPropagation();
    setKeepAwake((prev) => {
      const next = !prev;
      localStorage.setItem("fullscreen_clock_keep_awake", String(next));
      return next;
    });
  };

  const handleBgColorChange = (newColor: string) => {
    setBgColor(newColor);
    localStorage.setItem("fullscreen_clock_bg_color", newColor);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close if clicking directly on overlay background after a short delay from mount
    if (
      e.target === e.currentTarget &&
      Date.now() - mountTimeRef.current > 350
    ) {
      handleClose();
    }
  };

  // Derive digits
  const rawHours = date.getHours();
  const hoursVal = is24Hour ? rawHours : rawHours % 12 || 12;
  const hoursStr = String(hoursVal).padStart(2, "0");
  const minutesStr = String(date.getMinutes()).padStart(2, "0");
  const secondsStr = String(date.getSeconds()).padStart(2, "0");

  const [h1, h2] = hoursStr.split("");
  const [m1, m2] = minutesStr.split("");
  const [s1, s2] = secondsStr.split("");

  const { locale } = useContext(AppContext);
  const t = translation[locale] || translation.en;

  const renderSwatch = (preset: {
    name: string;
    value: string;
    isLight: boolean;
  }) => {
    const isSelected = bgColor.toLowerCase() === preset.value.toLowerCase();
    return (
      <button
        key={preset.value}
        type="button"
        className={`fullscreen-clock-swatch ${preset.isLight ? "light-swatch" : ""} ${
          isSelected ? "selected" : ""
        }`}
        style={{ backgroundColor: preset.value }}
        onClick={() => handleBgColorChange(preset.value)}
        title={preset.name}
      >
        {isSelected && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`fullscreen-clock-swatch-check ${
              preset.isLight ? "dark-check" : ""
            }`}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    );
  };

  return (
    <div
      className={`fullscreen-clock-overlay ${controlsVisible ? "" : "controls-hidden"}`}
      style={
        {
          backgroundColor: bgColor,
          "--fullscreen-clock-bg": bgColor,
        } as React.CSSProperties
      }
      onClick={handleOverlayClick}
    >
      {/* Top Floating Controls */}
      <div className="fullscreen-clock-controls" title="">
        <button
          className={`fullscreen-clock-btn ${keepAwake ? "active" : ""}`}
          onClick={toggleKeepAwake}
          type="button"
          title={
            keepAwake
              ? t.wake_lock_on_title ||
                "Screen wake lock is ON (screen will not lock or sleep)"
              : t.wake_lock_off_title ||
                "Screen wake lock is OFF (screen will sleep/lock normally)"
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {keepAwake ? (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            )}
          </svg>
          <span>
            <Translation value="stay_awake" />:{" "}
            <Translation value={keepAwake ? "on" : "off"} />
          </span>
        </button>

        {/* Color Palette Button & Popover */}
        <div className="fullscreen-clock-palette-container" ref={paletteRef}>
          <button
            className={`fullscreen-clock-btn ${paletteOpen ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setPaletteOpen((prev) => !prev);
            }}
            type="button"
            title={t.color_palette || "Color Palette"}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
              <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
              <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
            <span
              className="fullscreen-clock-btn-swatch-dot"
              style={{ backgroundColor: bgColor }}
            />
            <span>
              <Translation value="color_palette" />
            </span>
          </button>

          {paletteOpen && (
            <div
              className="fullscreen-clock-palette-popover"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="fullscreen-clock-palette-title">
                <Translation value="choose_bg_color" />
              </div>

              {/* 4 Dark presets in first row, 4 Light presets in second row */}
              <div className="fullscreen-clock-palette-presets">
                {BG_COLOR_PRESETS.map((preset) => renderSwatch(preset))}
              </div>

              <div className="fullscreen-clock-palette-custom">
                <label className="fullscreen-clock-custom-label">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => handleBgColorChange(e.target.value)}
                    className="fullscreen-clock-color-input"
                  />
                  <span>
                    <Translation value="custom_color" />
                  </span>
                </label>
                {bgColor.toLowerCase() !== "#000000" && (
                  <button
                    type="button"
                    className="fullscreen-clock-reset-btn"
                    onClick={() => handleBgColorChange("#000000")}
                  >
                    <Translation value="reset_color" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          className="fullscreen-clock-btn"
          onClick={toggle24Hour}
          type="button"
          title={t.toggle_12_24_hour || "Toggle 12h / 24h mode"}
        >
          {is24Hour ? "24H" : "12H"}
        </button>

        <button
          className="fullscreen-clock-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          type="button"
          title={t.exit_fullscreen_esc || "Exit full screen (Esc)"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span>
            <Translation value="exit" />
          </span>
          <span className="fullscreen-clock-key-hint">Esc</span>
        </button>
      </div>

      {/* Main Split-Flap Flip Clock Display */}
      <div
        className="fullscreen-clock-display"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hours */}
        <div className="flip-card-group">
          <FlipCard digit={h1} />
          <FlipCard digit={h2} />
        </div>

        {/* Colon */}
        <div className="flip-clock-colon">
          <div className="flip-clock-colon-dot" />
          <div className="flip-clock-colon-dot" />
        </div>

        {/* Minutes */}
        <div className="flip-card-group">
          <FlipCard digit={m1} />
          <FlipCard digit={m2} />
        </div>

        {/* Colon */}
        <div className="flip-clock-colon">
          <div className="flip-clock-colon-dot" />
          <div className="flip-clock-colon-dot" />
        </div>

        {/* Seconds */}
        <div className="flip-card-group">
          <FlipCard digit={s1} />
          <FlipCard digit={s2} />
        </div>
      </div>
    </div>
  );
};

export default FullScreenClock;
