import { initLoadGate } from "./modules/load-gate.js";
import { initTheme } from "./modules/theme.js";
import { initSidebar } from "./modules/sidebar.js";
import { initFooterYear, initAliveTime, initBackToTop } from "./modules/chrome.js";
import { initJoshuaProject } from "./modules/joshua-project.js";

initLoadGate();
initTheme();
initSidebar();
initFooterYear();
initAliveTime();
initBackToTop();
initJoshuaProject();
