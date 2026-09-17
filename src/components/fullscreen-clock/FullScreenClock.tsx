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

  // Idle timer to hide controls after 3s of inactivity
  const resetIdleTimer = useCallback(() => {
    setControlsVisible(true);
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    const handleMouseMove = () => resetIdleTimer();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleMouseMove);
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [resetIdleTimer]);

  const mountTimeRef = useRef(Date.now());
  const enteredNativeFullscreen = useRef(Boolean(document.fullscreenElement));

  const handleClose = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [onClose]);

  // Handle native Fullscreen exit & Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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

  return (
    <div
      className={`fullscreen-clock-overlay ${controlsVisible ? "" : "controls-hidden"}`}
      onClick={handleOverlayClick}
      title={
        t.click_background_to_exit || "Click background or press Esc to exit"
      }
    >
      {/* Top Floating Controls */}
      <div className="fullscreen-clock-controls">
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
