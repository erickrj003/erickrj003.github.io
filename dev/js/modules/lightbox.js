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

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    img.removeAttribute("src");
  });
}
