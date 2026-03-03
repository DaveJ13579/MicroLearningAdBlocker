(function () {

  const PROCESSED_ATTR = "data-microlearn-replaced";
  const FALLBACK       = "💡 Stay curious — ask questions every day.";

  let pending       = [];
  let isFlushing    = false;
  let flushTimer    = null;
  let observer      = null;
  let pollInterval  = null;
  let activePattern = null;

  function isExtensionAlive() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  // ── Pattern System ────────────────────────────────────
  const PATTERN_FILES = {
    "green-dots":         "images/green dots.png",
    "confetti":           "images/pink confetti.png",
    "orange-waves":       "images/orange waves.png",
    "orange+blue floral": "images/orange+blue floral.png",
    "testpic1":           "images/testpic1.png",
    "PinkBlueSwirl":      "images/PinkBlueSwirl.jpg"
  };

  function loadPattern(callback) {
    chrome.storage.sync.get("adContainerPattern", ({ adContainerPattern }) => {
      activePattern = adContainerPattern || null;
      if (callback) callback();
    });
  }

  function patternURL(patternId) {
    const file = PATTERN_FILES[patternId];
    if (!file) return null;
    try {
      return chrome.runtime.getURL(file);
    } catch (e) {
      return null;
    }
  }

  function applyPattern(el, patternId) {
    if (patternId && PATTERN_FILES[patternId]) {
      el.style.backgroundImage    = `url("${patternURL(patternId)}")`;
      el.style.backgroundSize     = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat   = "no-repeat";
    } else {
      el.style.backgroundImage    = "";
      el.style.backgroundSize     = "";
      el.style.backgroundPosition = "";
      el.style.backgroundRepeat   = "";
    }
  }

  function refreshAllPatterns() {
    document.querySelectorAll(".microlearn-placeholder").forEach(el => {
      applyPattern(el, activePattern);
    });
  }

  // ── Splash Animation ──────────────────────────────────
  const SPLASH_MS      = 3000;
  const SPLASH_FADE_MS = 700;

  // ── Placeholder ───────────────────────────────────────
  function createPlaceholder(width, height) {
    const el = document.createElement("div");
    el.className = "microlearn-placeholder";
    if (width)  el.style.width  = width  + "px";
    if (height) el.style.height = height + "px";

    // Apply the user's chosen pattern as the background immediately
    applyPattern(el, activePattern);

    const url = activePattern ? patternURL(activePattern) : null;

    // If no pattern is set or extension is dead, show a simple card with no animation
    if (!url || !isExtensionAlive()) {
      el.innerHTML = `
        <div class="ml-content">
          <div class="microlearn-brand">MicroLearn</div>
          <div class="microlearn-topic microlearn-loading">Loading...</div>
          <div class="microlearn-headline microlearn-loading">Loading…</div>
          <div class="microlearn-tagline"></div>
        </div>`;
      return el;
    }

    // Pattern is set — show it as a full-bleed splash, then fade in the lesson on top
    el.innerHTML = `
      <div class="ml-splash" aria-hidden="true">
        <img class="ml-splash-img" src="${url}" alt="" />
      </div>
      <div class="ml-content ml-hidden">
        <div class="microlearn-brand">MicroLearn</div>
        <div class="microlearn-topic microlearn-loading">Loading...</div>
        <div class="microlearn-headline microlearn-loading">Loading…</div>
        <div class="microlearn-tagline"></div>
      </div>`;

    const splash  = el.querySelector(".ml-splash");
    const content = el.querySelector(".ml-content");

    // After SPLASH_MS, fade out the splash overlay and reveal the lesson
    // The pattern background image stays on the card itself the whole time
    setTimeout(() => {
      if (!el.isConnected) return;
      if (splash) splash.classList.add("ml-fadeout");
      setTimeout(() => {
        if (!el.isConnected) return;
        if (splash)  splash.remove();
        if (content) content.classList.remove("ml-hidden");
      }, SPLASH_FADE_MS);
    }, SPLASH_MS);

    return el;
  }

  function setLesson(placeholder, lessonData) {
    const topicEl    = placeholder.querySelector(".microlearn-topic");
    const headlineEl = placeholder.querySelector(".microlearn-headline");
    const taglineEl  = placeholder.querySelector(".microlearn-tagline");
    if (!headlineEl) return;

    const text  = lessonData?.text  ?? (typeof lessonData === "string" ? lessonData : null) ?? FALLBACK;
    const topic = lessonData?.topic ?? null;

    if (topic && topicEl) {
      topicEl.textContent = topic;
      topicEl.classList.remove("microlearn-loading");
    } else if (topicEl) {
      topicEl.style.display = "none";
    }

    // Parse HEADLINE/TAGLINE format
    const headlineMatch = text.match(/HEADLINE:\s*(.+?)(?:\s*TAGLINE:|\s*$)/i);
    const taglineMatch  = text.match(/TAGLINE:\s*(.+)/i);

    if (headlineMatch && taglineMatch) {
      headlineEl.textContent = headlineMatch[1].trim();
      taglineEl.textContent  = taglineMatch[1].trim();
    } else {
      // Fallback: dump full text into headline if format isn't recognized
      headlineEl.textContent = text;
      taglineEl.style.display = "none";
    }

    headlineEl.classList.remove("microlearn-loading");

    setTimeout(() => {
      if (headlineEl.scrollHeight > headlineEl.clientHeight) {
        headlineEl.title        = headlineEl.textContent;
        headlineEl.style.cursor = "help";
      }
    }, 10);
  }

  // ── Batching ──────────────────────────────────────────
  function flush() {
    flushTimer = null;
    if (isFlushing)      { flushTimer = setTimeout(flush, 200); return; }
    if (!pending.length) return;

    const toFill = pending.splice(0);
    isFlushing   = true;

    try {
      if (!isExtensionAlive()) {
        toFill.forEach(p => setLesson(p, FALLBACK));
        isFlushing = false;
        return;
      }
      chrome.runtime.sendMessage({ type: "FETCH_LESSONS", count: toFill.length }, response => {
        isFlushing = false;
        if (chrome.runtime.lastError) {
          console.warn("MicroLearn:", chrome.runtime.lastError.message);
          toFill.forEach(p => setLesson(p, FALLBACK));
        } else {
          const lessons = response?.lessons ?? [];
          toFill.forEach((p, i) => setLesson(p, lessons[i] ?? FALLBACK));
        }
        if (pending.length) scheduleFlush();
      });
    } catch (err) {
      isFlushing = false;
      console.warn("MicroLearn: context invalidated —", err.message);
      toFill.forEach(p => setLesson(p, FALLBACK));
    }
  }

  function scheduleFlush() {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 300);
  }

  // ── Ad Detection ──────────────────────────────────────
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

  function scanAndReplaceAds() {
    if (!isExtensionAlive()) return;

    const candidates = document.querySelectorAll(AD_SELECTORS);
    const newAds = [];

    candidates.forEach(ad => {
      if (ad.hasAttribute(PROCESSED_ATTR)) return;
      const rect = ad.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 50) return;
      newAds.push({ el: ad, rect });
    });

    if (!newAds.length) return;

    observer?.disconnect();

    newAds.forEach(({ el, rect }) => {
      const placeholder = createPlaceholder(rect.width, rect.height);
      placeholder.setAttribute(PROCESSED_ATTR, "true");
      el.replaceWith(placeholder);
      pending.push(placeholder);
    });

    if (observer) observer.observe(document.body, { childList: true, subtree: true });
    scheduleFlush();
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
    clearTimeout(flushTimer);
    flushTimer = null;
    location.reload();
  }

  // ── Init ──────────────────────────────────────────────
  chrome.storage.sync.get("enabled", ({ enabled }) => {
    if (enabled !== false) enableMicroLearn();
  });

  chrome.storage.onChanged.addListener(changes => {
    if ("enabled" in changes)
      changes.enabled.newValue ? enableMicroLearn() : disableMicroLearn();

    if ("adContainerPattern" in changes) {
      activePattern = changes.adContainerPattern.newValue || null;
      refreshAllPatterns();
    }
  });

})();