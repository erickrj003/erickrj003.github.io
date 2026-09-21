/**
 * Gives every article heading a permalink anchor.
 *
 * kramdown already emits ids via auto_ids, so this only adds the visible
 * affordance for linking to a section.
 */
export function initHeadingAnchors() {
  const headings = document.querySelectorAll(".prose h2[id], .prose h3[id], .prose h4[id]");

  headings.forEach((heading) => {
    heading.classList.add("group/heading", "scroll-mt-20");

    const anchor = document.createElement("a");
    anchor.href = `#${heading.id}`;
    anchor.className =
      "ml-2 inline-block align-middle text-azure opacity-0 transition-opacity group-hover/heading:opacity-100 focus:opacity-100";
    anchor.innerHTML = '<svg class="size-4" aria-hidden="true"><use href="#icon-link"></use></svg>';
    anchor.setAttribute("aria-label", `Link to this section: ${heading.textContent.trim()}`);

    heading.appendChild(anchor);
  });
}
