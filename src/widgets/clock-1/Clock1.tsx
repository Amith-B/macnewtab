import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import "./Clock1.css";
import { ReactComponent as HourHand } from "./hour-hand.svg";
import { ReactComponent as MinHand } from "./min-hand.svg";
import { ReactComponent as SecHand } from "./sec-hand.svg";
import { ReactComponent as SecSticks } from "./sec-sticks.svg";

const currentDate = new Date();
const hourNumbers = Array.from(Array(12).keys());

export default function Clock1() {
  const [hr, setHr] = useState(currentDate.getHours());
  const [min, setMin] = useState(currentDate.getMinutes());
  const [sec, setSec] = useState(currentDate.getSeconds());

  const hrStyle: CSSProperties & Record<string, string> = useMemo(() => {
    return {
      "--hand-deg": `${(hr % 12) * 30 + min * 0.5}deg`,
    };
  }, [hr, min]);

  const minStyle: CSSProperties & Record<string, string> = useMemo(() => {
    return {
      "--hand-deg": `${min * 6 + sec * 0.1}deg`,
    };
  }, [min, sec]);

  const secStyle: CSSProperties & Record<string, string> = useMemo(() => {
    return {
      "--hand-deg": `${sec * 6}deg`,
    };
  }, [sec]);

  useEffect(() => {
    const intervalRef = setInterval(() => {
      const newDate = new Date();

      setHr(newDate.getHours());
      setMin(newDate.getMinutes());
      setSec(newDate.getSeconds());
    }, 1000);

    return () => clearInterval(intervalRef);
  }, []);

  return (
    <div className="clock-1__container clock-1__bezel">
      <div className="clock-1__dial">
        <SecSticks />
        <div className="clock-1__hand clock-1__hr-hand" style={hrStyle}>
          <HourHand />
        </div>
        <div className="clock-1__hand clock-1__min-hand" style={minStyle}>
          <MinHand />
        </div>
        <div className="clock-1__hand clock-1__sec-hand" style={secStyle}>
          <SecHand />
        </div>

        {hourNumbers.map((hour) => {
          const numberStyle: CSSProperties & Record<string, string> = {
            "--hour-counter": `${hour + 1}`,
          };

          return (
            <div className="hour-number" style={numberStyle}>
              {hour + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}