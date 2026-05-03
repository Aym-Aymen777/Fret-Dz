"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "fretdz-theme";

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const html = document.documentElement;
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    const resolvedDark =
      savedTheme === "dark"
        ? true
        : savedTheme === "light"
          ? false
          : html.classList.contains("dark");

    setDark(resolvedDark);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", dark);
    window.localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  }, [dark]);

  const toggleDark = () => setDark((current) => !current);

  return { dark, toggleDark };
}
