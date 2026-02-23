(function () {
  const PROCESSED_ATTR = "data-microlearn-replaced";

  // Keep your existing selectors, but slightly safer.
  const AD_SELECTORS =
    '.ad-slot, ' +
    '[data-ad-label-text="Advertisement"], ' +
    '[data-desktop-slot-id], ' +
    'iframe[id^="google_ads_iframe"], ' +
    'gwd-google-ad, ' +
    '#ad, ' +
    'iframe[id^="ape_"]';

  function resolveThemeClass(cb) {
    chrome.storage.sync.get(["themeOverride"], (res) => {
      const override = res.themeOverride;
      const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = override ? override === "dark" : systemDark;
      cb(isDark ? "dark" : "light");
    });
  }

  function createPlaceholder(width, height) {
    const el = document.createElement("div");
    el.className = "ml-card";

    if (width) el.style.width = width + "px";
    if (height) el.style.height = height + "px";

    el.innerHTML = `
      <div class="ml-top">
        <div class="ml-badge" aria-hidden="true">INSIGHT</div>
        <div class="ml-topic" title="Topic"></div>
      </div>
      <div class="ml-body ml-loading">Loading…</div>
      <div class="ml-bottom">
        <div class="ml-meta" aria-hidden="true"></div>
        <button class="ml-next" type="button" title="Next insight">Next</button>
      </div>
    `;

    resolveThemeClass((t) => el.classList.toggle("dark", t === "dark"));

    return el;
  }

  function setCardContent(card, { topic, text }, streamInfo) {
    const topicEl = card.querySelector(".ml-topic");
    const bodyEl = card.querySelector(".ml-body");
    const metaEl = card.querySelector(".ml-meta");

    if (topicEl) topicEl.textContent = topic || "";
    if (bodyEl) {
      bodyEl.textContent = text || "";
      bodyEl.classList.remove("ml-loading");
    }

    if (metaEl && streamInfo) {
      const idx = streamInfo.index;
      const size = streamInfo.size;
      metaEl.textContent = size ? `Stream ${Math.min(idx, size)}/${size}` : "";
    }

    // mark shown
    chrome.runtime.sendMessage({ type: "INSIGHT_SHOWN" }, () => void 0);

    // topic accent
    card.dataset.topic = (topic || "").toLowerCase();
  }

  function fetchAndFill(card) {
    chrome.storage.sync.get(
      ["apiKey", "subjects", "selectedSubjects", "groups", "activeGroupId", "isMentalHealthMode"],
      (res) => {
        const apiKey = res.apiKey || "";
        const isMentalHealthMode = res.isMentalHealthMode === true;

        // Determine active topics (same logic as preferences save)
        let topics = [];
        if (isMentalHealthMode) {
          topics = ["Mental Health"];
        } else {
          if (Array.isArray(res.selectedSubjects) && res.selectedSubjects.length) {
            topics = res.selectedSubjects;
          } else if (Array.isArray(res.groups) && res.groups.length && res.activeGroupId) {
            const g = res.groups.find((x) => x.id === res.activeGroupId);
            topics = g && Array.isArray(g.subjects) ? g.subjects : [];
          }
        }

        chrome.runtime.sendMessage(
          {
            type: "FETCH_NEXT_INSIGHT",
            apiKey,
            topics,
            isMentalHealthMode
          },
          (response) => {
            const bodyEl = card.querySelector(".ml-body");

            if (!response || response.error) {
              if (bodyEl) {
                bodyEl.textContent = response?.error || "Couldn’t load insight.";
                bodyEl.classList.remove("ml-loading");
              }
              return;
            }

            setCardContent(card, response.insight, response.stream);
          }
        );
      }
    );
  }

  function replaceAd(ad) {
    if (!ad || ad.hasAttribute(PROCESSED_ATTR)) return;
    if (ad.closest(".ml-card")) return;

    const rect = ad.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) return;

    const style = window.getComputedStyle(ad);
    if (style.display === "none" || style.visibility === "hidden") return;

    const card = createPlaceholder(Math.floor(rect.width), Math.floor(rect.height));
    card.setAttribute(PROCESSED_ATTR, "true");

    ad.replaceWith(card);

    // Fetch first insight
    fetchAndFill(card);

    // Next button
    const nextBtn = card.querySelector(".ml-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const bodyEl = card.querySelector(".ml-body");
        if (bodyEl) {
          bodyEl.textContent = "Loading…";
          bodyEl.classList.add("ml-loading");
        }
        fetchAndFill(card);
      });
    }
  }

  function scan() {
    const nodes = document.querySelectorAll(AD_SELECTORS);
    nodes.forEach((n) => replaceAd(n));
  }

  let observer = null;
  let pollInterval = null;

  function enable() {
    scan();

    observer = new MutationObserver(() => scan());
    observer.observe(document.body, { childList: true, subtree: true });

    pollInterval = setInterval(scan, 2500);
  }

  function disable() {
    if (observer) observer.disconnect();
    observer = null;

    if (pollInterval) clearInterval(pollInterval);
    pollInterval = null;

    location.reload();
  }

  chrome.storage.sync.get(["enabled"], (res) => {
    if (res.enabled !== false) enable();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if ("enabled" in changes) {
      changes.enabled.newValue ? enable() : disable();
    }

    // Theme changes should update existing cards.
    if ("themeOverride" in changes) {
      resolveThemeClass((t) => {
        document.querySelectorAll(".ml-card").forEach((card) => {
          card.classList.toggle("dark", t === "dark");
        });
      });
    }
  });
})();
