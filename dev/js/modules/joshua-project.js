const ENDPOINT = "https://api.joshuaproject.net/v1/people_groups/daily_unreached.json";
const MAP_BASE = "https://joshuaproject.net/assets/media/profiles/maps/";
const REVEAL_MS = 8000;

function revealHome() {
  document.documentElement.classList.remove("preload");
}

function showImage(img, src, alt) {
  if (!img || !src) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      img.alt = alt || "";
      img.src = src;
      resolve();
    };
    const probe = new Image();
    probe.addEventListener("load", finish, { once: true });
    probe.addEventListener("error", finish, { once: true });
    probe.src = src;
    if (probe.complete) finish();
  });
}

const BIBLE_STATUS = {
  1: "Translation needed",
  2: "Translation started",
  3: "Portions",
  4: "New Testament",
  5: "Complete Bible",
};

const TEXT_FIELDS = {
  "pg-name": (d) => d.PeopNameInCountry,
  "country-name": (d) => d.Ctry,
  "pg-language": (d) => d.PrimaryLanguageName,
  "pg-population": (d) => Number(d.Population).toLocaleString(),
  "pg-religion": (d) => d.PrimaryReligion,
  "pg-bible-status": (d) => BIBLE_STATUS[Number(d.BibleStatus)] || "Unknown",
  "pg-frontier": (d) => (d.Frontier === "Y" || d.Frontier === true ? "Yes" : "No"),
  "pg-natural-name": (d) => d.NaturalName || d.PeopNameInCountry,
  "pg-pronunciation": (d) => d.NaturalPronunciation || "Not available",
  "pg-evangelical": (d) =>
    d.PercentEvangelical == null ? "0.00%" : `${Number(d.PercentEvangelical).toFixed(2)}%`,
  "pg-scale": (d) => d.JPScale,
  "pg-scale-text": (d) => d.JPScaleText,
  "pg-summary": (d) => d.Summary || "No summary available.",
  "pg-prayer-points": (d) => d.PrayForPG || "No specific prayer points available.",
};

function initGallery(slides) {
  const dialog = document.querySelector("[data-jp-gallery]");
  const open = document.querySelector("[data-jp-gallery-open]");
  if (!dialog || !open || !slides.length) return;

  const img = dialog.querySelector("[data-jp-gallery-img]");
  const caption = dialog.querySelector("[data-jp-gallery-caption]");
  const count = dialog.querySelector("[data-jp-gallery-count]");
  const prev = dialog.querySelector("[data-jp-gallery-prev]");
  const next = dialog.querySelector("[data-jp-gallery-next]");
  const multi = slides.length > 1;
  let index = 0;

  if (prev) prev.hidden = !multi;
  if (next) next.hidden = !multi;

  function show(i) {
    index = (i + slides.length) % slides.length;
    const slide = slides[index];
    img.src = slide.src;
    img.alt = slide.alt;
    if (caption) caption.textContent = slide.caption || "";
    if (count) count.textContent = multi ? `${index + 1} / ${slides.length}` : "";
  }

  open.addEventListener("click", () => {
    show(0);
    dialog.showModal();
  });

  prev?.addEventListener("click", () => show(index - 1));
  next?.addEventListener("click", () => show(index + 1));
  dialog.querySelector("[data-jp-gallery-close]")?.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("keydown", (event) => {
    if (!multi) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(index - 1);
    }
  });

  let startX = null;
  dialog.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, a")) return;
    startX = event.clientX;
  });
  dialog.addEventListener("pointerup", (event) => {
    if (startX == null || !multi) return;
    const dx = event.clientX - startX;
    startX = null;
    if (Math.abs(dx) < 48) return;
    show(index + (dx < 0 ? 1 : -1));
  });

  dialog.addEventListener("close", () => img.removeAttribute("src"));
}

function setText(root, cls, value) {
  root.querySelectorAll(`.${cls}`).forEach((el) => {
    el.textContent = value ?? "Unknown";
  });
}

export function initJoshuaProject() {
  const card = document.querySelector("[data-jp-widget]");
  if (!card) return;

  const timeout = setTimeout(revealHome, REVEAL_MS);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) revealHome();
  });

  fillJoshuaProject(card).finally(() => {
    clearTimeout(timeout);
    revealHome();
  });
}

async function fillJoshuaProject(card) {

  const apiKey = card.dataset.apiKey;
  if (!apiKey) {
    card.remove();
    return;
  }

  try {
    const res = await fetch(`${ENDPOINT}?api_key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const [group] = await res.json();
    if (!group) throw new Error("no people group returned");

    for (const [cls, read] of Object.entries(TEXT_FIELDS)) {
      setText(card, cls, read(group));
    }

    card.querySelectorAll(".pg-link").forEach((el) => (el.href = group.PeopleGroupURL));
    card.querySelectorAll(".country-link").forEach((el) => (el.href = group.CountryURL));

    const slides = [];
    if (group.PeopleGroupPhotoURL) {
      slides.push({
        src: group.PeopleGroupPhotoURL,
        alt: `${group.PeopNameInCountry} of ${group.Ctry}`,
        caption: group.PhotoCredits || "",
      });
    }
    if (group.MapAddress) {
      slides.push({
        src: MAP_BASE + group.MapAddress,
        alt: `Population density map for the ${group.PeopNameInCountry}`,
        caption: group.MapCredits || "",
      });
    }

    const photo = card.querySelector(".pg-image");
    const scale = card.querySelector(".pg-scale-image");
    const images = [];
    if (photo && slides[0]) images.push(showImage(photo, slides[0].src, slides[0].alt));
    if (scale && group.JPScaleImageURL) {
      scale.hidden = false;
      images.push(
        showImage(scale, group.JPScaleImageURL, `Progress scale ${group.JPScale}: ${group.JPScaleText}`)
      );
    }
    initGallery(slides);
    await Promise.all(images);
    card.removeAttribute("data-jp-loading");
  } catch (err) {
    console.error("Joshua Project widget:", err);
    card.remove();
  }
}
