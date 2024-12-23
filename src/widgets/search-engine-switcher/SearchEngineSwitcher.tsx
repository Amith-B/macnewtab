import React from "react";
import "./SearchEngineSwitcher.css";
import { searchEngineList } from "../../static/searchEngine";

export default function SearchEngineSwitcher({
  selectedSearchEngine,
  onSelectedEngineChange,
}: {
  selectedSearchEngine: string;
  onSelectedEngineChange: (val: string) => void;
}) {
  return (
    <div className="search-engine-switcher__container">
      <div className="search-engine-switcher__title">Search With</div>
      <div className="search-engine-switcher__divider-vertical"></div>
      <div className="search-engine-switcher__tile-group">
        {searchEngineList.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className="search-engine-switcher__tile-container"
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
              {item.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
