(function () {

  const PROCESSED_ATTR = "data-microlearn-replaced";
  const FALLBACK       = "Stay curious — ask questions every day.";

  let pending       = [];
  let isFlushing    = false;
  let flushTimer    = null;
  let observer      = null;
  let pollInterval  = null;
  let activePattern = null;

  // Amanda's rotating background images — used when no user pattern is selected
  const BG_IMAGES = [
    "images/northern-lights.png",
    "images/warm-gradient.jpg",
    "images/moonlight-snow.jpg",
    "images/sunset-cliffs.jpg",
    "images/alpine-reflection.jpg"
  ];
  let bgIndex = Math.floor(Math.random() * BG_IMAGES.length);

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
    "PinkBlueSwirl":      "images/PinkBlueSwirl.jpg",
    "flowers":            "images/flowers.png"
  };

  // ── Load pattern from storage ─────────────────────────
  function loadPattern(callback) {
    chrome.storage.sync.get("adContainerPattern", ({ adContainerPattern }) => {
      activePattern = adContainerPattern || null;
      if (callback) callback();
    });
  }

  // Returns the URL for the next placeholder background.
  // Priority: user-selected pattern → rotating landscape images.
  function getNextBgURL() {
    if (activePattern && PATTERN_FILES[activePattern] && isExtensionAlive()) {
      try { return chrome.runtime.getURL(PATTERN_FILES[activePattern]); } catch (e) {}
    }
    try {
      const url = chrome.runtime.getURL(BG_IMAGES[bgIndex % BG_IMAGES.length]);
      bgIndex++;
      return url;
    } catch (e) {
      return null;
    }
  }

  // Re-apply the user-selected pattern to all existing placeholders.
  // Only runs when activePattern is set — rotating images stay as-is.
  function refreshAllPatterns() {
    if (!activePattern) return;
    const splashFile = PATTERN_FILES[activePattern];
    const url = (splashFile && isExtensionAlive()) ? chrome.runtime.getURL(splashFile) : null;
    if (!url) return;
    document.querySelectorAll(".microlearn-placeholder").forEach(el => {
      el.style.backgroundImage    = `url("${url}")`;
      el.style.backgroundSize     = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat   = "no-repeat";
    });
  }

  // ── Splash Animation ──────────────────────────────────
  const SPLASH_MS      = 3000;
  const SPLASH_FADE_MS = 700;

  function createPlaceholder(width, height) {
    const el = document.createElement("div");
    el.className = "microlearn-placeholder ml-has-splash";
    if (width  > 0) el.style.width  = width  + "px";
    if (height > 0) el.style.height = height + "px";
    if (width > 0 && height > 0) {
      const ratio = width / height;
      if (ratio >= 3)        el.classList.add("ml-banner"); // wide-short (leaderboard/banner)
      else if (ratio <= 0.5) el.classList.add("ml-tall");   // narrow-tall (skyscraper)
    }

    const url = getNextBgURL();

    if (url) {
      el.style.backgroundImage    = `url("${url}")`;
      el.style.backgroundSize     = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat   = "no-repeat";
    }

    // Fallback: no URL → simple card with no animation.
    if (!url) {
      el.innerHTML = `
        <div class="ml-content">
          <div class="ml-header-row">
            <span class="microlearn-brand">MicroLearn</span>
            <span class="ml-header-sep">|</span>
            <span class="microlearn-topic microlearn-loading">Loading...</span>
          </div>
          <div class="microlearn-headline microlearn-loading">Loading...</div>
          <div class="microlearn-tagline"></div>
        </div>`;
      return el;
    }

    // Get logo URL
    let logoUrl = null;
    try {
      if (isExtensionAlive()) logoUrl = chrome.runtime.getURL("images/logo 5.1.png");
    } catch (e) { /* ignore */ }

    el.innerHTML = `
      <div class="ml-splash" aria-hidden="true">
        <img class="ml-splash-img" src="${url}" alt="" />
        ${logoUrl ? `<img class="ml-splash-logo" src="${logoUrl}" alt="MicroLearn" />` : ""}
      </div>
      <div class="ml-content ml-hidden">
        <div class="ml-header-row">
          <span class="microlearn-brand">MicroLearn</span>
          <span class="ml-header-sep">|</span>
          <span class="microlearn-topic microlearn-loading">Loading...</span>
        </div>
        <div class="microlearn-headline microlearn-loading">Loading...</div>
        <div class="microlearn-tagline"></div>
      </div>
      <button class="microlearn-prev" title="Previous lesson" disabled>&#8249;</button>
      <button class="microlearn-next" title="Next lesson">&#8250;</button>`;

    const splash  = el.querySelector(".ml-splash");
    const content = el.querySelector(".ml-content");

    if (content) content.classList.add("ml-hidden");

    // After SPLASH_MS, fade out the splash overlay and reveal the lesson.
    // The background image stays on the card itself the whole time.
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

  function setLesson(placeholder, lessonData, pushToHistory = true) {
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

    // Parse HEADLINE/TAGLINE format from Amanda
    const headlineMatch = text.match(/HEADLINE:\s*(.+?)(?:\s*TAGLINE:|\s*$)/i);
    const taglineMatch  = text.match(/TAGLINE:\s*(.+)/i);

    if (headlineMatch && taglineMatch) {
      headlineEl.textContent = headlineMatch[1].trim();
      if (taglineEl) taglineEl.textContent = taglineMatch[1].trim();
    } else {
      headlineEl.textContent = text;
      if (taglineEl) taglineEl.style.display = "none";
    }

    headlineEl.classList.remove("microlearn-loading");

    // Force centering (page CSS can override class-based rules)
    headlineEl.style.setProperty("text-align", "center", "important");
    if (taglineEl) taglineEl.style.setProperty("text-align", "center", "important");

    setTimeout(() => {
      if (headlineEl.scrollHeight > headlineEl.clientHeight) {
        headlineEl.title        = headlineEl.textContent;
        headlineEl.style.cursor = "help";
      }
    }, 10);

    // ── History tracking ──────────────────────────────
    if (!placeholder._mlHistory) placeholder._mlHistory = [];
    if (!("_mlHistIdx" in placeholder)) placeholder._mlHistIdx = -1;

    if (pushToHistory) {
      // Trim any forward entries if navigating from a mid-history position
      placeholder._mlHistory = placeholder._mlHistory.slice(0, placeholder._mlHistIdx + 1);
      placeholder._mlHistory.push(lessonData);
      placeholder._mlHistIdx = placeholder._mlHistory.length - 1;

      // Only track views for new (forward) lessons
      if (topic && isExtensionAlive()) {
        try {
          chrome.runtime.sendMessage({ type: "LESSON_VIEWED", topic });
        } catch (e) { /* extension context may be gone */ }
      }
    }

    // Show/hide prev button based on history position
    const prevBtn = placeholder.querySelector(".microlearn-prev");
    if (prevBtn) prevBtn.disabled = placeholder._mlHistIdx <= 0;

    // ── Prev button handler ───────────────────────────
    if (prevBtn && !prevBtn._mlBound) {
      prevBtn._mlBound = true;
      prevBtn.addEventListener("click", () => {
        if (placeholder._mlHistIdx <= 0) return;
        placeholder._mlHistIdx--;
        const lesson = placeholder._mlHistory[placeholder._mlHistIdx];
        if (taglineEl) taglineEl.style.display = "";
        setLesson(placeholder, lesson, false);
      });
    }

    // ── Next button handler ───────────────────────────
    const nextBtn = placeholder.querySelector(".microlearn-next");
    if (nextBtn && !nextBtn._mlBound) {
      nextBtn._mlBound = true;
      nextBtn.addEventListener("click", () => {
        // If there are forward entries in history, use them without fetching
        if (placeholder._mlHistIdx < placeholder._mlHistory.length - 1) {
          placeholder._mlHistIdx++;
          const lesson = placeholder._mlHistory[placeholder._mlHistIdx];
          if (taglineEl) taglineEl.style.display = "";
          setLesson(placeholder, lesson, false);
          return;
        }
        // Otherwise fetch a new lesson
        if (!isExtensionAlive()) return;
        try {
          chrome.runtime.sendMessage({ type: "FETCH_LESSONS", count: 1 }, response => {
            if (chrome.runtime.lastError) return;
            const lesson = response?.lessons?.[0];
            if (lesson) {
              if (taglineEl) taglineEl.style.display = "";
              setLesson(placeholder, lesson);
            }
          });
        } catch (e) { /* extension context may be gone */ }
      });
    }
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
    // ── General ───────────────────────────────────────
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
    'div[data-testid="text-ads-container"]',

    // ── YouTube ───────────────────────────────────────
    "ytd-promoted-sparkles-web-renderer",  // in-feed sponsored cards
    "ytd-promoted-video-renderer",         // promoted video results
    "ytd-ad-slot-renderer",                // general ad slot container
    "ytd-banner-promo-renderer",           // banner promos
    "ytd-statement-banner-renderer",       // statement banners
    "#masthead-ad",                        // top masthead ad
    "ytd-in-feed-ad-layout-renderer",      // in-feed ad layout
    '#panels ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]'
  ].join(", ");

  // ── YouTube: hide non-replaceable ad types ────────────
  // Pre-roll and overlay ads can't be replaced cleanly so we hide them.
  const YT_HIDE_SELECTORS = [
    ".ytp-ad-overlay-container",    // overlay ads on video
    ".ytp-ad-text-overlay",         // text overlays on video
    ".ytp-ad-skip-button-container" // skip button (pre-roll remnant)
  ].join(", ");

  function hideYouTubeVideoAds() {
    document.querySelectorAll(YT_HIDE_SELECTORS).forEach(el => {
      if (!el.hasAttribute(PROCESSED_ATTR)) {
        el.style.display = "none";
        el.setAttribute(PROCESSED_ATTR, "true");
      }
    });
  }

  // offsetWidth/offsetHeight are preferred: they reflect actual layout space,
  // are unaffected by transforms, and don't shift with scroll position.
  function measureAd(el) {
    let w = el.offsetWidth;
    let h = el.offsetHeight;

    if (!w || !h) {
      const cs = window.getComputedStyle(el);
      w = w || parseInt(cs.width,  10) || 0;
      h = h || parseInt(cs.height, 10) || 0;
    }

    return { w, h };
  }

  function scanAndReplaceAds() {
    if (!isExtensionAlive()) return;

    // Hide video overlay ads that can't be replaced with cards
    hideYouTubeVideoAds();

    const candidates = document.querySelectorAll(AD_SELECTORS);
    const newAds = [];

    candidates.forEach(ad => {
      if (ad.hasAttribute(PROCESSED_ATTR)) return;
      const { w, h } = measureAd(ad);
      if (w < 50 || h < 50) return;
      newAds.push({ el: ad, w, h });
    });

    if (!newAds.length) return;

    observer?.disconnect();

    newAds.forEach(({ el, w, h }) => {
      const parent = el.parentElement;

      // Snapshot parent's current children BEFORE replacement so we can detect
      // siblings injected by ad scripts after the placeholder is in place.
      const priorSiblings = parent ? new Set(parent.children) : null;

      const placeholder = createPlaceholder(w, h);
      placeholder.setAttribute(PROCESSED_ATTR, "true");
      el.replaceWith(placeholder);
      pending.push(placeholder);

      // Guard 1: prevent ad scripts from injecting INTO our placeholder.
      const ownChildren = new Set(placeholder.children);
      const innerGuard = new MutationObserver(mutations => {
        mutations.forEach(m => {
          m.addedNodes.forEach(node => {
            if (node.nodeType === 1 && !ownChildren.has(node)) node.remove();
          });
        });
      });
      innerGuard.observe(placeholder, { childList: true });

      // Guard 2: prevent ad scripts from injecting positioned overlays or new
      // ad elements as SIBLINGS after replacement.
      if (parent) {
        priorSiblings.add(placeholder);
        const siblingGuard = new MutationObserver(mutations => {
          mutations.forEach(m => {
            m.addedNodes.forEach(node => {
              if (node.nodeType !== 1 || priorSiblings.has(node)) return;
              const pos = node.style?.position;
              if (pos === "absolute" || pos === "fixed") { node.remove(); return; }
              // Block ad scripts re-injecting a new ad element in the same slot.
              // Replace with a MicroLearn card instead of just removing.
              try { if (node.matches(AD_SELECTORS)) { setTimeout(scanAndReplaceAds, 100); return; } } catch (e) {}
              setTimeout(() => {
                if (!node.isConnected) return;
                try { if (node.matches(AD_SELECTORS)) { setTimeout(scanAndReplaceAds, 50); return; } } catch (e) {}
                if (node.querySelector("[style*='z-index']")) node.remove();
              }, 150);
            });
          });
        });
        siblingGuard.observe(parent, { childList: true });
      }

      // Guard 3: scroll-back re-injection via IntersectionObserver + elementsFromPoint.
      const scrollbackGuard = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const r  = entry.boundingClientRect;
          const cx = r.left + r.width  / 2;
          const cy = r.top  + r.height / 2;
          document.elementsFromPoint(cx, cy).forEach(hit => {
            if (hit === placeholder || placeholder.contains(hit) || hit.contains(placeholder)) return;
            if (hit === document.documentElement || hit === document.body) return;
            const cs = window.getComputedStyle(hit);
            if (
              (cs.position === "absolute" || cs.position === "fixed") &&
              parseInt(cs.zIndex, 10) > 1000
            ) {
              hit.remove();
            }
          });
        });
      });
      scrollbackGuard.observe(placeholder);

      // Guard 4: placeholder removal — re-scan after 50ms if our node is removed.
      if (parent) {
        const removalGuard = new MutationObserver(mutations => {
          for (const m of mutations) {
            for (const node of m.removedNodes) {
              if (node === placeholder) {
                removalGuard.disconnect();
                setTimeout(scanAndReplaceAds, 50);
                return;
              }
            }
          }
        });
        removalGuard.observe(parent, { childList: true });
      }

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
    // Live-update pattern if it changes while page is open
    if ("adContainerPattern" in changes) {
      activePattern = changes.adContainerPattern.newValue || null;
      refreshAllPatterns();
    }
  });

})();
