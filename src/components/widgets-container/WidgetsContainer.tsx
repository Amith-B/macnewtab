import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./WidgetsContainer.css";
import { AppContext } from "../../context/provider";
import { LeftWidgetId } from "../../static/generalSettings";
import Clock1 from "../../widgets/clock-1/Clock1";
import Clock2 from "../../widgets/clock-2/Clock2";
import DigitalClock from "../../widgets/digital-clock/DigitalClock";
import Calendar from "../../widgets/calendar/Calendar";
import Calendar1 from "../../widgets/day-calendar/Calendar1";
import { getBodyZoomScale } from "../../utils/zoom";
import { translation } from "../../locale/languages";
import { ReactComponent as DraggableIcon } from "../settings/Dock/draggable.svg";

interface WidgetsContainerProps {
  date: Date;
  time: Date;
  handleOpenFullscreenClock: (e: React.MouseEvent) => void;
}

export default function WidgetsContainer({
  date,
  time,
  handleOpenFullscreenClock,
}: WidgetsContainerProps) {
  const {
    showClockAndCalendar,
    leftWidgetsOrder,
    setLeftWidgetsOrder,
    clockStyle,
    showMonthView,
    locale,
  } = useContext(AppContext);

  const activeWidgets = useMemo(() => {
    if (!showClockAndCalendar) return [];
    return leftWidgetsOrder.filter((id) => id === "clock" || id === "calendar");
  }, [leftWidgetsOrder, showClockAndCalendar]);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<LeftWidgetId | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [draggedSize, setDraggedSize] = useState({ width: 0, height: 0 });
  const [previewOrder, setPreviewOrder] = useState<LeftWidgetId[]>([]);

  const slotRefs = useRef<Map<LeftWidgetId, HTMLDivElement>>(new Map());
  const dragInfoRef = useRef<{
    pointerStart: { x: number; y: number };
    cardOffset: { x: number; y: number };
    scale: number;
    activeId: LeftWidgetId | null;
    isStarted: boolean;
    currentOrder: LeftWidgetId[];
  }>({
    pointerStart: { x: 0, y: 0 },
    cardOffset: { x: 0, y: 0 },
    scale: 1,
    activeId: null,
    isStarted: false,
    currentOrder: [],
  });

  const cleanupDragListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupDragListenersRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (!isDragging) {
      setPreviewOrder(activeWidgets);
      dragInfoRef.current.currentOrder = activeWidgets;
    }
  }, [activeWidgets, isDragging]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: LeftWidgetId) => {
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      if (
        target.closest(
          "button, a, input, select, textarea, .clock-widget-fullscreen-btn",
        )
      ) {
        return;
      }

      const slotEl = slotRefs.current.get(id);
      if (!slotEl) return;

      const rect = slotEl.getBoundingClientRect();
      const scale = getBodyZoomScale();

      dragInfoRef.current = {
        pointerStart: { x: e.clientX, y: e.clientY },
        cardOffset: {
          x: (e.clientX - rect.left) / scale,
          y: (e.clientY - rect.top) / scale,
        },
        scale,
        activeId: id,
        isStarted: false,
        currentOrder: activeWidgets,
      };

      setDraggedSize({
        width: rect.width / scale,
        height: rect.height / scale,
      });

      const handlePointerMove = (moveEvt: PointerEvent) => {
        const info = dragInfoRef.current;
        if (!info.activeId) return;

        const distance = Math.hypot(
          moveEvt.clientX - info.pointerStart.x,
          moveEvt.clientY - info.pointerStart.y,
        );

        if (!info.isStarted) {
          if (distance > 5) {
            info.isStarted = true;
            setIsDragging(true);
            setDraggedId(info.activeId);
            setPreviewOrder(info.currentOrder);
          } else {
            return;
          }
        }

        const currentScale = info.scale || 1;
        const currentX = moveEvt.clientX / currentScale - info.cardOffset.x;
        const currentY = moveEvt.clientY / currentScale - info.cardOffset.y;
        setDragPos({ x: currentX, y: currentY });

        let closestId: LeftWidgetId | null = null;
        let minDistance = Infinity;

        info.currentOrder.forEach((slotId) => {
          const slot = slotRefs.current.get(slotId);
          if (!slot) return;
          const slotRect = slot.getBoundingClientRect();
          const centerX = slotRect.left + slotRect.width / 2;
          const centerY = slotRect.top + slotRect.height / 2;
          const dist = Math.hypot(
            moveEvt.clientX - centerX,
            moveEvt.clientY - centerY,
          );
          if (dist < minDistance) {
            minDistance = dist;
            closestId = slotId;
          }
        });

        if (closestId && closestId !== info.activeId) {
          const fromIndex = info.currentOrder.indexOf(info.activeId);
          const toIndex = info.currentOrder.indexOf(closestId);

          if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            const newOrder = [...info.currentOrder];
            const [removed] = newOrder.splice(fromIndex, 1);
            newOrder.splice(toIndex, 0, removed);

            info.currentOrder = newOrder;
            setPreviewOrder(newOrder);
          }
        }
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
        cleanupDragListenersRef.current = null;
      };

      const handlePointerUp = () => {
        cleanup();

        const info = dragInfoRef.current;
        if (info.isStarted && info.activeId) {
          const finalActiveOrder = info.currentOrder;
          const remaining = leftWidgetsOrder.filter(
            (wid) => !finalActiveOrder.includes(wid),
          );
          setLeftWidgetsOrder([...finalActiveOrder, ...remaining]);
        }

        setIsDragging(false);
        setDraggedId(null);
        dragInfoRef.current.activeId = null;
        dragInfoRef.current.isStarted = false;
      };

      cleanupDragListenersRef.current = cleanup;

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [activeWidgets, leftWidgetsOrder, setLeftWidgetsOrder],
  );

  const renderWidgetContent = useCallback(
    (id: LeftWidgetId) => {
      switch (id) {
        case "clock":
          return (
            <div className="clock-widget-container">
              {clockStyle === "digital" ? (
                <DigitalClock date={time} />
              ) : clockStyle === "analog-2" ? (
                <Clock2 date={time} />
              ) : (
                <Clock1 date={time} />
              )}
              <button
                className="clock-widget-fullscreen-btn"
                onClick={handleOpenFullscreenClock}
                title={
                  translation[locale]?.fullscreen_clock || "Fullscreen Clock"
                }
                aria-label={
                  translation[locale]?.fullscreen_clock || "Fullscreen Clock"
                }
                type="button"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            </div>
          );
        case "calendar":
          return showMonthView ? (
            <Calendar date={date} />
          ) : (
            <Calendar1 date={date} />
          );
        default:
          return null;
      }
    },
    [clockStyle, time, handleOpenFullscreenClock, locale, showMonthView, date],
  );

  if (activeWidgets.length === 0) {
    return null;
  }

  const itemsToRender = isDragging ? previewOrder : activeWidgets;

  return (
    <div className="widgets-container">
      {itemsToRender.map((id) => {
        const isThisDragged = isDragging && draggedId === id;

        return (
          <div
            key={id}
            ref={(el) => {
              if (el) {
                slotRefs.current.set(id, el);
              } else {
                slotRefs.current.delete(id);
              }
            }}
            className="widgets-container__slot"
          >
            {isThisDragged ? (
              <div className="widget-drop-placeholder" />
            ) : (
              <div
                className="widgets-container__item"
                onPointerDown={(e) => handlePointerDown(e, id)}
              >
                <div
                  className="widget-drag-indicator"
                  title={
                    translation[locale]?.drag_to_reorder || "Drag to reorder"
                  }
                >
                  <DraggableIcon />
                </div>
                {renderWidgetContent(id)}
              </div>
            )}
          </div>
        );
      })}

      {isDragging && draggedId && (
        <div
          className="widgets-container__item is-being-dragged"
          style={{
            position: "fixed",
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
            width: `${draggedSize.width}px`,
            height: `${draggedSize.height}px`,
          }}
        >
          <div className="widget-drag-indicator" style={{ opacity: 1 }}>
            <DraggableIcon />
          </div>
          {renderWidgetContent(draggedId)}
        </div>
      )}
    </div>
  );
}
