import { storageGet, storageSet } from "../storage.js";

export function initTheme() {
  const root = document.documentElement;

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = root.dataset.mode === "dark" ? "light" : "dark";
      root.dataset.mode = next;
      storageSet("mode", next);
    });
  });

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    if (storageGet("mode")) return;
    root.dataset.mode = event.matches ? "dark" : "light";
  });
}

