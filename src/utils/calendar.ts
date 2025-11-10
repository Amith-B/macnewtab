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
      // Parse dates as local dates (YYYY-MM-DD format from Google Calendar)
      const startDate = new Date(start.date + "T00:00:00");
      const endDate = new Date(end.date + "T00:00:00");

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

      // Use the event's timezone if provided, otherwise use local timezone
      const timeZone = start.timeZone || undefined;

      // Get date strings in the event's timezone (YYYY-MM-DD format)
      const startDay = timeZone
        ? new Date(startDateTime.toLocaleString("en-US", { timeZone }))
            .toISOString()
            .split("T")[0]
        : `${startDateTime.getFullYear()}-${String(
            startDateTime.getMonth() + 1
          ).padStart(2, "0")}-${String(startDateTime.getDate()).padStart(
            2,
            "0"
          )}`;

      const endDay = timeZone
        ? new Date(endDateTime.toLocaleString("en-US", { timeZone }))
            .toISOString()
            .split("T")[0]
        : `${endDateTime.getFullYear()}-${String(
            endDateTime.getMonth() + 1
          ).padStart(2, "0")}-${String(endDateTime.getDate()).padStart(
            2,
            "0"
          )}`;

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
        const startDateObj = new Date(startDay + "T00:00:00");
        const endDateObj = new Date(endDay + "T00:00:00");

        for (
          let d = new Date(startDateObj);
          d <= endDateObj;
          d.setDate(d.getDate() + 1)
        ) {
          const currentDay = `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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
    // Convert to local date in YYYY-MM-DD format
    const eventDate = new Date(e.date);
    const localDate = `${eventDate.getFullYear()}-${String(
      eventDate.getMonth() + 1
    ).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`;

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

export function isToday(dateString: string): boolean {
  const givenDate = new Date(dateString);
  const today = new Date();

  return (
    givenDate.getFullYear() === today.getFullYear() &&
    givenDate.getMonth() === today.getMonth() &&
    givenDate.getDate() === today.getDate()
  );
}
