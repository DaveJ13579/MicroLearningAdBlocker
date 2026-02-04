/* content.js */

(function () {
  const PROCESSED_ATTR = "data-microlearn-replaced";
  const LINKEDIN_TEXT_ADS_CONTAINER = 'div[data-testid="text-ads-container"]';

  // Universal observer/interval for MicroLearn only
  let observer = null;
  let pollInterval = null;

  let savedApiKey = "";
  let savedTopics = ["Science", "History"];

  let killed = false;
  let enabledNow = false;

  function isExtensionAlive() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  function stopAll() {
    try { if (observer) observer.disconnect(); } catch (e) {}
    observer = null;

    try { if (pollInterval) clearInterval(pollInterval); } catch (e) {}
    pollInterval = null;
  }

  function killScript() {
    killed = true;
    enabledNow = false;
    stopAll();
  }

  // Catch "Extension context invalidated" and shut down quietly.
  window.addEventListener(
    "error",
    (e) => {
      const msg = String((e && (e.message || (e.error && e.error.message))) || "");
      if (msg.toLowerCase().includes("extension context invalidated")) {
        try { killScript(); } catch (_) {}
        try { e.preventDefault(); } catch (_) {}
      }
    },
    true
  );

  function pickTopic(topics) {
    return topics[Math.floor(Math.random() * topics.length)];
  }

  function createMicroLearnPlaceholder() {
    const wrapper = document.createElement("div");
    wrapper.className = "microlearn-placeholder";
    wrapper.setAttribute(PROCESSED_ATTR, "true");

    wrapper.innerHTML =
      '<div class="microlearn-header">MicroLearn</div>' +
      '<div class="microlearn-body microlearn-loading">Loading lesson…</div>';

    return wrapper;
  }

  // Size: match the replaced module, but do not hard lock it.
  function setPlaceholderSizeFromRect(placeholder, rect) {
    if (!(placeholder instanceof Element) || !rect) return;

    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    if (w >= 50) {
      placeholder.style.width = w + "px";
      placeholder.style.minWidth = w + "px";
    }

    if (h >= 50) {
      placeholder.style.height = h + "px";
      placeholder.style.minHeight = h + "px";
    }
  }

  function isInsideProcessedOrMicrolearn(el) {
    if (!(el instanceof Element)) return true;
    if (el.closest(".microlearn-placeholder")) return true;
    if (el.closest("[" + PROCESSED_ATTR + '="true"]')) return true;
    return false;
  }

  // Universal ad keyword matching with word boundaries
  const AD_WORD_RE =
    /\b(ad|ads|adslot|ad-slot|adunit|ad-unit|advert|advertisement|sponsor|sponsored|promoted|promotion|doubleclick|gpt|dfp)\b/i;

  function textLooksLikeAd(el) {
    if (!(el instanceof Element)) return false;

    const r = el.getBoundingClientRect();
    if (r.width < 50 || r.height < 12) return false;
    if (r.height > 160) return false;

    const t = (el.textContent || "").trim().toLowerCase();
    if (!t) return false;

    return t === "advertisement" || t === "sponsored" || t === "promoted";
  }

  function iframeIsLikelyAd(el) {
    if (!(el instanceof HTMLIFrameElement)) return false;

    const title = (el.getAttribute("title") || "").toLowerCase();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    const id = (el.getAttribute("id") || "").toLowerCase();
    const src = (el.getAttribute("src") || "").toLowerCase();

    if (title.includes("advertisement")) return true;
    if (aria.includes("advertisement")) return true;

    if (id.startsWith("google_ads_iframe")) return true;
    if (id.startsWith("ape_")) return true;

    if (src.includes("doubleclick")) return true;
    if (src.includes("googlesyndication")) return true;
    if (src.includes("/ads")) return true;

    return false;
  }

  function elementLooksLikeAd(el) {
    if (!(el instanceof Element)) return false;

    const tag = el.tagName.toLowerCase();

    if (tag === "gwd-google-ad") return true;

    if (tag === "iframe") {
      return iframeIsLikelyAd(el);
    }

    const dataLabel = (el.getAttribute("data-ad-label-text") || "").toLowerCase();
    if (dataLabel === "advertisement") return true;

    const id = (el.getAttribute("id") || "").toLowerCase();
    const cls = (el.getAttribute("class") || "").toLowerCase();
    const role = (el.getAttribute("role") || "").toLowerCase();

    if (AD_WORD_RE.test(id)) return true;
    if (AD_WORD_RE.test(cls)) return true;

    if (role === "banner" && (AD_WORD_RE.test(cls) || AD_WORD_RE.test(id))) return true;

    const label = el.querySelector("span, div, p");
    if (label && textLooksLikeAd(label)) return true;

    return false;
  }

  // Do not replace giant layout wrappers.
  function isProbablyLayoutWrapper(el) {
    if (!(el instanceof Element)) return true;

    const rect = el.getBoundingClientRect();
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);

    if (rect.width < 50 || rect.height < 50) return true;

    if (rect.height > vh * 1.3 && rect.height > 900) return true;

    const area = rect.width * rect.height;
    const vArea = vw * vh;
    if (area > vArea * 0.8) return true;

    return false;
  }

  function isInteractive(el) {
    if (!(el instanceof Element)) return false;
    return !!el.querySelector("a, button, input, textarea, select");
  }

  function nodeTextIsAdvertisement(el) {
    if (!(el instanceof Element)) return false;
    const t = (el.textContent || "").trim().toLowerCase();
    return t === "advertisement";
  }

  function moduleHasAdvertisementBar(el) {
    if (!(el instanceof Element)) return false;

    const children = el.children;
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (!(c instanceof Element)) continue;

      if (!nodeTextIsAdvertisement(c)) continue;

      const r = c.getBoundingClientRect();
      if (r.height <= 80 && !isInteractive(c)) return true;
    }

    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (!(c instanceof Element)) continue;

      const grand = c.children;
      for (let j = 0; j < grand.length; j++) {
        const g = grand[j];
        if (!(g instanceof Element)) continue;

        if (!nodeTextIsAdvertisement(g)) continue;

        const r = g.getBoundingClientRect();
        if (r.height <= 80 && !isInteractive(g)) return true;
      }
    }

    return false;
  }

  // For iframes, climb to a reasonable wrapper but stop before big wrappers.
  function getBestReplaceTarget(el) {
    if (!(el instanceof Element)) return null;

    let target = el;
    const canClimb = el instanceof HTMLIFrameElement || iframeIsLikelyAd(el);
    if (!canClimb) return target;

    let current = el;

    for (let i = 0; i < 7; i++) {
      const parent = current.parentElement;
      if (!parent || parent === document.body) break;

      if (isProbablyLayoutWrapper(parent)) break;

      const cr = current.getBoundingClientRect();
      const pr = parent.getBoundingClientRect();

      if (pr.width < 50 || pr.height < 50) break;

      const iframeCount = parent.querySelectorAll("iframe").length;
      if (iframeCount > 1) break;

      const widthOK = pr.width <= cr.width + 140;

      const hasAdBar = moduleHasAdvertisementBar(parent);

      const heightOK = pr.height <= cr.height + 280;
      const heightOKWithBar = pr.height <= cr.height + 420;

      if (widthOK && (heightOK || (hasAdBar && heightOKWithBar))) {
        target = parent;
        current = parent;
        continue;
      }

      break;
    }

    return target;
  }

  // Remove standalone "Advertisement" text near placeholder only.
  function removeNearbyAdvertisementLabels(placeholder) {
    if (!(placeholder instanceof Element)) return;

    const toCheck = [];

    let el = placeholder.nextElementSibling;
    for (let i = 0; i < 10 && el; i++) {
      toCheck.push(el);
      el = el.nextElementSibling;
    }

    el = placeholder.previousElementSibling;
    for (let i = 0; i < 6 && el; i++) {
      toCheck.push(el);
      el = el.previousElementSibling;
    }

    const p = placeholder.parentElement;
    if (p && p.children) {
      for (let i = 0; i < p.children.length; i++) {
        toCheck.push(p.children[i]);
      }
    }

    const seen = new Set();
    for (const node of toCheck) {
      if (!(node instanceof Element)) continue;
      if (seen.has(node)) continue;
      seen.add(node);

      if (!nodeTextIsAdvertisement(node)) continue;

      const r = node.getBoundingClientRect();
      if (r.height > 80) continue;
      if (isInteractive(node)) continue;

      try { node.remove(); } catch (e) {}
    }
  }

  // Keep placeholder stable if layout reflows.
  function attachResizeSync(placeholder, initialRect) {
    let lastGood = initialRect;

    try {
      const ro = new ResizeObserver(() => {
        if (killed) return;
        if (!(placeholder instanceof Element)) return;

        const pr = placeholder.getBoundingClientRect();

        const vw = Math.max(1, window.innerWidth);
        const vh = Math.max(1, window.innerHeight);

        const tooSmall = pr.width < 50 || pr.height < 50;
        const tooBig = pr.height > vh * 1.3 || pr.width > vw * 0.98;

        if (!tooSmall && !tooBig) {
          lastGood = pr;
          return;
        }

        if (lastGood && lastGood.width >= 50 && lastGood.height >= 50) {
          setPlaceholderSizeFromRect(placeholder, lastGood);
        }
      });

      ro.observe(placeholder);
      return ro;
    } catch (e) {
      return null;
    }
  }

  function replaceAd(ad, apiKey, topics) {
    if (killed) return;
    if (!isExtensionAlive()) { killScript(); return; }
    if (!(ad instanceof Element)) return;
    if (!elementLooksLikeAd(ad)) return;
    if (isInsideProcessedOrMicrolearn(ad)) return;

    const target = getBestReplaceTarget(ad);
    if (!target) return;

    if (target.classList && target.classList.contains("microlearn-placeholder")) return;
    if (target.hasAttribute(PROCESSED_ATTR)) return;
    if (isProbablyLayoutWrapper(target)) return;

    const rect = target.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) return;

    const placeholder = createMicroLearnPlaceholder();
    setPlaceholderSizeFromRect(placeholder, rect);

    target.setAttribute(PROCESSED_ATTR, "true");
    try {
      target.replaceWith(placeholder);
    } catch (e) {
      return;
    }

    removeNearbyAdvertisementLabels(placeholder);
    const resizeObserver = attachResizeSync(placeholder, rect);

    const topic = pickTopic(topics);

    if (killed) {
      try { if (resizeObserver) resizeObserver.disconnect(); } catch (_) {}
      return;
    }
    if (!isExtensionAlive()) {
      try { if (resizeObserver) resizeObserver.disconnect(); } catch (_) {}
      killScript();
      return;
    }

    try {
      chrome.runtime.sendMessage(
        { type: "FETCH_LESSON", apiKey: apiKey, topic: topic },
        (response) => {
          if (killed) {
            try { if (resizeObserver) resizeObserver.disconnect(); } catch (_) {}
            return;
          }
          if (!isExtensionAlive()) {
            try { if (resizeObserver) resizeObserver.disconnect(); } catch (_) {}
            killScript();
            return;
          }

          const bodyEl = placeholder.querySelector(".microlearn-body");
          if (!bodyEl) return;

          if (response && response.lesson) {
            bodyEl.textContent = response.lesson;
          } else {
            bodyEl.textContent = "💡 Tip: Stay curious — ask questions every day.";
          }
          bodyEl.classList.remove("microlearn-loading");

          removeNearbyAdvertisementLabels(placeholder);
        }
      );
    } catch (e) {
      const bodyEl = placeholder.querySelector(".microlearn-body");
      if (bodyEl) {
        bodyEl.textContent = "💡 Tip: Stay curious — ask questions every day.";
        bodyEl.classList.remove("microlearn-loading");
      }
      removeNearbyAdvertisementLabels(placeholder);
    }
  }

  function scanAndReplaceAds(apiKey, topics) {
    if (killed) return;
    if (!isExtensionAlive()) { killScript(); return; }

    const ads = document.querySelectorAll(
      [
        ".ad-slot",
        '[data-ad-label-text="Advertisement"]',
        "[data-desktop-slot-id]",
        'iframe[id^="google_ads_iframe"]',
        "gwd-google-ad",
        'iframe[id^="ape_"]',
        'iframe[title="advertisement" i]',
        'iframe[aria-label="advertisement" i]',
        LINKEDIN_TEXT_ADS_CONTAINER
      ].join(", ")
    );

    const adList = Array.from(ads);

    adList.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (rb.width * rb.height) - (ra.width * ra.height);
    });

    for (const ad of adList) {
      if (killed) return;
      if (isInsideProcessedOrMicrolearn(ad)) continue;
      replaceAd(ad, savedApiKey, savedTopics);
    }
  }

  function enableMicroLearn() {
    if (killed) return;
    if (!isExtensionAlive()) { killScript(); return; }
    if (enabledNow) return;
    enabledNow = true;

    stopAll();
    scanAndReplaceAds(savedApiKey, savedTopics);

    // IMPORTANT: never call .observe on a null observer
    try { if (observer) observer.disconnect(); } catch (e) {}
    observer = new MutationObserver(() => {
      if (killed) return;
      if (!isExtensionAlive()) { killScript(); return; }
      scanAndReplaceAds(savedApiKey, savedTopics);
    });

    try {
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    } catch (e) {}

    pollInterval = setInterval(() => {
      if (killed) return;
      if (!isExtensionAlive()) { killScript(); return; }
      scanAndReplaceAds(savedApiKey, savedTopics);
    }, 2000);
  }

  function disableMicroLearn() {
    enabledNow = false;
    stopAll();
    location.reload();
  }

  function disableMicroLearnNoReload() {
    enabledNow = false;
    stopAll();
  }

  try {
    chrome.storage.sync.get(["enabled", "apiKey", "topics"], (result) => {
      if (killed) return;
      if (!isExtensionAlive()) { killScript(); return; }

      savedApiKey = result.apiKey || "";
      savedTopics =
        Array.isArray(result.topics) && result.topics.length > 0
          ? result.topics
          : ["Science", "History"];

      if (result.enabled !== false) enableMicroLearn();
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (killed) return;
      if (!isExtensionAlive()) { killScript(); return; }

      if ("apiKey" in changes) savedApiKey = changes.apiKey.newValue || "";
      if ("topics" in changes) savedTopics = changes.topics.newValue || savedTopics;

      if ("enabled" in changes) {
        changes.enabled.newValue ? enableMicroLearn() : disableMicroLearn();
      }
    });
  } catch (e) {
    try { disableMicroLearnNoReload(); } catch (_) {}
  }

  /* ===============================
     Facebook Sponsored: replace card and keep space
     Uses its own observer variable, never touches the universal observer.
     Will not crash Quora.
     =============================== */

  (function fbSponsoredKeepSpace() {
    try {
      if (!location.hostname.includes("facebook.com")) return;

      const DONE = "data-microlearn-fb-done";

      function isVisible(el) {
        if (!(el instanceof Element)) return false;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }

      function isSponsoredLabel(el) {
        if (!(el instanceof Element)) return false;
        if (!isVisible(el)) return false;
        const t = (el.innerText || "").trim();
        return /^Sponsored$/i.test(t);
      }

      function rectOK(el) {
        if (!(el instanceof Element)) return false;
        const r = el.getBoundingClientRect();
        const vw = Math.max(1, window.innerWidth);
        const vh = Math.max(1, window.innerHeight);

        if (r.width < 220 || r.height < 80) return false;
        if (r.height > 2600) return false;

        const tooBig =
          (r.width > vw * 0.96 && r.height > vh * 0.65) ||
          (r.height > vh * 1.2);

        return !tooBig;
      }

      function countSponsoredInside(el) {
        const spans = el.querySelectorAll("span");
        let n = 0;
        for (const s of spans) {
          const t = (s.innerText || "").trim();
          if (/^Sponsored$/i.test(t)) n++;
          if (n >= 2) return n;
        }
        return n;
      }

      function pickCardFromLabel(label) {
        const article = label.closest('div[role="article"]');
        if (article && rectOK(article)) return article;

        const feedUnit = label.closest('div[data-pagelet^="FeedUnit_"]');
        if (feedUnit && rectOK(feedUnit)) return feedUnit;

        let cur = label;
        let best = null;

        for (let i = 0; i < 20 && cur; i++) {
          cur = cur.parentElement;
          if (!cur) break;

          const tag = cur.tagName;
          if (tag === "BODY" || tag === "HTML") break;

          if (!isVisible(cur)) continue;
          if (!rectOK(cur)) continue;

          if (countSponsoredInside(cur) >= 2) continue;

          best = cur;
        }

        return best;
      }

      function makePlaceholder(rect) {
        const ph = document.createElement("div");
        ph.setAttribute(DONE, "1");

        ph.style.minHeight = Math.round(rect.height) + "px";
        ph.style.width = "100%";

        ph.style.borderRadius = "12px";
        ph.style.background = "rgba(120,120,120,0.10)";
        ph.style.display = "flex";
        ph.style.alignItems = "center";
        ph.style.justifyContent = "center";
        ph.style.padding = "12px";
        ph.style.boxSizing = "border-box";
        ph.style.color = "rgba(255,255,255,0.75)";
        ph.style.fontSize = "14px";
        ph.style.userSelect = "none";

        ph.textContent = "Sponsored content removed";
        return ph;
      }

      function replaceCard(card) {
        if (!(card instanceof Element)) return;
        if (card.getAttribute(DONE) === "1") return;

        if (!rectOK(card)) return;

        const rect = card.getBoundingClientRect();
        card.setAttribute(DONE, "1");

        const ph = makePlaceholder(rect);

        try {
          card.replaceWith(ph);
        } catch (e) {
          card.style.minHeight = Math.round(rect.height) + "px";
          card.style.opacity = "0";
          card.style.pointerEvents = "none";
        }
      }

      function scan(root) {
        const scope = root instanceof Element ? root : document;

        const spans = scope.querySelectorAll("span");

        for (const s of spans) {
          if (!isSponsoredLabel(s)) continue;

          const card = pickCardFromLabel(s);
          if (!card) continue;

          replaceCard(card);
        }
      }

      // Initial scan
      scan(document);

      // Dedicated observer so it never conflicts with MicroLearn
      let raf = 0;
      const fbObserver = new MutationObserver((mutations) => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          for (const m of mutations) {
            for (const n of m.addedNodes) {
              if (n instanceof Element) scan(n);
            }
          }
        });
      });

      if (document.documentElement) {
        fbObserver.observe(document.documentElement, { childList: true, subtree: true });
      }
    } catch (e) {
      // silent
    }
  })();

})();
