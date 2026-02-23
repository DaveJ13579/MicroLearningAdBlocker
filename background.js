// background.js - service worker
// Relays Claude API requests from content scripts, which may be
// blocked by a host page Content-Security-Policy.

// Diversity hints for varied content styles
const diversityHints = [
  "Define a key term.",
  "State a number or measurement.",
  "Compare two related things.",
  "Quick-recall: a standard or version.",
  "List 3-4 related items.",
  "Name a common problem and its fix.",
  "State a rule of thumb.",
  "Name a tool and what it does.",
  "State a core concept in one line.",
  "Give a real-world example."
];

let diversityIndex = 0;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "FETCH_LESSON") return false;

  const { apiKey, topic } = msg;

  // Basic guard
  if (!apiKey || !topic) {
    console.log("FETCH_LESSON blocked: missing apiKey or topic");
    sendResponse({ error: "Missing apiKey or topic." });
    return true;
  }

  // Get current diversity hint and cycle to next
  const diversityHint = diversityHints[diversityIndex];
  diversityIndex = (diversityIndex + 1) % 10;

  const prompt = `You write micro-learning ads. Your output replaces a banner ad on a webpage.

Format — return EXACTLY two lines, nothing else:
HEADLINE: [the fact — 5 to 8 words]
TAGLINE: [why it matters — 8 to 15 words]

Topic: ${topic}
Style: ${diversityHint}

Rules:
- Headline is the knowledge. Dense, concrete, no filler.
- Tagline is the hook. Makes the headline stick.
- Total must be under 25 words.
- No intros, no labels beyond HEADLINE/TAGLINE, no explanations.
- Write like a billboard, not a textbook.`;

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
      max_tokens: 40,
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