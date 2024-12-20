import LightThemeImage from "./theme-images/light.png";
import DarkThemeImage from "./theme-images/dark.png";
import SystemThemeImage from "./theme-images/system.png";

export const THEME_LOCAL_STORAGE_KEY = "default_theme";

export const THEME_LIST = [
  { title: "Light", key: "light", image: LightThemeImage },
  { title: "Dark", key: "dark", image: DarkThemeImage },
  { title: "System", key: "system", image: SystemThemeImage },
];

export const THEME_KEYS = THEME_LIST.map((item) => item.key);
