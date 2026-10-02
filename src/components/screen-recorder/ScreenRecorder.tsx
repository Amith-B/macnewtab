import React, { useState, useEffect, useRef, useContext, memo } from "react";
import "./ScreenRecorder.css";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";
import Toggle from "../toggle/Toggle";

const ScreenRecorder = memo(
  ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [includeAudio, setIncludeAudio] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const { locale } = useContext(AppContext);
    const t = translation[locale];

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (!open) return;

      // Initial centering
      setPosition({
        x: window.innerWidth / 2 - 150, // width 300
        y: window.innerHeight / 2 - 100, // height 200
      });
    }, [open]);

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          setPosition({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y,
          });
        }
      };

      const handleMouseUp = () => setIsDragging(false);

      if (isDragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isDragging, dragOffset]);

    useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isRecording) {
          e.preventDefault();
          e.returnValue = ""; // Trigger native browser warning
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isRecording]);

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    };

    const startRecording = async () => {
      try {
        // 1. Capture the screen (video + optional system audio)
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true, // capture system/tab audio if available
        });

        let combinedStream = displayStream;

        // 2. If user wants mic, get mic stream and merge audio tracks
        if (includeAudio) {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });

            // Use AudioContext to mix display audio + mic audio together
            const audioCtx = new AudioContext();
            const destination = audioCtx.createMediaStreamDestination();

            // Add display audio tracks if present
            if (displayStream.getAudioTracks().length > 0) {
              const displaySource = audioCtx.createMediaStreamSource(
                new MediaStream(displayStream.getAudioTracks()),
              );
              displaySource.connect(destination);
            }

            // Add mic audio tracks
            const micSource = audioCtx.createMediaStreamSource(micStream);
            micSource.connect(destination);

            // Build a new stream: screen video + merged audio
            combinedStream = new MediaStream([
              ...displayStream.getVideoTracks(),
              ...destination.stream.getAudioTracks(),
            ]);

            // Clean up mic when recording ends
            displayStream.getVideoTracks()[0].onended = () => {
              micStream.getTracks().forEach((t) => t.stop());
              audioCtx.close();
            };
          } catch (micErr) {
            console.warn(
              "Microphone access denied, recording without mic audio:",
              micErr,
            );
          }
        }

        streamRef.current = combinedStream;
        const options = { mimeType: "video/webm;codecs=vp8,opus" };
        const recorder = new MediaRecorder(
          combinedStream,
          MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined,
        );

        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, {
            type: recorder.mimeType || "video/webm",
          });
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);

          // Stop all tracks
          combinedStream.getTracks().forEach((track) => track.stop());
          displayStream.getTracks().forEach((track) => track.stop());
        };

        // If user stops sharing via browser UI
        displayStream.getVideoTracks()[0].onended = () => {
          if (recorder.state === "recording") {
            recorder.stop();
          }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordingTime(0);
        setVideoUrl(null);

        timerRef.current = setInterval(() => {
          setRecordingTime((t) => t + 1);
        }, 1000);
      } catch (err) {
        console.error("Error starting recording:", err);
      }
    };

    const stopRecording = () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    };

    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
      const s = (seconds % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    };

    const downloadVideo = () => {
      if (!videoUrl) return;
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = `recording-${new Date().getTime()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    const discardVideo = () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
    };

    if (!open) return null;

    return (
      <div
        className="screen-recorder-overlay"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <div className="screen-recorder-container">
          <div className="screen-recorder-header" onMouseDown={handleMouseDown}>
            <div className="window-controls">
              <button
                className="window-control close"
                onClick={() => {
                  if (isRecording) stopRecording();
                  onClose();
                }}
              ></button>
              <button
                className="window-control minimize"
                onClick={() => onClose()}
              ></button>
              <button className="window-control maximize"></button>
            </div>
            <div className="screen-recorder-title">{t.capture_title}</div>
          </div>

          <div className="screen-recorder-body">
            {videoUrl ? (
              <div className="recorder-result">
                <video src={videoUrl} controls className="recorder-preview" />
                <div className="recorder-actions">
                  <button className="button" onClick={discardVideo}>
                    {t.discard}
                  </button>
                  <button
                    className="button button-primary"
                    onClick={downloadVideo}
                  >
                    {t.save_to_downloads}
                  </button>
                </div>
                <p className="recorder-hint">{t.records_in_webm}</p>
              </div>
            ) : (
              <div className="recorder-controls">
                {isRecording ? (
                  <>
                    <div className="recording-status">
                      <div className="recording-dot"></div>
                      <span className="recording-time">
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                    <button
                      className="recorder-btn stop"
                      onClick={stopRecording}
                    >
                      <div className="stop-square"></div>
                    </button>
                  </>
                ) : (
                  <>
                    <label className="audio-toggle">
                      <span>{t.include_mic_audio}</span>
                      <Toggle
                        id="mic-audio-toggle"
                        name="Include microphone audio"
                        isChecked={includeAudio}
                        handleToggleChange={() =>
                          setIncludeAudio(!includeAudio)
                        }
                      />
                    </label>
                    <button
                      className="recorder-btn start"
                      onClick={startRecording}
                    >
                      <div className="record-circle"></div>
                      {t.start_recording}
                    </button>
                    <p className="recorder-hint">{t.records_in_webm}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default ScreenRecorder;
