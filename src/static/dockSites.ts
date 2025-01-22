export const DOCK_SITES_LOCAL_STORAGE_KEY = "dock_sites";
export const DOCK_POSITION_LOCAL_STORAGE_KEY = "dock_position";

export const DOCK_SITES_MAX_LIMIT = 10;

export const dockBarDefaultSites = [
  {
    title: "Gemini",
    url: "https://gemini.google.com/?hl=en-IN",
  },
  {
    title: "ChatGPT",
    url: "https://chat.openai.com/",
  },
  {
    title: "Copilot",
    url: "https://copilot.microsoft.com/",
  },
  {
    title: "Meta AI",
    url: "https://www.meta.ai/",
  },
];

export const dockPositions = [
  { label: "Left", value: "left" },
  { label: "Bottom", value: "bottom" },
  { label: "Right", value: "right" },
];

export const dockPositionsList = dockPositions.map(({ value }) => value);

export type DockPosition = "left" | "bottom" | "right";
