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


function refreshAllPatterns() {
    const splashFile = activePattern ? PATTERN_FILES[activePattern] : DEFAULT_SPLASH;
    const url = (splashFile && isExtensionAlive()) ? chrome.runtime.getURL(splashFile) : null;
    document.querySelectorAll(".microlearn-placeholder").forEach(el => {
      if (url) {
        el.style.backgroundImage    = `url("${url}")`;
        el.style.backgroundSize     = "cover";
        el.style.backgroundPosition = "center";
        el.style.backgroundRepeat   = "no-repeat";
      } else {
        el.style.backgroundImage = "";
      }
    });
  }

  // ── Splash Animation ──────────────────────────────────
  const SPLASH_MS      = 3000;
  const SPLASH_FADE_MS = 700;
  const DEFAULT_SPLASH = "images/testpic1.png";

  function createPlaceholder(width, height) {
    const el = document.createElement("div");
    el.className = "microlearn-placeholder ml-has-splash";
    // Pin both dimensions to the ad's measured size so the placeholder occupies
    // exactly the same space and nothing around it shifts or leaves black gaps.
    if (width  > 0) el.style.width  = width  + "px";
    if (height > 0) el.style.height = height + "px";

    // Resolve the splash image: user-selected pattern, or the built-in default.
    // This restores the always-present background + transition from before the merge.
    const splashFile = activePattern ? PATTERN_FILES[activePattern] : DEFAULT_SPLASH;
    const url = (splashFile && isExtensionAlive())
      ? chrome.runtime.getURL(splashFile)
      : null;

    // Apply as the persistent card background (remains visible after the splash fades out).
    if (url) {
      el.style.backgroundImage    = `url("${url}")`;
      el.style.backgroundSize     = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat   = "no-repeat";
    }

    // Fallback: extension is dead → simple card with no animation.
    if (!url) {
      el.innerHTML = `
        <div class="ml-content">
          <div class="microlearn-header">MicroLearn</div>
          <div class="microlearn-topic microlearn-loading">Loading...</div>
          <div class="microlearn-body microlearn-loading">Loading…</div>
        </div>
      `;
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
        <div class="microlearn-header">MicroLearn</div>
        <div class="microlearn-topic microlearn-loading">Loading...</div>
        <div class="microlearn-body microlearn-loading">Loading…</div>
      </div>
    `;

    const splash  = el.querySelector(".ml-splash");
    const content = el.querySelector(".ml-content");

    if (content) content.classList.add("ml-hidden");

    // After SPLASH_MS, fade out the splash overlay and reveal the lesson.
    // The pattern background image stays on the card itself the whole time.
    setTimeout(() => {
      if (!el.isConnected) return;
      if (splash)  splash.classList.add("ml-fadeout");
      setTimeout(() => {
        if (!el.isConnected) return;
        if (splash)  splash.remove();
        if (content) content.classList.remove("ml-hidden");
      }, SPLASH_FADE_MS);
    }, SPLASH_MS);

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
        bodyEl.title        = text;
        bodyEl.style.cursor = "help";
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

  // Returns the best available pixel dimensions for an element.
  // offsetWidth/offsetHeight are preferred: they reflect actual layout space,
  // are unaffected by transforms, and don't shift with scroll position.
  function measureAd(el) {
    let w = el.offsetWidth;
    let h = el.offsetHeight;

    // offsetWidth can be 0 for elements not yet in flow; fall back to computed style.
    if (!w || !h) {
      const cs = window.getComputedStyle(el);
      w = w || parseInt(cs.width,  10) || 0;
      h = h || parseInt(cs.height, 10) || 0;
    }

    return { w, h };
  }

  function scanAndReplaceAds() {
    if (!isExtensionAlive()) return;

    const candidates = document.querySelectorAll(AD_SELECTORS);
    const newAds = [];

    candidates.forEach(ad => {
      if (ad.hasAttribute(PROCESSED_ATTR)) return;
      const { w, h } = measureAd(ad);
      if (w < 50 || h < 50) return;

      // Walk up ancestors to find the real ad slot container — sites like CNN
      // wrap a small ad element (e.g. 90px iframe) in several nested divs that
      // together form the full-height reserved slot (e.g. 360px black wrapper).
      // We take the tallest qualifying ancestor: taller than the measured ad but
      // not so large that it's a page section (capped at 900px).
      let finalH = h;
      let ancestor = ad.parentElement;
      for (let depth = 0; depth < 5 && ancestor && ancestor !== document.body; depth++) {
        const ph = ancestor.offsetHeight;
        if (ph > h * 1.2 && ph <= 600 && ph > finalH) finalH = ph;
        ancestor = ancestor.parentElement;
      }

      newAds.push({ el: ad, w, h: finalH });
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

      // Guard 2: prevent ad scripts from injecting positioned overlays as SIBLINGS
      // next to our placeholder.  Two patterns to catch:
      //   a) Outer wrapper has inline position:absolute/fixed  → remove immediately.
      //   b) Outer wrapper has no position but its children use z-index inline
      //      (e.g. Celtra: outer div is width:100%;height:100%, inner divs carry
      //      z-index:10001+ and position:absolute).  Those children haven't rendered
      //      yet when the parent mutation fires, so we re-check after a short delay.
      if (parent) {
        priorSiblings.add(placeholder); // our placeholder is a legitimate child
        const siblingGuard = new MutationObserver(mutations => {
          mutations.forEach(m => {
            m.addedNodes.forEach(node => {
              if (node.nodeType !== 1 || priorSiblings.has(node)) return;

              // Pattern (a): inline position on the injected element itself.
              const pos = node.style?.position;
              if (pos === "absolute" || pos === "fixed") { node.remove(); return; }

              // Pattern (b): wrapper element whose children will carry inline z-index.
              // Give the ad script ~150 ms to finish building its subtree, then check.
              setTimeout(() => {
                if (!node.isConnected) return;
                if (node.querySelector("[style*='z-index']")) node.remove();
              }, 150);
            });
          });
        });
        siblingGuard.observe(parent, { childList: true });
      }

      // Guard 3: scroll-back re-injection.
      // Ad systems use IntersectionObserver to destroy their creative when off-screen
      // and re-inject when scrolled back into view.  The re-injection often targets an
      // ancestor container — above the level Guards 1 & 2 watch.
      // When OUR placeholder becomes visible again, sample elementsFromPoint at its
      // centre and remove any element that is (a) covering it, (b) positioned
      // absolute/fixed, and (c) has a computed z-index > 1000 (universal ad-overlay
      // fingerprint that won't hit normal nav/header elements).
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

      // Guard 4: placeholder removal.
      // Some ad systems detect that their slot was modified and respond by removing
      // our placeholder entirely and reinserting the original ad.  Guards 1-3 all
      // watch for additions; none of them fire when the placeholder itself disappears.
      // This guard watches the parent for our node being removed and immediately
      // re-runs the scan so the reinserted ad gets caught and replaced again.
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

      // If dimensions still look suspect, watch the parent and correct once it settles.
      if (parent && h < 100) {
        const ro = new ResizeObserver(entries => {
          for (const entry of entries) {
            const ph = entry.contentRect.height;
            if (ph > 50) {
              placeholder.style.height = ph + "px";
              ro.disconnect();
            }
          }
        });
        ro.observe(parent);
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

    if ("adContainerPattern" in changes) {
      activePattern = changes.adContainerPattern.newValue || null;
      refreshAllPatterns();
    }
  });

})();
