import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./RightWidgetsContainer.css";
import { AppContext } from "../../context/provider";
import { RightWidgetId } from "../../static/generalSettings";
import Weather from "../../widgets/weather/Weather";
import Battery from "../../widgets/battery/Battery";
import TopSites from "../topsites/TopSites";
import Search from "../search/Search";
import SearchEngineSwitcher from "../search-engine-switcher/SearchEngineSwitcher";
import Translation from "../../locale/Translation";
import { translation } from "../../locale/languages";
import { getBodyZoomScale } from "../../utils/zoom";
import { ReactComponent as DraggableIcon } from "../settings/Dock/draggable.svg";

interface RightWidgetsContainerProps {
  searchEngine: string;
  handleSearchEngineChange: (val: string) => void;
  greeting: keyof (typeof translation)["en"];
}

export default function RightWidgetsContainer({
  searchEngine,
  handleSearchEngineChange,
  greeting,
}: RightWidgetsContainerProps) {
  const {
    showWeather,
    showBattery,
    showGreeting,
    showVisitedSites,
    showSearchBar,
    showSearchEngines,
    useSearchDropdown,
    rightWidgetsOrder,
    setRightWidgetsOrder,
    locale,
  } = useContext(AppContext);

  const activeWidgets = useMemo(() => {
    return rightWidgetsOrder.filter((id) => {
      if (id === "weather-battery") return showWeather || showBattery;
      if (id === "greeting") return showGreeting;
      if (id === "top-sites") return showVisitedSites;
      if (id === "search-bar") return showSearchBar;
      if (id === "quick-search")
        return showSearchBar && showSearchEngines && !useSearchDropdown;
      return false;
    });
  }, [
    rightWidgetsOrder,
    showWeather,
    showBattery,
    showGreeting,
    showVisitedSites,
    showSearchBar,
    showSearchEngines,
    useSearchDropdown,
  ]);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<RightWidgetId | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [draggedSize, setDraggedSize] = useState({ width: 0, height: 0 });
  const [previewOrder, setPreviewOrder] = useState<RightWidgetId[]>([]);

  const slotRefs = useRef<Map<RightWidgetId, HTMLDivElement>>(new Map());
  const dragInfoRef = useRef<{
    pointerStart: { x: number; y: number };
    cardOffset: { x: number; y: number };
    scale: number;
    activeId: RightWidgetId | null;
    isStarted: boolean;
    currentOrder: RightWidgetId[];
  }>({
    pointerStart: { x: 0, y: 0 },
    cardOffset: { x: 0, y: 0 },
    scale: 1,
    activeId: null,
    isStarted: false,
    currentOrder: [],
  });

  useEffect(() => {
    if (!isDragging) {
      setPreviewOrder(activeWidgets);
      dragInfoRef.current.currentOrder = activeWidgets;
    }
  }, [activeWidgets, isDragging]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: RightWidgetId) => {
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      // Do not initiate drag when interacting with inputs, buttons, links, etc.
      if (
        target.closest(
          "input, button, a, select, textarea, .top-site-link, .search-engine-switcher, .search__input, .search__icon, .voice-search-icon",
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

        let closestId: RightWidgetId | null = null;
        let minDistance = Infinity;

        info.currentOrder.forEach((slotId) => {
          const slot = slotRefs.current.get(slotId);
          if (!slot) return;
          const slotRect = slot.getBoundingClientRect();
          const centerY = slotRect.top + slotRect.height / 2;
          const dist = Math.abs(moveEvt.clientY - centerY);
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

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);

        const info = dragInfoRef.current;
        if (info.isStarted && info.activeId) {
          const finalActiveOrder = info.currentOrder;
          const remaining = rightWidgetsOrder.filter(
            (wid) => !finalActiveOrder.includes(wid),
          );
          setRightWidgetsOrder([...finalActiveOrder, ...remaining]);
        }

        setIsDragging(false);
        setDraggedId(null);
        dragInfoRef.current.activeId = null;
        dragInfoRef.current.isStarted = false;
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [activeWidgets, rightWidgetsOrder, setRightWidgetsOrder],
  );

  const renderWidgetContent = useCallback(
    (id: RightWidgetId) => {
      switch (id) {
        case "weather-battery":
          return (
            <div className="weather-battery-row">
              {showWeather && <Weather />}
              {showBattery && <Battery />}
            </div>
          );
        case "greeting":
          return (
            <h1 className="greeting">
              <Translation value={greeting} />!
            </h1>
          );
        case "top-sites":
          return <TopSites />;
        case "search-bar":
          return (
            <Search
              selectedSearchEngine={searchEngine}
              onSelectedEngineChange={handleSearchEngineChange}
              showSearchEngines={showSearchEngines}
              useSearchDropdown={useSearchDropdown}
            />
          );
        case "quick-search":
          return (
            <SearchEngineSwitcher
              selectedSearchEngine={searchEngine}
              onSelectedEngineChange={handleSearchEngineChange}
            />
          );
        default:
          return null;
      }
    },
    [
      showWeather,
      showBattery,
      greeting,
      searchEngine,
      handleSearchEngineChange,
      showSearchEngines,
      useSearchDropdown,
    ],
  );

  if (activeWidgets.length === 0) {
    return null;
  }

  const itemsToRender = isDragging ? previewOrder : activeWidgets;

  return (
    <div className="right-widgets-container">
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
            className="right-widgets-container__slot"
          >
            {isThisDragged ? (
              <div
                className="right-widget-drop-placeholder"
                style={{ height: `${draggedSize.height || 60}px` }}
              />
            ) : (
              <div
                className="right-widgets-container__item"
                onPointerDown={(e) => handlePointerDown(e, id)}
              >
                <div
                  className="right-widget-drag-indicator"
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
          className="right-widgets-container__item is-being-dragged"
          style={{
            position: "fixed",
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
            width: `${draggedSize.width}px`,
          }}
        >
          {renderWidgetContent(draggedId)}
        </div>
      )}
    </div>
  );
}
