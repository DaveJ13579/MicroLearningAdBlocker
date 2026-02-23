// background.js - service worker
// Relays Claude API requests from content scripts.

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "FETCH_LESSON") return false;

  const { apiKey, topic } = msg;

  // Guard
  if (!apiKey || !topic) {
    sendResponse({ error: "Missing apiKey or topic." });
    return true;
  }

  // NEW: basic API key sanity check
  if (apiKey.length < 20) {
    sendResponse({ error: "Invalid API key." });
    return true;
  }

  const prompt =
    "Give me one micro-learning fact about " +
    topic +
    ". Exactly one sentence. Make it surprising or interesting. " +
    "No headers, no bullet points, no extra text.";

  fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      messages: [{ role: "user", content: prompt }]
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.content && data.content[0]?.text) {
        sendResponse({ lesson: data.content[0].text.trim() });
      } else {
        sendResponse({ error: "Unexpected response format." });
      }
    })
    .catch(err => {
      sendResponse({ error: err.message || "Network error" });
    });

  return true;
});
