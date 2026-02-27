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
        <div className="search-engine-switcher__header">
          <span className="search-engine-switcher__title">
            <Translation value="search_with" />
          </span>
        </div>
        <div className="search-engine-switcher__tile-group">
          {searchEngineList.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedSearchEngine === item.key;
            return (
              <button
                key={item.key}
                className={`search-engine-switcher__tile-container accessible ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => onSelectedEngineChange(item.key)}
                type="button"
              >
                <div className="search-engine-switcher__tile-icon-wrapper">
                  <Icon />
                  {isSelected && (
                    <div className="search-engine-switcher__checkmark">
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
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
  },
);

export default SearchEngineSwitcher;
