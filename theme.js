// theme.js
// Applies a light/dark theme to extension pages.
// Priority: themeOverride (sync) -> system -> light.

(function () {
  const ROOT = document.documentElement;

  function setDark(isDark) {
    ROOT.classList.toggle("dark", isDark);
    ROOT.dataset.theme = isDark ? "dark" : "light";

    // Back-compat: some pages use body.dark-mode.
    if (document.body) {
      document.body.classList.toggle("dark-mode", isDark);
    }
  }

  function applyThemeFromStorage() {
    chrome.storage.sync.get(["themeOverride"], (res) => {
      const override = res.themeOverride; // "light" | "dark" | undefined
      const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = override ? override === "dark" : systemDark;
      setDark(isDark);
    });
  }

  // Initial apply
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyThemeFromStorage, { once: true });
  } else {
    applyThemeFromStorage();
  }

  // Respond to user changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if ("themeOverride" in changes) applyThemeFromStorage();
  });

  // Respond to OS theme changes (only matters when no override)
  const mql = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  if (mql && typeof mql.addEventListener === "function") {
    mql.addEventListener("change", () => applyThemeFromStorage());
  } else if (mql && typeof mql.addListener === "function") {
    mql.addListener(() => applyThemeFromStorage());
  }
})();
