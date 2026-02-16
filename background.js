// background.js - service worker

const POOL_SIZE = 30;
const POOL_KEY = "lessonPool";
const USED_KEY = "usedLessonIds";
const HISTORICAL_FACTS_KEY = "historicalFacts";
const MAX_HISTORICAL_FACTS = 30; // Keep last 30 facts (one generation) to avoid repeating
const PARALLEL_REQUESTS = 5; // Generate 5 lessons at a time (safer for rate limits)

// ── API fetch ─────────────────────────────────────────────────────────────────

// Tracks recently used facts so the model avoids repeating similar angles
const recentFacts = [];

// Classifies ad size into a word budget and style guidance
function getSizeGuidance(width, height) {
  const area = width * height;
  if (area < 30000) {
    // Small (e.g. 300x100) — pure hook, nothing else
    return { maxWords: 10, style: "Write a single punchy statement of 10 words or fewer. No verb required. Think billboard." };
  } else if (area < 80000) {
    // Medium (e.g. 300x250) — hook + one short sentence
    return { maxWords: 20, style: "Write one hook sentence of 20 words or fewer. Lead with the most surprising word. No buildup." };
  } else {
    // Large (e.g. 728x90, 970x250) — hook + one supporting sentence
    return { maxWords: 35, style: "Write two sentences, 35 words maximum total. First sentence is the hook. Second gives one concrete detail. No preamble." };
  }
}

async function fetchSingleLesson(apiKey, topic, width, height, lessonIndex, historicalFacts = []) {
  const { maxWords } = getSizeGuidance(width || 300, height || 250);

  // Build a strong diversity prompt using all historical facts
  const avoidClause = historicalFacts.length > 0
    ? " CRITICAL: You must pick a completely different subtopic/angle than these already-used facts: " +
      historicalFacts.map((f, i) => (i + 1) + ". " + f).join(" ") +
      " Do NOT write about the same concept or example mentioned above."
    : "";

  // Use lesson index to encourage diversity - each index focuses on different aspects
  const diversityHints = [
    "Write a key term or concept with its definition.",
    "Write a specific number, measurement, or quantifiable fact.",
    "Write a direct comparison between two related things.",
    "Write a quick-recall fact about a standard, version, or timeline.",
    "Write a list of 3-4 related items, components, or steps.",
    "Write a common problem or challenge with its key characteristic.",
    "Write a best practice, principle, or rule of thumb.",
    "Write a tool, method, or technique with its primary purpose.",
    "Write a foundational concept or framework overview.",
    "Write a practical example or real-world application."
  ];
  
  const diversityHint = diversityHints[lessonIndex % diversityHints.length];

  const prompt = `Write a single micro-learning fact about: ${topic}

Style: ${diversityHint}

Rules:
- Maximum ${maxWords} words total
- Focus on the technical content and core concepts, NOT information about the certification exam itself
- Write study material someone would need to know for practical understanding
- Use concrete facts: definitions, numbers, comparisons, lists, technical specifications
- Format like a flashcard: clear, direct, memorizable
- Lead with the most important information
- No labels, headers, or meta-text (like "HOOK:" or "KEY TERM:")
- Just write the fact itself as a single statement or sentence
- No introductory phrases or explanations

${avoidClause}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
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

  const data = await response.json();

  if (data.content && data.content[0] && data.content[0].text) {
    // Strip markdown formatting and collapse whitespace
    const raw = data.content[0].text.trim();
    const clean = raw
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\s*\n\s*/g, " ")
      .trim();
    return clean;
  } else if (data.error) {
    throw new Error(data.error.message || "API error");
  } else {
    throw new Error("Unexpected response format");
  }
}

// ── Pool generation with parallel requests ────────────────────────────────────

async function generatePool(apiKey, topics) {
  console.log("MicroLearn: generating pool of", POOL_SIZE, "lessons...");

  // Load historical facts from storage
  const storage = await chrome.storage.local.get([HISTORICAL_FACTS_KEY]);
  const historicalFacts = storage[HISTORICAL_FACTS_KEY] || [];
  
  console.log("MicroLearn: loaded", historicalFacts.length, "historical facts to avoid");

  const lessons = [];
  recentFacts.length = 0; // Clear recent facts at the start
  
  // Start with historical facts in the avoidance list
  const allFactsToAvoid = [...historicalFacts];
  
  // Generate lessons in batches of PARALLEL_REQUESTS
  for (let batchStart = 0; batchStart < POOL_SIZE; batchStart += PARALLEL_REQUESTS) {
    const batchSize = Math.min(PARALLEL_REQUESTS, POOL_SIZE - batchStart);
    const batchPromises = [];
    
    for (let i = 0; i < batchSize; i++) {
      const lessonIndex = batchStart + i;
      const topic = topics[lessonIndex % topics.length];
      
      // Pass the growing list of facts to avoid
      const promise = fetchSingleLesson(apiKey, topic, 970, 250, lessonIndex, allFactsToAvoid)
        .then(text => {
          console.log("MicroLearn: lesson", lessonIndex + 1, "of", POOL_SIZE, "generated");
          return { id: lessonIndex, topic: topic, text: text };
        })
        .catch(err => {
          console.error("MicroLearn: failed lesson", lessonIndex, "-", err.message);
          // Return null for failed lessons so we can filter them out
          return null;
        });
      
      batchPromises.push(promise);
    }
    
    // Wait for this batch to complete before starting the next
    const batchResults = await Promise.all(batchPromises);
    
    // Filter out null results (failed lessons)
    const successfulLessons = batchResults.filter(lesson => lesson !== null);
    lessons.push(...successfulLessons);
    
    // IMPORTANT: Add this batch's facts to the avoidance list for the next batch
    successfulLessons.forEach(lesson => {
      if (lesson && lesson.text) {
        allFactsToAvoid.push(lesson.text);
      }
    });
    
    console.log("MicroLearn: batch complete -", lessons.length, "successful lessons so far,", allFactsToAvoid.length, "facts to avoid for next batch");
  }

  // If we got at least some lessons, save them
  if (lessons.length > 0) {
    await chrome.storage.local.set({ [POOL_KEY]: lessons, [USED_KEY]: [] });
    
    // Replace historical facts with the new generation (just keep last 30)
    const newFacts = lessons.map(l => l.text);
    await chrome.storage.local.set({ [HISTORICAL_FACTS_KEY]: newFacts });
    
    console.log("MicroLearn: pool saved -", lessons.length, "lessons ready");
    console.log("MicroLearn: historical facts updated - storing", newFacts.length, "facts for next generation");
  } else {
    console.error("MicroLearn: no lessons generated successfully");
  }
  
  return lessons;
}

// ── Get N lessons in one atomic operation ─────────────────────────────────────
// Reads pool + used list once, picks N unique lessons, writes back once.
// If pool is exhausted, triggers auto-regeneration.

async function getLessons(count) {
  const data = await chrome.storage.local.get([POOL_KEY, USED_KEY]);
  const pool = data[POOL_KEY] || [];
  let used = data[USED_KEY] || [];

  console.log("MicroLearn: getLessons requested", count, "| pool:", pool.length, "| used:", used.length);

  if (pool.length === 0) {
    console.warn("MicroLearn: pool is empty, triggering regeneration");
    // Trigger regeneration in the background
    triggerAutoRegeneration();
    return [];
  }

  let available = pool.filter((l) => !used.includes(l.id));
  console.log("MicroLearn: available lessons:", available.length);

  // If not enough unused lessons, reset and use the full pool
  if (available.length < count) {
    console.log("MicroLearn: pool exhausted! All", pool.length, "lessons have been shown. Triggering auto-regeneration...");
    
    // Trigger regeneration in the background
    triggerAutoRegeneration();
    
    // Reset used list and continue with current pool for now
    used = [];
    available = [...pool];
  }

  // Shuffle available
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  // Pick exactly count lessons
  const picked = available.slice(0, count);
  const newUsed = [...used, ...picked.map((l) => l.id)];

  console.log("MicroLearn: picked", picked.length, "lessons, new used total:", newUsed.length);

  // Single write — no concurrent call can interleave here
  await chrome.storage.local.set({ [USED_KEY]: newUsed });

  // Return lessons with both text and topic
  return picked.map((l) => ({ text: l.text, topic: l.topic }));
}

// ── Auto-regeneration trigger ──────────────────────────────────────────────────

async function triggerAutoRegeneration() {
  console.log("MicroLearn: auto-regeneration triggered");
  
  // Get API key and topics from storage
  const result = await chrome.storage.sync.get(["apiKey", "topics", "subjects", "selectedSubjects", "groups", "activeGroupId"]);
  
  if (!result.apiKey) {
    console.warn("MicroLearn: cannot auto-regenerate - no API key set");
    return;
  }
  
  // Determine which topics to use (same logic as preferences.js Save button)
  let topicsToUse = [];
  
  if (result.selectedSubjects && result.selectedSubjects.length > 0) {
    topicsToUse = result.selectedSubjects;
  } else if (result.activeGroupId && result.groups) {
    const activeGroup = result.groups.find(g => g.id === result.activeGroupId);
    if (activeGroup) {
      topicsToUse = activeGroup.subjects;
    }
  } else if (result.topics && result.topics.length > 0) {
    // Fallback to old topics format
    topicsToUse = result.topics;
  }
  
  if (topicsToUse.length === 0) {
    console.warn("MicroLearn: cannot auto-regenerate - no topics selected");
    return;
  }
  
  console.log("MicroLearn: auto-regenerating with topics:", topicsToUse);
  console.log("MicroLearn: this will load historical facts to avoid repeating previous generation");
  
  // Generate new pool (this will load and use historical facts internally)
  try {
    await generatePool(result.apiKey, topicsToUse);
    console.log("MicroLearn: auto-regeneration complete!");
  } catch (err) {
    console.error("MicroLearn: auto-regeneration failed:", err.message);
  }
}

// ── Pool management ───────────────────────────────────────────────────────────

async function ensurePool(apiKey, topics) {
  if (!apiKey || !topics || topics.length === 0) {
    console.warn("MicroLearn: cannot generate pool - missing key or topics");
    return;
  }

  const data = await chrome.storage.local.get([POOL_KEY, "lastTopics", "lastApiKey"]);
  const pool = data[POOL_KEY] || [];
  const topicsChanged = JSON.stringify(data.lastTopics || []) !== JSON.stringify(topics);
  const keyChanged = (data.lastApiKey || "") !== apiKey;

  if (pool.length === 0 || topicsChanged || keyChanged) {
    console.log("MicroLearn: pool needs regeneration");
    await generatePool(apiKey, topics);
    await chrome.storage.local.set({ lastTopics: topics, lastApiKey: apiKey });
  } else {
    console.log("MicroLearn: pool is up to date");
  }
}

// ── Startup ───────────────────────────────────────────────────────────────────

chrome.storage.sync.get(["apiKey", "topics"], (result) => {
  if (result.apiKey && result.topics) {
    ensurePool(result.apiKey, result.topics);
  }
});

// ── Regenerate pool when settings change ──────────────────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.apiKey || changes.topics)) {
    chrome.storage.sync.get(["apiKey", "topics"], (result) => {
      if (result.apiKey && result.topics) {
        ensurePool(result.apiKey, result.topics);
      }
    });
  }
});

// ── Keep service worker alive ─────────────────────────────────────────────────

function keepAlive() {
  chrome.storage.local.get("keepAlive", () => {});
}
setInterval(keepAlive, 20000);

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log("MicroLearn: message received -", msg.type);

  if (msg.type === "FETCH_LESSONS") {
    const count = msg.count || 1;
    getLessons(count)
      .then((lessons) => {
        console.log("MicroLearn: sending", lessons.length, "lessons");
        sendResponse({ lessons: lessons });
      })
      .catch((err) => {
        console.error("MicroLearn: getLessons error -", err.message);
        sendResponse({ error: err.message });
      });
    return true;
  }

  if (msg.type === "REGENERATE_POOL") {
    const { apiKey, topics } = msg;
    if (!apiKey || !topics) {
      sendResponse({ error: "Missing apiKey or topics" });
      return true;
    }
    generatePool(apiKey, topics)
      .then(() => {
        chrome.storage.local.set({ lastTopics: topics, lastApiKey: apiKey });
        sendResponse({ success: true });
      })
      .catch((err) => {
        console.error("MicroLearn: regeneration failed -", err.message);
        sendResponse({ error: err.message });
      });
    return true;
  }

  return false;
});