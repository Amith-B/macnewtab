import React, { useState } from "react";
import { ReactComponent as SearchIcon } from "./search-icon.svg";
import "./Search.css";
import { searchEngineList } from "../../static/searchEngine";

export default function Search({
  selectedSearchEngine,
}: {
  selectedSearchEngine: string;
}) {
  const [searchString, setSearchString] = useState("");

  const handleKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key === "Enter") {
      const searchEngineUrl = searchEngineList.find(
        (item) => item.key === selectedSearchEngine
      )?.url;

      if (searchString.trim() !== "") {
        var searchUrl = searchEngineUrl + encodeURIComponent(searchString);
        window.location.href = searchUrl;
      }
    }
  };

  return (
    <div className="search__container">
      <SearchIcon className="search-icon__container" />
      <input
        value={searchString}
        onChange={(e) => setSearchString(e.target.value)}
        placeholder="Search"
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
