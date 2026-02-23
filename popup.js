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

  // ── Topic list with types ───────────────────────────────
  const ALL_TOPICS = [
    { topic: "Security+ (SY0-701)", type: "educational" },
    { topic: "CCNA (200-301)", type: "educational" },
    { topic: "Stress & Resilience", type: "behavioral" },
    { topic: "Financial Habits", type: "behavioral" }
  ];

  // Active topics stored as a Set of topic names for fast lookup
  // Full objects are retrieved from ALL_TOPICS when saving
  let activeTopicNames = new Set();

  // ── Render topic chips grouped by type ──────────────────
  function renderTopics() {
    topicGrid.innerHTML = "";

    const educational = ALL_TOPICS.filter(t => t.type === "educational");
    const behavioral = ALL_TOPICS.filter(t => t.type === "behavioral");

    // Render educational group
    if (educational.length > 0) {
      const label = document.createElement("div");
      label.className = "topic-group-label";
      label.textContent = "Learn";
      topicGrid.appendChild(label);

      educational.forEach(({ topic }) => {
        topicGrid.appendChild(createChip(topic));
      });
    }

    // Render behavioral group
    if (behavioral.length > 0) {
      const label = document.createElement("div");
      label.className = "topic-group-label";
      label.textContent = "Influence";
      topicGrid.appendChild(label);

      behavioral.forEach(({ topic }) => {
        topicGrid.appendChild(createChip(topic));
      });
    }
  }

  function createChip(topic) {
    const chip = document.createElement("div");
    chip.className = "topic-chip" + (activeTopicNames.has(topic) ? " active" : "");
    chip.textContent = topic;
    chip.addEventListener("click", () => {
      if (activeTopicNames.has(topic)) {
        if (activeTopicNames.size === 1) return; // keep at least one
        activeTopicNames.delete(topic);
      } else {
        activeTopicNames.add(topic);
      }
      renderTopics();
    });
    return chip;
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

  // ── Save button ───────────────────────────────────────
  saveBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();

    // Loose format check
    if (key && !key.startsWith("sk-ant-")) {
      showStatus("Key should start with sk-ant-…", "error");
      return;
    }

    if (activeTopicNames.size === 0) {
      showStatus("Select at least one topic.", "error");
      return;
    }

    // Build full topic objects from active names
    const topics = ALL_TOPICS.filter(t => activeTopicNames.has(t.topic));

    chrome.storage.sync.set({ apiKey: key, topics: topics }, () => {
      showStatus(key ? "Saved ✓" : "Key cleared ✓", "success");
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

    // Topics — handle both old string format and new object format
    if (Array.isArray(result.topics) && result.topics.length > 0) {
      // Check if it's the old string format
      if (typeof result.topics[0] === "string") {
        // Old format: default to new topics
        activeTopicNames = new Set([ALL_TOPICS[0].topic]);
      } else {
        // New format: extract topic names
        activeTopicNames = new Set(result.topics.map(t => t.topic));
      }
    } else {
      // Default to first topic
      activeTopicNames = new Set([ALL_TOPICS[0].topic]);
    }
    renderTopics();
  });
});
