/** Footer copyright year, rendered as a range once the site is older than a year. */
export function initFooterYear() {
  const el = document.querySelector("[data-footer-year]");
  if (!el) return;

  const since = parseInt(el.textContent.trim(), 10);
  const now = new Date().getFullYear();
  if (Number.isFinite(since) && since < now) el.textContent = `${since}\u2013${now}`;
  else if (Number.isFinite(since)) el.textContent = String(since);
}

/** "This site has been running for ..." counter in the footer. */
export function initAliveTime() {
  const el = document.querySelector("[data-alivetime]");
  if (!el) return;

  const start = new Date(el.dataset.start);
  if (Number.isNaN(start.getTime())) return;

  const tick = () => {
    const ms = Date.now() - start.getTime();
    if (ms < 0) return;

    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    el.textContent = `Online for ${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  tick();
  setInterval(tick, 1000);
}

/** Back-to-top button, revealed after the first viewport of scrolling. */
export function initBackToTop() {
  const btn = document.querySelector("[data-back-to-top]");
  if (!btn) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  // A sentinel beats a scroll listener here: no per-frame work on the main thread.
  const sentinel = document.createElement("div");
  sentinel.style.cssText = "position:absolute;top:100vh;height:1px;width:1px;pointer-events:none";
  document.body.prepend(sentinel);

  new IntersectionObserver(([entry]) => {
    btn.hidden = entry.isIntersecting;
  }).observe(sentinel);
}
