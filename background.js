// background.js - service worker

const POOL_SIZE      = 30;
const POOL_KEY       = "lessonPool";
const USED_KEY       = "usedLessonIds";
const HISTORICAL_KEY = "historicalFacts";
const PARALLEL       = 5;

// ── Lesson Generation ─────────────────────────────────

async function fetchLesson(apiKey, topic, lessonIndex, historical = [], mentalHealth = false) {
  const recentFacts  = historical.slice(-10);
  const avoidClause  = recentFacts.length
    ? " CRITICAL: Pick a completely different angle than these: " +
      recentFacts.map((f, i) => `${i + 1}. ${f.slice(0, 50)}...`).join(" ")
    : "";

  const mentalHints = [
    "Cognitive reframe: State a negative thought, then reframe it positively.",
    "Share a normalizing mental health statistic.",
    "Describe a breathing exercise in exact steps.",
    "Give one sleep hygiene tip.",
    "Offer a self-compassion reminder.",
    "Teach a quick mindfulness technique.",
    "Share a stress management tip.",
    "Give an anxiety-reduction technique.",
    "Encourage social connection.",
    "Describe a grounding exercise."
  ];

  const learningHints = [
    "Key term with definition.",
    "Specific number or measurement.",
    "Direct comparison between two things.",
    "Quick-recall fact about a standard.",
    "List 3-4 related items.",
    "Common problem with key trait.",
    "Best practice or principle.",
    "Tool or technique with purpose.",
    "Foundational concept overview.",
    "Practical example or application."
  ];

  const hint = mentalHealth
    ? mentalHints[lessonIndex % mentalHints.length]
    : learningHints[lessonIndex % learningHints.length];

  const prompt = mentalHealth
    ? `${hint}\n\nRules:\n- EXACTLY 15 words or fewer\n- One sentence only\n- Direct and actionable\n- No fluff\n- Example: "Box breathing: Inhale 4s, hold 4s, exhale 4s, hold 4s."\n${avoidClause}`
    : `Micro-learning fact about: ${topic}\n\nStyle: ${hint}\n\nRules:\n- Max 35 words\n- Technical content, NOT exam info\n- Concrete facts: definitions, numbers, comparisons\n- Flashcard format: clear, direct\n- No labels or headers\n- Single statement\n${avoidClause}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  if (data?.content?.[0]?.text) {
    return data.content[0].text.trim()
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g,    "$1")
      .replace(/^#{1,6}\s+/gm,  "")
      .replace(/`(.+?)`/g,      "$1")
      .replace(/\s*\n\s*/g,     " ")
      .trim();
  }
  if (data?.error) throw new Error(data.error.message || "API error");
  throw new Error("Unexpected response format");
}

// ── Pool Management ───────────────────────────────────

async function generatePool(apiKey, topics, mentalHealth = false) {
  console.log("MicroLearn: generating pool of", POOL_SIZE, mentalHealth ? "mental health tips..." : "lessons...");

  const { [HISTORICAL_KEY]: historical = [] } = await chrome.storage.local.get(HISTORICAL_KEY);
  const allFacts = [...historical];
  const lessons  = [];

  for (let start = 0; start < POOL_SIZE; start += PARALLEL) {
    const batchSize = Math.min(PARALLEL, POOL_SIZE - start);
    const batch = await Promise.all(
      Array.from({ length: batchSize }, (_, i) => {
        const idx   = start + i;
        const topic = mentalHealth ? "Mental Health" : topics[idx % topics.length];
        return fetchLesson(apiKey, topic, idx, allFacts, mentalHealth)
          .then(text => {
            console.log("MicroLearn: lesson", idx + 1, "of", POOL_SIZE, "generated");
            return { id: idx, topic, text };
          })
          .catch(err => { console.error("MicroLearn: lesson", idx, "failed —", err.message); return null; });
      })
    );

    const ok = batch.filter(Boolean);
    lessons.push(...ok);
    ok.forEach(l => allFacts.push(l.text));
  }

  if (lessons.length > 0) {
    await chrome.storage.local.set({
      [POOL_KEY]:       lessons,
      [USED_KEY]:       [],
      [HISTORICAL_KEY]: lessons.map(l => l.text)
    });
    console.log("MicroLearn: pool saved —", lessons.length, "lessons ready");
  } else {
    console.error("MicroLearn: no lessons generated");
  }

  return lessons;
}

async function getLessons(count) {
  const { [POOL_KEY]: pool = [], [USED_KEY]: used = [] } = await chrome.storage.local.get([POOL_KEY, USED_KEY]);

  if (pool.length === 0) {
    console.warn("MicroLearn: pool empty, triggering regeneration");
    triggerAutoRegeneration();
    return [];
  }

  let available  = pool.filter(l => !used.includes(l.id));
  let currentUsed = used;

  if (available.length < count) {
    console.log("MicroLearn: pool exhausted, triggering regeneration");
    triggerAutoRegeneration();
    currentUsed = [];
    available   = [...pool];
  }

  // Fisher-Yates shuffle
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  const picked = available.slice(0, count);
  await chrome.storage.local.set({ [USED_KEY]: [...currentUsed, ...picked.map(l => l.id)] });
  return picked.map(l => ({ text: l.text, topic: l.topic }));
}

async function ensurePool(apiKey, topics) {
  if (!apiKey || !topics?.length) return;
  const { [POOL_KEY]: pool = [], lastTopics, lastApiKey } = await chrome.storage.local.get([POOL_KEY, "lastTopics", "lastApiKey"]);

  if (pool.length === 0 || JSON.stringify(lastTopics) !== JSON.stringify(topics) || lastApiKey !== apiKey) {
    await generatePool(apiKey, topics);
    await chrome.storage.local.set({ lastTopics: topics, lastApiKey: apiKey });
  }
}

// ── Auto-Regeneration ─────────────────────────────────

async function triggerAutoRegeneration() {
  const result = await chrome.storage.sync.get(["apiKey", "selectedSubjects", "groups", "activeGroupId", "isMentalHealthMode"]);
  if (!result.apiKey) { console.warn("MicroLearn: no API key for auto-regen"); return; }

  if (result.isMentalHealthMode === true) {
    await generatePool(result.apiKey, ["Mental Health"], true).catch(err => console.error("MicroLearn: auto-regen failed —", err.message));
    return;
  }

  let topics = result.selectedSubjects?.length ? result.selectedSubjects : [];
  if (!topics.length && result.activeGroupId && result.groups) {
    const g = result.groups.find(g => g.id === result.activeGroupId);
    if (g) topics = g.subjects;
  }

  if (!topics.length) { console.warn("MicroLearn: no topics for auto-regen"); return; }
  await generatePool(result.apiKey, topics, false).catch(err => console.error("MicroLearn: auto-regen failed —", err.message));
}

// ── Init ──────────────────────────────────────────────

chrome.storage.sync.get(["apiKey", "topics"], ({ apiKey, topics }) => {
  if (apiKey && topics) ensurePool(apiKey, topics);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.apiKey || changes.topics)) {
    chrome.storage.sync.get(["apiKey", "topics"], ({ apiKey, topics }) => {
      if (apiKey && topics) ensurePool(apiKey, topics);
    });
  }
});

// Keep service worker alive
setInterval(() => chrome.storage.local.get("keepAlive", () => {}), 20000);

// ── Message Handler ───────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "FETCH_LESSONS") {
    getLessons(msg.count || 1)
      .then(lessons => sendResponse({ lessons }))
      .catch(err    => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === "REGENERATE_POOL") {
    const { apiKey, topics, isMentalHealthMode } = msg;
    if (!apiKey || !topics) { sendResponse({ error: "Missing apiKey or topics" }); return true; }
    generatePool(apiKey, topics, isMentalHealthMode || false)
      .then(() => {
        chrome.storage.local.set({ lastTopics: topics, lastApiKey: apiKey });
        sendResponse({ success: true });
      })
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }
});