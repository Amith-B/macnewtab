import React, { useState } from "react";
import { ReactComponent as SearchIcon } from "./search-icon.svg";
import "./Search.css";

export default function Search() {
  const [searchString, setSearchString] = useState("");

  return (
    <div className="search__container">
      <SearchIcon className="search-icon__container" />
      <input
        value={searchString}
        onChange={(e) => setSearchString(e.target.value)}
        placeholder="Search"
      />
    </div>
  );
}
