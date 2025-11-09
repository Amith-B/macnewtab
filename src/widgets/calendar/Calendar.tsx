import { useContext, useEffect, useMemo, useState } from "react";
import "./Calendar.css";
import { translation } from "../../locale/languages";
import { AppContext } from "../../context/provider";
import {
  fetchGoogleCalendarEvents,
  GoogleCalendarEvent,
} from "../../utils/googleAuth";
import { convertCalendarEvents, groupEventsByDate } from "../../utils/calendar";

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

export default function Calendar({ date }: { date: Date }) {
  const [weeks, setWeeks] = useState<string[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([
    {
      id: "e08h3dp793rdgder0au469khqo",
      htmlLink:
        "https://www.google.com/calendar/event?eid=ZTA4aDNkcDc5M3JkZ2RlcjBhdTQ2OWtocW8gYW1pdGhicjZAbQ",
      summary: "Train to KSR BENGALURU (SBC)",
      description:
        "To see detailed information for automatically created events like this one, use the official Google Calendar app. https://g.co/calendar\n\nThis event was created from an email you received in Gmail. https://mail.google.com/mail?extsrc=cal&plid=ACUX6DPwBVvUhgcL7zM2knAhCLUJg48MY0hulWA\n",
      location: "SAGAR JAMBAGARU (SRF)",
      start: {
        dateTime: "2025-11-11T21:17:00+05:30",
      },
      end: {
        dateTime: "2025-11-12T04:50:00+05:30",
      },
    },
    {
      id: "61h64ob36kp6cb9k6soj8b9kcdh3abb265hmabb274s3gd1hclh3gc9l6g_20251113",
      htmlLink:
        "https://www.google.com/calendar/event?eid=NjFoNjRvYjM2a3A2Y2I5azZzb2o4YjlrY2RoM2FiYjI2NWhtYWJiMjc0czNnZDFoY2xoM2djOWw2Z18yMDI1MTExMyBhbWl0aGJyNkBt",
      summary: "Mutual fund Automatic payment",
      description: "Mutual fund Automatic payment",
      start: {
        date: "2025-11-13",
      },
      end: {
        date: "2025-11-14",
      },
    },
    {
      id: "lcorqg52o81r57n5nej180jr3g",
      htmlLink:
        "https://www.google.com/calendar/event?eid=bGNvcnFnNTJvODFyNTduNW5lajE4MGpyM2cgYW1pdGhicjZAbQ",
      summary: "Train to KSR BENGALURU (SBC)",
      description:
        "To see detailed information for automatically created events like this one, use the official Google Calendar app. https://g.co/calendar\n\nThis event was created from an email you received in Gmail. https://mail.google.com/mail?extsrc=cal&plid=ACUX6DOyRNwjSZv-TYpsZ36sJDgzYYoIdhnqc4U\n",
      location: "SAGAR JAMBAGARU (SRF)",
      start: {
        dateTime: "2025-11-19T21:17:00+05:30",
      },
      end: {
        dateTime: "2025-11-20T04:50:00+05:30",
      },
    },
  ]);
  const { locale, showGoogleCalendar, googleAuthToken } =
    useContext(AppContext);

  useEffect(() => {
    setWeeks(getSingleLetterWeekNames());
  }, []);

  useEffect(() => {
    if (!showGoogleCalendar || !googleAuthToken) {
      return;
    }

    fetchGoogleCalendarEvents(googleAuthToken).then((events) => {
      console.log("Fetched events:", events);
      setCalendarEvents(events);
    });
  }, [showGoogleCalendar, googleAuthToken]);

  const eventGroup = useMemo(() => {
    const eventList = convertCalendarEvents(calendarEvents);
    const eventGroup = groupEventsByDate(eventList);

    return eventGroup;
  }, [calendarEvents]);

  const year = date.getFullYear();
  const month = date.getMonth();
  const currentDate = date.getDate();

  const dateList = useMemo(() => {
    return generateDateArray(year, month);
  }, [year, month]);

  const monthKey = getMonthName(
    date
  ).toLowerCase() as keyof (typeof translation)["en"];

  return (
    <div
      className={
        "calendar__container" + (calendarEvents.length > 0 ? " has-events" : "")
      }
    >
      <div className="calendar__date__container">
        <div className="calendar__date">
        <div className="calendar__month-label">
          {translation[locale]?.[monthKey]}
        </div>
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
              key={monthKey + idx + item}
            >
              {item}
            </div>
          ))}
          </div>
        </div>
        <div className="calendar__event">
          <Events eventGroup={eventGroup} />
        </div>
      </div>
    </div>
  );
}
