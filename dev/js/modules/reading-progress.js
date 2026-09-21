/**
 * Thin progress bar across the top of a post, showing how far through the
 * article the reader is.
 *
 * Driven by a scroll-timeline in CSS where supported, so it costs no main
 * thread work; the JS path below is only a fallback for browsers without
 * animation-timeline.
 */
export function initReadingProgress() {
  const article = document.querySelector("article .prose");
  if (!article) return;

  const bar = document.createElement("div");
  bar.className = "fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-sky-brand";
  bar.setAttribute("role", "presentation");
  bar.dataset.readingProgress = "";
  document.body.prepend(bar);

  if (CSS.supports("animation-timeline: scroll()")) return;

  let ticking = false;
  const update = () => {
    const start = article.offsetTop;
    const distance = article.offsetHeight - window.innerHeight;
    const progress = distance > 0 ? (window.scrollY - start) / distance : 1;
    bar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
    ticking = false;
  };

  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  update();
}
