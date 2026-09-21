const ENDPOINT = "https://api.joshuaproject.net/v1/people_groups/daily_unreached.json";
const MAP_BASE = "https://joshuaproject.net/assets/media/profiles/maps/";

/**
 * Fills the "Unreached People of the Day" card from the Joshua Project API.
 *
 * The card ships with skeleton placeholders sized to the final content, so
 * populating it does not shift the page. On any failure the whole card is
 * removed rather than left showing an error, since it is supplementary.
 */

/** Maps a CSS class in the card to a function producing its text. */
const TEXT_FIELDS = {
  "pg-name": (d) => d.PeopNameInCountry,
  "country-name": (d) => d.Ctry,
  "pg-language": (d) => d.PrimaryLanguageName,
  "pg-population": (d) => Number(d.Population).toLocaleString(),
  "pg-religion": (d) => d.PrimaryReligion,
  "pg-frontier": (d) => (d.Frontier ? "Yes" : "No"),
  "pg-natural-name": (d) => d.NaturalName || d.PeopNameInCountry,
  "pg-pronunciation": (d) => d.NaturalPronunciation || "Not available",
  "pg-evangelical": (d) =>
    d.PercentEvangelical == null ? "0.00%" : `${Number(d.PercentEvangelical).toFixed(2)}%`,
  "pg-scale": (d) => d.JPScale,
  "pg-scale-text": (d) => d.JPScaleText,
  "pg-summary": (d) => d.Summary || "No summary available.",
  "pg-prayer-points": (d) => d.PrayForPG || "No specific prayer points available.",
};

function setText(root, cls, value) {
  root.querySelectorAll(`.${cls}`).forEach((el) => {
    el.textContent = value ?? "Unknown";
  });
}

export async function initJoshuaProject() {
  const card = document.querySelector("[data-jp-widget]");
  if (!card) return;

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

    const photo = card.querySelector(".pg-image");
    if (photo && group.PeopleGroupPhotoURL) {
      photo.src = group.PeopleGroupPhotoURL;
      photo.alt = `${group.PeopNameInCountry} of ${group.Ctry}`;
    } else {
      photo?.closest("figure")?.remove();
    }

    const map = card.querySelector(".pg-map-image");
    if (map && group.MapAddress) {
      map.src = MAP_BASE + group.MapAddress;
      map.alt = `Population density map for the ${group.PeopNameInCountry}`;
      setText(card, "map-credit-text", group.MapCredits || "");
      const credit = card.querySelector(".map-credit-link");
      if (credit && group.MapCreditURL) credit.href = group.MapCreditURL;
      else credit?.remove();
    } else {
      map?.closest("[data-jp-map]")?.remove();
    }

    card.removeAttribute("data-jp-loading");
  } catch (err) {
    console.error("Joshua Project widget:", err);
    card.remove();
  }
}
