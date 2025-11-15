import { useContext, useEffect, useMemo, useState } from "react";
import "./Calendar1.css";
import { translation } from "../../locale/languages";
import { AppContext } from "../../context/provider";
import {
  fetchGoogleCalendarEvents,
  GoogleCalendarEvent,
} from "../../utils/googleAuth";
import Events from "../events/Events";
import { convertCalendarEvents, groupEventsByDate } from "../../utils/calendar";
import { ReactComponent as ExpandableIcon } from "../../assets/expandable.svg";

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
  const { locale, showGoogleCalendar, calendarEvents } = useContext(AppContext);

  const eventGroup = useMemo(() => {
    if (!showGoogleCalendar) {
      return [];
    }

    const eventList = convertCalendarEvents(calendarEvents);
    const eventGroup = groupEventsByDate(eventList);

    return eventGroup;
  }, [calendarEvents, showGoogleCalendar]);

  const hasEventsToday = useMemo(() => {
    const todayString = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return eventGroup.some((group) => group.date === todayString);
  }, [eventGroup, date]);

  return (
    <div
      className={
        "calendar-1__container" +
        (showGoogleCalendar && calendarEvents.length > 0 ? " has-events" : "")
      }
    >
      <div className="calendar__event-expand-icon">
        <ExpandableIcon />
      </div>
      <div className="calendar-1__date__container">
        <div className="calendar-1__date">
          <div className="calendar-1__top-section">
            <div className="calendar-1__week">
              {translation[locale]?.[getWeekName(date)]}
            </div>
            <div className="calendar-1__month">
              {translation[locale]?.[getMonthName(date)]}
            </div>
          </div>
          <div className="calendar-1__bottom-section">{date.getDate()}</div>
          {hasEventsToday && <div className="calendar-1__event-indicator" />}
        </div>
        <div className="calendar-1__event">
          <Events eventGroup={eventGroup} />
        </div>
      </div>
    </div>
  );
}
