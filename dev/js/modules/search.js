let uiPromise;

async function loadPagefindUI() {
  uiPromise ??= (async () => {
    // Pagefind files do not exist during jekyll serve.
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

    const query = new URLSearchParams(window.location.search).get("q");
    if (!query) return;

    const fill = () => {
      const input = document.querySelector(".pagefind-ui__search-input");
      if (!input) return false;
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    };

    if (!fill()) {
      const observer = new MutationObserver(() => {
        if (fill()) observer.disconnect();
      });
      observer.observe(container, { childList: true, subtree: true });
    }
  } catch {
    container.innerHTML =
      '<p class="font-body text-muted">' +
      "Search index is unavailable. It is generated at build time, so it is missing from local previews." +
      "</p>";
  }
}

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
