const SELECTORS = [
  "[id*='ad']",
  "[class*='ad']",
  "iframe[src*='doubleclick']",
  "[aria-label*='sponsored']"
];

async function loadContent() {
  const res = await fetch(chrome.runtime.getURL("data/content.json"));
  return await res.json();
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createCard(content, prefs) {
  const card = document.createElement("div");
  card.className = `ml-card ${content.topic.toLowerCase()}`;

  card.innerHTML = `
    <div class="ml-header">${content.topic}</div>
    <div class="ml-body">${content.text}</div>
    <div class="ml-footer">${content.source}</div>
  `;

  if (prefs.theme === "dark") {
    card.classList.add("dark");
  }

  if (prefs.showProgress) {
    const bar = document.createElement("div");
    bar.className = "ml-progress";
    bar.innerHTML = `<div class="ml-progress-fill"></div>`;
    card.appendChild(bar);
  }

  return card;
}

async function replaceAds() {
  const contentLibrary = await loadContent();

  chrome.storage.sync.get("prefs", (data) => {
    const prefs = data.prefs || {};

    SELECTORS.forEach(selector => {
      document.querySelectorAll(selector).forEach(node => {
        if (!node.dataset.mlReplaced) {
          const content = getRandomItem(contentLibrary);
          const card = createCard(content, prefs);

          node.replaceWith(card);
          card.dataset.mlReplaced = "true";
        }
      });
    });
  });
}

function observeDOM() {
  const observer = new MutationObserver(() => {
    replaceAds();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

replaceAds();
observeDOM();
