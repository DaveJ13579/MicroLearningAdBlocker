// preferences.js

// ── SVG Icons ────────────────────────────────────────
const ICON_SUN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
const ICON_MOON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
const ICON_GEAR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>';
const ICON_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

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
let subjects           = [...DEFAULT_SUBJECTS];
let selectedSubjects   = [];
let activeGroupId      = null;
let isMentalHealthMode = false;
let selectedBehavioralTopics = [...BEHAVIORAL_PATHS.stress.topics.slice(0, MAX_SUBJECTS)];
let apiKey             = "";
let learningPath       = "ccna";

// Groups are stored per learning path so switching tabs doesn't wipe them.
let groupsByPath = { ccna: [], "security+": [], custom: [] };

function getGroups()    { return groupsByPath[learningPath] || []; }
function setGroups(arr) { groupsByPath[learningPath] = arr; }

// Behavioral path state
let behavioralPath = "stress";
let behavioralCustomSubjects = [...BEHAVIORAL_PATHS["custom-beh"].topics];

let behavioralGroupsByPath = { stress: [], finance: [], "custom-beh": [] };

function getBehavioralGroups()    { return behavioralGroupsByPath[behavioralPath] || []; }
function setBehavioralGroups(arr) { behavioralGroupsByPath[behavioralPath] = arr; }

// ── Modal Helpers ─────────────────────────────────────
function openModal(title, bodyHTML, actionsHTML) {
  modalTitle.textContent = title;
  modalBody.innerHTML    = bodyHTML;
  modalActions.innerHTML = actionsHTML;
  modalOverlay.classList.add("open");
}

function closeModal() {
  modalOverlay.classList.remove("open");
  modalBody.innerHTML    = "";
  modalActions.innerHTML = "";
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });

// ── API Settings Modal ────────────────────────────────
function showAPISettingsModal() {
  openModal(
    "API Settings",
    `<div class="api-settings-hint">Enter your Anthropic API key to generate lessons</div>
     ${apiKey ? `<div class="api-key-status">
       <span class="api-key-masked">●●●●●●●●●●●●</span>
       <span class="api-key-connected">✓ Connected</span>
     </div>` : ""}
     <input type="password" class="text-input" id="apiKeyModalInput"
       placeholder="sk-ant-..." value="${apiKey}" autocomplete="off" spellcheck="false" />
     <div id="apiStatusModal" class="api-status"></div>`,
    `<button class="modal-btn secondary" id="cancelAPISettings">Cancel</button>
     <button class="modal-btn primary"   id="saveAPISettings">Save</button>`
  );

  document.getElementById("cancelAPISettings").addEventListener("click", closeModal);
  document.getElementById("saveAPISettings").addEventListener("click", () => {
    const key    = document.getElementById("apiKeyModalInput").value.trim();
    const status = document.getElementById("apiStatusModal");
    if (!key) {
      status.textContent = "Please enter an API key";
      status.className   = "api-status error";
      return;
    }
    if (!key.startsWith("sk-ant-")) {
      status.textContent = "Key should start with sk-ant-...";
      status.className   = "api-status error";
      return;
    }
    apiKey = key;
    chrome.storage.sync.set({ apiKey: key }, closeModal);
  });
}

settingsBtn.addEventListener("click", showAPISettingsModal);

// ── Theme Toggle ─────────────────────────────────────
let currentTheme = "light";

function applyTheme(theme) {
  currentTheme = theme;
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggleBtn.innerHTML = ICON_SUN;
  } else {
    document.documentElement.removeAttribute("data-theme");
    themeToggleBtn.innerHTML = ICON_MOON;
  }
  chrome.storage.sync.set({ extensionTheme: theme });
}

themeToggleBtn.addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

// ── Learning Path Tabs ────────────────────────────────
function switchLearningPath(path) {
  learningPath = path;
  document.querySelectorAll(".path-tab").forEach(t => t.classList.remove("active"));

  if (path === "ccna") {
    ccnaTab.classList.add("active");
    subjects         = [...CCNA_TOPICS];
    selectedSubjects = CCNA_TOPICS.slice(0, MAX_SUBJECTS);
  } else if (path === "security+") {
    securityPlusTab.classList.add("active");
    subjects         = [...SECURITY_PLUS_TOPICS];
    selectedSubjects = SECURITY_PLUS_TOPICS.slice(0, MAX_SUBJECTS);
  } else {
    customTab.classList.add("active");
    subjects         = [...DEFAULT_SUBJECTS];
    selectedSubjects = [];
  }

  activeGroupId = null;
  renderSubjects();
  renderGroups();
}

ccnaTab.addEventListener("click",         () => switchLearningPath("ccna"));
securityPlusTab.addEventListener("click", () => switchLearningPath("security+"));
customTab.addEventListener("click",       () => switchLearningPath("custom"));

// ── Behavioral Path Tabs ─────────────────────────────
function switchBehavioralPath(path) {
  behavioralPath = path;
  behavioralPathSection.querySelectorAll(".path-tab").forEach(t => t.classList.remove("active"));

  if (path === "stress") {
    stressTab.classList.add("active");
    selectedBehavioralTopics = [...BEHAVIORAL_PATHS.stress.topics.slice(0, MAX_SUBJECTS)];
  } else if (path === "finance") {
    financialTab.classList.add("active");
    selectedBehavioralTopics = [...BEHAVIORAL_PATHS.finance.topics.slice(0, MAX_SUBJECTS)];
  } else {
    behavioralCustomTab.classList.add("active");
    selectedBehavioralTopics = [];
  }

  activeGroupId = null;
  renderBehavioralSubjects();
  renderGroups();
}

stressTab.addEventListener("click",          () => switchBehavioralPath("stress"));
financialTab.addEventListener("click",       () => switchBehavioralPath("finance"));
behavioralCustomTab.addEventListener("click", () => switchBehavioralPath("custom-beh"));

// ── Mode Toggle ───────────────────────────────────────
function updateModeUI() {
  modeOptionLeft.classList.toggle("active",  !isMentalHealthMode);
  modeOptionRight.classList.toggle("active",  isMentalHealthMode);

  // Show/hide the correct path tabs
  learningPathSection.style.display    = isMentalHealthMode ? "none" : "";
  behavioralPathSection.style.display  = isMentalHealthMode ? ""     : "none";

  // Topic selection stays enabled in both modes
  topicSelection.classList.remove("disabled");

  // Show/hide add-subject input based on whether the active path allows custom subjects
  const isCustomPath = isMentalHealthMode
    ? (behavioralPath === "custom-beh")
    : (learningPath === "custom");
  document.querySelector(".add-subject-row").style.display = isCustomPath ? "flex" : "none";

  // Show/hide create group button (available in all paths)
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

  if (!subjects.length) {
    const empty = document.createElement("div");
    empty.className   = "subject-empty";
    empty.textContent = "No subjects yet";
    subjectsList.appendChild(empty);
    return;
  }

  const atLimit = selectedSubjects.length >= MAX_SUBJECTS;

  subjects.forEach(subject => {
    const isSelected = selectedSubjects.includes(subject);
    const item = document.createElement("div");
    item.className = "subject-item"
      + (isSelected ? " selected" : "")
      + (!isSelected && atLimit ? " at-limit" : "");

    if (isSelected) {
      const check = document.createElement("span");
      check.className = "check-icon";
      check.innerHTML = ICON_CHECK;
      item.appendChild(check);
    }

    const name = document.createElement("span");
    name.className   = "subject-item-name";
    name.textContent = subject;
    name.addEventListener("click", () => toggleSubjectSelection(subject));

    item.appendChild(name);

    if (learningPath === "custom") {
      const removeBtn = document.createElement("button");
      removeBtn.className   = "subject-remove-btn";
      removeBtn.textContent = "\u2715";
      removeBtn.title       = "Remove subject";
      removeBtn.addEventListener("click", e => {
        e.stopPropagation();
        if (getGroups().some(g => g.subjects.includes(subject))) {
          alert(`Cannot remove "${subject}" — it's being used in a group.`);
          return;
        }
        subjects         = subjects.filter(s => s !== subject);
        selectedSubjects = selectedSubjects.filter(s => s !== subject);
        renderSubjects();
      });
      item.appendChild(removeBtn);
    }
    subjectsList.appendChild(item);
  });

  updateSubjectCounter();
}

// ── Render Behavioral Subjects ────────────────────────
function renderBehavioralSubjects() {
  subjectsList.innerHTML = "";

  // Determine which subject list to show
  let subjectList;
  if (behavioralPath === "custom-beh") {
    subjectList = behavioralCustomSubjects;
  } else {
    subjectList = BEHAVIORAL_PATHS[behavioralPath]?.topics || [];
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
    const item = document.createElement("div");
    item.className = "subject-item"
      + (isSelected ? " selected" : "")
      + (!isSelected && atLimit ? " at-limit" : "");

    if (isSelected) {
      const check = document.createElement("span");
      check.className = "check-icon";
      check.innerHTML = ICON_CHECK;
      item.appendChild(check);
    }

    const name = document.createElement("span");
    name.className   = "subject-item-name";
    name.textContent = topic;
    name.addEventListener("click", () => {
      if (selectedBehavioralTopics.includes(topic)) {
        if (selectedBehavioralTopics.length > 1) {
          selectedBehavioralTopics = selectedBehavioralTopics.filter(t => t !== topic);
        }
      } else if (selectedBehavioralTopics.length < MAX_SUBJECTS) {
        selectedBehavioralTopics = [...selectedBehavioralTopics, topic];
      }
      renderBehavioralSubjects();
    });

    // Only show remove button on Custom path
    if (behavioralPath === "custom-beh") {
      const removeBtn = document.createElement("button");
      removeBtn.className   = "subject-remove-btn";
      removeBtn.textContent = "\u2715";
      removeBtn.title       = "Remove subject";
      removeBtn.addEventListener("click", e => {
        e.stopPropagation();
        behavioralCustomSubjects = behavioralCustomSubjects.filter(s => s !== topic);
        selectedBehavioralTopics = selectedBehavioralTopics.filter(s => s !== topic);
        renderBehavioralSubjects();
      });
      item.appendChild(name);
      item.appendChild(removeBtn);
    } else {
      item.appendChild(name);
    }

    subjectsList.appendChild(item);
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

// ── Add Subject ───────────────────────────────────────
function addSubject() {
  const val = addSubjectInput.value.trim();
  if (!val) return;

  if (isMentalHealthMode && behavioralPath === "custom-beh") {
    if (behavioralCustomSubjects.includes(val)) { alert(`"${val}" is already in your library.`); return; }
    behavioralCustomSubjects.push(val);
    addSubjectInput.value = "";
    renderBehavioralSubjects();
  } else {
    if (subjects.includes(val)) { alert(`"${val}" is already in your library.`); return; }
    subjects.push(val);
    addSubjectInput.value = "";
    renderSubjects();
  }
}

addSubjectBtn.addEventListener("click", addSubject);
addSubjectInput.addEventListener("keydown", e => { if (e.key === "Enter") addSubject(); });

// ── Render Groups ─────────────────────────────────────
function renderGroups() {
  groupList.innerHTML = "";
  const groups = getGroups();

  if (!groups.length) {
    groupList.innerHTML = '<li class="group-empty">No groups yet</li>';
    return;
  }

  groups.forEach(group => {
    const li = document.createElement("li");
    li.className = "group-item" + (group.id === activeGroupId ? " active" : "");

    const content = document.createElement("div");
    content.className = "group-item-content";

    const nameSpan = document.createElement("div");
    nameSpan.className   = "group-name";
    nameSpan.textContent = group.name;

    const topicsSpan = document.createElement("div");
    topicsSpan.className   = "group-topics";
    topicsSpan.textContent = group.subjects.length ? group.subjects.join(", ") : "No subjects selected";

    content.appendChild(nameSpan);
    content.appendChild(topicsSpan);
    content.addEventListener("click", () => {
      selectedSubjects = [];
      activeGroupId    = group.id;
      renderGroups();
      renderSubjects();
    });

    const ellipsis = document.createElement("button");
    ellipsis.className   = "group-ellipsis";
    ellipsis.textContent = "\u00B7\u00B7\u00B7";
    ellipsis.addEventListener("click", e => { e.stopPropagation(); showGroupActions(group); });

    li.appendChild(content);
    li.appendChild(ellipsis);
    groupList.appendChild(li);
  });
}

// ── Group Modals ──────────────────────────────────────
function showGroupActions(group) {
  openModal(
    group.name, "",
    `<button class="modal-btn secondary" id="editGroupBtn">Edit Group</button>
     <button class="modal-btn danger"    id="deleteGroupBtn">Delete Group</button>`
  );
  document.getElementById("editGroupBtn").addEventListener("click",   () => { closeModal(); showEditGroup(group); });
  document.getElementById("deleteGroupBtn").addEventListener("click", () => { closeModal(); showDeleteGroup(group); });
}

function buildSubjectSelector(selectedSet) {
  const selector = document.createElement("div");
  selector.className = "subject-selector";
  subjects.forEach(subject => {
    const chip = document.createElement("button");
    chip.className   = "subject-chip" + (selectedSet.has(subject) ? " selected" : "");
    chip.textContent = subject;
    chip.addEventListener("click", () => {
      selectedSet.has(subject) ? selectedSet.delete(subject) : selectedSet.add(subject);
      chip.classList.toggle("selected", selectedSet.has(subject));
    });
    selector.appendChild(chip);
  });
  return selector;
}

function showEditGroup(group) {
  openModal(
    "Edit Group",
    `<input type="text" class="text-input" id="editGroupName" value="${group.name}" placeholder="Group name" />
     <div class="modal-hint">Select subjects for this group:</div>
     <div id="subjectSelector"></div>`,
    `<button class="modal-btn secondary" id="cancelEdit">Cancel</button>
     <button class="modal-btn primary"   id="confirmEdit">Save Group</button>`
  );

  const selectedSet = new Set(group.subjects);
  document.getElementById("subjectSelector").appendChild(buildSubjectSelector(selectedSet));

  document.getElementById("cancelEdit").addEventListener("click", closeModal);
  document.getElementById("confirmEdit").addEventListener("click", () => {
    const name = document.getElementById("editGroupName").value.trim();
    if (!name) { alert("Please enter a group name."); return; }
    group.name     = name;
    group.subjects = [...selectedSet];
    closeModal();
    renderGroups();
  });
}

function showDeleteGroup(group) {
  openModal(
    "Delete Group?",
    `<div class="subject-info">This will permanently remove <strong>${group.name}</strong>.</div>`,
    `<button class="modal-btn secondary" id="cancelDelete">Cancel</button>
     <button class="modal-btn danger"    id="confirmDelete">Delete</button>`
  );
  document.getElementById("cancelDelete").addEventListener("click", closeModal);
  document.getElementById("confirmDelete").addEventListener("click", () => {
    const updated = getGroups().filter(g => g.id !== group.id);
    setGroups(updated);
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
    `<input type="text" class="text-input" id="newGroupName" placeholder="e.g. Work Skills" />
     <div class="modal-hint">Select subjects for this group:</div>
     <div id="subjectSelector"></div>`,
    `<button class="modal-btn secondary" id="cancelCreate">Cancel</button>
     <button class="modal-btn primary"   id="confirmCreate">Create</button>`
  );

  const selectedSet = new Set();
  document.getElementById("subjectSelector").appendChild(buildSubjectSelector(selectedSet));

  document.getElementById("cancelCreate").addEventListener("click", closeModal);
  document.getElementById("confirmCreate").addEventListener("click", () => {
    const name = document.getElementById("newGroupName").value.trim();
    if (!name) { alert("Please enter a group name."); return; }
    const newGroup = { id: Date.now(), name, subjects: [...selectedSet] };
    const updated  = [...getGroups(), newGroup];
    setGroups(updated);
    selectedSubjects = [];
    activeGroupId    = newGroup.id;
    closeModal();
    renderGroups();
    renderSubjects();
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
  // Big number reflects selected period
  const bigNum = statPeriod === "daily" ? dashStats.today
    : statPeriod === "weekly" ? dashStats.weekly
    : dashStats.monthly;
  dashBigNumber.textContent = bigNum;

  // Averages row always shows all three
  dashToday.textContent   = dashStats.today;
  dashWeekly.textContent  = dashStats.weekly;
  dashMonthly.textContent = dashStats.monthly;

  // Period tab active state
  document.querySelectorAll(".dash-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.period === statPeriod);
  });

  // Topic breakdown — top 6 by count
  dashTopicsList.innerHTML = "";
  const entries = Object.entries(dashTopics).sort((a, b) => b[1] - a[1]).slice(0, 6);

  if (!entries.length) {
    dashTopicsList.innerHTML = '<div class="dash-empty">No lessons viewed yet</div>';
    return;
  }

  const maxCount = entries[0][1];
  const totalViews = Object.values(dashTopics).reduce((s, c) => s + c, 0);

  entries.forEach(([name, count]) => {
    const pct = totalViews > 0 ? Math.round((count / totalViews) * 100) : 0;
    const barWidth = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

    const row = document.createElement("div");
    row.className = "dash-topic-row";
    row.innerHTML = `
      <div class="dash-topic-meta">
        <span class="dash-topic-name">${name}</span>
        <span class="dash-topic-count">${count} · ${pct}%</span>
      </div>
      <div class="dash-topic-bar">
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

  const groups = getGroups();

  const topics = isMentalHealthMode
    ? (selectedBehavioralTopics.length ? selectedBehavioralTopics : BEHAVIORAL_PATHS.stress.topics)
    : (() => {
        if (selectedSubjects.length) return selectedSubjects;
        const g = groups.find(g => g.id === activeGroupId);
        return g ? g.subjects : [];
      })();

  if (!topics.length) {
    showSaveStatus("Please select subjects or choose a group with subjects.", "error");
    return;
  }

  saveBtn.disabled    = true;
  saveBtn.textContent = "Saving...";

  chrome.storage.sync.set(
    {
      subjects, selectedSubjects, groupsByPath, activeGroupId,
      isMentalHealthMode, learningPath,
      selectedBehavioralTopics, behavioralPath, behavioralCustomSubjects,
      behavioralGroupsByPath
    },
    () => {
      chrome.runtime.sendMessage(
        { type: "REGENERATE_POOL", apiKey, topics, isMentalHealthMode },
        response => {
          saveBtn.disabled    = false;
          saveBtn.textContent = "Save & Regenerate";
          if (response?.success) {
            showSaveStatus(isMentalHealthMode
              ? "Saved! 30 behavioral prompts generated."
              : "Saved! 30 new lessons generated.", "success");
          } else {
            showSaveStatus(
              response?.error ? "Saved, but generation failed: " + response.error : "Saved!",
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
  ["apiKey", "subjects", "selectedSubjects", "groupsByPath", "activeGroupId", "isMentalHealthMode", "learningPath", "extensionTheme", "selectedBehavioralTopics", "behavioralPath", "behavioralCustomSubjects", "behavioralGroupsByPath"],
  result => {
    if (result.apiKey) apiKey = result.apiKey;
    if (result.extensionTheme) applyTheme(result.extensionTheme);
    else applyTheme("light");

    // Restore all groups across all paths
    if (result.groupsByPath) {
      groupsByPath = result.groupsByPath;
      groupsByPath.ccna          = groupsByPath.ccna          || [];
      groupsByPath["security+"]  = groupsByPath["security+"]  || [];
      groupsByPath.custom        = groupsByPath.custom        || [];
    }

    if (result.learningPath) {
      switchLearningPath(result.learningPath);

      if (result.learningPath === "custom") {
        if (result.subjects?.length)  subjects         = result.subjects;
        if (result.selectedSubjects)  selectedSubjects = result.selectedSubjects;
      }
    }

    if (result.activeGroupId) activeGroupId = result.activeGroupId;

    if (result.selectedBehavioralTopics?.length) selectedBehavioralTopics = result.selectedBehavioralTopics;

    // Restore behavioral state (with migration from old keys)
    if (result.behavioralPath) {
      let bp = result.behavioralPath;
      if (bp === "financial") bp = "finance";
      if (bp === "behavioral-custom") bp = "custom-beh";
      behavioralPath = bp;
    }
    if (result.behavioralCustomSubjects?.length) behavioralCustomSubjects = result.behavioralCustomSubjects;
    if (result.behavioralGroupsByPath) {
      behavioralGroupsByPath = result.behavioralGroupsByPath;
      // Migrate old keys if present
      if (behavioralGroupsByPath.financial && !behavioralGroupsByPath.finance) {
        behavioralGroupsByPath.finance = behavioralGroupsByPath.financial;
        delete behavioralGroupsByPath.financial;
      }
      if (behavioralGroupsByPath["behavioral-custom"] && !behavioralGroupsByPath["custom-beh"]) {
        behavioralGroupsByPath["custom-beh"] = behavioralGroupsByPath["behavioral-custom"];
        delete behavioralGroupsByPath["behavioral-custom"];
      }
      behavioralGroupsByPath.stress       = behavioralGroupsByPath.stress       || [];
      behavioralGroupsByPath.finance      = behavioralGroupsByPath.finance      || [];
      behavioralGroupsByPath["custom-beh"] = behavioralGroupsByPath["custom-beh"] || [];
    }

    if (result.isMentalHealthMode === true) {
      isMentalHealthMode = true;
      switchBehavioralPath(behavioralPath);
    }

    updateModeUI();
    renderSubjects();
    renderGroups();
    loadDashboard();
  }
);
