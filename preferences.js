// preferences.js

// ── DOM References ────────────────────────────────────
const settingsBtn         = document.getElementById("settingsBtn");
const modeToggle          = document.getElementById("modeToggle");
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
const modeOptionLeft      = document.getElementById("modeOptionLeft");
const modeOptionRight     = document.getElementById("modeOptionRight");

// Theme customization
const themeLightBtn         = document.getElementById("themeLightBtn");
const themeDarkBtn          = document.getElementById("themeDarkBtn");
const adContainersBtn       = document.getElementById("adContainersBtn");
const adContainersOverlay   = document.getElementById("adContainersOverlay");
const adContainersClose     = document.getElementById("adContainersClose");
const adContainersCancel    = document.getElementById("adContainersCancel");
const adContainersSave      = document.getElementById("adContainersSave");
const patternTrack          = document.getElementById("patternTrack");
const slideLeft             = document.getElementById("slideLeft");
const slideRight            = document.getElementById("slideRight");
const patternPreview        = document.getElementById("patternPreview");
const previewPlaceholderMsg = document.getElementById("previewPlaceholderMsg");
const previewCard           = document.getElementById("previewCard");

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

const BEHAVIORAL_TOPICS = [
  "Reframing Negative Thoughts",
  "Managing Stress",
  "Breathing & Grounding",
  "Sleep & Daily Routines",
  "Self-Compassion",
  "Reducing Anxiety",
  "Mindfulness",
  "Building Connection"
];

// ── State ─────────────────────────────────────────────
let subjects           = [...DEFAULT_SUBJECTS];
let selectedSubjects   = [];
let activeGroupId      = null;
let isMentalHealthMode = false;
let selectedBehavioralTopics = [...BEHAVIORAL_TOPICS.slice(0, 5)];
let apiKey             = "";
let learningPath       = "ccna";

// Groups are stored per learning path so switching tabs doesn't wipe them.
// Shape: { ccna: [], "security+": [], custom: [] }
let groupsByPath = { ccna: [], "security+": [], custom: [] };

// Convenience getter / setter for the currently active path's groups
function getGroups()       { return groupsByPath[learningPath] || []; }
function setGroups(arr)    { groupsByPath[learningPath] = arr; }

// ── Patterns ──────────────────────────────────────────

const PATTERNS = [
  { id: "green-dots",         label: "Green Dots",         file: "images/green dots.png" },
  { id: "confetti",           label: "Confetti",           file: "images/pink confetti.png" },
  { id: "orange-waves",       label: "Orange Waves",       file: "images/orange waves.png" },
  { id: "orange+blue floral", label: "Orange+Blue Floral", file: "images/orange+blue floral.png" },
  { id: "testpic1",           label: "Test Pattern",       file: "images/testpic1.png" },
  { id: "PinkBlueSwirl",           label: "Test Pattern",       file: "images/PinkBlueSwirl.jpg" }
];

const VISIBLE = 3;
let slideOffset    = 0;
let pendingPattern = null;
let savedPattern   = null;

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

// ── Extension Theme (inline buttons) ─────────────────
let currentTheme = "light";

function applyTheme(theme) {
  currentTheme = theme;
  document.body.classList.toggle("dark-mode", theme === "dark");
  themeLightBtn.classList.toggle("active", theme === "light");
  themeDarkBtn.classList.toggle("active",  theme === "dark");
  chrome.storage.sync.set({ extensionTheme: theme });
}

themeLightBtn.addEventListener("click", () => applyTheme("light"));
themeDarkBtn.addEventListener("click",  () => applyTheme("dark"));

// ── Learning Path Tabs ────────────────────────────────
function switchLearningPath(path) {
  learningPath = path;
  document.querySelectorAll(".path-tab").forEach(t => t.classList.remove("active"));

  if (path === "ccna") {
    ccnaTab.classList.add("active");
    subjects         = [...CCNA_TOPICS];
    selectedSubjects = [...CCNA_TOPICS];
  } else if (path === "security+") {
    securityPlusTab.classList.add("active");
    subjects         = [...SECURITY_PLUS_TOPICS];
    selectedSubjects = [...SECURITY_PLUS_TOPICS];
  } else {
    customTab.classList.add("active");
    subjects         = [...DEFAULT_SUBJECTS];
    selectedSubjects = [];
  }

  // Reset active group selection when switching paths,
  // but keep the groups themselves intact in groupsByPath.
  activeGroupId = null;

  renderSubjects();
  renderGroups();
}

ccnaTab.addEventListener("click",         () => switchLearningPath("ccna"));
securityPlusTab.addEventListener("click", () => switchLearningPath("security+"));
customTab.addEventListener("click",       () => switchLearningPath("custom"));

// ── Mode Toggle ───────────────────────────────────────
function updateModeUI() {
  modeOptionLeft.classList.toggle("active",    !isMentalHealthMode);
  modeOptionLeft.classList.toggle("inactive",   isMentalHealthMode);
  modeOptionRight.classList.toggle("active",    isMentalHealthMode);
  modeOptionRight.classList.toggle("inactive", !isMentalHealthMode);
  learningPathSection.classList.toggle("disabled", isMentalHealthMode);
  modeToggle.checked = isMentalHealthMode;

  // Instead of disabling topic selection, switch to behavioral topics
  topicSelection.classList.remove("disabled");

  if (isMentalHealthMode) {
    renderBehavioralSubjects();
  } else {
    renderSubjects();
  }
  renderGroups();

  document.querySelector(".add-subject-row").style.display = isMentalHealthMode ? "none" : "flex";
  document.getElementById("createGroupBtn").style.display  = isMentalHealthMode ? "none" : "block";
}

modeOptionLeft.addEventListener("click",  () => { isMentalHealthMode = false; updateModeUI(); });
modeOptionRight.addEventListener("click", () => { isMentalHealthMode = true;  updateModeUI(); });

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

  subjects.forEach(subject => {
    const item = document.createElement("div");
    item.className = "subject-item" + (selectedSubjects.includes(subject) ? " selected" : "");

    const name = document.createElement("span");
    name.className   = "subject-item-name";
    name.textContent = subject;
    name.addEventListener("click", () => toggleSubjectSelection(subject));

    const removeBtn = document.createElement("button");
    removeBtn.className   = "subject-remove-btn";
    removeBtn.textContent = "✕";
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

    item.appendChild(name);
    item.appendChild(removeBtn);
    subjectsList.appendChild(item);
  });
}

// ── Render Behavioral Subjects ────────────────────────
function renderBehavioralSubjects() {
  subjectsList.innerHTML = "";

  BEHAVIORAL_TOPICS.forEach(topic => {
    const item = document.createElement("div");
    item.className = "subject-item" + (selectedBehavioralTopics.includes(topic) ? " selected" : "");

    const name = document.createElement("span");
    name.className   = "subject-item-name";
    name.textContent = topic;
    name.addEventListener("click", () => {
      if (selectedBehavioralTopics.includes(topic)) {
        if (selectedBehavioralTopics.length > 1) {
          selectedBehavioralTopics = selectedBehavioralTopics.filter(t => t !== topic);
        }
      } else {
        selectedBehavioralTopics = [...selectedBehavioralTopics, topic];
      }
      renderBehavioralSubjects();
    });

    item.appendChild(name);
    subjectsList.appendChild(item);
  });
}

// ── Toggle Subject Selection ──────────────────────────
function toggleSubjectSelection(subject) {
  activeGroupId    = null;
  selectedSubjects = selectedSubjects.includes(subject)
    ? selectedSubjects.filter(s => s !== subject)
    : [...selectedSubjects, subject];
  renderSubjects();
  renderGroups();
}

// ── Add Subject ───────────────────────────────────────
function addSubject() {
  const val = addSubjectInput.value.trim();
  if (!val) return;
  if (subjects.includes(val)) { alert(`"${val}" is already in your library.`); return; }
  subjects.push(val);
  addSubjectInput.value = "";
  renderSubjects();
}

addSubjectBtn.addEventListener("click", addSubject);
addSubjectInput.addEventListener("keydown", e => { if (e.key === "Enter") addSubject(); });

// ── Render Groups ─────────────────────────────────────
function renderGroups() {
  groupList.innerHTML = "";
  const groups = getGroups();

  if (!groups.length) {
    groupList.innerHTML = '<li style="padding:10px 12px;font-size:12px;color:#bbb;">No groups yet</li>';
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
    ellipsis.textContent = "•••";
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

// ── Ad Containers Modal ───────────────────────────────
function buildPatternThumbs() {
  patternTrack.innerHTML = "";
  PATTERNS.forEach(p => {
    const thumb = document.createElement("div");
    thumb.className = "pattern-thumb" + (pendingPattern === p.id ? " selected" : "");
    thumb.style.backgroundImage = `url("${chrome.runtime.getURL(p.file)}")`;
    thumb.title = p.label;
    thumb.addEventListener("click", () => selectPattern(p.id));
    patternTrack.appendChild(thumb);
  });
  updateSlideArrows();
}

function updateSlidePosition() {
  const thumbWidth = patternTrack.parentElement.offsetWidth / VISIBLE;
  patternTrack.style.transform = `translateX(-${slideOffset * (thumbWidth + 10)}px)`;
  updateSlideArrows();
}

function updateSlideArrows() {
  slideLeft.disabled  = slideOffset <= 0;
  slideRight.disabled = slideOffset >= PATTERNS.length - VISIBLE;
}

slideLeft.addEventListener("click", () => {
  if (slideOffset > 0) { slideOffset--; updateSlidePosition(); }
});

slideRight.addEventListener("click", () => {
  if (slideOffset < PATTERNS.length - VISIBLE) { slideOffset++; updateSlidePosition(); }
});

function selectPattern(id) {
  pendingPattern = id;
  patternTrack.querySelectorAll(".pattern-thumb").forEach((el, i) => {
    el.classList.toggle("selected", PATTERNS[i].id === id);
  });
  const p = PATTERNS.find(x => x.id === id);
  if (p) {
    previewPlaceholderMsg.style.display  = "none";
    previewCard.style.display            = "flex";
    previewCard.style.backgroundImage    = `url("${chrome.runtime.getURL(p.file)}")`;
    previewCard.style.backgroundSize     = "cover";
    previewCard.style.backgroundPosition = "center";
  }
}

function openAdContainersModal() {
  pendingPattern = null;
  slideOffset    = 0;
  adContainersOverlay.classList.add("open");
  previewPlaceholderMsg.style.display = "";
  previewCard.style.display           = "none";
  buildPatternThumbs();
  requestAnimationFrame(updateSlidePosition);
}

function closeAdContainersModal() {
  adContainersOverlay.classList.remove("open");
}

adContainersBtn.addEventListener("click", openAdContainersModal);
adContainersClose.addEventListener("click", closeAdContainersModal);
adContainersCancel.addEventListener("click", closeAdContainersModal);
adContainersOverlay.addEventListener("click", e => {
  if (e.target === adContainersOverlay) closeAdContainersModal();
});

adContainersSave.addEventListener("click", () => {
  if (!pendingPattern) {
    alert("Please select a background pattern first.");
    return;
  }
  savedPattern = pendingPattern;
  chrome.storage.sync.set({ adContainerPattern: savedPattern }, () => {
    closeAdContainersModal();
    showSaveStatus("Pattern saved!", "success");
  });
});

// ── Save & Regenerate ─────────────────────────────────
saveBtn.addEventListener("click", () => {
  if (!apiKey.startsWith("sk-ant-")) {
    showSaveStatus("Please set your API key first (click the ⚙️ icon)", "error");
    return;
  }

  const groups = getGroups();

  const topics = isMentalHealthMode
    ? (selectedBehavioralTopics.length ? selectedBehavioralTopics : BEHAVIORAL_TOPICS.slice(0, 5))
    : (() => {
      if (selectedSubjects.length) return selectedSubjects;
      const g = groups.find(g => g.id === activeGroupId);
      return g ? g.subjects : [];
    })();

  if (!isMentalHealthMode && !topics.length) {
    showSaveStatus("Please select subjects or choose a group with subjects.", "error");
    return;
  }

  saveBtn.disabled    = true;
  saveBtn.textContent = "Saving...";

  // Persist everything including all groups across all paths
  chrome.storage.sync.set(
    { subjects, selectedSubjects, groupsByPath, activeGroupId, isMentalHealthMode, learningPath, selectedBehavioralTopics },
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
  ["apiKey", "subjects", "selectedSubjects", "groupsByPath", "activeGroupId", "isMentalHealthMode", "learningPath", "adContainerPattern", "extensionTheme", "selectedBehavioralTopics"],
  result => {
    if (result.apiKey)             apiKey = result.apiKey;
    if (result.adContainerPattern) savedPattern = result.adContainerPattern;
    if (result.extensionTheme)     applyTheme(result.extensionTheme);
    else                           applyTheme("light");

    // Restore all groups across all paths
    if (result.groupsByPath) {
      groupsByPath = result.groupsByPath;
      // Ensure all keys exist in case new paths were added
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

    if (result.selectedBehavioralTopics) selectedBehavioralTopics = result.selectedBehavioralTopics;

    if (result.isMentalHealthMode === true) {
      isMentalHealthMode = true;
      modeToggle.checked = true;
    }

    updateModeUI();
    renderSubjects();
    renderGroups();
  }
);