(function () {

  // ══════════════════════════════════════════════════════════════════════════════
  // CONSTANTS
  // ══════════════════════════════════════════════════════════════════════════════

  const PROCESSED_ATTR = "data-microlearn-replaced";
  const FALLBACK = "💡 Stay curious — ask questions every day.";

  const SPLASH_MS = 4000;
  const LOGO_PATH = "images/logo2.png";

  // ══════════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════════

  let pending = [];
  let isFlushing = false;
  let flushTimer = null;
  let observer = null;
  let pollInterval = null;

  // ══════════════════════════════════════════════════════════════════════════════
  // PLACEHOLDER CREATION & UPDATES
  // ══════════════════════════════════════════════════════════════════════════════

 function createPlaceholder(width, height) {
    const wrapper = document.createElement("div");
    wrapper.className = "microlearn-placeholder";
    if (width) wrapper.style.width = width + "px";
    if (height) wrapper.style.height = height + "px";

    const logoUrl = chrome.runtime.getURL(LOGO_PATH);

   wrapper.innerHTML = `
      <div class="ml-splash" aria-hidden="true">
        <div class="ml-splash-inner">
          <div class="ml-splash-logoWrap">
            <img class="ml-splash-logo" src="${logoUrl}" alt="MicroLearn" />
          </div>
        </div>
      </div>

      <div class="ml-content ml-hidden">
        <div class="microlearn-header">MicroLearn</div>
        <div class="microlearn-topic microlearn-loading">Loading...</div>
        <div class="microlearn-body microlearn-loading"></div>
      </div>
    `;

    const splash = wrapper.querySelector(".ml-splash");
    const content = wrapper.querySelector(".ml-content");

    // Hard hide content until splash ends
    if (content) content.classList.add("ml-hidden");

    setTimeout(() => {
      if (splash) splash.classList.add("ml-hidden");
      if (content) content.classList.remove("ml-hidden");
    }, SPLASH_MS);

    return wrapper;
  }

  function setLesson(placeholder, lessonData) {
    const topicEl = placeholder.querySelector(".microlearn-topic");
    const bodyEl = placeholder.querySelector(".microlearn-body");
    
    if (!bodyEl) {
      console.warn("MicroLearn: bodyEl missing on placeholder");
      return;
    }
    
    let text, topic;
    if (typeof lessonData === 'string') {
      text = lessonData;
      topic = null;
    } else if (lessonData && typeof lessonData === 'object') {
      text = lessonData.text;
      topic = lessonData.topic;
    } else {
      text = FALLBACK;
      topic = null;
    }
    
    console.log("MicroLearn: setting lesson ->", (text || FALLBACK).slice(0, 40));
    
    if (topic && topicEl) {
      topicEl.textContent = topic;
      topicEl.classList.remove("microlearn-loading");
    } else if (topicEl) {
      topicEl.style.display = "none";
    }
    
    bodyEl.textContent = text || FALLBACK;
    bodyEl.classList.remove("microlearn-loading");
    
    // Add tooltip if text is truncated
    setTimeout(() => {
      if (bodyEl.scrollHeight > bodyEl.clientHeight) {
        bodyEl.title = text || FALLBACK;
        bodyEl.style.cursor = "help";
      }
    }, 10);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // BATCHING & API CALLS
  // ══════════════════════════════════════════════════════════════════════════════

  function flush() {
    flushTimer = null;

    if (isFlushing) {
      flushTimer = setTimeout(flush, 300);
      return;
    }

    if (pending.length === 0) return;

    const toFill = pending.splice(0);
    isFlushing = true;

    try {
      chrome.runtime.sendMessage(
        { type: "FETCH_LESSONS", count: toFill.length },
        (response) => {
          isFlushing = false;

          if (chrome.runtime.lastError) {
            console.warn("MicroLearn:", chrome.runtime.lastError.message);
            toFill.forEach((p) => setLesson(p, FALLBACK));
            if (pending.length > 0) scheduleFlush();
            return;
          }

          const lessons = (response && response.lessons) ? response.lessons : [];
          toFill.forEach((p, i) => setLesson(p, lessons[i] || FALLBACK));

          if (pending.length > 0) scheduleFlush();
        }
      );
    } catch (err) {
      isFlushing = false;
      console.warn("MicroLearn: context invalidated, refresh the page.", err.message);
      toFill.forEach((p) => setLesson(p, FALLBACK));
    }
  }

  function scheduleFlush() {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 300);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // AD DETECTION & REPLACEMENT
  // ══════════════════════════════════════════════════════════════════════════════

  function findNewAds() {
    const candidates = document.querySelectorAll(
      '.ad-slot, ' +
      '[data-ad-label-text="Advertisement"], ' +
      '[data-desktop-slot-id], ' +
      'iframe[id^="google_ads_iframe"], ' +
      'gwd-google-ad, ' +
      '#ad, ' +
      'iframe[id^="ape_"], ' +
      'div.uitk-layout-grid:has(a[href*="doubleclick.net"]), ' +
      'div.uitk-layout-grid:has(a[href*="adform.net"]), ' +
      'div.uitk-card:has(a.uitk-card-link[href*="one-key-cards"]), ' +
      '.ad-slot-header, ' +
      '[data-ssp="pbm"], ' +
      '[id^="bx-campaign-"]'
  );

    const newAds = [];
    candidates.forEach((ad) => {
      if (ad.hasAttribute(PROCESSED_ATTR)) return;
      const rect = ad.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 50) return;
      newAds.push({ el: ad, rect: rect });
    });

    return newAds;
  }

  function scanAndReplaceAds() {
    const newAds = findNewAds();
    if (newAds.length === 0) return;

    if (observer) observer.disconnect();

    newAds.forEach(({ el, rect }) => {
      const placeholder = createPlaceholder(rect.width, rect.height);
      placeholder.setAttribute(PROCESSED_ATTR, "true");
      el.replaceWith(placeholder);
      pending.push(placeholder);
    });

    if (observer) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    scheduleFlush();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ENABLE/DISABLE
  // ══════════════════════════════════════════════════════════════════════════════

  function enableMicroLearn() {
    scanAndReplaceAds();
    observer = new MutationObserver(() => scanAndReplaceAds());
    observer.observe(document.body, { childList: true, subtree: true });
    pollInterval = setInterval(scanAndReplaceAds, 2000);
  }

  function disableMicroLearn() {
    if (observer) observer.disconnect();
    observer = null;
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = null;
    clearTimeout(flushTimer);
    flushTimer = null;
    location.reload();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════════════════════════════════════════════

  chrome.storage.sync.get(["enabled"], (result) => {
    if (result.enabled !== false) enableMicroLearn();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if ("enabled" in changes) {
      changes.enabled.newValue ? enableMicroLearn() : disableMicroLearn();
    }
  });

})();