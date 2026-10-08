export function initCodeCopy() {
  const blocks = document.querySelectorAll(".prose pre");
  if (!blocks.length || !navigator.clipboard) return;

  blocks.forEach((pre) => {
    pre.classList.add("relative", "group/pre");

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "absolute top-2.5 right-2.5 rounded-lg bg-white/10 p-2 text-white/70 opacity-0 transition hover:bg-white/20 hover:text-white focus:opacity-100 group-hover/pre:opacity-100";
    button.innerHTML = '<svg class="size-4" aria-hidden="true"><use href="#icon-copy"></use></svg>';
    button.setAttribute("aria-label", "Copy code");

    button.addEventListener("click", async () => {
      const code = pre.querySelector("code")?.innerText ?? pre.innerText;
      try {
        await navigator.clipboard.writeText(code);
        button.innerHTML = '<svg class="size-4" aria-hidden="true"><use href="#icon-check"></use></svg>';
        button.setAttribute("aria-label", "Copied");
        setTimeout(() => {
          button.innerHTML = '<svg class="size-4" aria-hidden="true"><use href="#icon-copy"></use></svg>';
          button.setAttribute("aria-label", "Copy code");
        }, 2000);
      } catch {
        button.setAttribute("aria-label", "Copy failed");
      }
    });

    pre.appendChild(button);
  });
}
