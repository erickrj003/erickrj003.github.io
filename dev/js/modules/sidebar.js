import { storageGet, storageSet } from "../storage.js";

const COLLAPSE_KEY = "sidebar-collapsed";

export function initSidebar() {
  const sidebar = document.querySelector("[data-sidebar]");
  if (!sidebar) return;

  const root = document.documentElement;
  const scrim = document.querySelector("[data-drawer-scrim]");
  const openBtn = document.querySelector("[data-drawer-open]");
  const closeBtn = document.querySelector("[data-drawer-close]");
  const collapseBtn = document.querySelector("[data-sidebar-toggle]");
  const collapseIcon = document.querySelector("[data-collapse-icon]");

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

  if (storageGet(COLLAPSE_KEY) === "true") applyCollapsed(true);

  collapseBtn?.addEventListener("click", () => {
    const collapsed = !sidebar.hasAttribute("data-collapsed");
    applyCollapsed(collapsed);
    storageSet(COLLAPSE_KEY, String(collapsed));
  });

  const setDrawer = (open) => {
    sidebar.toggleAttribute("data-open", open);
    scrim?.toggleAttribute("data-open", open);
    openBtn?.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) sidebar.querySelector("[data-drawer-close]")?.focus();
    else openBtn?.focus();
  };

  openBtn?.addEventListener("click", () => setDrawer(true));
  closeBtn?.addEventListener("click", () => setDrawer(false));
  scrim?.addEventListener("click", () => setDrawer(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.hasAttribute("data-open")) setDrawer(false);
  });

  sidebar.addEventListener("click", (e) => {
    if (e.target.closest("a") && sidebar.hasAttribute("data-open")) setDrawer(false);
  });

  matchMedia("(min-width: 64rem)").addEventListener("change", (e) => {
    if (e.matches) setDrawer(false);
  });
}
