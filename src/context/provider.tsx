import { useState, useEffect, ReactNode, createContext } from "react";
import { THEME_KEYS, THEME_LOCAL_STORAGE_KEY } from "../static/theme";
import { BG_IMAGE_LOCAL_STORAGE_KEY } from "../static/backgroundImage";

export const AppContext = createContext({
  date: new Date(),
  theme: "system",
  handleThemeChange: (val: string) => {},
  backgroundImage: "",
  setBackgroundImage: (val: string) => {},
});

export default function AppProvider({ children }: { children: ReactNode }) {
  const [date, setDate] = useState(new Date());
  const [theme, setTheme] = useState("system");
  const [backgroundImage, setBackgroundImage] = useState("");

  useEffect(() => {
    const intervalRef = setInterval(() => {
      setDate(new Date());
    }, 1000);

    const defaultTheme = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);

    if (defaultTheme && THEME_KEYS.includes(defaultTheme)) {
      setTheme(defaultTheme);
    } else {
      setTheme("system");
    }

    const defaultWallpaper = localStorage.getItem(BG_IMAGE_LOCAL_STORAGE_KEY);
    setBackgroundImage(defaultWallpaper || "");

    return () => clearInterval(intervalRef);
  }, []);

  useEffect(() => {
    localStorage.setItem(BG_IMAGE_LOCAL_STORAGE_KEY, backgroundImage);
  }, [backgroundImage]);

  const handleThemeChange = (val: string) => {
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, val);
    setTheme(val);
  };

  return (
    <AppContext.Provider
      value={{
        date,
        theme,
        handleThemeChange,
        backgroundImage,
        setBackgroundImage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
