// preferences.js

// ── DOM References ────────────────────────────────────
// v3.2.2: theme override helper (System/Light/Dark)
function setThemeOverride(value) {
  if (value === "system") {
    chrome.storage.sync.remove("themeOverride");
  } else {
    chrome.storage.sync.set({ themeOverride: value });
  }
}

const settingsBtn     = document.getElementById("settingsBtn");
const modeToggle      = document.getElementById("modeToggle");
const topicSelection  = document.getElementById("topicSelection");
const groupList       = document.getElementById("groupList");
const subjectsList    = document.getElementById("subjectsList");
const addSubjectInput = document.getElementById("addSubjectInput");
const addSubjectBtn   = document.getElementById("addSubjectBtn");
const createGroupBtn  = document.getElementById("createGroupBtn");
const saveBtn         = document.getElementById("saveBtn");
const saveStatus      = document.getElementById("saveStatus");
const modalOverlay    = document.getElementById("modalOverlay");
const modalClose      = document.getElementById("modalClose");
const modalTitle      = document.getElementById("modalTitle");
const modalBody       = document.getElementById("modalBody");
const modalActions    = document.getElementById("modalActions");
const learningPathSection = document.getElementById("learningPathSection");
const ccnaTab         = document.getElementById("ccnaTab");
const securityPlusTab = document.getElementById("securityPlusTab");
const customTab       = document.getElementById("customTab");
const modeOptionLeft  = document.getElementById("modeOptionLeft");
const modeOptionRight = document.getElementById("modeOptionRight");

// Theme customization
const adContainersBtn     = document.getElementById("adContainersBtn");
const adContainersOverlay = document.getElementById("adContainersOverlay");
const adContainersClose   = document.getElementById("adContainersClose");
const adContainersCancel  = document.getElementById("adContainersCancel");
const adContainersSave    = document.getElementById("adContainersSave");
const patternTrack        = document.getElementById("patternTrack");
const slideLeft           = document.getElementById("slideLeft");
const slideRight          = document.getElementById("slideRight");
const patternPreview      = document.getElementById("patternPreview");
const previewPlaceholderMsg = document.getElementById("previewPlaceholderMsg");
const previewCard         = document.getElementById("previewCard");

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

// ── State ─────────────────────────────────────────────
let subjects         = [...DEFAULT_SUBJECTS];
let selectedSubjects = [];
let groups           = [];
let activeGroupId    = null;
let isMentalHealthMode = false;
let apiKey           = "";
let learningPath     = "ccna";

// ── Patterns ──────────────────────────────────────────
const PATTERNS = [
  {
    id: "green-dots",
    label: "Green Dots",
    file: "images/green dots.png"
  },
  {
    id: "confetti",
    label: "Confetti",
    file: "images/pink confetti.png"
  },
  {
    id: "orange-waves",
    label: "Orange Waves",
    file: "images/orange waves.png"
  },
  {
    id: "orange+blue floral",
    label: "orange+blue floral",
    file: "images/orange+blue floral.png"
  }
];

// How many thumbnails visible at once
const VISIBLE = 3;
let slideOffset  = 0;       // current scroll index (leftmost visible)
let pendingPattern = null;  // pattern id chosen in modal but not yet saved
let savedPattern   = null;  // last saved pattern id

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

// ── Learning Path Tabs ────────────────────────────────
function switchLearningPath(path) {
  learningPath = path;
  document.querySelectorAll(".path-tab").forEach(t => t.classList.remove("active"));

  if (path === "ccna") {
    ccnaTab.classList.add("active");
    subjects = selectedSubjects = [...CCNA_TOPICS];
  } else if (path === "security+") {
    securityPlusTab.classList.add("active");
    subjects = selectedSubjects = [...SECURITY_PLUS_TOPICS];
  } else {
    customTab.classList.add("active");
    subjects         = [...DEFAULT_SUBJECTS];
    selectedSubjects = [];
  }

  groups        = [];
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
  topicSelection.classList.toggle("disabled",   isMentalHealthMode);
  learningPathSection.classList.toggle("disabled", isMentalHealthMode);
  modeToggle.checked = isMentalHealthMode;
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
      if (groups.some(g => g.subjects.includes(subject))) {
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
    groups = groups.filter(g => g.id !== group.id);
    if (activeGroupId === group.id)
      activeGroupId = groups.length ? groups[0].id : null;
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
    groups.push(newGroup);
    selectedSubjects = [];
    activeGroupId    = newGroup.id;
    closeModal();
    renderGroups();
    renderSubjects();
  });
});

// ── Extension Theme Modal ─────────────────────────────

const extensionThemeBtn     = document.getElementById("extensionThemeBtn");
const extensionThemeOverlay = document.getElementById("extensionThemeOverlay");
const extensionThemeClose   = document.getElementById("extensionThemeClose");

const themeSystemBtn        = document.getElementById("themeSystemBtn");
const themeLightBtn         = document.getElementById("themeLightBtn");
const themeDarkBtn          = document.getElementById("themeDarkBtn");

function applyTheme(selection) {
  // selection: "system" | "light" | "dark"
  const sel = selection || "system";

  // Button UI state
  if (themeSystemBtn) themeSystemBtn.classList.toggle("active", sel === "system");
  if (themeLightBtn)  themeLightBtn.classList.toggle("active",  sel === "light");
  if (themeDarkBtn)   themeDarkBtn.classList.toggle("active",   sel === "dark");

  // Persist override (system = remove override)
  if (sel === "system") {
    chrome.storage.sync.remove(["themeOverride"]);
  } else {
    chrome.storage.sync.set({ themeOverride: sel });
  }
}

if (themeSystemBtn) themeSystemBtn.addEventListener("click", () => applyTheme("system"));
if (themeLightBtn)  themeLightBtn.addEventListener("click",  () => applyTheme("light"));
if (themeDarkBtn)   themeDarkBtn.addEventListener("click",   () => applyTheme("dark"));

function openExtensionThemeModal() {

  extensionThemeOverlay.classList.add("open");
}

function closeExtensionThemeModal() {
  extensionThemeOverlay.classList.remove("open");
}

extensionThemeBtn.addEventListener("click", openExtensionThemeModal);
extensionThemeClose.addEventListener("click", closeExtensionThemeModal);
extensionThemeOverlay.addEventListener("click", e => {
  if (e.target === extensionThemeOverlay) closeExtensionThemeModal();
});

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
  // Each thumb is 1/3 of track width + gap; use translateX by index steps
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
  // Update thumb selected state
  patternTrack.querySelectorAll(".pattern-thumb").forEach((el, i) => {
    el.classList.toggle("selected", PATTERNS[i].id === id);
  });
  // Update preview
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
  pendingPattern = null; // always start with nothing selected
  slideOffset    = 0;
  adContainersOverlay.classList.add("open");

  // Always show the "choose a pattern" message on open
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

  const topics = isMentalHealthMode ? ["Mental Health"] : (() => {
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

  chrome.storage.sync.set(
    { subjects, selectedSubjects, groups, activeGroupId, isMentalHealthMode, learningPath },
    () => {
      chrome.runtime.sendMessage(
        { type: "REGENERATE_STREAM", apiKey, topics, isMentalHealthMode },
        response => {
          saveBtn.disabled    = false;
          saveBtn.textContent = "Save & Regenerate";
          if (response?.success) {
            showSaveStatus(isMentalHealthMode
              ? "Saved! 30 mental health tips generated."
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
  ["apiKey", "subjects", "selectedSubjects", "groups", "activeGroupId", "isMentalHealthMode", "learningPath", "adContainerPattern", "themeOverride", "extensionTheme"],
  result => {
    if (result.apiKey)     apiKey = result.apiKey;
    if (result.adContainerPattern) savedPattern = result.adContainerPattern;
    const sel = result.themeOverride ? result.themeOverride : (result.extensionTheme || "system");
    applyTheme(sel);


    if (result.learningPath) {
      switchLearningPath(result.learningPath);

      if (result.learningPath === "custom") {
        if (result.subjects?.length)  subjects         = result.subjects;
        if (result.selectedSubjects)  selectedSubjects = result.selectedSubjects;
        if (result.groups?.length) {
          groups = result.groups;
          if (result.activeGroupId) activeGroupId = result.activeGroupId;
        }
      }
    }

    if (result.isMentalHealthMode === true) {
      isMentalHealthMode = true;
      modeToggle.checked = true;
    }

    updateModeUI();
    renderSubjects();
    renderGroups();
  }
);

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = btn.dataset.theme;
    setThemeOverride(v);
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});


function applyThemeButtons() {
  chrome.storage.sync.get(['themeOverride'], (res) => {
    const override = res.themeOverride;
    const active = override ? override : 'system';
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === active);
    });
  });
}
document.addEventListener('DOMContentLoaded', applyThemeButtons);


// v3.2.2: bind theme buttons safely (prevents script crash)
function bindThemeButtons_v322() {
  const btns = document.querySelectorAll(".theme-btn");
  if (!btns || btns.length === 0) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.theme;
      setThemeOverride(v);

      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // reflect current state
  chrome.storage.sync.get(["themeOverride"], (res) => {
    const override = res.themeOverride;
    const active = override ? override : "system";
    btns.forEach((b) => b.classList.toggle("active", b.dataset.theme === active));
  });
}

document.addEventListener("DOMContentLoaded", bindThemeButtons_v322);
