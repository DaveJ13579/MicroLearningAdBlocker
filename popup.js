document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle");
  const statusText = document.getElementById("statusText");
  const insightsToday = document.getElementById("insightsToday");
  const streamProgress = document.getElementById("streamProgress");
  const openPrefs = document.getElementById("openPrefs");
  const refreshStats = document.getElementById("refreshStats");
  const hint = document.getElementById("hint");

  function setHint(text) {
    if (!hint) return;
    hint.textContent = text || "";
    if (text) setTimeout(() => (hint.textContent = ""), 2500);
  }

  function updateStatus(enabled) {
    if (!statusText) return;
    statusText.textContent = enabled ? "On" : "Off";
  }

  function loadStats() {
    chrome.runtime.sendMessage({ type: "GET_METRICS" }, (res) => {
      if (!res || res.success === false) {
        insightsToday.textContent = "—";
        streamProgress.textContent = "—";
        return;
      }

      const today = res.metrics?.insightsToday;
      const idx = res.stream?.index;
      const size = res.stream?.size;

      insightsToday.textContent = typeof today === "number" ? String(today) : "0";
      streamProgress.textContent = size ? `${Math.min(idx, size)}/${size}` : "0/0";
    });
  }

  toggle.addEventListener("change", () => {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ enabled }, () => {
      updateStatus(enabled);
      setHint(enabled ? "Enabled" : "Disabled");
    });
  });

  openPrefs.addEventListener("click", () => {
    const url = chrome.runtime.getURL("preferences.html");
    chrome.tabs.create({ url });
  });

  refreshStats.addEventListener("click", () => {
    loadStats();
    setHint("Updated");
  });

  chrome.storage.sync.get(["enabled"], (res) => {
    const enabled = res.enabled !== false;
    toggle.checked = enabled;
    updateStatus(enabled);
    loadStats();
  });
});
