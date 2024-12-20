import React, { useEffect, useState } from "react";
import "./App.css";
import Clock1 from "./widgets/clock-1/Clock1";
import Calendar1 from "./widgets/day-calendar/Calendar1";
import Search from "./widgets/search/Search";
import SearchEngineSwitcher from "./widgets/search-engine-switcher/SearchEngineSwitcher";
import {
  SEARCH_ENGINE_LOCAL_STORAGE_KEY,
  searchEngineKeys,
} from "./static/searchEngine";
import Provider from "./context/provider";

function App() {
  const [searchEngine, setSearchEngine] = useState("");

  useEffect(() => {
    const defaultSearchEngine = localStorage.getItem(
      SEARCH_ENGINE_LOCAL_STORAGE_KEY
    );

    if (defaultSearchEngine && searchEngineKeys.includes(defaultSearchEngine)) {
      setSearchEngine(defaultSearchEngine);
    } else {
      setSearchEngine(searchEngineKeys[0]);
    }
  }, []);

  const handleSearchEngineChange = (val: string) => {
    localStorage.setItem(SEARCH_ENGINE_LOCAL_STORAGE_KEY, val);
    setSearchEngine(val);
  };

  return (
    <Provider>
      <div className="App">
        <div className="main-content">
          <div className="section-1">
            <Clock1 />
            <Calendar1 />
          </div>
          <div className="section-2">
            <Search selectedSearchEngine={searchEngine} />
            <SearchEngineSwitcher
              selectedSearchEngine={searchEngine}
              onSelectedEngineChange={handleSearchEngineChange}
            />
          </div>
        </div>
      </div>
    </Provider>
  );
}

export default App;
