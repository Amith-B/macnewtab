import { ReactComponent as SearchEngineIcon } from "./search-engine-icons/search-engine.svg";
import { ReactComponent as YoutubeIcon } from "./search-engine-icons/youtube.svg";

export const searchEngineList = [
  {
    key: "browser_search_engine",
    icon: SearchEngineIcon,
    searchFunction: (text: string) => {
      if (!chrome?.search?.query) {
        return;
      }

      chrome.search.query({
        text,
      });
    },
  },
  {
    key: "youtube",
    title: "Youtube",
    icon: YoutubeIcon,
    searchFunction: (text: string) => {
      window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        text
      )}`;
    },
  },
];

export const searchEngineKeys = searchEngineList.map((item) => item.key);

export const SEARCH_ENGINE_LOCAL_STORAGE_KEY = "default_search_engine";
