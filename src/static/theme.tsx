import LightThemeImage from "./theme-images/light.png";
import DarkThemeImage from "./theme-images/dark.png";
import SystemThemeImage from "./theme-images/system.png";
import Translation from "../locale/Translation";

export const THEME_LOCAL_STORAGE_KEY = "default_theme";

export const THEME_LIST = [
  { title: <Translation value="light" />, key: "light", image: LightThemeImage },
  { title: <Translation value="dark" />, key: "dark", image: DarkThemeImage },
  { title: <Translation value="system" />, key: "system", image: SystemThemeImage },
];

export const THEME_KEYS = THEME_LIST.map((item) => item.key);
