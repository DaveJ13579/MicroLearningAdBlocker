document.addEventListener("DOMContentLoaded", () => {
  // ── Elements ──────────────────────────────────────────
  const toggle      = document.getElementById("toggle");
  const statusText  = document.getElementById("statusText");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const apiStatus   = document.getElementById("apiStatus");
  const topicGrid   = document.getElementById("topicGrid");
  const saveBtn     = document.getElementById("saveBtn");

  if (!toggle || !statusText || !apiKeyInput || !topicGrid || !saveBtn) {
    console.error("Popup: one or more elements not found");
    return;
  }

  // ── Topic list ────────────────────────────────────────
  const ALL_TOPICS = [
    "History",
    "Science",
    "Math",
    "Geography",
    "Psychology",
    "Philosophy",
    "Biology",
    "Physics",
    "Economics",
    "Technology",
    "Literature",
    "Art"
  ];

  // Active topics stored as a Set for fast lookup
  let activeTopics = new Set();

  // ── Render topic chips ────────────────────────────────
  function renderTopics() {
    topicGrid.innerHTML = "";
    ALL_TOPICS.forEach((topic) => {
      const chip = document.createElement("div");
      chip.className = "topic-chip" + (activeTopics.has(topic) ? " active" : "");
      chip.textContent = topic;
      chip.addEventListener("click", () => {
        if (activeTopics.has(topic)) {
          if (activeTopics.size === 1) return; // keep at least one
          activeTopics.delete(topic);
        } else {
          activeTopics.add(topic);
        }
        renderTopics();
      });
      topicGrid.appendChild(chip);
    });
  }

  // ── Toggle logic ──────────────────────────────────────
  function updateStatus(enabled) {
    statusText.textContent = enabled ? "Status: On" : "Status: Off";
  }

  toggle.addEventListener("change", () => {
    const isEnabled = toggle.checked;
    chrome.storage.sync.set({ enabled: isEnabled });
    updateStatus(isEnabled);
  });

 saveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();

  if (key && !key.startsWith("sk-ant-")) {
    showStatus("Key should start with sk-ant-…", "error");
    return;
  }

  const topics = [...activeTopics];
  if (topics.length === 0) {
    showStatus("Select at least one topic.", "error");
    return;
  }

  chrome.storage.sync.set({ apiKey: key, topics: topics }, () => {
    showStatus(key ? "Saved ✓" : "Key cleared ✓", "success");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.reload(tabs[0].id);
    });
  });
});

  // ── Status helper ─────────────────────────────────────
  function showStatus(msg, type) {
    apiStatus.textContent = msg;
    apiStatus.className   = "api-status " + type;
    setTimeout(() => {
      apiStatus.textContent = "";
      apiStatus.className   = "api-status";
    }, 2500);
  }

  // ── Load saved state on open ──────────────────────────
  chrome.storage.sync.get(["enabled", "apiKey", "topics"], (result) => {
    // Toggle
    const isEnabled  = result.enabled !== false;
    toggle.checked   = isEnabled;
    updateStatus(isEnabled);

    // API key
    if (result.apiKey) apiKeyInput.value = result.apiKey;

    // Topics — default to Science + History if nothing saved yet
    if (Array.isArray(result.topics) && result.topics.length > 0) {
      activeTopics = new Set(result.topics);
    } else {
      activeTopics = new Set(["Science", "History"]);
    }
    renderTopics();
  });
});
