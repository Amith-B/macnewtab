import React, {
  ChangeEvent,
  memo,
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

const triggerSearch = (searchString: string, selectedSearchEngine: string) => {
  const searchSelection = searchEngineList.find(
    (item) => item.key === selectedSearchEngine
  );

  if (searchString.trim() !== "") {
    searchSelection?.searchFunction(searchString);
  }
};

const Search = memo(
  ({ selectedSearchEngine }: { selectedSearchEngine: string }) => {
    const [searchString, setSearchString] = useState("");
    const { locale } = useContext(AppContext);
    const {
      transcript,
      listening,
      resetTranscript,
      browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

    const listenerRef = useRef("");
    const hiddenButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (listening && listenerRef.current !== "listening") {
        listenerRef.current = "listening";
      }

      if (!listening && listenerRef.current !== "abort") {
        hiddenButtonRef.current?.click();
      }
    }, [listening]);

    const voiceSearchLanguage = useMemo(() => {
      return (
        languageOptions.find((item) => item.value === locale)
          ?.voiceSearchLanguage || "en-US"
      );
    }, [locale]);

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

    return (
      <div className="search__container">
        <SearchIcon className="search-icon__container" />
        <input
          id="search-web"
          name="Search web"
          value={transcript || searchString}
          onChange={handleInput}
          placeholder={translation[locale]["search"]}
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
