import { Switch } from "antd";
import { useEffect, useState } from "react";
export default function ThemeControl({
  darkLabel,
  lightLabel,
}: {
  darkLabel: string;
  lightLabel: string;
}) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);
  function changeTheme(checked: boolean) {
    setDark(checked);
    document.documentElement.dataset.theme = checked ? "dark" : "light";
    try {
      localStorage.setItem("typeplot-theme", checked ? "dark" : "light");
    } catch {
      /* Theme works when storage is unavailable. */
    }
    window.dispatchEvent(new Event("typeplot-theme-change"));
  }
  return (
    <span className="theme-control">
      <Switch
        checked={dark}
        onChange={changeTheme}
        aria-label={dark ? lightLabel : darkLabel}
        size="small"
      />
    </span>
  );
}
