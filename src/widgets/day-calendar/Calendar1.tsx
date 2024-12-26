import React, { useContext } from "react";
import "./Calendar1.css";
import { AppContext } from "../../context/provider";

const getMonthName = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
};

const getWeekName = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
};

export default function Calendar1() {
  const { date } = useContext(AppContext);

  return (
    <div className="calendar-1__container">
      <div className="calendar-1__top-section">
        <div className="calendar-1__week">{getWeekName(date)}</div>
        <div className="calendar-1__month">{getMonthName(date)}</div>
      </div>
      <div className="calendar-1__bottom-section">{date.getDate()}</div>
    </div>
  );
}
