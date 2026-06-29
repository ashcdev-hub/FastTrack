import { Platform } from "react-native";

export function applyTheme(theme: "dark" | "light") {
  if (Platform.OS !== "web") return;

  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  root.style.backgroundColor = theme === "dark" ? "#131313" : "#F5F3F0";
}
