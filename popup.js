document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle");
  const statusText = document.getElementById("statusText");

  if (!toggle || !statusText) {
    console.error("Popup elements not found");
    return;
  }

  // Update label
  function updateStatus(enabled) {
    statusText.textContent = enabled ? "Status: On" : "Status: Off";
  }

  // Load saved state
  chrome.storage.sync.get("enabled", ({ enabled }) => {
    const isEnabled = enabled !== false;
    toggle.checked = isEnabled;
    updateStatus(isEnabled);
  });

  // Toggle changed
  toggle.addEventListener("change", () => {
    const isEnabled = toggle.checked;
    chrome.storage.sync.set({ enabled: isEnabled });
    updateStatus(isEnabled);
  });
});
