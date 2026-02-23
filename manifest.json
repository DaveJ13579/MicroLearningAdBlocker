// background.js - service worker
// Relays Claude API requests from content scripts, which may be
// blocked by a host page Content-Security-Policy.

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "FETCH_LESSON") return false;

  const { apiKey, topic } = msg;

  // Basic guard
  if (!apiKey || !topic) {
    console.log("FETCH_LESSON blocked: missing apiKey or topic");
    sendResponse({ error: "Missing apiKey or topic." });
    return true;
  }

  const prompt =
    "Give me one micro-learning fact about " +
    topic +
    ". " +
    "Exactly one sentence. " +
    "Make it surprising or interesting. " +
    "No headers, no bullet points, no extra text.";

  console.log("Fetching lesson for topic:", topic);

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
    .then((res) => {
      console.log("API status:", res.status);
      return res.json();
    })
    .then((data) => {
      console.log("API response:", JSON.stringify(data));

      if (data.content && data.content[0] && data.content[0].text) {
        sendResponse({ lesson: data.content[0].text.trim() });
      } else if (data.error) {
        sendResponse({ error: data.error.message || "API error" });
      } else {
        sendResponse({ error: "Unexpected response format." });
      }
    })
    .catch((err) => {
      console.log("API fetch error:", err.message);
      sendResponse({ error: err.message || "Network error" });
    });

  // Return true so the channel stays open until sendResponse fires
  return true;
});
