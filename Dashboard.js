// ---------- APP STATE ----------
let tasks = [];
let currentFilter = "all";          // "all", "pending", "completed"
let currentPriorityFilter = "all";  // "all", "high", "medium", "low"
let editingTaskId = null;

// DOM elements
const tasksContainer = document.getElementById("tasksContainer");
const totalSpan = document.getElementById("totalTasks");
const completedSpan = document.getElementById("completedTasks");
const pendingSpan = document.getElementById("pendingTasks");
const highPrioritySpan = document.getElementById("highPriorityCount");
const taskTitleInp = document.getElementById("taskTitle");
const taskDescInp = document.getElementById("taskDesc");
const saveBtn = document.getElementById("saveTaskBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitleSpan = document.getElementById("formTitle");

let selectedPriority = "medium";
const priorityOptions = document.querySelectorAll(".priority-option");

// Load from localStorage
function loadTasks() {
  const stored = localStorage.getItem("taskflow_app");
  if (stored) {
    tasks = JSON.parse(stored);
  } else {
    // Demo tasks
    tasks = [
      { id: Date.now() + 1, title: "Finish portfolio project", description: "Add this task manager to showcase", completed: false, priority: "high", createdAt: new Date().toISOString() },
      { id: Date.now() + 2, title: "Implement dark mode", description: "User-friendly theme toggle", completed: true, priority: "medium", createdAt: new Date().toISOString() },
      { id: Date.now() + 3, title: "Write documentation", description: "Explain features in README", completed: false, priority: "low", createdAt: new Date().toISOString() }
    ];
  }
  renderStatsAndTasks();
}

function saveToLocal() {
  localStorage.setItem("taskflow_app", JSON.stringify(tasks));
}

// Helper: escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
    return c;
  });
}

// Update stats & render filtered tasks
function renderStatsAndTasks() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const highPriority = tasks.filter(t => t.priority === "high" && !t.completed).length;
  totalSpan.innerText = total;
  completedSpan.innerText = completed;
  pendingSpan.innerText = pending;
  highPrioritySpan.innerText = highPriority;

  // filter logic
  let filtered = [...tasks];
  if (currentFilter === "pending") filtered = filtered.filter(t => !t.completed);
  else if (currentFilter === "completed") filtered = filtered.filter(t => t.completed);
  if (currentPriorityFilter !== "all") filtered = filtered.filter(t => t.priority === currentPriorityFilter);

  renderTaskList(filtered);
}

function renderTaskList(taskArray) {
  if (taskArray.length === 0) {
    tasksContainer.innerHTML = `<div class="empty-msg"><i class="fas fa-clipboard-list"></i> <br> No tasks match <br> ✨ add a new task</div>`;
    return;
  }

  tasksContainer.innerHTML = "";
  taskArray.forEach(task => {
    const taskDiv = document.createElement("div");
    taskDiv.className = `task-item ${task.completed ? "completed-task" : ""}`;

    let priorityClass = "";
    if (task.priority === "high") priorityClass = "priority-high";
    else if (task.priority === "medium") priorityClass = "priority-med";
    else priorityClass = "priority-low";

    const priorityLabel = task.priority === "high" ? "🔴 High" : task.priority === "medium" ? "🟠 Medium" : "🟢 Low";

    taskDiv.innerHTML = `
      <div class="task-content">
        <div class="task-title">
          <span>${escapeHtml(task.title)}</span>
          <span class="priority-badge ${priorityClass}">${priorityLabel}</span>
        </div>
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span><i class="far fa-calendar-alt"></i> ${new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="complete-btn" data-id="${task.id}" title="${task.completed ? "Undo" : "Complete"}"><i class="fas ${task.completed ? 'fa-undo-alt' : 'fa-check-circle'}"></i></button>
        <button class="edit-btn" data-id="${task.id}" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="delete-btn" data-id="${task.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    tasksContainer.appendChild(taskDiv);
  });

  // attach dynamic events
  document.querySelectorAll(".complete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.dataset.id);
      toggleComplete(id);
    });
  });
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.dataset.id);
      startEditTask(id);
    });
  });
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.dataset.id);
      deleteTaskById(id);
    });
  });
}

function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveToLocal();
    renderStatsAndTasks();
  }
}

function deleteTaskById(id) {
  tasks = tasks.filter(t => t.id !== id);
  if (editingTaskId === id) resetForm();
  saveToLocal();
  renderStatsAndTasks();
}

function startEditTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId = task.id;
  taskTitleInp.value = task.title;
  taskDescInp.value = task.description || "";
  selectedPriority = task.priority;
  updatePriorityUI();
  formTitleSpan.innerText = "✏️ Edit Task";
  saveBtn.innerHTML = '<i class="fas fa-pen"></i> Update Task';
}

function resetForm() {
  editingTaskId = null;
  taskTitleInp.value = "";
  taskDescInp.value = "";
  selectedPriority = "medium";
  updatePriorityUI();
  formTitleSpan.innerText = "Create Task";
  saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Task';
}

function updatePriorityUI() {
  priorityOptions.forEach(opt => {
    const prio = opt.getAttribute("data-prio");
    if (prio === selectedPriority) opt.classList.add("active");
    else opt.classList.remove("active");
  });
}

function saveCurrentTask() {
  const title = taskTitleInp.value.trim();
  if (!title) {
    alert("Please enter a task title");
    return;
  }
  if (editingTaskId !== null) {
    // update existing
    const task = tasks.find(t => t.id === editingTaskId);
    if (task) {
      task.title = title;
      task.description = taskDescInp.value.trim();
      task.priority = selectedPriority;
      saveToLocal();
    }
    resetForm();
  } else {
    // create new
    const newTask = {
      id: Date.now(),
      title: title,
      description: taskDescInp.value.trim(),
      completed: false,
      priority: selectedPriority,
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    saveToLocal();
    resetForm();
  }
  renderStatsAndTasks();
}

// Event listeners for priority selection
priorityOptions.forEach(opt => {
  opt.addEventListener("click", () => {
    selectedPriority = opt.getAttribute("data-prio");
    updatePriorityUI();
  });
});

saveBtn.addEventListener("click", saveCurrentTask);
cancelEditBtn.addEventListener("click", resetForm);

// Filter chips (status)
document.querySelectorAll(".filter-chip[data-filter]").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip[data-filter]").forEach(c => c.classList.remove("active-filter"));
    chip.classList.add("active-filter");
    currentFilter = chip.getAttribute("data-filter");
    renderStatsAndTasks();
  });
});

// Priority filter chips
document.querySelectorAll(".filter-chip[data-priority-filter]").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip[data-priority-filter]").forEach(c => c.classList.remove("active-filter"));
    chip.classList.add("active-filter");
    currentPriorityFilter = chip.getAttribute("data-priority-filter");
    renderStatsAndTasks();
  });
});

// Dark Mode Toggle
const themeToggle = document.getElementById("themeToggleBtn");
if (localStorage.getItem("taskflow_theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
} else {
  document.body.classList.remove("dark");
}
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("taskflow_theme", isDark ? "dark" : "light");
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i> <span>Light Mode</span>' : '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
});

// set default active filter UI
document.querySelector(".filter-chip[data-filter='all']").classList.add("active-filter");
document.querySelector(".filter-chip[data-priority-filter='all']").classList.add("active-filter");
updatePriorityUI();
loadTasks();