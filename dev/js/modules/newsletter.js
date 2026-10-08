// Mailchimp has no CORS endpoint, so this uses their JSONP post-json URL.
export function initNewsletter() {
  const form = document.querySelector("[data-newsletter]");
  if (!form) return;

  const status = form.querySelector("[data-newsletter-status]");
  const button = form.querySelector("button[type=submit]");

  const say = (message, ok) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("text-azure", ok === true);
    status.classList.toggle("text-red-600", ok === false);
  };

  form.addEventListener("submit", (event) => {
    const email = form.querySelector("[name=EMAIL]");
    if (!email?.value || !email.checkValidity()) {
      event.preventDefault();
      say("Please enter a valid email address.", false);
      email?.focus();
      return;
    }

    event.preventDefault();
    button.disabled = true;
    say("Subscribing\u2026");

    const callback = `mcb_${Date.now()}`;
    const params = new URLSearchParams(new FormData(form));
    params.set("c", callback);

    const url = form.action.replace("/post?", "/post-json?") + "&" + params.toString();
    const script = document.createElement("script");

    const cleanup = () => {
      delete window[callback];
      script.remove();
      button.disabled = false;
    };

    window[callback] = (data) => {
      const ok = data?.result === "success";
      const text = (data?.msg || "").replace(/<[^>]*>/g, "");
      say(ok ? "You're subscribed. Thanks for joining us!" : text || "Something went wrong.", ok);
      if (ok) form.reset();
      cleanup();
    };

    script.onerror = () => {
      cleanup();
      say("");
      form.submit();
    };

    script.src = url;
    document.body.appendChild(script);
  });
}
