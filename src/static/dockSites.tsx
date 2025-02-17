import Translation from "../locale/Translation";
import { generateRandomId } from "../utils/random";

export const DOCK_SITES_LOCAL_STORAGE_KEY = "dock_sites";
export const DOCK_POSITION_LOCAL_STORAGE_KEY = "dock_position";

export const DOCK_SITES_MAX_LIMIT = 10;

export const dockBarDefaultSites = [
  {
    title: "Gemini",
    url: "https://gemini.google.com/?hl=en-IN",
    id: generateRandomId(),
  },
  {
    title: "ChatGPT",
    url: "https://chat.openai.com/",
    id: generateRandomId(),
  },
  {
    title: "Copilot",
    url: "https://copilot.microsoft.com/",
    id: generateRandomId(),
  },
  {
    title: "Meta AI",
    url: "https://www.meta.ai/",
    id: generateRandomId(),
  },
];

export const dockPositions = [
  { label: <Translation value="left" />, value: "left" },
  { label: <Translation value="bottom" />, value: "bottom" },
  { label: <Translation value="right" />, value: "right" },
];

export const dockPositionsList = dockPositions.map(({ value }) => value);

export type DockPosition = "left" | "bottom" | "right";
