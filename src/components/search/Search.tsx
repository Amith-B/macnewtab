import React, {
  ChangeEvent,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ReactComponent as SearchIcon } from "./search-icon.svg";
import "./Search.css";
import { searchEngineList } from "../../static/searchEngine";
import { AppContext } from "../../context/provider";
import { languageOptions, translation } from "../../locale/languages";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import VoiceSearch from "../voice-search/VoiceSearch";
import Translation from "../../locale/Translation";

const triggerSearch = (searchString: string, selectedSearchEngine: string) => {
  const searchSelection = searchEngineList.find(
    (item) => item.key === selectedSearchEngine
  );

  if (searchString.trim() !== "") {
    searchSelection?.searchFunction(searchString);
  }
};

const Search = memo(
  ({
    selectedSearchEngine,
    onSelectedEngineChange,
    showSearchEngines,
    useSearchDropdown = false,
  }: {
    selectedSearchEngine: string;
    onSelectedEngineChange: (val: string) => void;
    showSearchEngines: boolean;
    useSearchDropdown?: boolean;
  }) => {
    const [searchString, setSearchString] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const { locale } = useContext(AppContext);
    const {
      transcript,
      listening,
      resetTranscript,
      browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

    const listenerRef = useRef("");
    const hiddenButtonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (listening && listenerRef.current !== "listening") {
        listenerRef.current = "listening";
      }

      if (!listening && listenerRef.current !== "abort") {
        hiddenButtonRef.current?.click();
      }
    }, [listening]);

    // Close dropdown when clicking outside
    useEffect(() => {
      if (!dropdownOpen) return;
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setDropdownOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownOpen]);

    useEffect(() => {
      if (dropdownOpen && triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        const margin = 20;

        if (spaceBelow > spaceAbove) {
          setDropdownStyle({
            top: "calc(100% + 8px)",
            bottom: "auto",
            maxHeight: `${Math.max(spaceBelow - margin, 100)}px`,
          });
        } else {
          setDropdownStyle({
            bottom: "calc(100% + 8px)",
            top: "auto",
            maxHeight: `${Math.max(spaceAbove - margin, 100)}px`,
          });
        }
      }
    }, [dropdownOpen]);

    const voiceSearchLanguage = useMemo(() => {
      return (
        languageOptions.find((item) => item.value === locale)
          ?.voiceSearchLanguage || "en-US"
      );
    }, [locale]);

    const selectedEngine = useMemo(() => {
      return searchEngineList.find(
        (item) => item.key === selectedSearchEngine
      );
    }, [selectedSearchEngine]);

    const handleKeyDown = (evt: React.KeyboardEvent) => {
      if (evt.key === "Enter") {
        triggerSearch(searchString, selectedSearchEngine);
      }
    };

    const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
      resetTranscript();
      setSearchString(e.target.value);
    };

    const handleVoiceSearch = () => {
      resetTranscript();
      setSearchString("");
      if (listening) {
        SpeechRecognition.abortListening();
        listenerRef.current = "abort";
        return;
      }
      SpeechRecognition.startListening({ language: voiceSearchLanguage });
    };

    const triggerVoiceSearch = () => {
      triggerSearch(transcript, selectedSearchEngine);
    };

    const handleEngineSelect = useCallback(
      (key: string) => {
        onSelectedEngineChange(key);
        setDropdownOpen(false);
      },
      [onSelectedEngineChange]
    );

    return (
      <div className="search__container">
        {showSearchEngines && useSearchDropdown && selectedEngine ? (
          <div className="search-engine-dropdown" ref={dropdownRef}>
            <button
              ref={triggerRef}
              className="search-engine-dropdown__trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title={
                selectedEngine.title ||
                translation[locale as keyof typeof translation]?.[
                  selectedEngine.key as keyof (typeof translation)["en"]
                ] ||
                selectedEngine.key
              }
            >
              <div className="search-engine-dropdown__selected-icon">
                <selectedEngine.icon />
              </div>
              <svg
                className={
                  "search-engine-dropdown__chevron" +
                  (dropdownOpen ? " open" : "")
                }
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="search-engine-dropdown__panel" style={dropdownStyle}>
                {searchEngineList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      className={
                        "search-engine-dropdown__item" +
                        (selectedSearchEngine === item.key ? " selected" : "")
                      }
                      onClick={() => handleEngineSelect(item.key)}
                    >
                      <div className="search-engine-dropdown__item-icon">
                        <Icon />
                      </div>
                      <span>
                        {item.title || (
                          <Translation
                            value={
                              item.key as keyof (typeof translation)["en"]
                            }
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="search-engine-dropdown__divider" />
          </div>
        ) : (
          <SearchIcon className="search-icon__container" />
        )}
        <input
          id="search-web"
          name="Search web"
          value={transcript || searchString}
          onChange={handleInput}
          placeholder={translation[locale as keyof typeof translation]?.["search"] || "Search"}
          onKeyDown={handleKeyDown}
        />
        {browserSupportsSpeechRecognition && (
          <>
            <button className="voice-search" onClick={handleVoiceSearch}>
              <VoiceSearch animate={listening} />
            </button>
            <button
              ref={hiddenButtonRef}
              className="hidden-voice-search-button"
              onClick={triggerVoiceSearch}
            ></button>
          </>
        )}
      </div>
    );
  }
);

export default Search;
