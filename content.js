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

  // Finds common ad containers
  function scanAndReplaceAds() {
    const ads = document.querySelectorAll(
      ".ad-slot, \
       [data-ad-label-text='Advertisement'], \
       [data-desktop-slot-id], \
       iframe[id^='google_ads_iframe']"
    );

    ads.forEach(replaceAd);
  }

  // MutationObserver watches for dynamically loaded ads
  let observer = null;

  function enableMicroLearn() {
    // Replace existing ads
    scanAndReplaceAds();

    // Watch for new ads
    observer = new MutationObserver(scanAndReplaceAds);
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
  chrome.storage.onChanged.addListener(changes => {
    if ("enabled" in changes) {
      changes.enabled.newValue
        ? enableMicroLearn()
        : disableMicroLearn();
    }
  });

})();
