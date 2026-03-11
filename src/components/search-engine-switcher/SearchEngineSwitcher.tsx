import { memo, useEffect, useRef, useState } from "react";
import "./SearchEngineSwitcher.css";
import { searchEngineList } from "../../static/searchEngine";
import Translation from "../../locale/Translation";
import { translation } from "../../locale/languages";
import { ReactComponent as LeftArrow } from "../../assets/left-arrow.svg";
import { ReactComponent as RightArrow } from "../../assets/right-arrow.svg";

const SearchEngineSwitcher = memo(
  ({
    selectedSearchEngine,
    onSelectedEngineChange,
  }: {
    selectedSearchEngine: string;
    onSelectedEngineChange: (val: string) => void;
  }) => {
    const [isOverflowLeft, setIsOverflowLeft] = useState(false);
    const [isOverflowRight, setIsOverflowRight] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const checkOverflow = () => {
      const container = containerRef.current;
      if (!container) return;

      // Small delay to ensure rendering is complete before checking sizing
      setTimeout(() => {
        setIsOverflowLeft(container.scrollLeft > 0);
        setIsOverflowRight(
          // Allow 1px tolerance for rounding issues
          container.scrollLeft < container.scrollWidth - container.clientWidth - 1
        );
      }, 0);
    };

    useEffect(() => {
      checkOverflow();
      // Ensure we check on window resize
      window.addEventListener("resize", checkOverflow);
      return () => window.removeEventListener("resize", checkOverflow);
    }, []);

    // Auto-scroll to selected element
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const selectedButton = container.querySelector(
        '[data-id="' + selectedSearchEngine + '"]'
      ) as HTMLButtonElement | null;

      if (selectedButton) {
        // Calculate the center position
        const scrollPosition =
          selectedButton.offsetLeft -
          container.clientWidth / 2 +
          selectedButton.clientWidth / 2;

        container.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
        
        // Timeout necessary to check overflow AFTER the smooth scroll finishes
        setTimeout(checkOverflow, 350);
      }
    }, [selectedSearchEngine]);

    const scroll = (direction: number) => {
      const container = containerRef.current;
      if (!container) return;
      container.scrollLeft += direction * 150;
    };

    return (
      <div className="search-engine-switcher__container">
        <div className="search-engine-switcher__title">
          {<Translation value="search_with" />}
        </div>
        <div className="search-engine-switcher__divider-vertical"></div>
        <div className="search-engine-switcher__tile-group-wrapper">
          <button
            className="search-engine__arrow arrow-left"
            onClick={() => scroll(-1)}
            disabled={!isOverflowLeft}
          >
            <LeftArrow />
          </button>
          <div
            className="search-engine-switcher__tile-group"
            ref={containerRef}
            onScroll={checkOverflow}
          >
            {searchEngineList.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  data-id={item.key}
                  className="search-engine-switcher__tile-container accessible"
                  onClick={() => onSelectedEngineChange(item.key)}
                >
                  <div
                    className={
                      "search-engine-switcher__tile-selection-indicator" +
                      (selectedSearchEngine === item.key ? " selected" : "")
                    }
                  >
                    <Icon />
                  </div>
                  {item.title || (
                    <Translation
                      value={item.key as keyof (typeof translation)["en"]}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <button
            className="search-engine__arrow arrow-right"
            onClick={() => scroll(1)}
            disabled={!isOverflowRight}
          >
            <RightArrow />
          </button>
        </div>
      </div>
    );
  }
);

export default SearchEngineSwitcher;
