(function () {

  const PROCESSED_ATTR = "data-microlearn-replaced";
  const FALLBACK_HEADLINE = "Stay curious — ask questions every day.";
  const FALLBACK_TAGLINE = "Learning transforms how you see the world.";

  // ── Default Topics ─────────────────────────────────────
  const DEFAULT_TOPICS = [
    { topic: "Security+ (SY0-701)", type: "educational" }
  ];

  let savedApiKey = "";
  let savedTopics = DEFAULT_TOPICS;

  // ── Pattern Backgrounds ────────────────────────────────
  const PATTERN_FILES = {
    "green-dots":   "images/green dots.png",
    "confetti":     "images/pink confetti.png",
    "orange-waves": "images/orange waves.png",
    "flowers":      "images/flowers.png"
  };

  let observer      = null;
  let pollInterval  = null;
  let activePattern = null;

  function loadPattern(callback) {
    chrome.storage.sync.get("adContainerPattern", ({ adContainerPattern }) => {
      activePattern = adContainerPattern || null;
      if (callback) callback();
    });
  }

  function patternURL(patternId) {
    const file = PATTERN_FILES[patternId];
    if (!file) return null;
    return chrome.runtime.getURL(file);
  }

  function applyPattern(el, patternId) {
    if (patternId && PATTERN_FILES[patternId]) {
      el.style.backgroundImage    = `url("${patternURL(patternId)}")`;
      el.style.backgroundSize     = "cover";
      el.style.backgroundPosition = "center";
    } else {
      el.style.backgroundImage    = "";
      el.style.backgroundSize     = "";
      el.style.backgroundPosition = "";
    }
  }

  function refreshAllPatterns() {
    document.querySelectorAll(".microlearn-placeholder").forEach(el => {
      applyPattern(el, activePattern);
    });
  }

  // ── Topic Picking ──────────────────────────────────────
  function pickTopic(topics) {
    const item = topics[Math.floor(Math.random() * topics.length)];
    if (typeof item === "string") return { topic: item, type: "educational" };
    return item;
  }

  // ── Parse HEADLINE / TAGLINE ───────────────────────────
  function parseLesson(text) {
    const headlineMatch = text.match(/HEADLINE:\s*(.+)/i);
    const taglineMatch  = text.match(/TAGLINE:\s*(.+)/i);
    if (headlineMatch && taglineMatch) {
      return { headline: headlineMatch[1].trim(), tagline: taglineMatch[1].trim() };
    }
    return null;
  }

  // ── Placeholder ────────────────────────────────────────
  function createPlaceholder(width, height) {
    const el = document.createElement("div");
    el.className = "microlearn-placeholder";
    if (width)  el.style.width  = width  + "px";
    if (height) el.style.height = height + "px";
    el.innerHTML =
      '<div class="microlearn-header">MicroLearn</div>' +
      '<div class="microlearn-body microlearn-loading">Loading…</div>' +
      '<div class="microlearn-tagline"></div>';
    applyPattern(el, activePattern);
    return el;
  }

  function setLesson(placeholder, headline, tagline) {
    const bodyEl    = placeholder.querySelector(".microlearn-body");
    const taglineEl = placeholder.querySelector(".microlearn-tagline");
    if (!bodyEl) return;

    bodyEl.textContent = headline;
    bodyEl.classList.remove("microlearn-loading");

    if (taglineEl) taglineEl.textContent = tagline || "";

    setTimeout(() => {
      if (bodyEl.scrollHeight > bodyEl.clientHeight) {
        bodyEl.title = headline;
        bodyEl.style.cursor = "help";
      }
    }, 10);
  }

  // ── Ad Detection & Replacement ─────────────────────────
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

    // Pick a topic and fetch a lesson
    const { topic, type: contentType } = pickTopic(savedTopics);

    if (!savedApiKey) {
      setLesson(placeholder, FALLBACK_HEADLINE, FALLBACK_TAGLINE);
      return;
    }

    try {
      chrome.runtime.sendMessage(
        { type: "FETCH_LESSON", apiKey: savedApiKey, topic: topic, contentType: contentType },
        response => {
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
              // Fallback: show full response as headline
              setLesson(placeholder, response.lesson, "");
            }
          } else {
            setLesson(placeholder, FALLBACK_HEADLINE, FALLBACK_TAGLINE);
          }
        }
      );
    } catch (err) {
      console.warn("MicroLearn: context invalidated —", err.message);
      setLesson(placeholder, FALLBACK_HEADLINE, FALLBACK_TAGLINE);
    }
  }

  function scanAndReplaceAds() {
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

  // ── Enable / Disable ──────────────────────────────────
  function enableMicroLearn() {
    loadPattern(() => {
      scanAndReplaceAds();
      observer = new MutationObserver(scanAndReplaceAds);
      observer.observe(document.body, { childList: true, subtree: true });
      pollInterval = setInterval(scanAndReplaceAds, 2000);
    });
  }

  function disableMicroLearn() {
    observer?.disconnect();
    observer = null;
    clearInterval(pollInterval);
    pollInterval = null;
    location.reload();
  }

  // ── Init ───────────────────────────────────────────────
  chrome.storage.sync.get(["enabled", "apiKey", "topics"], result => {
    savedApiKey = result.apiKey || "";

    // Handle topics with backward compatibility
    if (Array.isArray(result.topics) && result.topics.length > 0) {
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
        savedTopics = typeof newTopics[0] === "string" ? DEFAULT_TOPICS : newTopics;
      }
    }
    if ("adContainerPattern" in changes) {
      activePattern = changes.adContainerPattern.newValue || null;
      refreshAllPatterns();
    }
  });

})();
