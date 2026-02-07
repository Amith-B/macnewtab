import React, { useState, useEffect, useRef, useContext, memo } from "react";
import "./FocusMode.css";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";
import { ReactComponent as CloseIcon } from "../settings/close-icon.svg";
import { ReactComponent as MinimizeIcon } from "../settings/minimize-icon.svg";

const DEFAULT_DURATION = 25 * 60; // 25 minutes

const FocusMode: React.FC<{
  onClose: () => void;
  onOpenTodo: () => void;
  visible: boolean;
}> = memo(({ onClose, onOpenTodo, visible }) => {
  const [duration, setDuration] = useState(() => {
    const saved = localStorage.getItem("focus_duration");
    return saved ? parseInt(saved) : DEFAULT_DURATION;
  });
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("25");

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundType, setSoundType] = useState<
    "brown" | "white" | "pink" | "violet" | "blue"
  >("brown");
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const workletLoadedRef = useRef(false);

  const { todoList, locale } = useContext(AppContext);

  // Get the first unchecked todo as the focus task
  const currentTask =
    todoList.find((task) => !task.checked)?.content ||
    translation[locale].no_active_tasks;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      stopSound();
      playAlarm();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const handleTimeClick = () => {
    if (!isActive) {
      setIsEditing(true);
      setEditValue(Math.floor(duration / 60).toString());
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const val = e.target.value.replace(/[^0-9]/g, "");
    setEditValue(val);
  };

  const handleTimeBlur = () => {
    setIsEditing(false);
    let minutes = parseInt(editValue);
    if (isNaN(minutes) || minutes < 1) minutes = 1;
    if (minutes > 120) minutes = 120; // Max 2 hours

    const newDuration = minutes * 60;
    setDuration(newDuration);
    setTimeLeft(newDuration);
    localStorage.setItem("focus_duration", newDuration.toString());
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTimeBlur();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateProgress = () => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (timeLeft / duration) * circumference;
    return { dasharray: circumference, dashoffset: offset };
  };

  // Sound Generation Logic
  const initAudio = async () => {
    if (!audioContextRef.current) {
      const CtxClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new CtxClass();
      audioContextRef.current = ctx;
    }

    const ctx = audioContextRef.current;
    if (!workletLoadedRef.current && ctx) {
      try {
        const workletUrl = chrome.runtime.getURL("audio-worklet.js");
        await ctx.audioWorklet.addModule(workletUrl);
        workletLoadedRef.current = true;
      } catch (err) {
        console.error("Failed to load audio worklet", err);
      }
    }
  };

  const stopSound = () => {
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    setSoundEnabled(false);
  };

  const startSound = async () => {
    await initAudio();
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const typeMap: Record<string, string> = {
      brown: "brown-noise",
      pink: "pink-noise",
      white: "white-noise",
      violet: "violet-noise",
      blue: "blue-noise",
    };

    const processorName = typeMap[soundType] || "white-noise";

    try {
      // Clean up previous node if any
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
      }

      const node = new AudioWorkletNode(ctx, processorName);
      workletNodeRef.current = node;

      if (!gainNodeRef.current) {
        gainNodeRef.current = ctx.createGain();
        gainNodeRef.current.gain.value = 0.1; // Low volume
        gainNodeRef.current.connect(ctx.destination);
      }

      node.connect(gainNodeRef.current);
      setSoundEnabled(true);
    } catch (e) {
      console.error("Error creating AudioWorkletNode", e);
    }
  };

  const toggleSound = () => {
    if (soundEnabled) {
      stopSound();
    } else {
      startSound();
    }
  };

  // Re-init sound if type changes while playing
  useEffect(() => {
    if (soundEnabled) {
      stopSound();
      startSound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundType]);

  const handleFullClose = () => {
    setIsActive(false);
    setTimeLeft(duration);

    // Stop sound
    if (soundEnabled) {
      stopSound();
    }

    onClose();
  };

  const handleMinimize = () => {
    onClose();
  };

  const playAlarm = () => {
    if (!audioContextRef.current) {
      const CtxClass =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new CtxClass();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  };

  // Dragging Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".focus-controls")) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const { dasharray, dashoffset } = calculateProgress();

  return (
    <div
      className="focus-mode-container"
      style={{
        left: position.x,
        top: position.y,
        display: visible ? "flex" : "none",
      }}
    >
      <div className="focus-header" onMouseDown={handleMouseDown}>
        <div className="focus-window-manager">
          <button
            className="focus-window-button focus-window-close"
            onClick={handleFullClose}
            title={translation[locale].close_reset}
          >
            <CloseIcon />
          </button>
          <button
            className="focus-window-button focus-window-minimize"
            onClick={handleMinimize}
            title={translation[locale].minimize}
          >
            <MinimizeIcon />
          </button>
          <button
            className="focus-window-button focus-window-expand"
            disabled
          ></button>
        </div>
        <span className="focus-title">{translation[locale].focus_studio}</span>
      </div>

      <div className="focus-content">
        <div className="timer-display">
          <svg className="timer-circle-svg">
            <circle className="timer-circle-bg" cx="50%" cy="50%" r="70" />
            <circle
              className="timer-circle-progress"
              cx="50%"
              cy="50%"
              r="70"
              style={{
                strokeDasharray: dasharray,
                strokeDashoffset: dashoffset,
              }}
            />
          </svg>
          {isEditing ? (
            <input
              className="timer-input"
              autoFocus
              value={editValue}
              onChange={handleTimeChange}
              onBlur={handleTimeBlur}
              onKeyDown={handleTimeKeyDown}
            />
          ) : (
            <div
              className="timer-text"
              onClick={handleTimeClick}
              title={translation[locale].click_to_edit_duration}
            >
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className="focus-controls">
          <button
            className="focus-btn"
            onClick={resetTimer}
            title={translation[locale].reset}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <button
            className="focus-btn primary"
            onClick={toggleTimer}
            title={
              isActive ? translation[locale].pause : translation[locale].start
            }
          >
            {isActive ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
          </button>
        </div>

        <div className="task-section">
          <div className="task-label">{translation[locale].active_task}</div>
          {todoList.find((task) => !task.checked) ? (
            <div className="current-task">{currentTask}</div>
          ) : (
            <button className="add-task-btn" onClick={onOpenTodo}>
              {translation[locale].add_a_task}
            </button>
          )}
        </div>

        <div className="sound-controls">
          <div className="sound-info">
            <div className="sound-label">
              {translation[locale].ambient_sound}
            </div>
            <div className="sound-select-wrapper">
              <select
                className="sound-select"
                value={soundType}
                onChange={(e) => setSoundType(e.target.value as any)}
              >
                <option value="brown">{translation[locale].brown_noise}</option>
                <option value="pink">{translation[locale].pink_noise}</option>
                <option value="white">{translation[locale].white_noise}</option>
                <option value="violet">
                  {translation[locale].violet_noise}
                </option>
                <option value="blue">{translation[locale].blue_noise}</option>
              </select>
            </div>
          </div>
          <button
            className={`sound-toggle ${soundEnabled ? "active" : ""}`}
            onClick={toggleSound}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

export default FocusMode;
