document.addEventListener("DOMContentLoaded", () => {
  const toggle       = document.getElementById("toggle");
  const statusText   = document.getElementById("statusText");
  const customizeBtn = document.getElementById("customizeBtn");

  // ── Toggle ────────────────────────────────────────────
  function updateStatus(enabled) {
    statusText.textContent = enabled ? "On" : "Off";
  }

  toggle.addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
    updateStatus(toggle.checked);
  });

  // ── Open preferences page ─────────────────────────────
  customizeBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("preferences.html") });
  });

  // ── Load saved state ──────────────────────────────────
  chrome.storage.sync.get(["enabled"], (result) => {
    const isEnabled = result.enabled !== false;
    toggle.checked = isEnabled;
    updateStatus(isEnabled);
  });
});