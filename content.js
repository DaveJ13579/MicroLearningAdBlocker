(function () {

  const PROCESSED_ATTR = "data-microlearn-replaced";
  const FALLBACK       = "Stay curious — ask questions every day.";

  let pending       = [];
  let isFlushing    = false;
  let flushTimer    = null;
  let observer      = null;
  let pollInterval  = null;

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

  function getNextBgURL() {
    try {
      const url = chrome.runtime.getURL(BG_IMAGES[bgIndex % BG_IMAGES.length]);
      bgIndex++;
      return url;
    } catch (e) {
      return null;
    }
  }

  // ── Splash Animation ──────────────────────────────────
  const SPLASH_MS      = 3000;
  const SPLASH_FADE_MS = 700;

  function createPlaceholder(width, height) {
    const el = document.createElement("div");
    el.className = "microlearn-placeholder ml-has-splash";
    // Width/height are set by the wrapper; we only use them for layout classification.
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

    el.innerHTML = `
      <div class="ml-splash" aria-hidden="true">
        <img class="ml-splash-img" src="${url}" alt="" />
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

    // ── Reddit ────────────────────────────────────────
    "shreddit-ad-post",                    // Reddit's custom ad post element
    ":has(> a[href*='alb.reddit.com'])",   // ad overlay link (Reddit's ad domain)

    // ── CNN ──────────────────────────────────────────
    '[data-component-name="video-player"][data-show-ads="true"]', // CNN video player with ads enabled

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

  // Prefer declared dimensions (stable across reloads) over layout-measured
  // dimensions (which vary depending on when/how the page has rendered).
  function measureAd(el) {
    // 1. Inline style px values — most reliable for ad divs with explicit sizing
    if (el.style.width && el.style.height) {
      const sw = parseFloat(el.style.width);
      const sh = parseFloat(el.style.height);
      if (sw > 0 && sh > 0 && el.style.width.endsWith("px") && el.style.height.endsWith("px")) {
        return { w: sw, h: sh };
      }
    }

    // 2. HTML width/height attributes — iframes and legacy img ad tags
    const aw = parseInt(el.getAttribute("width"),  10);
    const ah = parseInt(el.getAttribute("height"), 10);
    if (aw > 0 && ah > 0) return { w: aw, h: ah };

    // 3. Measured layout dimensions — last resort (varies with render timing)
    let w = el.offsetWidth;
    let h = el.offsetHeight;
    if (!w || !h) {
      const cs = window.getComputedStyle(el);
      w = w || parseInt(cs.width,  10) || 0;
      h = h || parseInt(cs.height, 10) || 0;
    }
    return { w, h };
  }

  // ── Heuristic Ad Detection ────────────────────────────
  // Runs AFTER selector-based scan as a fallback layer.
  // Scores each unprocessed element on behavioral signals
  // rather than relying on class/attribute names.

  // IAB standard ad sizes [width, height] with ±5px tolerance
  const IAB_SIZES = [
    [728, 90], [970, 90], [970, 250], [320, 50], [320, 100],
    [300, 250], [300, 600], [300, 50], [160, 600], [120, 600],
    [250, 250], [200, 200], [468, 60], [336, 280], [580, 400]
  ];
  const SIZE_TOLERANCE = 5;

  // Words that survive most CSS class renames — they appear in ids,
  // data-attributes, aria-labels, or ancestor containers.
  const AD_KEYWORDS = [
    "advertisement", "advertising", "sponsored", "sponsor",
    "promo", "promotion", "promoted", "banner", "leaderboard", "skyscraper",
    "dfp", "gpt", "prebid", "pubads", "adsense", "doubleclick",
    "adslot", "ad-slot", "adunit", "ad-unit", "adzone", "ad-zone",
    "adcontainer", "ad-container", "adwrapper", "ad-wrapper",
    // ── Reddit ────────────────────────────────────────────
    "shreddit"  // Reddit web component prefix (e.g. shreddit-ad-post)
  ];

  function isIABSize(w, h) {
    return IAB_SIZES.some(([iw, ih]) =>
      Math.abs(w - iw) <= SIZE_TOLERANCE &&
      Math.abs(h - ih) <= SIZE_TOLERANCE
    );
  }

  function hasAdKeyword(el) {
    // Check id, class, and all data-* attributes on the element itself
    const haystack = [
      el.id,
      el.className,
      el.getAttribute("aria-label") || "",
      el.getAttribute("title") || "",
      ...Array.from(el.attributes)
           .filter(a => a.name.startsWith("data-"))
           .map(a => a.name + " " + a.value)
    ].join(" ").toLowerCase().replace(/[-_]/g, "");

    return AD_KEYWORDS.some(kw => haystack.includes(kw.replace(/[-_]/g, "")));
  }

  function isEmptyShell(el) {
    // Ad containers are typically empty or contain only iframes/scripts/ins
    const text = (el.innerText || "").trim();
    if (text.length > 80) return false; // has real text content

    const children = [...el.children];
    if (children.length === 0) return true; // completely empty

    const adChildTags = new Set(["IFRAME", "SCRIPT", "INS", "NOSCRIPT"]);
    return children.every(c => adChildTags.has(c.tagName));
  }

  function isInContentArea(el) {
    // If the element is inside article/main/[role=main] it's likely content, not an ad
    let node = el.parentElement;
    while (node && node !== document.body) {
      const tag  = node.tagName?.toLowerCase();
      const role = node.getAttribute("role");
      if (tag === "article" || tag === "main" || role === "main" || role === "article") {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function scoreElement(el, w, h) {
    let score = 0;

    // Signal 1: IAB standard size — strongest signal (2 points)
    if (isIABSize(w, h)) score += 2;

    // Signal 2: ad keyword in attributes — strong (2 points)
    if (hasAdKeyword(el)) score += 2;

    // Signal 3: empty shell or iframe/script-only content (1 point)
    if (isEmptyShell(el)) score += 1;

    // Signal 4: inside article/main content — penalise (-2 points)
    if (isInContentArea(el)) score -= 2;

    // Signal 5: element is an <ins> tag (Google AdSense standard) (2 points)
    if (el.tagName === "INS") score += 2;

    // Signal 6: contains a cross-origin iframe (common ad delivery) (1 point)
    const iframe = el.querySelector("iframe");
    if (iframe) {
      try {
        const src = iframe.src || "";
        if (src && !src.startsWith(location.origin)) score += 1;
      } catch (e) {}
    }

    return score;
  }

  // Threshold: score must be >= this to be treated as an ad.
  // 3 means at least two strong signals must agree.
  const HEURISTIC_THRESHOLD = 3;

  // Candidate tags — we only score block-level containers, not inline elements.
  const HEURISTIC_TAGS = "div, section, aside, ins, figure";

  function scanHeuristicAds() {
    if (!isExtensionAlive()) return;

    const candidates = document.querySelectorAll(HEURISTIC_TAGS);
    const newAds = [];

    candidates.forEach(el => {
      if (el.hasAttribute(PROCESSED_ATTR)) return;

      const { w, h } = measureAd(el);
      if (w < 50 || h < 50) return; // too small to be an ad

      const score = scoreElement(el, w, h);
      if (score >= HEURISTIC_THRESHOLD) {
        newAds.push({ el, w, h });
      }
    });

    if (!newAds.length) return;

    // Reuse the same replacement logic as selector-based detection
    observer?.disconnect();

    newAds.forEach(({ el, w, h }) => replaceWithPlaceholder(el, w, h));

    if (observer) observer.observe(document.body, { childList: true, subtree: true });
    scheduleFlush();
  }

  function scanAndReplaceAds() {
    if (!isExtensionAlive()) return;

    hideYouTubeVideoAds();

    // Pass 1: fast, precise — known selectors
    const candidates = document.querySelectorAll(AD_SELECTORS);
    const newAds = [];

    candidates.forEach(ad => {
      if (ad.hasAttribute(PROCESSED_ATTR)) return;
      const { w, h } = measureAd(ad);
      if (w < 50 || h < 50) return;
      newAds.push({ el: ad, w, h });
    });

    if (newAds.length) {
      observer?.disconnect();
      newAds.forEach(({ el, w, h }) => replaceWithPlaceholder(el, w, h));
      if (observer) observer.observe(document.body, { childList: true, subtree: true });
      scheduleFlush();
    }

    // Pass 2: heuristic — catches renamed/unknown ad structures
    scanHeuristicAds();
  }

  function replaceWithPlaceholder(el, w, h) {
    const parent = el.parentElement;

    // ── Get exact rendered dimensions ────────────────────
    // getBoundingClientRect() is called while the original element is still in
    // the DOM with its ad content, giving us the true visual size regardless of
    // how the element was sized (inline style, CSS class, content-driven, etc.).
    // Fall back to the pre-measured w/h if the rect is zero for some reason.
    const rect   = el.getBoundingClientRect();
    const finalW = Math.round(rect.width)  || w;
    const finalH = Math.round(rect.height) || h;
    if (finalW < 50 || finalH < 50) return;

    // Read layout-flow properties before the element leaves the DOM
    const cs = window.getComputedStyle(el);

    // ── Build a clean wrapper div ─────────────────────────
    // We ALWAYS replace with a fresh div — no inherited CSS classes, no site
    // styles that could fight our sizing. The wrapper gets explicit pixel
    // dimensions so it is identical in size to the original ad on every load.
    //
    // Width strategy: ads with an explicit inline/attribute width (e.g. 728x90,
    // 300x250) get a fixed pixel width — they're always measured accurately.
    // Ads sized by CSS or parent layout (e.g. full-width banners, CNN video
    // players, Reddit posts) get width:100% so the wrapper always fills the
    // slot regardless of when the scan ran relative to page layout completion.
    const hasExplicitWidth = (el.style.width && el.style.width.endsWith("px"))
                          || el.getAttribute("width");
    const wrapper = document.createElement("div");
    wrapper.setAttribute(PROCESSED_ATTR, "true");
    wrapper.style.width     = hasExplicitWidth ? finalW + "px" : "100%";
    wrapper.style.height    = finalH + "px";
    wrapper.style.overflow  = "hidden";
    wrapper.style.position  = "relative"; // containing block for absolute placeholder
    wrapper.style.boxSizing = "border-box";
    wrapper.style.flexShrink = "0";       // prevent flex parents from compressing it

    // Copy layout-flow properties so the wrapper sits in the same slot
    const disp = cs.display;
    wrapper.style.display = (!disp || disp === "none") ? "block"
                          : (disp === "inline" || disp === "inline-block") ? "inline-block"
                          : disp;
    if (cs.float && cs.float !== "none")   wrapper.style.float = cs.float;
    if (cs.margin && cs.margin !== "0px") wrapper.style.margin = cs.margin;
    if (cs.flexGrow   && cs.flexGrow   !== "0")    wrapper.style.flexGrow   = cs.flexGrow;
    if (cs.flexBasis  && cs.flexBasis  !== "auto") wrapper.style.flexBasis  = cs.flexBasis;
    if (cs.gridArea   && cs.gridArea   !== "auto / auto / auto / auto") wrapper.style.gridArea   = cs.gridArea;
    if (cs.alignSelf  && cs.alignSelf  !== "auto") wrapper.style.alignSelf  = cs.alignSelf;
    if (cs.justifySelf && cs.justifySelf !== "auto") wrapper.style.justifySelf = cs.justifySelf;
    if (cs.position === "absolute" || cs.position === "fixed") {
      wrapper.style.position = cs.position;
      if (cs.top    !== "auto") wrapper.style.top    = cs.top;
      if (cs.left   !== "auto") wrapper.style.left   = cs.left;
      if (cs.right  !== "auto") wrapper.style.right  = cs.right;
      if (cs.bottom !== "auto") wrapper.style.bottom = cs.bottom;
      if (cs.zIndex !== "auto") wrapper.style.zIndex = cs.zIndex;
    }

    el.replaceWith(wrapper);

    // ── Insert MicroLearn card ────────────────────────────
    // position:absolute + inset:0 fills the wrapper exactly — immune to
    // padding, display type, and host height-resolution issues.
    const placeholder = createPlaceholder(finalW, finalH);
    placeholder.style.position = "absolute";
    placeholder.style.inset    = "0";
    wrapper.appendChild(placeholder);
    pending.push(placeholder);

    const priorSiblings = parent ? new Set(parent.children) : null;

    // Guard 1: block ad scripts re-injecting content into the wrapper
    const innerGuard = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node === placeholder || node.nodeType !== 1) return;
          node.remove();
        });
      });
    });
    innerGuard.observe(wrapper, { childList: true });

    // Guard 2: block sibling injection / re-injection
    if (parent && priorSiblings) {
      priorSiblings.add(wrapper);
      const siblingGuard = new MutationObserver(mutations => {
        mutations.forEach(m => {
          m.addedNodes.forEach(node => {
            if (node.nodeType !== 1 || priorSiblings.has(node)) return;
            const pos = node.style?.position;
            if (pos === "absolute" || pos === "fixed") { node.remove(); return; }
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

    // Guard 3: scroll-back overlay detection
    const scrollbackGuard = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const r  = entry.boundingClientRect;
        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;
        document.elementsFromPoint(cx, cy).forEach(hit => {
          if (hit === wrapper || wrapper.contains(hit) || hit.contains(wrapper)) return;
          if (hit === document.documentElement || hit === document.body) return;
          const hcs = window.getComputedStyle(hit);
          if (
            (hcs.position === "absolute" || hcs.position === "fixed") &&
            parseInt(hcs.zIndex, 10) > 1000
          ) hit.remove();
        });
      });
    });
    scrollbackGuard.observe(wrapper);

    // Guard 4: re-scan if the wrapper is removed from the DOM
    if (parent) {
      const removalGuard = new MutationObserver(mutations => {
        for (const m of mutations) {
          for (const node of m.removedNodes) {
            if (node === wrapper) {
              removalGuard.disconnect();
              setTimeout(scanAndReplaceAds, 50);
              return;
            }
          }
        }
      });
      removalGuard.observe(parent, { childList: true });
    }
  }

  // ── Enable / Disable ──────────────────────────────────
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
  });

})();
