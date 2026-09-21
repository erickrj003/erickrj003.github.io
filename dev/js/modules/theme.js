/**
 * Light/dark switches the card surfaces only; the mahogany page background
 * is constant in both modes.
 *
 * The initial value is applied by a blocking inline script in head.html so
 * there is no flash of the wrong theme. This only handles the toggle.
 */
export function initTheme() {
  const root = document.documentElement;

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = root.dataset.mode === "dark" ? "light" : "dark";
      root.dataset.mode = next;
      try {
        localStorage.setItem("mode", next);
      } catch {
        /* storage unavailable; the choice just will not persist */
      }
    });
  });

  // Track the OS preference only while the visitor has not chosen explicitly.
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    try {
      if (localStorage.getItem("mode")) return;
    } catch {
      /* fall through and follow the OS */
    }
    root.dataset.mode = e.matches ? "dark" : "light";
  });
}
