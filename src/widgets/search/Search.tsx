import React, { useContext, useState } from "react";
import { ReactComponent as SearchIcon } from "./search-icon.svg";
import "./Search.css";
import { searchEngineList } from "../../static/searchEngine";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";
import { ReactComponent as VoiceSearch } from "../../assets/voice.svg";

export default function Search({
  selectedSearchEngine,
}: {
  selectedSearchEngine: string;
}) {
  const [searchString, setSearchString] = useState("");
  const { locale } = useContext(AppContext);
  const [animate, setAnimate] = useState(false);

  const handleKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key === "Enter") {
      const searchSelection = searchEngineList.find(
        (item) => item.key === selectedSearchEngine
      );

      if (searchString.trim() !== "") {
        searchSelection?.searchFunction(searchString);
      }
    }
  };

  return (
    <div className="search__container">
      <SearchIcon className="search-icon__container" />
      <input
        value={searchString}
        onChange={(e) => setSearchString(e.target.value)}
        placeholder={translation[locale]["search"]}
        onKeyDown={handleKeyDown}
      />
      <button className="voice-search" onClick={() => setAnimate(!animate)}>
        <VoiceSearch className={animate ? "animate" : ""} />
      </button>
    </div>
  );
}
