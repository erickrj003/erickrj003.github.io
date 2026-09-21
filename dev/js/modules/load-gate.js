const FAILSAFE_MS = 2500;

/**
 * Holds the page invisible until every subresource has settled, so content
 * appears all at once instead of images and text popping in as they arrive.
 *
 * Waits on `load` rather than `DOMContentLoaded` because images decode after
 * the DOM is ready, and separately on `document.fonts.ready` because `load`
 * does not account for webfonts. The failsafe guarantees that a hung request
 * can never leave a permanently blank page.
 */
export function initLoadGate() {
  const release = () => document.documentElement.classList.remove("preload");

  // Never let the gate outlive the failsafe, whatever else happens.
  setTimeout(release, FAILSAFE_MS);

  const windowLoaded =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));

  const fontsLoaded = document.fonts ? document.fonts.ready : Promise.resolve();

  Promise.all([windowLoaded, fontsLoaded]).then(release).catch(release);

  // A bfcache restore or view-transitioned navigation reuses the document
  // without firing `load`, so make sure the gate is not left applied.
  window.addEventListener("pageshow", release);
}
