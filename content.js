(function () {

  const PROCESSED_ATTR = "data-microlearn-replaced";
  const FALLBACK_HEADLINE = "Stay curious — ask questions every day.";
  const FALLBACK_TAGLINE = "Learning transforms how you see the world.";

  // ── Topic Management ─────────────────────────────────
  // Default topics with types
  const DEFAULT_TOPICS = [
    { topic: "Security+ (SY0-701)", type: "educational" }
  ];

  let savedApiKey = "";
  let savedTopics = DEFAULT_TOPICS;

  // Pick a random topic from the saved list
  function pickTopic(topics) {
    const item = topics[Math.floor(Math.random() * topics.length)];
    // Handle both old string format and new object format
    if (typeof item === "string") {
      return { topic: item, type: "educational" };
    }
    return item;
  }

  // Parse HEADLINE/TAGLINE from API response
  function parseLesson(text) {
    const headlineMatch = text.match(/HEADLINE:\s*(.+)/i);
    const taglineMatch = text.match(/TAGLINE:\s*(.+)/i);

    if (headlineMatch && taglineMatch) {
      return {
        headline: headlineMatch[1].trim(),
        tagline: taglineMatch[1].trim()
      };
    }
    // Fallback: couldn't parse
    return null;
  }

  // ── Extension State ──────────────────────────────────
  let observer = null;
  let pollInterval = null;

  function isExtensionAlive() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  // ── Splash Animation ─────────────────────────────────
  const SPLASH_MS = 3000;
  const SPLASH_FADE_MS = 700;

  const SPLASH_IMAGES = [
    "images/testpic1.png",
    // add more later
  ];

  let splashIndex = 0;

  function getNextSplashUrl() {
    const path = SPLASH_IMAGES[splashIndex % SPLASH_IMAGES.length];
    splashIndex += 1;

    try {
      if (!isExtensionAlive()) return null;
      return chrome.runtime.getURL(path);
    } catch (e) {
      return null;
    }
  }

  // ── Placeholder Creation ─────────────────────────────
  function createPlaceholder(width, height) {
    const el = document.createElement("div");
    el.className = "microlearn-placeholder ml-has-splash";
    if (width) el.style.width = width + "px";
    if (height) el.style.height = height + "px";

    const splashUrl = getNextSplashUrl();

    // If extension context is invalidated, fall back to normal card (no splash)
    if (!splashUrl) {
      el.innerHTML = `
        <div class="ml-content">
          <div class="microlearn-brand">MicroLearn</div>
          <div class="microlearn-headline microlearn-loading">Loading...</div>
          <div class="microlearn-tagline"></div>
        </div>
      `;
      return el;
    }

    // Normal splash path
    el.style.backgroundImage = `url("${splashUrl}")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.style.backgroundRepeat = "no-repeat";

    el.innerHTML = `
      <div class="ml-splash" aria-hidden="true">
        <img class="ml-splash-img" src="${splashUrl}" alt="" />
      </div>

      <div class="ml-content ml-hidden">
        <div class="microlearn-brand">MicroLearn</div>
        <div class="microlearn-headline microlearn-loading">Loading...</div>
        <div class="microlearn-tagline"></div>
      </div>
    `;

    const splash = el.querySelector(".ml-splash");
    const content = el.querySelector(".ml-content");

    if (content) content.classList.add("ml-hidden");

    setTimeout(() => {
      if (!el.isConnected) return;

      if (splash) splash.classList.add("ml-fadeout");

      setTimeout(() => {
        if (!el.isConnected) return;

        if (splash) splash.remove();
        if (content) content.classList.remove("ml-hidden");
      }, SPLASH_FADE_MS);
    }, SPLASH_MS);

    return el;
  }

  // ── Set Lesson Content ───────────────────────────────
  function setLesson(placeholder, headline, tagline) {
    const headlineEl = placeholder.querySelector(".microlearn-headline");
    const taglineEl = placeholder.querySelector(".microlearn-tagline");
    if (!headlineEl) return;

    headlineEl.textContent = headline;
    headlineEl.classList.remove("microlearn-loading");

    if (taglineEl) {
      taglineEl.textContent = tagline;
    }

    // Add tooltip if text overflows
    setTimeout(() => {
      if (headlineEl.scrollHeight > headlineEl.clientHeight) {
        headlineEl.title = headline;
        headlineEl.style.cursor = "help";
      }
    }, 10);
  }

  // ── Ad Detection & Replacement ───────────────────────
  const AD_SELECTORS = [
    ".ad-slot",
    '[data-ad-label-text="Advertisement"]',
    "[data-desktop-slot-id]",
    'iframe[id^="google_ads_iframe"]',
    "gwd-google-ad",
    "#ad",
    'iframe[id^="ape_"]',
    'div.uitk-layout-grid:has(a[href*="doubleclick.net"])',
    'div.uitk-layout-grid:has(a[href*="adform.net"])',
    'div.uitk-card:has(a.uitk-card-link[href*="one-key-cards"])',
    'div[data-testid="text-ads-container"]'
  ].join(", ");

  function replaceAd(ad) {
    if (ad.hasAttribute(PROCESSED_ATTR)) return;

    const rect = ad.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) return;

    const placeholder = createPlaceholder(rect.width, rect.height);
    placeholder.setAttribute(PROCESSED_ATTR, "true");

    ad.replaceWith(placeholder);

    // Pick a topic and fetch lesson
    const { topic, type: contentType } = pickTopic(savedTopics);

    if (!isExtensionAlive() || !savedApiKey) {
      setLesson(placeholder, FALLBACK_HEADLINE, FALLBACK_TAGLINE);
      return;
    }

    chrome.runtime.sendMessage(
      { type: "FETCH_LESSON", apiKey: savedApiKey, topic: topic, contentType: contentType },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn("MicroLearn:", chrome.runtime.lastError.message);
          setLesson(placeholder, FALLBACK_HEADLINE, FALLBACK_TAGLINE);
          return;
        }

        if (response && response.lesson) {
          const parsed = parseLesson(response.lesson);

          if (parsed) {
            setLesson(placeholder, parsed.headline, parsed.tagline);
          } else {
            // Fallback: parsing failed, show full response
            setLesson(placeholder, response.lesson, "");
          }
        } else {
          setLesson(placeholder, FALLBACK_HEADLINE, FALLBACK_TAGLINE);
        }
      }
    );
  }

  function scanAndReplaceAds() {
    if (!isExtensionAlive()) return;

    const candidates = document.querySelectorAll(AD_SELECTORS);
    const newAds = [];

    candidates.forEach(ad => {
      if (ad.hasAttribute(PROCESSED_ATTR)) return;
      const rect = ad.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 50) return;
      newAds.push(ad);
    });

    if (!newAds.length) return;

    observer?.disconnect();

    newAds.forEach(ad => replaceAd(ad));

    if (observer) observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Enable / Disable ─────────────────────────────────
  function enableMicroLearn() {
    scanAndReplaceAds();
    observer = new MutationObserver(scanAndReplaceAds);
    observer.observe(document.body, { childList: true, subtree: true });
    pollInterval = setInterval(scanAndReplaceAds, 2000);
  }

  function disableMicroLearn() {
    observer?.disconnect();
    observer = null;
    clearInterval(pollInterval);
    pollInterval = null;
    location.reload();
  }

  // ── Init ─────────────────────────────────────────────
  chrome.storage.sync.get(["enabled", "apiKey", "topics"], (result) => {
    savedApiKey = result.apiKey || "";

    // Handle topics with backward compatibility
    if (Array.isArray(result.topics) && result.topics.length > 0) {
      // Check if old string format
      if (typeof result.topics[0] === "string") {
        savedTopics = DEFAULT_TOPICS;
      } else {
        savedTopics = result.topics;
      }
    } else {
      savedTopics = DEFAULT_TOPICS;
    }

    if (result.enabled !== false) enableMicroLearn();
  });

  chrome.storage.onChanged.addListener(changes => {
    if ("enabled" in changes) {
      changes.enabled.newValue ? enableMicroLearn() : disableMicroLearn();
    }
    if ("apiKey" in changes) {
      savedApiKey = changes.apiKey.newValue || "";
    }
    if ("topics" in changes) {
      const newTopics = changes.topics.newValue;
      if (Array.isArray(newTopics) && newTopics.length > 0) {
        if (typeof newTopics[0] === "string") {
          savedTopics = DEFAULT_TOPICS;
        } else {
          savedTopics = newTopics;
        }
      }
    }
  });

})();
