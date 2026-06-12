import React, { useRef, useEffect, useState, useCallback } from "react";
import "./TimeRangeSlider.css";
import { formatTimeDisplay } from "../../../utils/spacesStorage";

export interface TimeRange {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

interface TimeRangeSliderProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  unavailableRanges: TimeRange[];
  isValid: boolean;
}

const TOTAL_MINUTES = 24 * 60;
const STEP_MINUTES = 15;

const timeToMinutes = (h: number, m: number) => h * 60 + m;
const minutesToTime = (mins: number) => ({
  hour: Math.floor(mins / 60),
  minute: mins % 60,
});

export const TimeRangeSlider: React.FC<TimeRangeSliderProps> = ({
  value,
  onChange,
  unavailableRanges,
  isValid,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // State for dragging
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null);

  // Local state for smooth dragging before onChange fires
  const [localStartMins, setLocalStartMins] = useState(
    timeToMinutes(value.startHour, value.startMinute),
  );
  const [localEndMins, setLocalEndMins] = useState(
    timeToMinutes(value.endHour, value.endMinute),
  );

  // Sync with props when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalStartMins(timeToMinutes(value.startHour, value.startMinute));
      setLocalEndMins(timeToMinutes(value.endHour, value.endMinute));
    }
  }, [value, isDragging]);

  const handlePointerDown =
    (handle: "start" | "end") => (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(handle);
    };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));

      const percentage = x / rect.width;
      let mins =
        Math.round((percentage * TOTAL_MINUTES) / STEP_MINUTES) * STEP_MINUTES;
      mins = Math.max(0, Math.min(mins, TOTAL_MINUTES));

      if (isDragging === "start") {
        // Prevent crossing end handle
        const newStart = Math.min(mins, localEndMins - STEP_MINUTES);
        setLocalStartMins(newStart);
      } else {
        // Prevent crossing start handle
        const newEnd = Math.max(mins, localStartMins + STEP_MINUTES);
        setLocalEndMins(newEnd);
      }
    },
    [isDragging, localStartMins, localEndMins],
  );

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(null);
      const start = minutesToTime(localStartMins);
      const end = minutesToTime(localEndMins);
      onChange({
        startHour: start.hour,
        startMinute: start.minute,
        endHour: end.hour,
        endMinute: end.minute,
      });
    }
  }, [isDragging, localStartMins, localEndMins, onChange]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    } else {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const localIsValid = React.useMemo(() => {
    for (const range of unavailableRanges) {
      let rStart = timeToMinutes(range.startHour, range.startMinute);
      let rEnd = timeToMinutes(range.endHour, range.endMinute);

      const checkOverlap = (s1: number, e1: number, s2: number, e2: number) => {
        return s1 < e2 && s2 < e1;
      };

      if (rStart > rEnd) {
        if (checkOverlap(localStartMins, localEndMins, rStart, TOTAL_MINUTES))
          return false;
        if (checkOverlap(localStartMins, localEndMins, 0, rEnd)) return false;
      } else {
        if (checkOverlap(localStartMins, localEndMins, rStart, rEnd))
          return false;
      }
    }
    return true;
  }, [localStartMins, localEndMins, unavailableRanges]);

  // Render helpers
  const getPercent = (mins: number) => (mins / TOTAL_MINUTES) * 100;

  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i <= 24; i++) {
      ticks.push(
        <div
          key={i}
          className="time-range-slider__tick"
          style={{ left: `${(i / 24) * 100}%` }}
        >
          {i % 2 === 0 && (
            <span className="time-range-slider__tick-label">
              {i.toString().padStart(2, "0")}:00
            </span>
          )}
        </div>,
      );
    }
    return ticks;
  };

  const renderUnavailable = () => {
    return unavailableRanges.map((range, idx) => {
      let startMins = timeToMinutes(range.startHour, range.startMinute);
      let endMins = timeToMinutes(range.endHour, range.endMinute);

      // Handle crossing midnight for unavailable slots
      if (startMins > endMins) {
        return (
          <React.Fragment key={idx}>
            <div
              className="time-range-slider__unavailable"
              style={{
                left: `${getPercent(startMins)}%`,
                width: `${100 - getPercent(startMins)}%`,
              }}
            />
            <div
              className="time-range-slider__unavailable"
              style={{
                left: "0%",
                width: `${getPercent(endMins)}%`,
              }}
            />
          </React.Fragment>
        );
      }

      return (
        <div
          key={idx}
          className="time-range-slider__unavailable"
          style={{
            left: `${getPercent(startMins)}%`,
            width: `${getPercent(endMins - startMins)}%`,
          }}
        />
      );
    });
  };

  return (
    <div className="time-range-slider-container">
      <div
        className="spaces__time-display"
        style={{ marginBottom: "15px", fontWeight: 500, fontSize: "14px" }}
      >
        Selected Interval:{" "}
        {formatTimeDisplay(
          minutesToTime(localStartMins).hour,
          minutesToTime(localStartMins).minute,
        )}{" "}
        –{" "}
        {formatTimeDisplay(
          minutesToTime(localEndMins).hour,
          minutesToTime(localEndMins).minute,
        )}
      </div>
      <div className="time-range-slider" ref={containerRef}>
        <div className="time-range-slider__track">
          {renderUnavailable()}

          {/* Selection */}
          <div
            className={`time-range-slider__selection ${!localIsValid ? "invalid" : ""}`}
            style={{
              left: `${getPercent(localStartMins)}%`,
              width: `${getPercent(localEndMins - localStartMins)}%`,
            }}
          />

          <div className="time-range-slider__ticks">{renderTicks()}</div>

          {/* Handles */}
          <div
            className="time-range-slider__handle"
            style={{ left: `${getPercent(localStartMins)}%` }}
            onPointerDown={handlePointerDown("start")}
          />
          <div
            className="time-range-slider__handle"
            style={{ left: `${getPercent(localEndMins)}%` }}
            onPointerDown={handlePointerDown("end")}
          />
        </div>
      </div>
    </div>
  );
};
