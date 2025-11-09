import { useContext } from "react";
import {
  CalendarEvents,
  getFormattedDateStringForEventsGroup,
  getFormattedTimeString,
} from "../../utils/calendar";
import "./Events.css";
import { AppContext } from "../../context/provider";

export default function Events({
  eventGroup,
}: {
  eventGroup: {
    date: string;
    events: CalendarEvents;
  }[];
}) {
  const { locale } = useContext(AppContext);

  return (
    <div className="events__container">
      {eventGroup.map((group) => (
        <div key={group.date} className="events__date-group">
          <div className="events__date-label">
            {getFormattedDateStringForEventsGroup(group.date, locale)}
          </div>
          {group.events.map((event, idx) => (
            <div key={idx} className="event__item">
              <div className="event__type__indicator"></div>
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
                    {event.location}
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
