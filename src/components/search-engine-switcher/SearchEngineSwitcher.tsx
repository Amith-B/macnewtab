import { memo } from "react";
import "./SearchEngineSwitcher.css";
import { searchEngineList } from "../../static/searchEngine";
import Translation from "../../locale/Translation";
import { translation } from "../../locale/languages";

const SearchEngineSwitcher = memo(
  ({
    selectedSearchEngine,
    onSelectedEngineChange,
  }: {
    selectedSearchEngine: string;
    onSelectedEngineChange: (val: string) => void;
  }) => {
    return (
      <div className="search-engine-switcher__container">
        <div className="search-engine-switcher__title">
          {<Translation value="search_with" />}
        </div>
        <div className="search-engine-switcher__divider-vertical"></div>
        <div className="search-engine-switcher__tile-group">
          {searchEngineList.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
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
      </div>
    );
  }
);

export default SearchEngineSwitcher;
