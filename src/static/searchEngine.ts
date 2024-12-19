import { ReactComponent as GoogleIcon } from "./search-engine-icons/google.svg";
import { ReactComponent as BraveIcon } from "./search-engine-icons/brave.svg";
import { ReactComponent as BingIcon } from "./search-engine-icons/bing.svg";
import { ReactComponent as YoutubeIcon } from "./search-engine-icons/youtube.svg";
import { ReactComponent as DuckDuckGoIcon } from "./search-engine-icons/duckduckgo.svg";

export const searchEngineList = [
  {
    key: "google",
    title: "Google",
    icon: GoogleIcon,
    url: "https://www.google.com/search?q=",
  },
  {
    key: "bing",
    title: "Bing",
    icon: BingIcon,
    url: "https://bing.com/?q=",
  },
  {
    key: "youtube",
    title: "Youtube",
    icon: YoutubeIcon,
    url: "https://www.youtube.com/results?search_query=",
  },
  {
    key: "duck",
    title: "Duck",
    icon: DuckDuckGoIcon,
    url: "https://duckduckgo.com/?q=",
  },
  {
    key: "brave",
    title: "Brave",
    icon: BraveIcon,
    url: "https://search.brave.com/search?q=",
  },
];

export const searchEngineKeys = searchEngineList.map((item) => item.key);

export const SEARCH_ENGINE_LOCAL_STORAGE_KEY = "default_search_engine";
