import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "cyberpunk" | "anime-neon" | "space" | "sunset";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("eq_theme") as Theme;
      if (stored && ["dark", "light", "cyberpunk", "anime-neon", "space", "sunset"].includes(stored)) {
        return stored;
      }
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return systemPrefersDark ? "dark" : "light";
    }
    return "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "cyberpunk", "anime-neon", "space", "sunset");
    
    root.classList.add(theme);
    
    // If it's a specialized dark theme, also add 'dark' so Tailwind utilities work
    if (theme !== "light" && theme !== "dark") {
      root.classList.add("dark");
    }
    
    localStorage.setItem("eq_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
