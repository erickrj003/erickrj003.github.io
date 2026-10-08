export function initContactForm() {
  const form = document.querySelector("[data-contact]");
  if (!form) return;

  const status = form.querySelector("[data-contact-status]");
  const button = form.querySelector("button[type=submit]");

  const say = (message, ok) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("text-azure", ok === true);
    status.classList.toggle("text-red-600", ok === false);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    button.disabled = true;
    say("Sending\u2026");

    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      const data = await res.json();

      if (data.success) {
        say("Thanks, your message is on its way.", true);
        form.reset();
      } else {
        say(data.message || "Something went wrong. Please email instead.", false);
      }
    } catch {
      say("Could not reach the server. Please email instead.", false);
    } finally {
      button.disabled = false;
    }
  });
}
