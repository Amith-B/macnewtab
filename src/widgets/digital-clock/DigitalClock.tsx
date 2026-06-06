import { useEffect, useMemo, useState } from "react";
import "./DigitalClock.css";
import DigitalTicks from "./DigitalTicks";

const currentDate = new Date();

export default function DigitalClock({ date }: { date: Date }) {
  const [hr, setHr] = useState(currentDate.getHours());
  const [min, setMin] = useState(currentDate.getMinutes());
  const [sec, setSec] = useState(currentDate.getSeconds());

  useEffect(() => {
    setHr(date.getHours());
    setMin(date.getMinutes());
    setSec(date.getSeconds());
  }, [date]);

  const formattedHour = useMemo(() => {
    const h = hr % 12 || 12;
    return h.toString();
  }, [hr]);

  const formattedMin = useMemo(() => {
    return min.toString().padStart(2, "0");
  }, [min]);

  return (
    <div className="digital-clock__container">
      <div className="digital-clock__background">
        <DigitalTicks currentSecond={sec} />

      </div>
      <div className="digital-clock__time">
        <span className="digital-clock__hours">{formattedHour}</span>
        <span className="digital-clock__colon">:</span>
        <span className="digital-clock__minutes">{formattedMin}</span>
      </div>
    </div>
  );
}
