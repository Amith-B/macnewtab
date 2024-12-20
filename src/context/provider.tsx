import { useState, useEffect, ReactNode, createContext } from "react";
import { THEME_LIST, THEME_LOCAL_STORAGE_KEY } from "../static/theme";

export const AppContext = createContext({
  date: new Date(),
  theme: "system",
  handleThemeChange: (val: string) => {},
});

export default function AppProvider({ children }: { children: ReactNode }) {
  const [date, setDate] = useState(new Date());
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const intervalRef = setInterval(() => {
      setDate(new Date());
    }, 1000);

    const defaultTheme = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);

    if (defaultTheme && THEME_LIST.includes(defaultTheme)) {
      setTheme(defaultTheme);
    } else {
      setTheme("system");
    }

    return () => clearInterval(intervalRef);
  }, []);

  const handleThemeChange = (val: string) => {
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, val);
    setTheme(val);
  };

  return (
    <AppContext.Provider value={{ date, theme, handleThemeChange }}>
      {children}
    </AppContext.Provider>
  );
}
