import React, { useContext, useEffect, useState } from "react";
import "./Calendar1.css";
import { AppContext } from "../../context/provider";

const getMonthName = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
};

const getWeekName = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
};

export default function Calendar1() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { date } = useContext(AppContext);

  useEffect(() => {
    setCurrentDate(date);
  }, [date]);

  return (
    <div className="calendar-1__container">
      <div className="calendar-1__top-section">
        <div className="calendar-1__week">{getWeekName(currentDate)}</div>
        <div className="calendar-1__month">{getMonthName(currentDate)}</div>
      </div>
      <div className="calendar-1__bottom-section">{currentDate.getDate()}</div>
    </div>
  );
}
