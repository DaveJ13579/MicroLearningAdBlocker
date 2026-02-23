(function () {

  const PROCESSED_ATTR = "data-microlearn-replaced";

  function pickTopic(topics) {
    return topics[Math.floor(Math.random() * topics.length)];
  }

  function createMicroLearnPlaceholder(width, height) {
    const wrapper = document.createElement("div");
    wrapper.className = "microlearn-placeholder";

    if (width)  wrapper.style.width  = width  + "px";
    if (height) wrapper.style.height = height + "px";

    wrapper.innerHTML =
      '<div class="microlearn-header">MicroLearn</div>' +
      '<div class="microlearn-body microlearn-loading">Loading lesson…</div>' +
      '<div class="microlearn-footer">Powered by Claude</div>';

    return wrapper;
  }

  function replaceAd(ad, apiKey, topics) {
    if (ad.hasAttribute(PROCESSED_ATTR)) return;
    if (ad.closest(".microlearn-placeholder")) return;

    const rect = ad.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) return;

    const placeholder = createMicroLearnPlaceholder(rect.width, rect.height);
    placeholder.setAttribute(PROCESSED_ATTR, "true");

    ad.replaceWith(placeholder);

    const topic = pickTopic(topics);

    chrome.runtime.sendMessage(
      { type: "FETCH_LESSON", apiKey: apiKey, topic: topic },
      (response) => {
        const bodyEl = placeholder.querySelector(".microlearn-body");
        if (!bodyEl) return;

        if (response && response.lesson) {
          bodyEl.textContent = response.lesson;
        } else {
          const fallbackFacts = [
            "💡 Curiosity activates reward circuits in the brain.",
            "💡 The human brain uses about 20% of your body's energy.",
            "💡 Learning strengthens neural pathways.",
            "💡 The shortest war in history lasted 38 minutes."
          ];
          bodyEl.textContent =
            fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)];
        }

        bodyEl.classList.remove("microlearn-loading");
      }
    );
  }

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

    const visibleAds = [...ads].filter(ad => {
      const style = window.getComputedStyle(ad);
      return style.display !== "none" && style.visibility !== "hidden";
    });

    visibleAds.forEach(ad => replaceAd(ad, apiKey, topics));
  }

  let observer = null;
  let pollInterval = null;
  let savedApiKey = "";
  let savedTopics = ["Science", "History"];

  function enableMicroLearn() {
    scanAndReplaceAds(savedApiKey, savedTopics);

    observer = new MutationObserver(() => {
      scanAndReplaceAds(savedApiKey, savedTopics);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    pollInterval = setInterval(() => {
      scanAndReplaceAds(savedApiKey, savedTopics);
    }, 2000);
  }

  function disableMicroLearn() {
    if (observer) observer.disconnect();
    if (pollInterval) clearInterval(pollInterval);
    location.reload();
  }

  chrome.storage.sync.get(["enabled", "apiKey", "topics"], (result) => {
    savedApiKey = result.apiKey || "";
    savedTopics = (Array.isArray(result.topics) && result.topics.length > 0)
      ? result.topics
      : ["Science", "History"];

    if (result.enabled !== false) enableMicroLearn();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if ("enabled" in changes) {
      changes.enabled.newValue ? enableMicroLearn() : disableMicroLearn();
    }
    if ("apiKey" in changes)  savedApiKey = changes.apiKey.newValue || "";
    if ("topics" in changes)  savedTopics = changes.topics.newValue || savedTopics;
  });

})();
