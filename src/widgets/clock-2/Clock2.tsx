import { CSSProperties, useEffect, useMemo, useState } from "react";
import "./Clock2.css";
import { ReactComponent as HourHand } from "./hour-hand.svg";
import { ReactComponent as MinHand } from "./min-hand.svg";
import { ReactComponent as SecHand } from "./sec-hand.svg";
import { ReactComponent as ClockDark } from "./clock-dark.svg";
import { ReactComponent as ClockLight } from "./clock-light.svg";

const currentDate = new Date();
const hourNumbers = Array.from(Array(12).keys());

export default function Clock1({ date }: { date: Date }) {
  const [hr, setHr] = useState(currentDate.getHours());
  const [min, setMin] = useState(currentDate.getMinutes());
  const [sec, setSec] = useState(currentDate.getSeconds());
  const [isDay, setIsDay] = useState(false);

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
    const hour = date.getHours(); // local time
    setHr(hour);
    setMin(date.getMinutes());
    setSec(date.getSeconds());

    setIsDay(hour >= 6 && hour < 18);
  }, [date]);

  return (
    <div
      className={"clock-2__container clock-2__bezel" + (!isDay ? " dark" : "")}
    >
      {isDay ? <ClockLight /> : <ClockDark />}
      {hourNumbers
        .filter((hr) => (hr + 1) % 3 === 0)
        .map((hour) => {
          const numberStyle: CSSProperties & Record<string, string> = {
            "--hour-counter": `${hour + 1}`,
          };

          return (
            <div key={hour} className="hour-number" style={numberStyle}>
              {hour + 1}
            </div>
          );
        })}
      <div className="clock-2__hand clock-2__hr-hand" style={hrStyle}>
        <HourHand />
      </div>
      <div className="clock-2__hand clock-2__min-hand" style={minStyle}>
        <MinHand />
      </div>
      <div className="clock-2__hand clock-2__sec-hand" style={secStyle}>
        <SecHand />
      </div>
    </div>
  );
}
