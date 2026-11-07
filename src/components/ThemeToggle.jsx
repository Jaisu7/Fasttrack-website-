import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f3f3ed" : "#101619");
    try { localStorage.setItem("fastrack-theme", theme); } catch { /* Optional preference storage. */ }
  }, [theme]);
  return <button className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
    {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}<span>{theme === "dark" ? "Light" : "Dark"}</span>
  </button>;
}
