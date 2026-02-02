(function () {
  // Attribute used to mark ads already replaced
  const PROCESSED_ATTR = "data-microlearn-replaced";

  // Creates the learning placeholder box
  function createMicroLearnPlaceholder(width, height) {
    const wrapper = document.createElement("div");
    wrapper.className = "microlearn-placeholder";

    // Match original ad size
    if (width) wrapper.style.width = width + "px";
    if (height) wrapper.style.height = height + "px";

    // Placeholder content
    wrapper.innerHTML = `
      <div class="microlearn-header">MicroLearn</div>
      <div class="microlearn-body">MicroLearn content goes here</div>
    `;

    return wrapper;
  }

  // Replaces a detected ad with learning content
  function replaceAd(ad) {
    if (!ad || !(ad instanceof Element)) return;

    // Prevent double replacement
    if (ad.hasAttribute(PROCESSED_ATTR)) return;

    // Skip very small elements
    const rect = ad.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) return;

    // Create replacement content
    const placeholder = createMicroLearnPlaceholder(rect.width, rect.height);

    // Mark as processed
    placeholder.setAttribute(PROCESSED_ATTR, "true");

    // Completely replace ad element
    ad.replaceWith(placeholder);
  }

  // Your original common ad containers (unchanged)
  function scanCommonAds(root = document) {
    const ads = root.querySelectorAll(
      ".ad-slot, \
       [data-ad-label-text='Advertisement'], \
       [data-desktop-slot-id], \
       iframe[id^='google_ads_iframe']"
    );

    ads.forEach(replaceAd);
  }

  // Quora in-feed sponsored detection (tight scope)
  function normalizeText(s) {
    return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

    // Quora in-feed sponsored detection (label-first approach)

  function normalizeText(s) {
    return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findSponsoredLabelNodes(root) {
    const nodes = root.querySelectorAll("span, div, a");
    const out = [];

    for (const n of nodes) {
      const t = normalizeText(n.textContent);
      if (t === "sponsored") out.push(n);
    }

    return out;
  }

  function findBestCardContainer(labelNode) {
    // Walk up and pick the first ancestor that looks like a "card"
    // This prevents grabbing huge layout wrappers and avoids messing up sidebar.
    let cur = labelNode;
    for (let i = 0; i < 10 && cur && cur.parentElement; i++) {
      cur = cur.parentElement;

      if (!(cur instanceof Element)) continue;
      if (cur.hasAttribute(PROCESSED_ATTR)) continue;

      const r = cur.getBoundingClientRect();

      // Card size window: wide enough to be a post, not so wide it is the page
      const okWidth = r.width >= 300 && r.width <= 900;
      const okHeight = r.height >= 150 && r.height <= 1400;

      if (!okWidth || !okHeight) continue;

      // Strong extra signal: Quora sponsored cards usually include a "Learn More" CTA
      const text = normalizeText(cur.innerText);
      const hasLearnMore = text.includes("learn more");

      // If we see a plausible card, take it. Prefer ones with Learn More.
      if (hasLearnMore) return cur;

      // Otherwise keep it as a fallback candidate if nothing better appears
      // but do not return yet, keep walking up a bit to find the full card.
      if (i >= 3) return cur;
    }

    return null;
  }

  function scanQuoraInFeedSponsored(root = document) {
    if (!location.hostname.includes("quora.com")) return;

    const labelNodes = findSponsoredLabelNodes(root);

    for (const labelNode of labelNodes) {
      const card = findBestCardContainer(labelNode);
      if (card) replaceAd(card);
    }
  }

  // Finds and replaces ads for all supported cases
  function scanAndReplaceAds() {
    scanCommonAds(document);
    scanQuoraInFeedSponsored(document);
  }

  // MutationObserver watches for dynamically loaded ads
  let observer = null;

  function enableMicroLearn() {
    // Replace existing ads
    scanAndReplaceAds();

    // Watch for new ads and new feed items
    observer = new MutationObserver(() => {
      scanAndReplaceAds();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function disableMicroLearn() {
    // Stop watching DOM
    if (observer) observer.disconnect();
    observer = null;

    // Reload page to restore ads
    location.reload();
  }

  // Load saved enabled/disabled state
  chrome.storage.sync.get("enabled", ({ enabled }) => {
    if (enabled !== false) enableMicroLearn();
  });

  // Listen for toggle changes
  chrome.storage.onChanged.addListener((changes) => {
    if ("enabled" in changes) {
      changes.enabled.newValue ? enableMicroLearn() : disableMicroLearn();
    }
  });
})();
