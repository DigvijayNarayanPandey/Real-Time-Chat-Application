import { useCallback, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "theme";
const DEFAULT_THEME = "dark";

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage write errors in restricted contexts
    }
  }, []);

  return { theme, setTheme };
}
