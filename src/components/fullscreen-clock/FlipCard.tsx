import React, { useEffect, useRef, useState } from "react";

interface FlipCardProps {
  digit: string | number;
}

export const FlipCard: React.FC<FlipCardProps> = ({ digit }) => {
  const currentVal = String(digit);
  const [currentDisplay, setCurrentDisplay] = useState(currentVal);
  const [prevDisplay, setPrevDisplay] = useState(currentVal);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipKey, setFlipKey] = useState(0);

  const prevValRef = useRef(currentVal);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentVal !== prevValRef.current) {
      const oldVal = prevValRef.current;
      prevValRef.current = currentVal;

      setPrevDisplay(oldVal);
      setCurrentDisplay(currentVal);
      setIsFlipping(true);
      setFlipKey((k) => k + 1);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setIsFlipping(false);
      }, 540);
    }
  }, [currentVal]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className={`flip-card-unit ${isFlipping ? "is-flipping" : ""}`}>
      {/* Upper static half (shows incoming/current digit) */}
      <div className="flip-card-half flip-card-upper">
        <div className="flip-card-content">{currentDisplay}</div>
        <div className="flip-card-gradient-top" />
      </div>

      {/* Lower static half (shows prevDisplay while flipping, currentDisplay when at rest) */}
      <div className="flip-card-half flip-card-lower">
        <div className="flip-card-content">
          {isFlipping ? prevDisplay : currentDisplay}
        </div>
        <div className="flip-card-gradient-bottom" />
      </div>

      {/* Top folding flap (folds down from 0 to -90deg showing prevDisplay) */}
      {isFlipping && (
        <div
          key={`leaf-top-${flipKey}`}
          className="flip-card-half flip-card-leaf-top"
        >
          <div className="flip-card-content">{prevDisplay}</div>
          <div className="flip-card-leaf-shadow-top" />
        </div>
      )}

      {/* Bottom unfolding flap (unfolds from 90 to 0deg showing currentDisplay) */}
      {isFlipping && (
        <div
          key={`leaf-bot-${flipKey}`}
          className="flip-card-half flip-card-leaf-bottom"
        >
          <div className="flip-card-content">{currentDisplay}</div>
          <div className="flip-card-leaf-shadow-bottom" />
        </div>
      )}

      {/* Middle seam divider line */}
      <div className="flip-card-seam" />
    </div>
  );
};

export default FlipCard;
