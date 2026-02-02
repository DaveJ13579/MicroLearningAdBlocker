(function () {

  // Attribute used to mark ads already replaced
  const PROCESSED_ATTR = "data-microlearn-replaced";

  // ── Pick a random topic from the saved list ──────────
  function pickTopic(topics) {
    return topics[Math.floor(Math.random() * topics.length)];
  }

  // ── Creates the learning placeholder box ──────────────
  function createMicroLearnPlaceholder(width, height) {
    const wrapper = document.createElement("div");
    wrapper.className = "microlearn-placeholder";

    if (width)  wrapper.style.width  = width  + "px";
    if (height) wrapper.style.height = height + "px";

    // Start with loading state
    wrapper.innerHTML =
      '<div class="microlearn-header">MicroLearn</div>' +
      '<div class="microlearn-body microlearn-loading">Loading lesson…</div>';

    return wrapper;
  }


  // ── Replaces a detected ad with learning content ─────
  function replaceAd(ad, apiKey, topics) {
    if (ad.hasAttribute(PROCESSED_ATTR)) return;

    const rect = ad.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) return;

    const placeholder = createMicroLearnPlaceholder(rect.width, rect.height);
    placeholder.setAttribute(PROCESSED_ATTR, "true");

    // Swap the ad out immediately so the user sees the card
    ad.replaceWith(placeholder);

    // Pick a topic and ask the background worker for a lesson
    const topic = pickTopic(topics);

    chrome.runtime.sendMessage(
      { type: "FETCH_LESSON", apiKey: apiKey, topic: topic },
      (response) => {
        const bodyEl = placeholder.querySelector(".microlearn-body");
        if (!bodyEl) return; // element was removed from DOM

        if (response && response.lesson) {
          bodyEl.textContent = response.lesson;
          bodyEl.classList.remove("microlearn-loading");
        } else {
          // Fallback: show a static tip so the card isn't empty
          bodyEl.textContent = "💡 Tip: Stay curious — ask questions every day.";
          bodyEl.classList.remove("microlearn-loading");
        }
      }
    );
  }

  // ── Scans page for common ad containers ──────────────
  function scanAndReplaceAds(apiKey, topics) {
    const ads = document.querySelectorAll(
      '.ad-slot, ' +
      '[data-ad-label-text="Advertisement"], ' +
      '[data-desktop-slot-id], ' +
      'iframe[id^="google_ads_iframe"], ' +
      'gwd-google-ad, ' +
      '#ad, ' +
      'iframe[id^="ape_"]'
    );
    ads.forEach((ad) => replaceAd(ad, apiKey, topics));
  }

  // ── MutationObserver + polling for late-loading ads ──
  let observer = null;
  let pollInterval = null;
  let savedApiKey = "";
  let savedTopics = ["Science", "History"];

  function enableMicroLearn() {
    scanAndReplaceAds(savedApiKey, savedTopics);

    // Catch ads added to the DOM
    observer = new MutationObserver(() => {
      scanAndReplaceAds(savedApiKey, savedTopics);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Catch ads that exist but are unsized until their content loads
    pollInterval = setInterval(() => {
      scanAndReplaceAds(savedApiKey, savedTopics);
    }, 2000);
  }

  function disableMicroLearn() {
    if (observer) observer.disconnect();
    observer = null;

    if (pollInterval) clearInterval(pollInterval);
    pollInterval = null;

    location.reload();
  }

  // ── Initialise: load settings then act ────────────────
  chrome.storage.sync.get(["enabled", "apiKey", "topics"], (result) => {
    savedApiKey = result.apiKey || "";
    savedTopics = (Array.isArray(result.topics) && result.topics.length > 0)
      ? result.topics
      : ["Science", "History"];

    if (result.enabled !== false) enableMicroLearn();
  });

  // ── React to toggle / setting changes at runtime ─────
  chrome.storage.onChanged.addListener((changes) => {
    if ("enabled" in changes) {
      changes.enabled.newValue ? enableMicroLearn() : disableMicroLearn();
    }
    if ("apiKey" in changes)  savedApiKey = changes.apiKey.newValue || "";
    if ("topics" in changes)  savedTopics = changes.topics.newValue || savedTopics;
  });

})();