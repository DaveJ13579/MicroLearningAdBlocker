// background.js - service worker
// Relays Claude API requests from content scripts

// Diversity hints for educational content
const educationalHints = [
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

// Diversity hints for behavioral content
const behavioralHints = [
  "Reframe a negative thought.",
  "State a grounding or breathing technique.",
  "Normalize a common struggle.",
  "Challenge an identity belief.",
  "Give a one-step action.",
  "State a boundary or permission.",
  "Offer a perspective shift.",
  "Use a contrast to reveal a pattern.",
  "Affirm a positive identity.",
  "Name a trigger and a redirect."
];

// Track hint indices separately per type
let educationalIndex = 0;
let behavioralIndex = 0;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "FETCH_LESSON") return false;

  const { apiKey, topic, contentType } = msg;

  // Basic guard
  if (!apiKey || !topic) {
    console.log("FETCH_LESSON blocked: missing apiKey or topic");
    sendResponse({ error: "Missing apiKey or topic." });
    return true;
  }

  // Get diversity hint based on content type
  let diversityHint;
  let prompt;

  if (contentType === "behavioral") {
    diversityHint = behavioralHints[behavioralIndex];
    behavioralIndex = (behavioralIndex + 1) % 10;

    prompt = `You write micro-influence ads. Your output replaces a banner ad on a webpage. Your job is to shift how someone thinks, feels, or sees themselves — not teach them a fact.

Format — return EXACTLY two lines, nothing else:
HEADLINE: [the statement — 5 to 8 words]
TAGLINE: [reinforcement — 8 to 15 words]

Topic: ${topic}
Style: ${diversityHint}

Rules:
- Headline is direct, second-person, identity-level.
- Tagline reinforces the headline emotionally or practically.
- Total must be under 25 words.
- Repetition is a feature. These should feel true every time someone sees them.
- No intros, no labels beyond HEADLINE/TAGLINE, no explanations.
- Write like a mantra on a billboard, not advice in a textbook.`;
  } else {
    // Default to educational
    diversityHint = educationalHints[educationalIndex];
    educationalIndex = (educationalIndex + 1) % 10;

    prompt = `You write micro-learning ads. Your output replaces a banner ad on a webpage.

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
  }

  console.log("Fetching lesson for topic:", topic, "type:", contentType);

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
        const text = data.content[0].text.trim()
          .replace(/\*\*(.+?)\*\*/g, "$1")
          .replace(/\*(.+?)\*/g, "$1")
          .replace(/^#{1,6}\s+/gm, "")
          .replace(/`(.+?)`/g, "$1")
          .trim();
        sendResponse({ lesson: text });
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
