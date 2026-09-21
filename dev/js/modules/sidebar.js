const COLLAPSE_KEY = "sidebar-collapsed";

/**
 * Desktop: the rail collapses to icons only, persisted across navigations.
 * Mobile: the same element becomes an off-canvas drawer.
 *
 * Dropdown groups are native <details>, so they need no JavaScript at all.
 */
export function initSidebar() {
  const sidebar = document.querySelector("[data-sidebar]");
  if (!sidebar) return;

  const root = document.documentElement;
  const scrim = document.querySelector("[data-drawer-scrim]");
  const openBtn = document.querySelector("[data-drawer-open]");
  const closeBtn = document.querySelector("[data-drawer-close]");
  const collapseBtn = document.querySelector("[data-sidebar-toggle]");
  const collapseIcon = document.querySelector("[data-collapse-icon]");

  /* ----- desktop collapse ----- */

  const applyCollapsed = (collapsed) => {
    sidebar.toggleAttribute("data-collapsed", collapsed);
    root.toggleAttribute("data-sidebar-collapsed", collapsed);
    if (collapseIcon) {
      collapseIcon.setAttribute("href", collapsed ? "#icon-panel-left-open" : "#icon-panel-left-close");
    }
    if (collapseBtn) {
      collapseBtn.querySelector("span").textContent = collapsed ? "Expand sidebar" : "Collapse sidebar";
    }
  };

  try {
    if (localStorage.getItem(COLLAPSE_KEY) === "true") applyCollapsed(true);
  } catch {
    /* storage unavailable; start expanded */
  }

  collapseBtn?.addEventListener("click", () => {
    const collapsed = !sidebar.hasAttribute("data-collapsed");
    applyCollapsed(collapsed);
    try {
      localStorage.setItem(COLLAPSE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  });

  /* ----- mobile drawer ----- */

  const setDrawer = (open) => {
    sidebar.toggleAttribute("data-open", open);
    if (scrim) scrim.hidden = !open;
    openBtn?.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) sidebar.querySelector("a, button")?.focus();
    else openBtn?.focus();
  };

  openBtn?.addEventListener("click", () => setDrawer(true));
  closeBtn?.addEventListener("click", () => setDrawer(false));
  scrim?.addEventListener("click", () => setDrawer(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.hasAttribute("data-open")) setDrawer(false);
  });

  // Following a link inside the drawer should close it.
  sidebar.addEventListener("click", (e) => {
    if (e.target.closest("a") && sidebar.hasAttribute("data-open")) setDrawer(false);
  });

  // Leaving mobile width while the drawer is open would otherwise strand
  // the scrim and the locked body scroll.
  matchMedia("(min-width: 64rem)").addEventListener("change", (e) => {
    if (e.matches) setDrawer(false);
  });
}
