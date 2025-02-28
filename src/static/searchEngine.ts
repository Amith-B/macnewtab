import { ReactComponent as SearchEngineIcon } from "./search-engine-icons/search-engine.svg";
import { ReactComponent as YoutubeIcon } from "./search-engine-icons/youtube.svg";
import { ReactComponent as ChaptGPTIcon } from "./search-engine-icons/chatgpt.svg";
import { ReactComponent as SpotifyIcon } from "./search-engine-icons/spotify.svg";

export const searchEngineList = [
  {
    key: "browser_search_engine",
    icon: SearchEngineIcon,
    searchFunction: (text: string) => {
      const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;
      if (urlPattern.test(text)) {
        const url = text.startsWith("http") ? text : `https://${text}`;
        window.location.href = url;
      } else {
        if (!chrome?.search?.query) {
          return;
        }

        chrome.search.query({
          text,
        });
      }
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
  {
    key: "chatgpt",
    title: "ChatGPT",
    icon: ChaptGPTIcon,
    searchFunction: (text: string) => {
      window.location.href = `https://chatgpt.com/?q=${encodeURIComponent(
        text
      )}`;
    },
  },
  {
    key: "spotify",
    title: "Spotify",
    icon: SpotifyIcon,
    searchFunction: (text: string) => {
      window.location.href = `https://open.spotify.com/search/${encodeURIComponent(
        text
      )}`;
    },
  },
];

export const searchEngineKeys = searchEngineList.map((item) => item.key);

export const SEARCH_ENGINE_LOCAL_STORAGE_KEY = "default_search_engine";
