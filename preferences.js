// preferences.js

// ── SVG Icons ────────────────────────────────────────
const ICON_SUN   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
const ICON_MOON  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
const ICON_GEAR  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>';
const ICON_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

// ── DOM References ────────────────────────────────────
const settingsBtn         = document.getElementById("settingsBtn");
const themeToggleBtn      = document.getElementById("themeToggleBtn");
const topicSelection      = document.getElementById("topicSelection");
const groupList           = document.getElementById("groupList");
const subjectsList        = document.getElementById("subjectsList");
const addSubjectInput     = document.getElementById("addSubjectInput");
const addSubjectBtn       = document.getElementById("addSubjectBtn");
const createGroupBtn      = document.getElementById("createGroupBtn");
const saveBtn             = document.getElementById("saveBtn");
const saveStatus          = document.getElementById("saveStatus");
const modalOverlay        = document.getElementById("modalOverlay");
const modalClose          = document.getElementById("modalClose");
const modalTitle          = document.getElementById("modalTitle");
const modalBody           = document.getElementById("modalBody");
const modalActions        = document.getElementById("modalActions");
const learningPathSection = document.getElementById("learningPathSection");
const ccnaTab             = document.getElementById("ccnaTab");
const securityPlusTab     = document.getElementById("securityPlusTab");
const customTab           = document.getElementById("customTab");
const modeOptionLeft          = document.getElementById("modeOptionLeft");
const modeOptionRight         = document.getElementById("modeOptionRight");
const modeCheckLeft           = document.getElementById("modeCheckLeft");
const modeCheckRight          = document.getElementById("modeCheckRight");
const subjectCounter          = document.getElementById("subjectCounter");
const behavioralPathSection   = document.getElementById("behavioralPathSection");
const stressTab               = document.getElementById("stressTab");
const financialTab            = document.getElementById("financialTab");
const behavioralCustomTab     = document.getElementById("behavioralCustomTab");
const dashBigNumber           = document.getElementById("dashBigNumber");
const dashToday               = document.getElementById("dashToday");
const dashWeekly              = document.getElementById("dashWeekly");
const dashMonthly             = document.getElementById("dashMonthly");
const dashTopicsList          = document.getElementById("dashTopicsList");

// Inject SVG icons into header buttons
settingsBtn.innerHTML    = ICON_GEAR;
themeToggleBtn.innerHTML = ICON_MOON;
modeCheckLeft.innerHTML  = ICON_CHECK;
modeCheckRight.innerHTML = ICON_CHECK;

// ── Topic Lists ───────────────────────────────────────
const DEFAULT_SUBJECTS = [
  "History", "Science", "Math", "Geography", "Psychology",
  "Philosophy", "Biology", "Physics", "Economics",
  "Technology", "Literature", "Art"
];

const CCNA_TOPICS = [
  "IPv4 Subnetting & VLSM",
  "OSI Model & TCP/IP Stack",
  "VLANs & VLAN Trunking (802.1Q)",
  "Spanning Tree Protocol (STP/RSTP)",
  "OSPF Single-Area Configuration",
  "IPv6 Addressing & Configuration",
  "Static & Dynamic Routing",
  "NAT & PAT",
  "ACLs (Standard & Extended)",
  "DHCP & DNS Operations",
  "Wireless LAN (802.11 & WLC)",
  "Network Security Fundamentals (AAA, SSH, Port Security)",
  "EtherChannel & Link Aggregation",
  "Network Automation & REST APIs",
  "Cloud & Virtualization Concepts"
];

const SECURITY_PLUS_TOPICS = [
  "Cryptography & PKI",
  "Identity & Access Management (IAM)",
  "Network Security Architecture",
  "Threat Intelligence & Threat Actors",
  "Malware Types & Attack Techniques",
  "Vulnerability Scanning & Penetration Testing",
  "Incident Response Procedures",
  "Security Information & Event Management (SIEM)",
  "Zero Trust & Security Controls",
  "Cloud Security & Shared Responsibility",
  "Application Security & Secure Coding",
  "Risk Management & Compliance Frameworks",
  "Wireless & Mobile Security",
  "Data Privacy & Legal Regulations",
  "Physical Security & Social Engineering"
];

const BEHAVIORAL_PATHS = {
  stress: {
    label: "Stress & Resilience",
    topics: [
      "Box Breathing", "Cognitive Reframing", "Progressive Muscle Relaxation",
      "Grounding Techniques", "Boundary Setting", "Sleep Hygiene",
      "Mindful Awareness", "Gratitude Practice", "Self-Compassion"
    ]
  },
  finance: {
    label: "Financial Habits",
    topics: [
      "Budgeting Basics", "Saving Strategies", "Debt Management",
      "Impulse Spending Awareness", "Emergency Fund Building",
      "Credit Score Fundamentals", "Needs vs. Wants",
      "Compound Interest", "Subscription Auditing"
    ]
  },
  "custom-beh": {
    label: "Custom",
    topics: [
      "Physical Activity", "Healthy Eating", "Hydration Habits",
      "Screen Time Balance", "Social Connection", "Journaling",
      "Time Management", "Positive Self-Talk", "Goal Setting"
    ]
  }
};

// ── Selection Limit ──────────────────────────────────
const MAX_SUBJECTS = 5;

// ── State ─────────────────────────────────────────────
let subjects                 = [...DEFAULT_SUBJECTS];
let customEducationalSubjects = [...DEFAULT_SUBJECTS];
let selectedSubjects         = [];
let activeGroupId            = null;
let isMentalHealthMode       = false;
let selectedBehavioralTopics = [...BEHAVIORAL_PATHS.stress.topics.slice(0, MAX_SUBJECTS)];
let apiKey                   = "";
let learningPath             = "ccna";

// Groups are shared across all paths within each content mode.
let educationalGroups = [];
let behavioralGroups  = [];

function getCurrentGroups()    { return isMentalHealthMode ? behavioralGroups : educationalGroups; }
function setCurrentGroups(arr) { if (isMentalHealthMode) behavioralGroups = arr; else educationalGroups = arr; }

// ── Behavioral path state ────────────────────────────
let behavioralPath           = "stress";
let behavioralCustomSubjects = [...BEHAVIORAL_PATHS["custom-beh"].topics];

function renderCurrentSubjects() {
  isMentalHealthMode ? renderBehavioralSubjects() : renderSubjects();
}

// ── Focus Trap for Modal ──────────────────────────────
// WCAG 2.4.3: focus must be moved into modal when it opens and
// restored to the trigger when it closes.
let _modalTrigger = null;

function getFocusableEls(container) {
  return [...container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
  )];
}

// ── Modal Helpers ─────────────────────────────────────
function openModal(title, bodyHTML, actionsHTML, triggerEl) {
  modalTitle.textContent = title;
  modalBody.innerHTML    = bodyHTML;
  modalActions.innerHTML = actionsHTML;

  // WCAG 4.1.2: remove aria-hidden so AT can see the dialog
  modalOverlay.setAttribute("aria-hidden", "false");
  modalOverlay.classList.add("open");

  // WCAG 2.4.3: save trigger, move focus to first focusable element in modal
  _modalTrigger = triggerEl || document.activeElement;
  const first = getFocusableEls(modalOverlay)[0];
  if (first) first.focus();

  // WCAG 2.1.1: trap Tab/Shift+Tab inside modal
  modalOverlay.addEventListener("keydown", trapFocus);

  // WCAG 2.1.1: Escape closes modal
  modalOverlay.addEventListener("keydown", escClose);
}

function closeModal() {
  modalOverlay.classList.remove("open");
  modalOverlay.setAttribute("aria-hidden", "true");
  modalOverlay.removeEventListener("keydown", trapFocus);
  modalOverlay.removeEventListener("keydown", escClose);
  modalBody.innerHTML    = "";
  modalActions.innerHTML = "";

  // WCAG 2.4.3: return focus to the element that opened the modal
  if (_modalTrigger && typeof _modalTrigger.focus === "function") {
    _modalTrigger.focus();
  }
  _modalTrigger = null;
}

function trapFocus(e) {
  if (e.key !== "Tab") return;
  const focusable = getFocusableEls(modalOverlay);
  if (!focusable.length) { e.preventDefault(); return; }
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
  }
}

function escClose(e) {
  if (e.key === "Escape") closeModal();
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });

// ── API Settings Modal ────────────────────────────────
function showAPISettingsModal() {
  openModal(
    "API Settings",
    `<p class="api-settings-hint">Enter your Anthropic API key to generate lessons.</p>
     ${apiKey ? `<div class="api-key-status">
       <span class="api-key-masked" aria-label="API key connected">●●●●●●●●●●●●</span>
       <span class="api-key-connected">✓ Connected</span>
     </div>` : ""}
     <label for="apiKeyModalInput" class="modal-hint">API Key</label>
     <input type="password" class="text-input" id="apiKeyModalInput"
       placeholder="sk-ant-..." value="${apiKey}"
       autocomplete="off" spellcheck="false"
       aria-describedby="apiStatusModal" />
     <div id="apiStatusModal" class="api-status" role="alert" aria-live="assertive"></div>`,
    `<button class="modal-btn secondary" id="cancelAPISettings">Cancel</button>
     <button class="modal-btn primary"   id="saveAPISettings">Save</button>`,
    settingsBtn
  );

  document.getElementById("cancelAPISettings").addEventListener("click", closeModal);
  document.getElementById("saveAPISettings").addEventListener("click", () => {
    const key    = document.getElementById("apiKeyModalInput").value.trim();
    const status = document.getElementById("apiStatusModal");
    if (!key) {
      status.textContent = "Please enter an API key.";
      status.className   = "api-status error";
      document.getElementById("apiKeyModalInput").focus();
      return;
    }
    if (!key.startsWith("sk-ant-")) {
      status.textContent = "Key should start with sk-ant-…";
      status.className   = "api-status error";
      document.getElementById("apiKeyModalInput").focus();
      return;
    }
    apiKey = key;
    chrome.storage.sync.set({ apiKey: key }, closeModal);
  });
}

settingsBtn.addEventListener("click", showAPISettingsModal);

// ── Theme Toggle ──────────────────────────────────────
let currentTheme = "light";

function applyTheme(theme) {
  currentTheme = theme;
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggleBtn.innerHTML  = ICON_SUN;
    themeToggleBtn.setAttribute("aria-label", "Switch to light theme");
  } else {
    document.documentElement.removeAttribute("data-theme");
    themeToggleBtn.innerHTML  = ICON_MOON;
    themeToggleBtn.setAttribute("aria-label", "Switch to dark theme");
  }
  chrome.storage.sync.set({ extensionTheme: theme });
}

themeToggleBtn.addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

// ── Learning Path Tabs ────────────────────────────────
function switchLearningPath(path) {
  learningPath = path;

  // WCAG 4.1.2: sync aria-selected on all ed path tabs
  [ccnaTab, securityPlusTab, customTab].forEach(t => {
    t.classList.remove("active");
    t.setAttribute("aria-selected", "false");
  });

  if (path === "ccna") {
    ccnaTab.classList.add("active");
    ccnaTab.setAttribute("aria-selected", "true");
    subjects         = [...CCNA_TOPICS];
    selectedSubjects = CCNA_TOPICS.slice(0, MAX_SUBJECTS);
  } else if (path === "security+") {
    securityPlusTab.classList.add("active");
    securityPlusTab.setAttribute("aria-selected", "true");
    subjects         = [...SECURITY_PLUS_TOPICS];
    selectedSubjects = SECURITY_PLUS_TOPICS.slice(0, MAX_SUBJECTS);
  } else {
    customTab.classList.add("active");
    customTab.setAttribute("aria-selected", "true");
    subjects         = [...customEducationalSubjects];
    selectedSubjects = [];
  }

  activeGroupId = null;
  updateAddSubjectVisibility();
  renderSubjects();
  renderGroups();
}

ccnaTab.addEventListener("click",         () => switchLearningPath("ccna"));
securityPlusTab.addEventListener("click", () => switchLearningPath("security+"));
customTab.addEventListener("click",       () => switchLearningPath("custom"));

// ── Behavioral Path Tabs ─────────────────────────────
function switchBehavioralPath(path) {
  behavioralPath = path;

  // WCAG 4.1.2: sync aria-selected on all beh path tabs
  [stressTab, financialTab, behavioralCustomTab].forEach(t => {
    t.classList.remove("active");
    t.setAttribute("aria-selected", "false");
  });

  if (path === "stress") {
    stressTab.classList.add("active");
    stressTab.setAttribute("aria-selected", "true");
    selectedBehavioralTopics = [...BEHAVIORAL_PATHS.stress.topics.slice(0, MAX_SUBJECTS)];
  } else if (path === "finance") {
    financialTab.classList.add("active");
    financialTab.setAttribute("aria-selected", "true");
    selectedBehavioralTopics = [...BEHAVIORAL_PATHS.finance.topics.slice(0, MAX_SUBJECTS)];
  } else {
    behavioralCustomTab.classList.add("active");
    behavioralCustomTab.setAttribute("aria-selected", "true");
    selectedBehavioralTopics = [];
  }

  activeGroupId = null;
  updateAddSubjectVisibility();
  renderBehavioralSubjects();
  renderGroups();
}

stressTab.addEventListener("click",           () => switchBehavioralPath("stress"));
financialTab.addEventListener("click",        () => switchBehavioralPath("finance"));
behavioralCustomTab.addEventListener("click", () => switchBehavioralPath("custom-beh"));

// ── Add-Subject Visibility ────────────────────────────
function updateAddSubjectVisibility() {
  const isCustomPath = isMentalHealthMode
    ? (behavioralPath === "custom-beh")
    : (learningPath === "custom");
  document.querySelector(".add-subject-row").style.display = isCustomPath ? "flex" : "none";
}

// ── Mode Toggle ───────────────────────────────────────
function updateModeUI() {
  // WCAG 4.1.2: update aria-pressed on both mode buttons
  modeOptionLeft.classList.toggle("active",  !isMentalHealthMode);
  modeOptionLeft.setAttribute("aria-pressed",  String(!isMentalHealthMode));
  modeOptionRight.classList.toggle("active",  isMentalHealthMode);
  modeOptionRight.setAttribute("aria-pressed", String(isMentalHealthMode));

  // Show/hide the correct path tabs
  learningPathSection.style.display   = isMentalHealthMode ? "none" : "";
  behavioralPathSection.style.display = isMentalHealthMode ? ""     : "none";

  // Topic selection stays enabled in both modes
  topicSelection.classList.remove("disabled");

  updateAddSubjectVisibility();

  // Create group button available in all paths
  document.getElementById("createGroupBtn").style.display = "block";

  if (isMentalHealthMode) {
    renderBehavioralSubjects();
  } else {
    renderSubjects();
  }
  renderGroups();
}

modeOptionLeft.addEventListener("click",  () => { isMentalHealthMode = false; updateModeUI(); });
modeOptionRight.addEventListener("click", () => { isMentalHealthMode = true;  updateModeUI(); });

// ── Subject Counter ──────────────────────────────────
function updateSubjectCounter() {
  const count = isMentalHealthMode ? selectedBehavioralTopics.length : selectedSubjects.length;
  if (subjectCounter) {
    subjectCounter.textContent = `${count} / ${MAX_SUBJECTS}`;
    subjectCounter.classList.toggle("full", count >= MAX_SUBJECTS);
  }
}

// ── Render Subjects ───────────────────────────────────
function renderSubjects() {
  subjectsList.innerHTML = "";

  let displaySubjects = subjects;
  if (activeGroupId) {
    const g = getCurrentGroups().find(g => g.id === activeGroupId);
    if (g?.subjects?.length) displaySubjects = g.subjects;
  }

  if (!displaySubjects.length) {
    const empty = document.createElement("div");
    empty.className   = "subject-empty";
    empty.textContent = "No subjects yet";
    subjectsList.appendChild(empty);
    return;
  }

  const atLimit = selectedSubjects.length >= MAX_SUBJECTS;

  displaySubjects.forEach(subject => {
    const isSelected = selectedSubjects.includes(subject);

    // WCAG 2.1.1 / 4.1.2: each subject is a <button> so it receives
    // keyboard focus and has an implicit role of "button".
    const btn = document.createElement("button");
    btn.type      = "button";
    btn.className = "subject-item"
      + (isSelected ? " selected" : "")
      + (!isSelected && atLimit ? " at-limit" : "");

    // WCAG 4.1.2: communicate selected state to AT
    btn.setAttribute("aria-pressed", String(isSelected));

    // WCAG 1.4.3 / 4.1.2: mark unavailable items so AT can describe them
    if (!isSelected && atLimit) {
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("tabindex", "-1");
    }

    if (isSelected) {
      const check = document.createElement("span");
      check.className = "check-icon";
      check.innerHTML = ICON_CHECK;
      btn.appendChild(check);
    }

    const name = document.createElement("span");
    name.className   = "subject-item-name";
    name.textContent = subject;
    btn.appendChild(name);

    btn.addEventListener("click", () => toggleSubjectSelection(subject));

    if (!activeGroupId && learningPath === "custom") {
      const removeBtn = document.createElement("button");
      removeBtn.type      = "button";
      removeBtn.className = "subject-remove-btn";
      removeBtn.textContent = "\u2715";
      removeBtn.setAttribute("aria-label", `Remove ${subject}`);
      removeBtn.addEventListener("click", e => {
        e.stopPropagation();
        if (getCurrentGroups().some(g => g.subjects.includes(subject))) {
          showInlineError(`Cannot remove "${subject}" — it's used in a group.`);
          return;
        }
        subjects         = subjects.filter(s => s !== subject);
        selectedSubjects = selectedSubjects.filter(s => s !== subject);
        customEducationalSubjects = [...subjects];
        renderSubjects();
      });
      btn.appendChild(removeBtn);
    }
    subjectsList.appendChild(btn);
  });

  updateSubjectCounter();
}

// ── Render Behavioral Subjects ────────────────────────
function renderBehavioralSubjects() {
  subjectsList.innerHTML = "";

  let subjectList;
  if (activeGroupId) {
    const g = getCurrentGroups().find(g => g.id === activeGroupId);
    if (g) subjectList = g.subjects;
  }
  if (!subjectList) {
    subjectList = behavioralPath === "custom-beh"
      ? behavioralCustomSubjects
      : (BEHAVIORAL_PATHS[behavioralPath]?.topics || []);
  }

  if (!subjectList.length) {
    const empty = document.createElement("div");
    empty.className   = "subject-empty";
    empty.textContent = "No subjects yet";
    subjectsList.appendChild(empty);
    return;
  }

  const atLimit = selectedBehavioralTopics.length >= MAX_SUBJECTS;

  subjectList.forEach(topic => {
    const isSelected = selectedBehavioralTopics.includes(topic);

    const btn = document.createElement("button");
    btn.type      = "button";
    btn.className = "subject-item"
      + (isSelected ? " selected" : "")
      + (!isSelected && atLimit ? " at-limit" : "");
    btn.setAttribute("aria-pressed", String(isSelected));
    if (!isSelected && atLimit) {
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("tabindex", "-1");
    }

    if (isSelected) {
      const check = document.createElement("span");
      check.className = "check-icon";
      check.innerHTML = ICON_CHECK;
      btn.appendChild(check);
    }

    const name = document.createElement("span");
    name.className   = "subject-item-name";
    name.textContent = topic;

    btn.addEventListener("click", () => {
      activeGroupId = null;
      if (selectedBehavioralTopics.includes(topic)) {
        if (selectedBehavioralTopics.length > 1) {
          selectedBehavioralTopics = selectedBehavioralTopics.filter(t => t !== topic);
        }
      } else if (selectedBehavioralTopics.length < MAX_SUBJECTS) {
        selectedBehavioralTopics = [...selectedBehavioralTopics, topic];
      }
      renderBehavioralSubjects();
      renderGroups();
    });

    if (!activeGroupId && behavioralPath === "custom-beh") {
      const removeBtn = document.createElement("button");
      removeBtn.type      = "button";
      removeBtn.className = "subject-remove-btn";
      removeBtn.textContent = "\u2715";
      removeBtn.setAttribute("aria-label", `Remove ${topic}`);
      removeBtn.addEventListener("click", e => {
        e.stopPropagation();
        behavioralCustomSubjects = behavioralCustomSubjects.filter(s => s !== topic);
        selectedBehavioralTopics = selectedBehavioralTopics.filter(s => s !== topic);
        renderBehavioralSubjects();
      });
      btn.appendChild(name);
      btn.appendChild(removeBtn);
    } else {
      btn.appendChild(name);
    }

    subjectsList.appendChild(btn);
  });

  updateSubjectCounter();
}

// ── Toggle Subject Selection ──────────────────────────
function toggleSubjectSelection(subject) {
  activeGroupId = null;
  if (selectedSubjects.includes(subject)) {
    selectedSubjects = selectedSubjects.filter(s => s !== subject);
  } else if (selectedSubjects.length < MAX_SUBJECTS) {
    selectedSubjects = [...selectedSubjects, subject];
  }
  renderSubjects();
  renderGroups();
}

// ── Inline Error Helper ───────────────────────────────
// WCAG 3.3.1: surfaces errors without alert() dialogs.
function showInlineError(msg) {
  showSaveStatus(msg, "error");
}

// ── Add Subject ───────────────────────────────────────
function addSubject() {
  const val = addSubjectInput.value.trim();
  if (!val) return;

  if (isMentalHealthMode && behavioralPath === "custom-beh") {
    if (behavioralCustomSubjects.includes(val)) {
      showInlineError(`"${val}" is already in your library.`);
      addSubjectInput.focus();
      return;
    }
    behavioralCustomSubjects.push(val);
    addSubjectInput.value = "";
    renderBehavioralSubjects();
  } else {
    if (subjects.includes(val)) {
      showInlineError(`"${val}" is already in your library.`);
      addSubjectInput.focus();
      return;
    }
    subjects.push(val);
    customEducationalSubjects = [...subjects];
    addSubjectInput.value = "";
    renderSubjects();
  }
}

addSubjectBtn.addEventListener("click", addSubject);
addSubjectInput.addEventListener("keydown", e => { if (e.key === "Enter") addSubject(); });

// ── Render Groups ─────────────────────────────────────
function renderGroups() {
  groupList.innerHTML = "";
  const groups = getCurrentGroups();

  if (!groups.length) {
    groupList.innerHTML = '<li class="group-empty">No groups yet</li>';
    return;
  }

  groups.forEach(group => {
    const li = document.createElement("li");

    // WCAG 2.1.1 / 4.1.2: use <button> as the interactive element so it
    // gets keyboard focus, click-on-Enter, and a button role for AT.
    const btn = document.createElement("button");
    btn.type      = "button";
    btn.className = "group-item" + (group.id === activeGroupId ? " active" : "");
    btn.setAttribute("aria-pressed", String(group.id === activeGroupId));

    const content = document.createElement("div");
    content.className = "group-item-content";

    const nameSpan = document.createElement("div");
    nameSpan.className   = "group-name";
    nameSpan.textContent = group.name;

    const topicsSpan = document.createElement("div");
    topicsSpan.className   = "group-topics";
    topicsSpan.textContent = group.subjects.length
      ? group.subjects.join(", ")
      : "No subjects selected";
    topicsSpan.setAttribute("title", topicsSpan.textContent);

    content.appendChild(nameSpan);
    content.appendChild(topicsSpan);

    btn.appendChild(content);
    btn.addEventListener("click", () => {
      if (activeGroupId === group.id) {
        activeGroupId = null;
        if (isMentalHealthMode) {
          const pathTopics = behavioralPath === "custom-beh"
            ? behavioralCustomSubjects
            : (BEHAVIORAL_PATHS[behavioralPath]?.topics || []);
          selectedBehavioralTopics = pathTopics.slice(0, MAX_SUBJECTS);
        } else {
          selectedSubjects = subjects.slice(0, MAX_SUBJECTS);
        }
      } else {
        activeGroupId = group.id;
        if (isMentalHealthMode) {
          selectedBehavioralTopics = [...group.subjects];
        } else {
          selectedSubjects = [...group.subjects];
        }
      }
      renderGroups();
      renderCurrentSubjects();
    });

    const ellipsis = document.createElement("button");
    ellipsis.type      = "button";
    ellipsis.className = "group-ellipsis";
    ellipsis.textContent = "\u00B7\u00B7\u00B7";
    // WCAG 4.1.2: icon-only button needs accessible name
    ellipsis.setAttribute("aria-label", `Options for ${group.name}`);
    ellipsis.addEventListener("click", e => {
      e.stopPropagation();
      showGroupActions(group, ellipsis);
    });

    li.appendChild(btn);
    li.appendChild(ellipsis);
    groupList.appendChild(li);
  });
}

// ── Group Modals ──────────────────────────────────────
function showGroupActions(group, triggerEl) {
  openModal(
    group.name, "",
    `<button class="modal-btn secondary" id="editGroupBtn">Edit Group</button>
     <button class="modal-btn danger"    id="deleteGroupBtn">Delete Group</button>`,
    triggerEl
  );
  document.getElementById("editGroupBtn").addEventListener("click",   () => { closeModal(); showEditGroup(group); });
  document.getElementById("deleteGroupBtn").addEventListener("click", () => { closeModal(); showDeleteGroup(group); });
}

function allSubjectsForMode() {
  if (isMentalHealthMode) {
    return [
      { id: "stress",     label: "Stress & Resilience", topics: BEHAVIORAL_PATHS.stress.topics },
      { id: "finance",    label: "Financial Habits",    topics: BEHAVIORAL_PATHS.finance.topics },
      { id: "custom-beh", label: "Custom",              topics: behavioralCustomSubjects }
    ];
  }
  return [
    { id: "ccna",      label: "CCNA",       topics: CCNA_TOPICS },
    { id: "security+", label: "Security+",  topics: SECURITY_PLUS_TOPICS },
    { id: "custom",    label: "Custom",     topics: customEducationalSubjects }
  ];
}

function buildSubjectSelector(selectedSet) {
  const selector = document.createElement("div");
  selector.className = "subject-selector";

  const modeLabel = isMentalHealthMode ? "behavioral" : "educational";
  const hint = document.createElement("div");
  hint.className   = "subject-selector-hint";
  hint.textContent = `Mix subjects from any ${modeLabel} path.`;
  selector.appendChild(hint);

  allSubjectsForMode().forEach(section => {
    const header = document.createElement("div");
    header.className   = "subject-selector-header";
    header.textContent = section.label;
    const sectionId = "sel-section-" + section.id;
    header.id = sectionId;
    selector.appendChild(header);

    section.topics.forEach(subject => {
      const chip = document.createElement("button");
      chip.type      = "button";
      chip.className = "subject-chip" + (selectedSet.has(subject) ? " selected" : "");
      chip.textContent = subject;
      chip.setAttribute("aria-pressed", String(selectedSet.has(subject)));
      chip.addEventListener("click", () => {
        if (selectedSet.has(subject)) {
          selectedSet.delete(subject);
          chip.setAttribute("aria-pressed", "false");
        } else {
          selectedSet.add(subject);
          chip.setAttribute("aria-pressed", "true");
        }
        chip.classList.toggle("selected", selectedSet.has(subject));
      });
      selector.appendChild(chip);
    });
  });

  return selector;
}

function showEditGroup(group) {
  openModal(
    "Edit Group",
    `<label for="editGroupName" class="modal-hint">Group name</label>
     <input type="text" class="text-input" id="editGroupName"
       value="${group.name}" placeholder="Group name"
       aria-required="true" />
     <div id="subjectSelector"></div>`,
    `<button class="modal-btn secondary" id="cancelEdit">Cancel</button>
     <button class="modal-btn primary"   id="confirmEdit">Save Group</button>`
  );

  const selectedSet = new Set(group.subjects);
  document.getElementById("subjectSelector").appendChild(buildSubjectSelector(selectedSet));

  document.getElementById("cancelEdit").addEventListener("click", closeModal);
  document.getElementById("confirmEdit").addEventListener("click", () => {
    const nameEl = document.getElementById("editGroupName");
    const name   = nameEl.value.trim();
    if (!name) {
      nameEl.setAttribute("aria-invalid", "true");
      nameEl.focus();
      return;
    }
    group.name     = name;
    group.subjects = [...selectedSet];
    closeModal();
    renderGroups();
  });
}

function showDeleteGroup(group) {
  openModal(
    "Delete Group?",
    `<p class="subject-info">This will permanently remove <strong>${group.name}</strong>.</p>`,
    `<button class="modal-btn secondary" id="cancelDelete">Cancel</button>
     <button class="modal-btn danger"    id="confirmDelete">Delete</button>`
  );
  document.getElementById("cancelDelete").addEventListener("click", closeModal);
  document.getElementById("confirmDelete").addEventListener("click", () => {
    const updated = getCurrentGroups().filter(g => g.id !== group.id);
    setCurrentGroups(updated);
    if (activeGroupId === group.id)
      activeGroupId = updated.length ? updated[0].id : null;
    closeModal();
    renderGroups();
  });
}

// ── Create Group ──────────────────────────────────────
createGroupBtn.addEventListener("click", () => {
  openModal(
    "New Group",
    `<label for="newGroupName" class="modal-hint">Group name</label>
     <input type="text" class="text-input" id="newGroupName"
       placeholder="e.g. Work Skills"
       aria-required="true" />
     <div id="subjectSelector"></div>`,
    `<button class="modal-btn secondary" id="cancelCreate">Cancel</button>
     <button class="modal-btn primary"   id="confirmCreate">Create</button>`,
    createGroupBtn
  );

  const selectedSet = new Set();
  document.getElementById("subjectSelector").appendChild(buildSubjectSelector(selectedSet));

  document.getElementById("cancelCreate").addEventListener("click", closeModal);
  document.getElementById("confirmCreate").addEventListener("click", () => {
    const nameEl = document.getElementById("newGroupName");
    const name   = nameEl.value.trim();
    if (!name) {
      nameEl.setAttribute("aria-invalid", "true");
      nameEl.focus();
      return;
    }
    const newGroup = { id: Date.now(), name, subjects: [...selectedSet] };
    const updated  = [...getCurrentGroups(), newGroup];
    setCurrentGroups(updated);
    activeGroupId = newGroup.id;
    if (isMentalHealthMode) {
      selectedBehavioralTopics = [...newGroup.subjects];
    } else {
      selectedSubjects = [...newGroup.subjects];
    }
    closeModal();
    renderGroups();
    renderCurrentSubjects();
  });
});

// ── Learning Activity Dashboard ──────────────────────

let statPeriod = "daily";
let dashStats  = { today: 0, weekly: 0, monthly: 0, total: 0 };
let dashTopics = {};

function loadDashboard() {
  chrome.storage.local.get(["lessonStats", "topicCounts"], result => {
    dashStats  = result.lessonStats  || { today: 0, weekly: 0, monthly: 0, total: 0 };
    dashTopics = result.topicCounts  || {};
    renderDashboard();
  });
}

function renderDashboard() {
  const bigNum = statPeriod === "daily"   ? dashStats.today
    : statPeriod === "weekly"  ? dashStats.weekly
    : dashStats.monthly;
  dashBigNumber.textContent = bigNum;

  dashToday.textContent   = dashStats.today;
  dashWeekly.textContent  = dashStats.weekly;
  dashMonthly.textContent = dashStats.monthly;

  // WCAG 4.1.2: update aria-pressed on period tabs
  document.querySelectorAll(".dash-tab").forEach(tab => {
    const active = tab.dataset.period === statPeriod;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  });

  dashTopicsList.innerHTML = "";
  const entries = Object.entries(dashTopics).sort((a, b) => b[1] - a[1]).slice(0, 6);

  if (!entries.length) {
    dashTopicsList.innerHTML = '<div class="dash-empty">No lessons viewed yet</div>';
    return;
  }

  const maxCount  = entries[0][1];
  const totalViews = Object.values(dashTopics).reduce((s, c) => s + c, 0);

  entries.forEach(([name, count]) => {
    const pct      = totalViews > 0 ? Math.round((count / totalViews) * 100) : 0;
    const barWidth = maxCount  > 0 ? Math.round((count / maxCount)  * 100) : 0;

    const row = document.createElement("div");
    row.className = "dash-topic-row";

    // WCAG 1.3.1: bar is purely visual; the count/pct text conveys the same
    // information, so the bar is aria-hidden.
    row.innerHTML = `
      <div class="dash-topic-meta">
        <span class="dash-topic-name">${name}</span>
        <span class="dash-topic-count">${count} · ${pct}%</span>
      </div>
      <div class="dash-topic-bar" aria-hidden="true">
        <div class="dash-topic-fill" style="width: ${barWidth}%"></div>
      </div>`;
    dashTopicsList.appendChild(row);
  });
}

// Period tab click handlers
document.querySelectorAll(".dash-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    statPeriod = tab.dataset.period;
    renderDashboard();
  });
});

// ── Save & Regenerate ─────────────────────────────────
saveBtn.addEventListener("click", () => {
  if (!apiKey.startsWith("sk-ant-")) {
    showSaveStatus("Please set your API key first (click the gear icon)", "error");
    return;
  }

  const groups = getCurrentGroups();

  const topics = (() => {
    if (activeGroupId) {
      const g = groups.find(g => g.id === activeGroupId);
      if (g?.subjects?.length) return g.subjects;
    }
    if (isMentalHealthMode) {
      return selectedBehavioralTopics.length ? selectedBehavioralTopics : BEHAVIORAL_PATHS.stress.topics;
    }
    return selectedSubjects.length ? selectedSubjects : [];
  })();

  if (!topics.length) {
    showSaveStatus("Please select subjects or choose a group with subjects.", "error");
    return;
  }

  saveBtn.disabled    = true;
  saveBtn.textContent = "Saving...";

  chrome.storage.sync.set(
    {
      subjects, selectedSubjects, educationalGroups, activeGroupId,
      isMentalHealthMode, learningPath,
      selectedBehavioralTopics, behavioralPath, behavioralCustomSubjects,
      behavioralGroups
    },
    () => {
      chrome.runtime.sendMessage(
        { type: "REGENERATE_POOL", apiKey, topics, isMentalHealthMode },
        response => {
          saveBtn.disabled    = false;
          saveBtn.textContent = "Save & Regenerate";
          if (response?.success) {
            showSaveStatus("Your settings have been saved.", "success");
          } else {
            showSaveStatus(
              response?.error
                ? "Saved, but generation failed. Please try again."
                : "Your settings have been saved.",
              response?.error ? "error" : "success"
            );
          }
        }
      );
    }
  );
});

function showSaveStatus(msg, type) {
  saveStatus.textContent = msg;
  saveStatus.className   = "save-status " + type;
  setTimeout(() => { saveStatus.textContent = ""; saveStatus.className = "save-status"; }, 4000);
}

// ── Load Saved State ──────────────────────────────────
switchLearningPath("ccna");
updateModeUI();

chrome.storage.sync.get(
  [
    "apiKey", "subjects", "selectedSubjects",
    "educationalGroups", "groupsByPath", "activeGroupId",
    "isMentalHealthMode", "learningPath", "extensionTheme",
    "selectedBehavioralTopics", "behavioralPath", "behavioralCustomSubjects",
    "behavioralGroups", "behavioralGroupsByPath"
  ],
  result => {
    if (result.apiKey) apiKey = result.apiKey;
    if (result.extensionTheme) applyTheme(result.extensionTheme);
    else applyTheme("light");

    // Restore educational groups (migrate from old per-path format)
    if (result.educationalGroups?.length) {
      educationalGroups = result.educationalGroups;
    } else if (result.groupsByPath) {
      const old = result.groupsByPath;
      educationalGroups = [
        ...(old.ccna       || []),
        ...(old["security+"] || []),
        ...(old.custom     || [])
      ];
    }

    if (result.subjects?.length) customEducationalSubjects = result.subjects;

    if (result.learningPath) {
      switchLearningPath(result.learningPath);
      if (result.learningPath === "custom") {
        if (result.selectedSubjects) selectedSubjects = result.selectedSubjects;
      }
    }

    if (result.activeGroupId) activeGroupId = result.activeGroupId;
    if (result.selectedBehavioralTopics?.length)
      selectedBehavioralTopics = result.selectedBehavioralTopics;

    if (result.behavioralPath) {
      let bp = result.behavioralPath;
      if (bp === "financial")        bp = "finance";
      if (bp === "behavioral-custom") bp = "custom-beh";
      behavioralPath = bp;
    }
    if (result.behavioralCustomSubjects?.length)
      behavioralCustomSubjects = result.behavioralCustomSubjects;

    // Restore behavioral groups (migrate from old per-path format)
    if (result.behavioralGroups?.length) {
      behavioralGroups = result.behavioralGroups;
    } else if (result.behavioralGroupsByPath) {
      const old = result.behavioralGroupsByPath;
      if (old.financial        && !old.finance)       old.finance       = old.financial;
      if (old["behavioral-custom"] && !old["custom-beh"]) old["custom-beh"] = old["behavioral-custom"];
      behavioralGroups = [
        ...(old.stress       || []),
        ...(old.finance      || []),
        ...(old["custom-beh"] || [])
      ];
    }

    if (result.isMentalHealthMode === true) {
      isMentalHealthMode = true;
      switchBehavioralPath(behavioralPath);
      // Re-apply saved state (switchBehavioralPath resets these)
      if (result.selectedBehavioralTopics?.length)
        selectedBehavioralTopics = result.selectedBehavioralTopics;
      if (result.activeGroupId) activeGroupId = result.activeGroupId;
    }

    updateModeUI();
    renderSubjects();
    renderGroups();
    loadDashboard();
  }
);
