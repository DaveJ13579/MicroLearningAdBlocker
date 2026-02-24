(function () {

  const PROCESSED_ATTR = "data-microlearn-replaced";
  const FALLBACK       = "💡 Stay curious — ask questions every day.";

  const PATTERN_FILES = {
    "green-dots":   "images/green dots.png",
    "confetti":     "images/pink confetti.png",
    "orange-waves": "images/orange waves.png",
    "flowers":      "images/flowers.png"
  };

  let pending      = [];
  let isFlushing   = false;
  let flushTimer   = null;
  let observer     = null;
  let pollInterval = null;
  let activePattern = null; // currently loaded pattern id

  // ── Load pattern from storage ─────────────────────────
  function loadPattern(callback) {
    chrome.storage.sync.get("adContainerPattern", ({ adContainerPattern }) => {
      activePattern = adContainerPattern || null;
      if (callback) callback();
    });
  }

  // Resolve a chrome-extension:// URL for a pattern image
  function patternURL(patternId) {
    const file = PATTERN_FILES[patternId];
    if (!file) return null;
    return chrome.runtime.getURL(file);
  }

  // Apply (or remove) background pattern on a placeholder element
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

  // ── Placeholder ───────────────────────────────────────
  function createPlaceholder(width, height) {
    const el = document.createElement("div");
    el.className = "microlearn-placeholder";
    if (width)  el.style.width  = width  + "px";
    if (height) el.style.height = height + "px";
    el.innerHTML =
      '<div class="microlearn-header">MicroLearn</div>' +
      '<div class="microlearn-topic microlearn-loading">Loading...</div>' +
      '<div class="microlearn-body microlearn-loading">Loading…</div>';
    applyPattern(el, activePattern);
    return el;
  }

  function setLesson(placeholder, lessonData) {
    const topicEl = placeholder.querySelector(".microlearn-topic");
    const bodyEl  = placeholder.querySelector(".microlearn-body");
    if (!bodyEl) return;

    const text  = lessonData?.text  ?? (typeof lessonData === "string" ? lessonData : null) ?? FALLBACK;
    const topic = lessonData?.topic ?? null;

    if (topic && topicEl) {
      topicEl.textContent = topic;
      topicEl.classList.remove("microlearn-loading");
    } else if (topicEl) {
      topicEl.style.display = "none";
    }

    bodyEl.textContent = text;
    bodyEl.classList.remove("microlearn-loading");

    setTimeout(() => {
      if (bodyEl.scrollHeight > bodyEl.clientHeight) {
        bodyEl.title  = text;
        bodyEl.style.cursor = "help";
      }
    }, 10);
  }

  // ── Re-apply pattern to all existing placeholders ─────
  function refreshAllPatterns() {
    document.querySelectorAll(".microlearn-placeholder").forEach(el => {
      applyPattern(el, activePattern);
    });
  }

  // ── Batching ──────────────────────────────────────────
  function flush() {
    flushTimer = null;
    if (isFlushing)          { flushTimer = setTimeout(flush, 200); return; }
    if (!pending.length) return;

    const toFill = pending.splice(0);
    isFlushing   = true;

    try {
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
    if ("enabled" in changes) {
      changes.enabled.newValue ? enableMicroLearn() : disableMicroLearn();
    }
    // Live-update pattern if it changes while page is open
    if ("adContainerPattern" in changes) {
      activePattern = changes.adContainerPattern.newValue || null;
      refreshAllPatterns();
    }
  });

})();