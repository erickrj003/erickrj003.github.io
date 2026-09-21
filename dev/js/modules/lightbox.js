/**
 * Image lightbox built on the native <dialog> element.
 *
 * Replaces the Fancybox plugin, which also required jQuery. <dialog> gives
 * us the focus trap, the Escape handler and the backdrop for free.
 */
export function initLightbox() {
  const dialog = document.querySelector("[data-lightbox]");
  if (!dialog) return;

  const img = dialog.querySelector("[data-lightbox-img]");
  const caption = dialog.querySelector("[data-lightbox-caption]");

  document.querySelectorAll("[data-lightbox-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      img.src = trigger.dataset.src;
      img.alt = trigger.dataset.alt || "";
      caption.textContent = trigger.dataset.caption || "";
      dialog.showModal();
    });
  });

  dialog.querySelector("[data-lightbox-close]")?.addEventListener("click", () => dialog.close());

  // Clicking the backdrop closes; clicking the image itself must not.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  // Drop the src on close so a large image is not retained in memory.
  dialog.addEventListener("close", () => {
    img.removeAttribute("src");
  });
}
