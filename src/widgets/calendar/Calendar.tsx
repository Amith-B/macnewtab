import React, { useContext, useEffect, useMemo, useState } from "react";
import "./Calendar.css";
import { AppContext } from "../../context/provider";

const getMonthName = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
};

const getSingleLetterWeekNames = () => {
  const formatter = new Intl.DateTimeFormat("en", { weekday: "short" });
  const singleLetterWeekNames = Array.from({ length: 7 }, (_, i) => {
    const dayName = formatter.format(new Date(1970, 0, 4 + i));
    return dayName.charAt(0);
  });
  return singleLetterWeekNames;
};

function generateDateArray(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const resultArray = Array(startDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    resultArray.push(day);
  }

  return resultArray;
}

export default function Calendar() {
  const [weeks, setWeeks] = useState<string[]>([]);
  const { date } = useContext(AppContext);

  useEffect(() => {
    setWeeks(getSingleLetterWeekNames());
  }, []);

  const year = date.getFullYear();
  const month = date.getMonth();
  const currentDate = date.getDate();

  const dateList = useMemo(() => {
    return generateDateArray(year, month);
  }, [year, month]);

  const monthTitle = getMonthName(date).toUpperCase();

  return (
    <div className="calendar__container">
      <div className="calendar__month-label">{monthTitle}</div>
      <div className="calendar__week-container">
        {weeks.map((week, idx) => (
          <div className="calendar__column-item" key={week + idx}>
            {week}
          </div>
        ))}
        {dateList.map((item, idx) => (
          <div
            className={
              "calendar__column-item" +
              (currentDate === item ? " current-date" : "")
            }
            key={monthTitle + idx + item}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
