import React, { useContext } from "react";
import "./Calendar1.css";
import { AppContext } from "../../context/provider";
import Translation from "../../locale/Translation";
import { translation } from "../../locale/languages";

const getMonthName = (date: Date): keyof (typeof translation)["en"] => {
  return new Intl.DateTimeFormat("en-US", { month: "short" })
    .format(date)
    .toLowerCase() as keyof (typeof translation)["en"];
};

const getWeekName = (date: Date): keyof (typeof translation)["en"] => {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" })
    .format(date)
    .toLowerCase() as keyof (typeof translation)["en"];
};

export default function Calendar1() {
  const { date } = useContext(AppContext);

  return (
    <div className="calendar-1__container">
      <div className="calendar-1__top-section">
        <div className="calendar-1__week">
          {<Translation value={getWeekName(date)} />}
        </div>
        <div className="calendar-1__month">
          {<Translation value={getMonthName(date)} />}
        </div>
      </div>
      <div className="calendar-1__bottom-section">{date.getDate()}</div>
    </div>
  );
}
