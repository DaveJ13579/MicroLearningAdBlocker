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
      '<div class="microlearn-brand">MicroLearn</div>' +
      '<div class="microlearn-content">' +
        '<div class="microlearn-headline microlearn-loading">Loading lesson…</div>' +
        '<div class="microlearn-tagline"></div>' +
      '</div>';

    return wrapper;
  }

  // ── Parses the API response into headline and tagline ──
  function parseLesson(text) {
    const headlineMatch = text.match(/HEADLINE:\s*(.+)/i);
    const taglineMatch = text.match(/TAGLINE:\s*(.+)/i);

    if (headlineMatch && taglineMatch) {
      return {
        headline: headlineMatch[1].trim(),
        tagline: taglineMatch[1].trim()
      };
    }

    // Fallback: couldn't parse, return full text as headline
    return null;
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
        const headlineEl = placeholder.querySelector(".microlearn-headline");
        const taglineEl = placeholder.querySelector(".microlearn-tagline");
        if (!headlineEl) return; // element was removed from DOM

        if (response && response.lesson) {
          const parsed = parseLesson(response.lesson);

          if (parsed) {
            headlineEl.textContent = parsed.headline;
            taglineEl.textContent = parsed.tagline;
          } else {
            // Fallback: parsing failed, show full response as headline
            headlineEl.textContent = response.lesson;
            taglineEl.textContent = "";
          }
          headlineEl.classList.remove("microlearn-loading");
        } else {
          // Fallback: show a static tip so the card isn't empty
          headlineEl.textContent = "Stay curious — ask questions every day.";
          taglineEl.textContent = "Learning transforms how you see the world.";
          headlineEl.classList.remove("microlearn-loading");
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