// preferences.js

const apiKeyInput  = document.getElementById("apiKeyInput");
const apiStatus    = document.getElementById("apiStatus");
const groupList    = document.getElementById("groupList");
const subjectsList = document.getElementById("subjectsList");
const addSubjectInput = document.getElementById("addSubjectInput");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const createGroupBtn = document.getElementById("createGroupBtn");
const saveBtn      = document.getElementById("saveBtn");
const saveStatus   = document.getElementById("saveStatus");

const modalOverlay = document.getElementById("modalOverlay");
const modalClose   = document.getElementById("modalClose");
const modalTitle   = document.getElementById("modalTitle");
const modalBody    = document.getElementById("modalBody");
const modalActions = document.getElementById("modalActions");

// ── State ─────────────────────────────────────────────
const DEFAULT_SUBJECTS = [
  "History", "Science", "Math", "Geography", "Psychology",
  "Philosophy", "Biology", "Physics", "Economics",
  "Technology", "Literature", "Art"
];

let subjects = [...DEFAULT_SUBJECTS]; // Master library
let selectedSubjects = [];            // Directly selected subjects from library
let groups = [];                      // [{ id, name, subjects: [] }]
let activeGroupId = null;

// ── Modal helpers ─────────────────────────────────────
function openModal(title, bodyHTML, actionsHTML) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalActions.innerHTML = actionsHTML;
  modalOverlay.classList.add("open");
}

function closeModal() {
  modalOverlay.classList.remove("open");
  modalBody.innerHTML = "";
  modalActions.innerHTML = "";
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ── Render subjects library ───────────────────────────
function renderSubjects() {
  subjectsList.innerHTML = "";

  if (subjects.length === 0) {
    const empty = document.createElement("div");
    empty.className = "subject-empty";
    empty.textContent = "No subjects yet";
    subjectsList.appendChild(empty);
    return;
  }

  subjects.forEach((subject) => {
    const item = document.createElement("div");
    item.className = "subject-item";
    
    // Add selected class if this subject is selected
    if (selectedSubjects.includes(subject)) {
      item.classList.add("selected");
    }

    const name = document.createElement("span");
    name.className = "subject-item-name";
    name.textContent = subject;

    // Click on the name or item (but not the X button) to toggle selection
    name.addEventListener("click", () => {
      toggleSubjectSelection(subject);
    });

    const removeBtn = document.createElement("button");
    removeBtn.className = "subject-remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove subject";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Don't trigger selection
      
      // Don't allow removing if it's in use by any group
      const inUse = groups.some(g => g.subjects.includes(subject));
      if (inUse) {
        alert(`Cannot remove "${subject}" - it's being used in a group.`);
        return;
      }
      subjects = subjects.filter(s => s !== subject);
      selectedSubjects = selectedSubjects.filter(s => s !== subject);
      renderSubjects();
    });

    item.appendChild(name);
    item.appendChild(removeBtn);
    subjectsList.appendChild(item);
  });
}

// ── Toggle subject selection ──────────────────────────
function toggleSubjectSelection(subject) {
  // Clear active group when selecting subjects directly
  activeGroupId = null;
  
  if (selectedSubjects.includes(subject)) {
    selectedSubjects = selectedSubjects.filter(s => s !== subject);
  } else {
    selectedSubjects.push(subject);
  }
  
  renderSubjects();
  renderGroups();
}

// ── Add subject to library ────────────────────────────
function addSubject() {
  const val = addSubjectInput.value.trim();
  if (!val) return;
  if (subjects.includes(val)) {
    alert(`"${val}" is already in your library.`);
    return;
  }
  subjects.push(val);
  addSubjectInput.value = "";
  renderSubjects();
}

addSubjectBtn.addEventListener("click", addSubject);
addSubjectInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addSubject();
});

// ── Render groups ─────────────────────────────────────
function renderGroups() {
  groupList.innerHTML = "";

  if (groups.length === 0) {
    groupList.innerHTML = '<li style="padding:10px 12px;font-size:12px;color:#bbb;">No groups yet</li>';
    return;
  }

  groups.forEach((group) => {
    const li = document.createElement("li");
    li.className = "group-item" + (group.id === activeGroupId ? " active" : "");

    const content = document.createElement("div");
    content.className = "group-item-content";

    const nameSpan = document.createElement("div");
    nameSpan.className = "group-name";
    nameSpan.textContent = group.name;

    const topicsSpan = document.createElement("div");
    topicsSpan.className = "group-topics";
    topicsSpan.textContent = group.subjects.length > 0 
      ? group.subjects.join(", ")
      : "No subjects selected";

    content.appendChild(nameSpan);
    content.appendChild(topicsSpan);

    content.addEventListener("click", () => {
      // Clear selected subjects when activating a group
      selectedSubjects = [];
      activeGroupId = group.id;
      renderGroups();
      renderSubjects();
    });

    const ellipsis = document.createElement("button");
    ellipsis.className = "group-ellipsis";
    ellipsis.textContent = "•••";
    ellipsis.addEventListener("click", (e) => {
      e.stopPropagation();
      showGroupActions(group);
    });

    li.appendChild(content);
    li.appendChild(ellipsis);
    groupList.appendChild(li);
  });
}

// ── Group actions modal ───────────────────────────────
function showGroupActions(group) {
  openModal(
    group.name,
    "",
    `<button class="modal-btn secondary" id="editGroupBtn">Edit Group</button>
     <button class="modal-btn danger"    id="deleteGroupBtn">Delete Group</button>`
  );

  document.getElementById("editGroupBtn").addEventListener("click", () => {
    closeModal();
    showEditGroup(group);
  });

  document.getElementById("deleteGroupBtn").addEventListener("click", () => {
    closeModal();
    showDeleteGroup(group);
  });
}

function showEditGroup(group) {
  const selectorHTML = `
    <input type="text" class="text-input" id="editGroupName" value="${group.name}" placeholder="Group name" />
    <div class="modal-hint">Select subjects for this group:</div>
    <div class="subject-selector" id="subjectSelector"></div>
  `;

  openModal(
    "Edit Group",
    selectorHTML,
    `<button class="modal-btn secondary" id="cancelEdit">Cancel</button>
     <button class="modal-btn primary"   id="confirmEdit">Save Group</button>`
  );

  const selector = document.getElementById("subjectSelector");
  const selectedSubjectsInModal = new Set(group.subjects);

  subjects.forEach((subject) => {
    const chip = document.createElement("button");
    chip.className = "subject-chip" + (selectedSubjectsInModal.has(subject) ? " selected" : "");
    chip.textContent = subject;
    chip.addEventListener("click", () => {
      if (selectedSubjectsInModal.has(subject)) {
        selectedSubjectsInModal.delete(subject);
        chip.classList.remove("selected");
      } else {
        selectedSubjectsInModal.add(subject);
        chip.classList.add("selected");
      }
    });
    selector.appendChild(chip);
  });

  document.getElementById("cancelEdit").addEventListener("click", closeModal);
  document.getElementById("confirmEdit").addEventListener("click", () => {
    const name = document.getElementById("editGroupName").value.trim();
    if (!name) {
      alert("Please enter a group name.");
      return;
    }
    group.name = name;
    group.subjects = Array.from(selectedSubjectsInModal);
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
    groups = groups.filter((g) => g.id !== group.id);
    if (activeGroupId === group.id) {
      activeGroupId = groups.length > 0 ? groups[0].id : null;
    }
    closeModal();
    renderGroups();
  });
}

// ── Create group ──────────────────────────────────────
createGroupBtn.addEventListener("click", () => {
  const selectorHTML = `
    <input type="text" class="text-input" id="newGroupName" placeholder="e.g. Work Skills" />
    <div class="modal-hint">Select subjects for this group:</div>
    <div class="subject-selector" id="subjectSelector"></div>
  `;

  openModal(
    "New Group",
    selectorHTML,
    `<button class="modal-btn secondary" id="cancelCreate">Cancel</button>
     <button class="modal-btn primary"   id="confirmCreate">Create</button>`
  );

  const selector = document.getElementById("subjectSelector");
  const selectedSubjectsInModal = new Set();

  subjects.forEach((subject) => {
    const chip = document.createElement("button");
    chip.className = "subject-chip";
    chip.textContent = subject;
    chip.addEventListener("click", () => {
      if (selectedSubjectsInModal.has(subject)) {
        selectedSubjectsInModal.delete(subject);
        chip.classList.remove("selected");
      } else {
        selectedSubjectsInModal.add(subject);
        chip.classList.add("selected");
      }
    });
    selector.appendChild(chip);
  });

  document.getElementById("cancelCreate").addEventListener("click", closeModal);
  document.getElementById("confirmCreate").addEventListener("click", () => {
    const name = document.getElementById("newGroupName").value.trim();
    if (!name) {
      alert("Please enter a group name.");
      return;
    }
    const newGroup = { 
      id: Date.now(), 
      name, 
      subjects: Array.from(selectedSubjectsInModal) 
    };
    groups.push(newGroup);
    
    // Clear selected subjects and activate the new group
    selectedSubjects = [];
    activeGroupId = newGroup.id;
    
    closeModal();
    renderGroups();
    renderSubjects();
  });
});

// ── Save & Regenerate ─────────────────────────────────
saveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();

  if (key && !key.startsWith("sk-ant-")) {
    apiStatus.textContent = "Key should start with sk-ant-...";
    apiStatus.className = "api-status error";
    return;
  }

  // Determine which topics to use: selected subjects OR active group's subjects
  let topicsToUse = [];
  
  if (selectedSubjects.length > 0) {
    // Use directly selected subjects
    topicsToUse = selectedSubjects;
  } else if (activeGroupId) {
    // Use active group's subjects
    const activeGroup = groups.find(g => g.id === activeGroupId);
    if (activeGroup) {
      topicsToUse = activeGroup.subjects;
    }
  }

  if (topicsToUse.length === 0) {
    showSaveStatus("Please select subjects or choose a group with subjects.", "error");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  // Save everything to storage
  chrome.storage.sync.set({ 
    apiKey: key, 
    subjects: subjects,
    selectedSubjects: selectedSubjects,
    groups: groups,
    activeGroupId: activeGroupId
  }, () => {
    // Send the topics to API
    chrome.runtime.sendMessage(
      { 
        type: "REGENERATE_POOL", 
        apiKey: key, 
        topics: topicsToUse 
      },
      (response) => {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save & Regenerate";

        if (response && response.success) {
          showSaveStatus("Saved! 30 new lessons generated.", "success");
        } else if (response && response.error) {
          showSaveStatus("Saved, but lesson generation failed: " + response.error, "error");
        } else {
          showSaveStatus("Saved!", "success");
        }
      }
    );
  });
});

function showSaveStatus(msg, type) {
  saveStatus.textContent = msg;
  saveStatus.className = "save-status " + type;
  setTimeout(() => {
    saveStatus.textContent = "";
    saveStatus.className = "save-status";
  }, 4000);
}

// ── Load saved state ──────────────────────────────────
chrome.storage.sync.get(["apiKey", "subjects", "selectedSubjects", "groups", "activeGroupId"], (result) => {
  if (result.apiKey) apiKeyInput.value = result.apiKey;
  
  if (Array.isArray(result.subjects) && result.subjects.length > 0) {
    subjects = result.subjects;
  }

  if (Array.isArray(result.selectedSubjects)) {
    selectedSubjects = result.selectedSubjects;
  }

  if (Array.isArray(result.groups) && result.groups.length > 0) {
    groups = result.groups;
    if (result.activeGroupId) {
      activeGroupId = result.activeGroupId;
    }
  }

  renderSubjects();
  renderGroups();
});