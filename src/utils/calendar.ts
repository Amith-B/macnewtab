import { languageLocaleMap, translation } from "../locale/languages";
import { GoogleCalendarEvent } from "./googleAuth";

export type CalendarEvents = Array<{
  date: Date;
  end: Date;
  eventType: "start_end" | "end" | "start" | "all_day";
  summary: string;
  description: string;
  htmlLink: string;
  recurringEvent?: boolean;
  location?: string;
}>;
export function convertCalendarEvents(
  events: GoogleCalendarEvent[]
): CalendarEvents {
  const eventList: any[] = [];

  for (const event of events) {
    const {
      summary,
      description,
      htmlLink,
      start,
      end,
      recurringEventId,
      location,
    } = event;

    // Case 1: All-day event (date present)
    if (start.date && end.date) {
      const startDate = new Date(start.date + "T00:00:00+05:30");
      const endDate = new Date(end.date + "T00:00:00+05:30");

      for (
        let d = new Date(startDate);
        d < endDate;
        d.setDate(d.getDate() + 1)
      ) {
        eventList.push({
          date: new Date(d).toISOString(),
          eventType: "all_day",
          summary,
          description,
          htmlLink,
          recurringEvent: Boolean(recurringEventId),
          location,
        });
      }
    }

    // Case 2: Timed event
    if (start.dateTime && end.dateTime) {
      const startDateTime = new Date(start.dateTime);
      const endDateTime = new Date(end.dateTime);

      const startDay = startDateTime.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      const endDay = endDateTime.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });

      if (startDay === endDay) {
        // same-day event
        eventList.push({
          date: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          eventType: "start_end",
          summary,
          description,
          htmlLink,
          recurringEvent: Boolean(recurringEventId),
          location,
        });
      } else {
        // multi-day time-based event
        for (
          let d = new Date(startDay + "T00:00:00+05:30");
          d <= new Date(endDay + "T00:00:00+05:30");
          d.setDate(d.getDate() + 1)
        ) {
          const currentDay = d.toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
          });
          if (currentDay === startDay) {
            eventList.push({
              date: startDateTime.toISOString(),
              eventType: "start",
              summary,
              description,
              htmlLink,
              recurringEvent: Boolean(recurringEventId),
              location,
            });
          } else if (currentDay === endDay) {
            eventList.push({
              date: endDateTime.toISOString(),
              eventType: "end",
              summary,
              description,
              htmlLink,
              recurringEvent: Boolean(recurringEventId),
              location,
            });
          } else {
            eventList.push({
              date: new Date(d).toISOString(),
              eventType: "all_day",
              summary,
              description,
              htmlLink,
              recurringEvent: Boolean(recurringEventId),
              location,
            });
          }
        }
      }
    }
  }

  return eventList;
}

export function groupEventsByDate(events: CalendarEvents): Array<{
  date: string;
  events: CalendarEvents;
}> {
  const groups: Record<string, CalendarEvents> = {};

  for (const e of events) {
    const localDate = new Date(e.date).toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
    if (!groups[localDate]) groups[localDate] = [];
    groups[localDate].push(e);
  }

  return Object.entries(groups).map(([date, events]) => ({
    date,
    events,
  }));
}

export function getFormattedDateStringForEventsGroup(
  dateString: string,
  language: keyof typeof translation = "en"
) {
  const locale = languageLocaleMap[language] || "en-US";
  const date = new Date(dateString);

  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(
    date
  );
  const day = new Intl.DateTimeFormat(locale, { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(
    date
  );

  return `${weekday}, ${day} ${month}`;
}

export function getFormattedTimeString(
  dateString: Date,
  langCode: keyof typeof translation = "en"
) {
  const locale = languageLocaleMap[langCode] || "en-US";
  const date = new Date(dateString);

  // Format: e.g. "9:17 AM" or "21:17" depending on locale
  const formattedTime = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true, // set to false if you prefer 24-hour format
  }).format(date);

  return formattedTime;
}
