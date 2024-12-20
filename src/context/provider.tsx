import { useState, useEffect, ReactNode, createContext } from "react";

export const AppContext = createContext({ date: new Date() });

export default function AppProvider({ children }: { children: ReactNode }) {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const intervalRef = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(intervalRef);
  }, []);

  return <AppContext.Provider value={{ date }}>{children}</AppContext.Provider>;
}
