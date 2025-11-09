import { useContext, useMemo } from "react";
import {
  CalendarEvents,
  getFormattedDateStringForEventsGroup,
  getFormattedTimeString,
  isToday,
} from "../../utils/calendar";
import "./Events.css";
import { AppContext } from "../../context/provider";
import { ReactComponent as LocationIcon } from "./location.svg";
import { ReactComponent as CalendarIcon } from "./calendar.svg";

export default function Events({
  eventGroup,
}: {
  eventGroup: {
    date: string;
    events: CalendarEvents;
  }[];
}) {
  const { locale } = useContext(AppContext);

  const eventHasCurrentDate = useMemo(() => {
    if (!eventGroup.length) {
      return false;
    }
    return isToday(eventGroup[0].date);
  }, [eventGroup]);

  return (
    <div className="events__container">
      {!eventHasCurrentDate && (
        <div className="events__date-group">
          <div className="events__date-label current-date">
            {getFormattedDateStringForEventsGroup(
              new Date().toISOString(),
              locale
            )}
          </div>
          <h2 className="event__item-no-event">No events today</h2>
        </div>
      )}

      {eventGroup.map((group, grpIdx) => (
        <div key={group.date} className="events__date-group">
          <div
            className={
              "events__date-label" +
              (grpIdx === 0 && eventHasCurrentDate ? " current-date" : "")
            }
          >
            {getFormattedDateStringForEventsGroup(group.date, locale)}
          </div>
          {group.events.map((event, idx) => (
            <div
              key={idx}
              className={
                "event__item" + (event.recurringEvent ? " recurring-event" : "")
              }
            >
              {event.recurringEvent ? (
                <div className="event__recurring-icon">
                  <CalendarIcon />
                </div>
              ) : (
                <div className="event__type__indicator"></div>
              )}

              <div className="event__summary">
                <h2
                  className="event__item-title"
                  aria-label={event.summary}
                  title={event.summary}
                >
                  {event.summary}
                </h2>
                {Boolean(event.location) && (
                  <h3
                    className="event__item-location"
                    aria-label={event.location}
                    title={event.location}
                  >
                    <LocationIcon />
                    <div className="event__item-location-text">
                      {event.location}
                    </div>
                  </h3>
                )}
                {event.eventType === "start_end" && (
                  <p className="event__item-time">
                    {getFormattedTimeString(event.date)} -{" "}
                    {getFormattedTimeString(event.end)}
                  </p>
                )}
                {(event.eventType === "start" || event.eventType === "end") && (
                  <p className="event__item-time">
                    {event.eventType === "end" && "Ends "}
                    {getFormattedTimeString(event.date)}
                  </p>
                )}
                {event.eventType === "all_day" && (
                  <p className="event__item-time">all-day</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
