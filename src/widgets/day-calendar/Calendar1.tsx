import { useContext, useEffect, useState } from "react";
import "./Calendar1.css";
import { translation } from "../../locale/languages";
import { AppContext } from "../../context/provider";
import {
  fetchGoogleCalendarEvents,
  GoogleCalendarEvent,
} from "../../utils/googleAuth";

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

export default function Calendar1({ date }: { date: Date }) {
  const { locale, showGoogleCalendar, googleAuthToken } =
    useContext(AppContext);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>(
    []
  );

  useEffect(() => {
    if (!showGoogleCalendar || !googleAuthToken) {
      return;
    }

    fetchGoogleCalendarEvents(googleAuthToken).then((events) => {
      console.log("Fetched events:", events);
      setCalendarEvents(events);
    });
  }, [showGoogleCalendar, googleAuthToken]);

  return (
    <div className="calendar-1__container">
      <div className="calendar-1__top-section">
        <div className="calendar-1__week">
          {translation[locale]?.[getWeekName(date)]}
        </div>
        <div className="calendar-1__month">
          {translation[locale]?.[getMonthName(date)]}
        </div>
      </div>
      <div className="calendar-1__bottom-section">{date.getDate()}</div>
    </div>
  );
}
