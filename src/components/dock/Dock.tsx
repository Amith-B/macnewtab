import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ReactComponent as SettingsIcon } from "../../assets/settings.svg";
import { ReactComponent as LaunchpadIcon } from "../../assets/launchpad.svg";
import { ReactComponent as LeftArrow } from "../../assets/left-arrow.svg";
import { ReactComponent as RightArrow } from "../../assets/right-arrow.svg";
import { ReactComponent as TodoIcon } from "../../assets/todo.svg";
import { ReactComponent as StickyNotesIcon } from "../../assets/sticky-notes.svg";
import Settings from "../settings/Settings";
import Launchpad from "../launchpad/Launchpad";
import TodoDialog from "../todo/Todo";
import "./Dock.css";
import { AppContext } from "../../context/provider";

const SITE_IMAGE_URL = "https://www.google.com/s2/favicons?sz=64&domain=";

const TooltipPosition: Record<string, string> = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom",
};

const Dock = memo(() => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [launchpadVisible, setLaunchpadVisible] = useState(false);
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [isOverflowLeft, setIsOverflowLeft] = useState(false);
  const [isOverflowRight, setIsOverflowRight] = useState(false);
  const [isOverflowButtonVisible, setIsOverflowButtonVisible] = useState(false);
  const {
    dockBarSites,
    dockPosition,
    todoListVisbility,
    groupTodosByCheckedStatus,
    showStickyNotes,
  } = useContext(AppContext);

  const handleLaunchpadClose = useCallback(
    () => setLaunchpadVisible(false),
    []
  );

  const handleTodoClose = useCallback(() => setTodoDialogOpen(false), []);

  const containerRef = useRef(null);

  const checkOverflowButtonVisibility = useCallback(() => {
    const container = containerRef.current as unknown as HTMLDivElement;
    if (!container) return;

    if (dockPosition === "bottom") {
      setIsOverflowButtonVisible(container.clientWidth < container.scrollWidth);
    } else {
      setIsOverflowButtonVisible(
        container.clientHeight < container.scrollHeight
      );
    }
  }, [containerRef, dockPosition]);

  const checkOverflow = useCallback(() => {
    const container = containerRef.current as unknown as HTMLDivElement;
    if (!container) return;

    let overflowLeft = false;
    let overflowRight = false;

    if (dockPosition === "bottom") {
      overflowLeft = container.scrollLeft > 0;
      overflowRight =
        Math.round(container.scrollLeft) <
        container.scrollWidth - container.clientWidth;
    } else {
      overflowLeft = container.scrollTop > 0;
      overflowRight =
        Math.round(container.scrollTop) <
        container.scrollHeight - container.clientHeight;
    }

    setIsOverflowLeft(overflowLeft);
    setIsOverflowRight(overflowRight);
  }, [containerRef, dockPosition]);

  useEffect(() => {
    checkOverflowButtonVisibility();
    checkOverflow();
  }, [
    dockPosition,
    containerRef,
    dockBarSites.length,
    checkOverflowButtonVisibility,
    checkOverflow,
  ]);

  useEffect(() => {
    const container = containerRef.current as unknown as HTMLDivElement;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      checkOverflowButtonVisibility();
      checkOverflow();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [containerRef, checkOverflowButtonVisibility, checkOverflow]);

  const scroll = (direction: number) => {
    const container = containerRef.current as unknown as HTMLDivElement;
    if (!container) return;

    if (dockPosition === "bottom") {
      container.scrollLeft += direction * 400;
    } else {
      container.scrollTop += direction * 400;
    }
  };

  const showDocBar = !!dockBarSites.length;

  return (
    <>
      <div
        className={
          `dock-container ${dockPosition}` + (showDocBar ? " center" : "")
        }
      >
        <button
          className={`launchpad-icon accessible tooltip tooltip-${
            TooltipPosition[dockPosition] || "top"
          }`}
          data-label="Launchpad"
          onClick={() => {
            setLaunchpadVisible(!launchpadVisible);
            setSettingsVisible(false);
          }}
        >
          <LaunchpadIcon />
        </button>
        {todoListVisbility && (
          <button
            className={`todo-button accessible tooltip tooltip-${
              TooltipPosition[showDocBar ? dockPosition : "top"] || "top"
            }`}
            data-label="Todo List"
            onClick={() => {
              groupTodosByCheckedStatus();
              setTodoDialogOpen(true);
            }}
          >
            <TodoIcon />
          </button>
        )}
        {showStickyNotes && (
          <button
            className={`sticky-notes-button accessible tooltip tooltip-${
              TooltipPosition[showDocBar ? dockPosition : "top"] || "top"
            }`}
            data-label="Add Sticky Note"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("createStickyNote"));
            }}
          >
            <StickyNotesIcon />
          </button>
        )}
        <button
          className={`settings-icon accessible tooltip tooltip-${
            TooltipPosition[dockPosition] || "top"
          }`}
          data-label="Settings"
          onClick={() => {
            setSettingsVisible(true);
            setLaunchpadVisible(false);
          }}
        >
          <SettingsIcon />
        </button>
        <div className="dock-divider"></div>
        {isOverflowButtonVisible && (
          <button
            className={
              "dock-arrow arrow-left" + (isOverflowLeft ? " visible" : "")
            }
            onClick={() => scroll(-1)}
          >
            <LeftArrow />
          </button>
        )}
        <div
          className="dock-links-container"
          ref={containerRef}
          onScroll={checkOverflow}
        >
          {dockBarSites.map((item) => {
            let siteURL;

            let anchorProps = {};

            try {
              siteURL = new URL(item.url);
              anchorProps = {
                href: item.url,
                target: "_self",
              };
            } catch (error) {
              anchorProps = {
                onClick: () => {
                  if (!chrome?.search?.query) {
                    return;
                  }
                  chrome.search.query({
                    text: item.url,
                  });
                },
              };
            }

            return (
              <a
                rel="noreferrer"
                className="dock-site__item with-link"
                data-label={item.title}
                title={item.title}
                key={item.id}
                {...anchorProps}
              >
                <img
                  className="dock-site__icon"
                  src={SITE_IMAGE_URL + siteURL?.hostname}
                  alt={item.title}
                />
              </a>
            );
          })}
        </div>
        {isOverflowButtonVisible && (
          <button
            className={
              "dock-arrow arrow-right" + (isOverflowRight ? " visible" : "")
            }
            onClick={() => scroll(1)}
          >
            <RightArrow />
          </button>
        )}
      </div>
      <Settings
        withinDock={showDocBar}
        open={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
      <Launchpad visible={launchpadVisible} onClose={handleLaunchpadClose} />
      <TodoDialog
        withinDock={showDocBar}
        open={todoDialogOpen}
        onClose={handleTodoClose}
      />
    </>
  );
});

export default Dock;
