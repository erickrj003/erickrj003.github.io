/**
 * Pagefind search, loaded lazily.
 *
 * The bundle and index are only fetched once someone reaches the search
 * page or opens the command palette, so they cost nothing elsewhere.
 * Pagefind generates its own files at build time, which do not exist while
 * running `jekyll serve`, hence the guarded import.
 */

let uiPromise;

async function loadPagefindUI() {
  uiPromise ??= (async () => {
    // Bare path, not a bundled import: these files only exist after
    // `npx pagefind` has run against _site.
    await import(/* @vite-ignore */ "/pagefind/pagefind-ui.js");
    return window.PagefindUI;
  })();
  return uiPromise;
}

const UI_OPTIONS = {
  showImages: false,
  showSubResults: true,
  excerptLength: 25,
  resetStyles: false,
};

export async function initSearchPage() {
  const container = document.querySelector("[data-pagefind-ui]");
  if (!container) return;

  try {
    const PagefindUI = await loadPagefindUI();
    new PagefindUI({ element: "#pagefind-search", ...UI_OPTIONS });
  } catch {
    container.innerHTML =
      '<p class="font-body text-ink-muted dark:text-ink-dark-muted">' +
      "Search index is unavailable. It is generated at build time, so it is missing from local previews." +
      "</p>";
  }
}

/** Cmd+K / Ctrl+K jumps to the search page with the field focused. */
export function initSearchShortcut() {
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();

      const onSearchPage = document.querySelector("[data-pagefind-ui]");
      if (onSearchPage) {
        document.querySelector(".pagefind-ui__search-input")?.focus();
      } else {
        window.location.href = "/search/";
      }
    }
  });
}
