// background.js - service worker (MV3)
// Generates and serves a structured "insight stream" to content scripts.
// Keeps CCNA/Security+/Custom topics and Mental Health mode.

const API_URL = "https://api.anthropic.com/v1/messages";

const DEFAULT_STREAM_SIZE = 20;
const GENERATION_BATCH = 5;

const LS = {
  streamItems: "ml_stream_items",
  streamIndex: "ml_stream_index",
  streamMeta: "ml_stream_meta", // { topicsHash, isMentalHealthMode, createdAt, size }
  metrics: "ml_metrics" // { dayKey, insightsToday, insightsThisWeek, weekKey }
};

function dayKey(d = new Date()) {
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function weekKey(d = new Date()) {
  // ISO-ish week key: YYYY-W## (good enough for lightweight stats)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function hashTopics(topics = []) {
  return topics
    .map(t => String(t).trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join("|");
}

async function fetchInsight({ apiKey, topic, isMentalHealthMode }) {
  // Short, professional tone. One or two sentences max.
  const prompt = isMentalHealthMode
    ? (
        "Write one short, supportive mental health micro-tip. " +
        "Tone: calm, practical, non-judgmental. " +
        "No disclaimers. No crisis content. " +
        "1–2 sentences."
      )
    : (
        "Give one concise, high-signal micro-learning insight about: " +
        topic +
        ". " +
        "1–2 sentences max. " +
        "No headers, no bullet points, no extra text."
      );

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  if (data?.content?.[0]?.text) {
    return data.content[0].text.trim();
  }
  if (data?.error?.message) throw new Error(data.error.message);
  throw new Error("Unexpected response format");
}

async function getLocal(keys) {
  return await chrome.storage.local.get(keys);
}

async function setLocal(obj) {
  return await chrome.storage.local.set(obj);
}

async function ensureMetrics() {
  const now = new Date();
  const dk = dayKey(now);
  const wk = weekKey(now);

  const { [LS.metrics]: m } = await getLocal([LS.metrics]);
  let metrics = m || { dayKey: dk, insightsToday: 0, weekKey: wk, insightsThisWeek: 0 };

  if (metrics.dayKey !== dk) {
    metrics.dayKey = dk;
    metrics.insightsToday = 0;
  }

  if (metrics.weekKey !== wk) {
    metrics.weekKey = wk;
    metrics.insightsThisWeek = 0;
  }

  await setLocal({ [LS.metrics]: metrics });
  return metrics;
}

async function incrementInsightCounters() {
  const metrics = await ensureMetrics();
  metrics.insightsToday += 1;
  metrics.insightsThisWeek += 1;
  await setLocal({ [LS.metrics]: metrics });
  return metrics;
}

async function getStreamState() {
  const res = await getLocal([LS.streamItems, LS.streamIndex, LS.streamMeta]);
  return {
    items: Array.isArray(res[LS.streamItems]) ? res[LS.streamItems] : [],
    index: typeof res[LS.streamIndex] === "number" ? res[LS.streamIndex] : 0,
    meta: res[LS.streamMeta] || null
  };
}

async function resetStream({ topicsHash, isMentalHealthMode, size }) {
  await setLocal({
    [LS.streamItems]: [],
    [LS.streamIndex]: 0,
    [LS.streamMeta]: {
      topicsHash,
      isMentalHealthMode: !!isMentalHealthMode,
      createdAt: Date.now(),
      size
    }
  });
}

function pickSequentialTopic(topics, i) {
  if (!topics.length) return "General";
  return topics[i % topics.length];
}

async function generateStream({ apiKey, topics, isMentalHealthMode, size = DEFAULT_STREAM_SIZE }) {
  const topicsHash = hashTopics(isMentalHealthMode ? ["Mental Health"] : topics);

  await resetStream({ topicsHash, isMentalHealthMode, size });

  const items = [];
  for (let offset = 0; offset < size; offset += GENERATION_BATCH) {
    const batchCount = Math.min(GENERATION_BATCH, size - offset);
    const batchTopics = Array.from({ length: batchCount }, (_, k) =>
      isMentalHealthMode ? "Mental Health" : pickSequentialTopic(topics, offset + k)
    );

    const results = await Promise.all(
      batchTopics.map(async (topic) => {
        const text = await fetchInsight({ apiKey, topic, isMentalHealthMode });
        return { topic, text };
      })
    );

    items.push(...results);
    await setLocal({ [LS.streamItems]: items });
  }

  return { success: true, size: items.length };
}

async function ensureStreamValid({ apiKey, topics, isMentalHealthMode }) {
  const { items, index, meta } = await getStreamState();
  const expectedHash = hashTopics(isMentalHealthMode ? ["Mental Health"] : topics);
  const expectedMode = !!isMentalHealthMode;

  const stale = !meta || meta.topicsHash !== expectedHash || meta.isMentalHealthMode !== expectedMode;
  const empty = items.length === 0;

  if (stale || empty) {
    await generateStream({ apiKey, topics, isMentalHealthMode, size: DEFAULT_STREAM_SIZE });
    const fresh = await getStreamState();
    return fresh;
  }

  // If consumed, regenerate.
  if (index >= items.length) {
    await generateStream({ apiKey, topics, isMentalHealthMode, size: DEFAULT_STREAM_SIZE });
    const fresh = await getStreamState();
    return fresh;
  }

  return { items, index, meta };
}

async function getNextInsight({ apiKey, topics, isMentalHealthMode }) {
  const state = await ensureStreamValid({ apiKey, topics, isMentalHealthMode });
  const { items } = state;
  let { index } = state;

  const next = items[index];
  index += 1;

  await setLocal({ [LS.streamIndex]: index });
  const metrics = await ensureMetrics();

  return {
    insight: next,
    stream: { index, size: items.length },
    metrics
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (!msg || !msg.type) return;

      if (msg.type === "FETCH_NEXT_INSIGHT") {
        const { apiKey, topics, isMentalHealthMode } = msg;
        if (!apiKey) {
          sendResponse({ error: "Missing API key." });
          return;
        }
        if (!isMentalHealthMode && (!Array.isArray(topics) || topics.length === 0)) {
          sendResponse({ error: "No topics selected." });
          return;
        }

        const payload = await getNextInsight({ apiKey, topics, isMentalHealthMode });
        sendResponse(payload);
        return;
      }

      if (msg.type === "REGENERATE_STREAM") {
        const { apiKey, topics, isMentalHealthMode } = msg;
        if (!apiKey) {
          sendResponse({ success: false, error: "Missing API key." });
          return;
        }
        if (!isMentalHealthMode && (!Array.isArray(topics) || topics.length === 0)) {
          sendResponse({ success: false, error: "No topics selected." });
          return;
        }

        const res = await generateStream({ apiKey, topics, isMentalHealthMode, size: DEFAULT_STREAM_SIZE });
        const metrics = await ensureMetrics();
        sendResponse({ ...res, metrics });
        return;
      }

      if (msg.type === "INSIGHT_SHOWN") {
        const metrics = await incrementInsightCounters();
        sendResponse({ success: true, metrics });
        return;
      }

      if (msg.type === "GET_METRICS") {
        const metrics = await ensureMetrics();
        const { items, index } = await getStreamState();
        sendResponse({
          success: true,
          metrics,
          stream: { index, size: items.length }
        });
        return;
      }
    } catch (e) {
      sendResponse({ success: false, error: e?.message || String(e) });
    }
  })();

  return true;
});
